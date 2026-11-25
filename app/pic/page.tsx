// Menandai file ini sebagai Client Component di Next.js App Router
'use client';

// Mengimpor hook React dan Suspense untuk state, efek samping, callback, serta fallback render
import React, { Suspense, useCallback, useEffect, useState } from 'react';
// Mengimpor hook navigasi halaman dari Next.js App Router
import { useRouter } from 'next/navigation';
// Mengimpor komponen footer halaman
import Footer from '@/components/Footer';
// Mengimpor komponen header halaman
import Header from '@/components/Header';
// Mengimpor komponen tabel progress beserta tipe data Task
import ProgressTable, { Task } from '@/components/ProgressTable';
// Mengimpor instance client Supabase untuk query database dan penyimpanan file
import { supabase } from '@/lib/supabaseClient';
// Mengimpor helper perhitungan status dan tanggal selesai terpusat
import { calculateTaskStatus, resolveCompletedAt } from '@/utils/helpers';

// ==================== TIPE DATA & KONSTANTA ====================

// Mendefinisikan struktur kolom baris data dari tabel `progress_targets` di Supabase
interface ProgressTargetRow {
  // ID unik target
  id: number;
  // Nama kategori target
  kategori: string;
  // Nama atau deskripsi target kerja
  nama_target: string;
  // Tanggal mulai target (YYYY-MM-DD)
  waktu_mulai: string;
  // Tanggal tenggat waktu / due date target (YYYY-MM-DD)
  tenggat_waktu: string;
  // Persentase progres target (0 - 100)
  progress: number;
  // Nama PIC pemilik target
  pic: string;
  // Riwayat catatan/keterangan target
  keterangan: string | null;
  // Riwayat URL dokumen yang diunggah
  dokumen: string | null;
  // Tanggal penyelesaian saat progres menyentuh 100% (YYYY-MM-DD)
  completed_at?: string | null;
}

// Nama bucket Supabase Storage untuk menyimpan dokumen bukti progres
const STORAGE_BUCKET_NAME = 'dokumen-progress';
// Nama tabel utama target progres di database Supabase
const TARGET_TABLE_NAME = 'progress_targets';

// ==================== HELPER MURNI ====================

// Mengubah baris data Supabase (snake_case) menjadi objek Task (camelCase)
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
  completedAt: row.completed_at || null,
});

// Menentukan teks sapaan berdasarkan jam lokal perangkat
const getTimeGreeting = (hour: number): string => {
  if (hour >= 4 && hour < 11) return 'Selamat Pagi';
  if (hour >= 11 && hour < 15) return 'Selamat Siang';
  if (hour >= 15 && hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
};

// Memformat waktu saat ini sesuai format lokal Indonesia (id-ID)
const formatTimestamp = (): string => {
  const now = new Date();
  return `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

// Menyisipkan entri dokumen baru di paling depan riwayat dokumen menggunakan pemisah '│'
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

// ==================== KOMPONEN KONTEN PIC ====================

// Komponen utama konten dashboard PIC untuk melihat dan memperbarui progres tugas milik sendiri
function PicDashboardContent() {
  // Instance router Next.js untuk navigasi atau redirect
  const router = useRouter();

  // State nama PIC yang sedang login (diambil dari sessionStorage)
  const [picName, setPicName] = useState<string>('');
  // State daftar tugas milik PIC yang sedang aktif
  const [tasks, setTasks] = useState<Task[]>([]);
  // State filter kategori aktif pada tabel ('ALL' untuk semua kategori)
  const [filterKategori, setFilterKategori] = useState('ALL');
  // State kata kunci pencarian pada tabel
  const [searchTerm, setSearchTerm] = useState('');
  // State indikator loading saat mengambil data awal
  const [loading, setLoading] = useState(true);
  // State ucapan sapaan waktu dinamis sesuai jam
  const [greeting, setGreeting] = useState('Selamat Datang');

  // --- PENGAMBILAN DATA ---

  // Mengambil daftar target khusus milik PIC aktif dari Supabase (silent=true tanpa spinner loading)
  const fetchTasksForPIC = useCallback(
    async (silent = false) => {
      if (!picName) return;

      if (!silent) {
        setLoading(true);
      }

      const { data } = await supabase
        .from(TARGET_TABLE_NAME)
        .select('*')
        .eq('pic', picName)
        .order('id', { ascending: false });

      if (data) {
        setTasks((data as ProgressTargetRow[]).map(mapRowToTask));
      }

      if (!silent) {
        setLoading(false);
      }
    },
    [picName]
  );

  // --- EFEK SAMPING (SESI, SAPAAN WAKTU & REALTIME) ---

  // Memvalidasi sesi PIC dari sessionStorage dan menyinkronkan sapaan waktu tiap 1 menit
  useEffect(() => {
    const storedRole = sessionStorage.getItem('userRole');
    const storedName = sessionStorage.getItem('userName')?.trim() || '';

    if (storedRole !== 'pic' || !storedName) {
      router.push('/');
      return;
    }

    setPicName(storedName);

    const syncGreeting = () => {
      setGreeting(getTimeGreeting(new Date().getHours()));
    };

    syncGreeting();
    const interval = setInterval(syncGreeting, 60000);

    return () => clearInterval(interval);
  }, [router]);

  // Memuat data tugas awal dan berlangganan perubahan Realtime Supabase khusus PIC aktif
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
                        completedAt: updatedRow.completed_at ?? null,
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

  // --- HANDLER AKSI ---

  // Mengunggah file bukti progres oleh PIC ke Supabase Storage lalu mengembalikan URL publiknya
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

  // Menyimpan pembaruan progres, tanggal selesai, status, keterangan, dan dokumen dari sisi PIC
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

      const nextCompletedAt = resolveCompletedAt(updatedTask.progress, updatedTask.completedAt);

      const { error } = await supabase
        .from(TARGET_TABLE_NAME)
        .update({
          nama_target: updatedTask.namaTarget,
          progress: updatedTask.progress,
          completed_at: nextCompletedAt,
          status: calculateTaskStatus(
            updatedTask.tenggatWaktu,
            updatedTask.progress,
            nextCompletedAt
          ),
          keterangan: updatedTask.keterangan,
          dokumen: finalDokumenUrl,
        })
        .eq('id', updatedTask.id);

      if (error) {
        alert('Gagal memperbarui progress: ' + error.message);
      } else {
        await fetchTasksForPIC(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert('Terjadi kesalahan: ' + message);
    }
  };

  // Menandai riwayat keterangan pada tugas tertentu sebagai sudah dibaca oleh PIC
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

  // Menghapus data sesi dan mengarahkan kembali ke halaman login/pemilihan akun
  const handleLogout = () => {
    sessionStorage.clear();
    router.push('/');
  };

  // --- RENDER HALAMAN ---

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Header halaman PIC dengan sapaan dan tombol logout */}
      <Header
        title="PROGRESS KERJA"
        subtitle={`${greeting}, ${picName}`}
        role="pic"
        onLogout={handleLogout}
      />

      {/* Konten utama halaman PIC */}
      <main className="max-w-[96%] mx-auto px-0 pt-24 pb-12 space-y-8 flex-1 w-full">
        {/* Indikator loading atau tabel daftar target milik PIC */}
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

      {/* Footer halaman */}
      <Footer />
    </div>
  );
}

// Membungkus PicDashboardContent dengan Suspense untuk kompatibilitas Next.js App Router
export default function PicDashboard() {
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