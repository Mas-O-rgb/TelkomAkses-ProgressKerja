'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProgressTable, { Task } from '@/components/ProgressTable';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface ProgressTargetRow {
  id: number;
  kategori: string;
  nama_target: string;
  waktu_mulai: string;
  tenggat_waktu: string;
  progress: number;
  pic: string;
  keterangan: string | null;
  dokumen: string | null;
}

const STORAGE_BUCKET_NAME = 'dokumen-progress';
const TARGET_TABLE_NAME = 'progress_targets';

// Hitung status target berdasarkan tenggat waktu dan persentase progress
const calculateTaskStatus = (tenggatWaktu: string, progress: number): string => {
  const today = new Date().toISOString().split('T')[0];
  if (tenggatWaktu && tenggatWaktu < today) return 'OVERDUE';
  if (progress === 100) return 'SUDAH SELESAI';
  if (progress > 0) return 'ON PROGRESS';
  return 'BELUM DIKERJAKAN';
};

// Ubah struktur baris tabel Supabase (snake_case) menjadi objek Task (camelCase)
const mapRowToTask = (row: ProgressTargetRow): Task => ({
  id: row.id,
  kategori: row.kategori,
  namaTarget: row.nama_target,
  waktuMulai: row.waktu_mulai,
  tenggatWaktu: row.tenggat_waktu,
  progress: row.progress,
  pic: row.pic,
  keterangan: row.keterangan || '',
  dokumen: row.dokumen || null,
});

// Tentukan sapaan waktu berdasarkan jam lokal perangkat
const getTimeGreeting = (hour: number): string => {
  if (hour >= 4 && hour < 11) return 'Selamat Pagi';
  if (hour >= 11 && hour < 15) return 'Selamat Siang';
  if (hour >= 15 && hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
};

const formatTimestamp = (): string => {
  const now = new Date();
  return `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

// Sisipkan dokumen baru di depan riwayat dokumen lama dengan pemisah '│'
const appendDocumentHistory = (
  existingDokumen: string | null | undefined,
  newPublicUrl: string,
  uploaderName: string
): string => {
  const newEntry = `[${formatTimestamp()}] ${uploaderName}::${newPublicUrl}`;
  const previousDocs =
    existingDokumen && existingDokumen !== '-' && existingDokumen !== 'Upluad File'
      ? existingDokumen
      : '';

  return previousDocs ? `${newEntry}│${previousDocs}` : newEntry;
};

function PicDashboardContent() {
  const params = useParams();
  const router = useRouter();
  const picName = decodeURIComponent((params?.nama as string) || '');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterKategori, setFilterKategori] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Selamat Datang');

  // Perbarui sapaan waktu setiap 1 menit
  useEffect(() => {
    const syncGreeting = () => {
      setGreeting(getTimeGreeting(new Date().getHours()));
    };

    syncGreeting();
    const interval = setInterval(syncGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  // Ambil daftar target khusus untuk PIC yang sedang dibuka
  const fetchTasksForPIC = useCallback(async () => {
    if (!picName) return;

    setLoading(true);
    const { data } = await supabase
      .from(TARGET_TABLE_NAME)
      .select('*')
      .eq('pic', picName)
      .order('id', { ascending: false });

    if (data) {
      setTasks((data as ProgressTargetRow[]).map(mapRowToTask));
    }
    setLoading(false);
  }, [picName]);

  // Muat data awal & dengarkan perubahan Supabase Realtime khusus milik PIC ini
  useEffect(() => {
    if (!picName) return;

    fetchTasksForPIC();

    const channel = supabase
      .channel('pic-dashboard-silent-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TARGET_TABLE_NAME },
        (payload) => {
          const eventType = payload.eventType;

          if (eventType === 'INSERT') {
            const insertedRow = payload.new as ProgressTargetRow;
            if (insertedRow.pic === picName) {
              setTasks((prev) => [mapRowToTask(insertedRow), ...prev]);
            }
          } else if (eventType === 'UPDATE') {
            const updatedRow = payload.new as ProgressTargetRow;
            if (updatedRow.pic === picName) {
              setTasks((prev) =>
                prev.map((task) =>
                  task.id === updatedRow.id
                    ? {
                        ...task,
                        kategori: updatedRow.kategori,
                        namaTarget: updatedRow.nama_target,
                        waktuMulai: updatedRow.waktu_mulai,
                        tenggatWaktu: updatedRow.tenggat_waktu,
                        progress: updatedRow.progress,
                        keterangan: updatedRow.keterangan || '',
                        dokumen: updatedRow.dokumen || task.dokumen,
                      }
                    : task
                )
              );
            }
          } else if (eventType === 'DELETE') {
            const deletedId = (payload.old as { id: number }).id;
            setTasks((prev) => prev.filter((task) => task.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [picName, fetchTasksForPIC]);

  // Unggah dokumen baru oleh PIC ke Supabase Storage lalu kembalikan public URL-nya
  const uploadDocumentToStorage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `pic_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .upload(fileName, file);

    if (uploadError) {
      alert('Gagal mengunggah dokumen: ' + uploadError.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  };

  // Simpan pembaruan progress, keterangan, atau dokumen dari sisi PIC
  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      let finalDokumenUrl = updatedTask.dokumen || '-';

      if (updatedTask.fileDokumen) {
        const uploadedUrl = await uploadDocumentToStorage(updatedTask.fileDokumen);
        if (!uploadedUrl) return;
        finalDokumenUrl = appendDocumentHistory(
          updatedTask.dokumen,
          uploadedUrl,
          updatedTask.pic
        );
      }

      const { error } = await supabase
        .from(TARGET_TABLE_NAME)
        .update({
          nama_target: updatedTask.namaTarget,
          progress: updatedTask.progress,
          status: calculateTaskStatus(updatedTask.tenggatWaktu, updatedTask.progress),
          keterangan: updatedTask.keterangan,
          dokumen: finalDokumenUrl,
        })
        .eq('id', updatedTask.id);

      if (error) {
        alert('Gagal memperbarui progress: ' + error.message);
      } else {
        await fetchTasksForPIC();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert('Terjadi kesalahan: ' + message);
    }
  };

  // Tandai catatan pada target tertentu sebagai sudah dibaca oleh PIC
  const handleMarkAsRead = async (taskId: number, cleanedKeterangan: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, keterangan: cleanedKeterangan } : task))
    );

    const { error } = await supabase
      .from(TARGET_TABLE_NAME)
      .update({ keterangan: cleanedKeterangan })
      .eq('id', taskId);

    if (error) {
      console.error('Gagal memperbarui status baca:', error.message);
    }
  };

  // Bersihkan sessionStorage dan kembali ke halaman pemilihan akun
  const handleLogout = () => {
    sessionStorage.clear();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <Header
        title="PROGRESS KERJA"
        subtitle={`${greeting}, ${picName}`}
        role="pic"
        onLogout={handleLogout}
      />

      <main className="max-w-[96%] mx-auto px-0 pt-24 pb-12 space-y-8 flex-1 w-full">
        {loading ? (
          <div className="text-center py-8 text-slate-500 text-sm">Memuat data target...</div>
        ) : (
          <ProgressTable
            tasks={tasks}
            filterKategori={filterKategori}
            setFilterKategori={setFilterKategori}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onUpdateTask={handleUpdateTask}
            onMarkAsRead={handleMarkAsRead}
            isPicView={true}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

// Dibungkus Suspense untuk mendukung kompatibilitas Next.js App Router
export default function PicDynamicDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">
          Memuat halaman PIC...
        </div>
      }
    >
      <PicDashboardContent />
    </Suspense>
  );
}
