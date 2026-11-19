'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import ProgressCharts from '@/components/ProgressCharts';
import ProgressForm, { TargetFormData } from '@/components/ProgressForm';
import ProgressTable, { Task } from '@/components/ProgressTable';
import { DAFTAR_PIC } from '@/utils/helpers';
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

const ADMIN_UPLOADER_NAME = 'Hendra Hadiyatna Djatnika';
const STORAGE_BUCKET_NAME = 'dokumen-progress';
const TARGET_TABLE_NAME = 'progress_targets';

const INITIAL_FORM_STATE: TargetFormData = {
  kategori: '',
  namaTarget: '',
  waktuMulai: '',
  tenggatWaktu: '',
  progress: 0,
  pic: DAFTAR_PIC[0],
  keterangan: '',
  dokumen: null,
};

// Hitung status target secara terpusat agar grafik, tabel, dan database konsisten
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
  dokumen: row.dokumen || 'Upluad File',
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

function AdminDashboardContent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [filterKategori, setFilterKategori] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TargetFormData>(INITIAL_FORM_STATE);
  const [adminName, setAdminName] = useState('Administrator');
  const [greeting, setGreeting] = useState('Selamat Datang');
  const router = useRouter();

  // Ambil daftar target dari Supabase (mode silent=true agar tidak memunculkan spinner ulang)
  const fetchTasks = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    const { data } = await supabase
      .from(TARGET_TABLE_NAME)
      .select('*')
      .order('id', { ascending: false });

    if (data) {
      setTasks((data as ProgressTargetRow[]).map(mapRowToTask));
    }

    if (!silent) {
      setLoading(false);
    }
  }, []);

  // Muat nama admin dari sessionStorage & perbarui sapaan waktu setiap 1 menit
  useEffect(() => {
    const storedName = sessionStorage.getItem('userName');
    if (storedName) {
      setAdminName(storedName);
    }

    const syncGreeting = () => {
      setGreeting(getTimeGreeting(new Date().getHours()));
    };

    syncGreeting();
    const interval = setInterval(syncGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  // Cek otorisasi role admin, ambil data awal, lalu dengarkan perubahan Supabase Realtime
  useEffect(() => {
    const role = sessionStorage.getItem('userRole');
    if (role !== 'admin') {
      router.push('/');
      return;
    }

    fetchTasks();

    const channel = supabase
      .channel('admin-dashboard-silent-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TARGET_TABLE_NAME },
        (payload) => {
          const eventType = payload.eventType;

          if (eventType === 'INSERT') {
            const insertedTask = mapRowToTask(payload.new as ProgressTargetRow);
            setTasks((prev) => [insertedTask, ...prev]);
          } else if (eventType === 'UPDATE') {
            const updatedRow = payload.new as ProgressTargetRow;
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
                      pic: updatedRow.pic,
                      keterangan: updatedRow.keterangan || '',
                      dokumen: updatedRow.dokumen || task.dokumen,
                    }
                  : task
              )
            );
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
  }, [router, fetchTasks]);

  // Reset form ke kondisi awal
  const resetForm = useCallback(() => {
    setCurrentTask(null);
    setFormData(INITIAL_FORM_STATE);
  }, []);

  // Unggah file ke Supabase Storage bucket lalu kembalikan public URL-nya
  const uploadDocumentToStorage = async (file: File, prefix?: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const uniqueToken = `${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const fileName = prefix ? `${prefix}_${uniqueToken}.${fileExt}` : `${uniqueToken}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .upload(fileName, file);

    if (uploadError) {
      console.error('Gagal mengunggah file:', uploadError);
      alert('Gagal mengunggah dokumen ke server.');
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  };

  // Simpan target baru atau update target dari form atas
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.namaTarget || !formData.waktuMulai || !formData.tenggatWaktu) {
      alert('Mohon isi Nama Target, Waktu Mulai, dan Due Date!');
      return;
    }

    setIsSubmitting(true);

    try {
      let dokumenUrl = typeof currentTask?.dokumen === 'string' ? currentTask.dokumen : null;

      if (formData.dokumen && typeof formData.dokumen !== 'string') {
        const uploadedUrl = await uploadDocumentToStorage(formData.dokumen);
        if (!uploadedUrl) return;
        dokumenUrl = uploadedUrl;
      }

      const payload = {
        kategori: formData.kategori,
        nama_target: formData.namaTarget,
        waktu_mulai: formData.waktuMulai,
        tenggat_waktu: formData.tenggatWaktu,
        progress: formData.progress,
        status: calculateTaskStatus(formData.tenggatWaktu, formData.progress),
        pic: formData.pic,
        keterangan: formData.keterangan,
        dokumen: dokumenUrl,
      };

      const { error } = currentTask
        ? await supabase.from(TARGET_TABLE_NAME).update(payload).eq('id', currentTask.id)
        : await supabase.from(TARGET_TABLE_NAME).insert([payload]);

      if (error) {
        console.error(currentTask ? 'Gagal update data:' : 'Gagal tambah data:', error);
      } else {
        resetForm();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update data target dari tabel (edit baris atau kirim balasan riwayat)
  const handleUpdateTask = async (updatedTask: Task) => {
    setIsSubmitting(true);

    try {
      let finalDokumenUrl = updatedTask.dokumen || '-';

      if (updatedTask.fileDokumen) {
        const uploadedUrl = await uploadDocumentToStorage(updatedTask.fileDokumen, 'admin');
        if (!uploadedUrl) return;
        finalDokumenUrl = appendDocumentHistory(
          updatedTask.dokumen,
          uploadedUrl,
          ADMIN_UPLOADER_NAME
        );
      }

      const { error } = await supabase
        .from(TARGET_TABLE_NAME)
        .update({
          kategori: updatedTask.kategori,
          nama_target: updatedTask.namaTarget,
          waktu_mulai: updatedTask.waktuMulai,
          tenggat_waktu: updatedTask.tenggatWaktu,
          progress: updatedTask.progress,
          status: calculateTaskStatus(updatedTask.tenggatWaktu, updatedTask.progress),
          pic: updatedTask.pic,
          keterangan: updatedTask.keterangan,
          dokumen: finalDokumenUrl,
        })
        .eq('id', updatedTask.id);

      if (error) {
        alert('Gagal memperbarui data: ' + error.message);
      } else {
        await fetchTasks(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert('Terjadi kesalahan: ' + message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hapus target berdasarkan ID
  const handleDelete = async (taskId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus target ini?')) return;

    const { error } = await supabase.from(TARGET_TABLE_NAME).delete().eq('id', taskId);
    if (error) {
      console.error('Gagal menghapus data:', error);
    } else if (currentTask?.id === taskId) {
      resetForm();
    }
  };

  // Hapus sesi lalu kembali ke halaman login
  const handleLogout = () => {
    sessionStorage.clear();
    router.push('/');
  };

  // Tandai catatan pada target tertentu sebagai sudah dibaca oleh Admin
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

  // Agregasi data untuk grafik distribusi status target
  const statusCounts = tasks.reduce<Record<string, number>>((acc, task) => {
    const status = calculateTaskStatus(task.tenggatWaktu, task.progress);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const pieDataStatusFormatted = Object.keys(statusCounts).map((statusKey) => ({
    name: statusKey,
    value: statusCounts[statusKey],
  }));

  // Agregasi data untuk grafik tumpuk (stacked bar) status per PIC
  const picStatusMap: Record<
    string,
    {
      'BELUM DIKERJAKAN': number;
      'ON PROGRESS': number;
      OVERDUE: number;
      'SUDAH SELESAI': number;
    }
  > = {};

  tasks.forEach((task) => {
    const picKey = task.pic || 'Tanpa PIC';
    const statusText = calculateTaskStatus(task.tenggatWaktu, task.progress);

    if (!picStatusMap[picKey]) {
      picStatusMap[picKey] = {
        'BELUM DIKERJAKAN': 0,
        'ON PROGRESS': 0,
        OVERDUE: 0,
        'SUDAH SELESAI': 0,
      };
    }

    if (statusText in picStatusMap[picKey]) {
      picStatusMap[picKey][statusText as keyof (typeof picStatusMap)[string]] += 1;
    }
  });

  const stackedDataPicStatus = Object.keys(picStatusMap).map((picKey) => ({
    name: picKey,
    ...picStatusMap[picKey],
  }));

  // Hitung jumlah target berdasarkan field tertentu (kategori atau pic)
  const countByField = (field: 'kategori' | 'pic') => {
    const counts = tasks.reduce<Record<string, number>>((acc, task) => {
      const key = task[field];
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(counts).map((key) => ({
      name: key,
      value: counts[key],
      jumlah: counts[key],
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <Header
        title="Monitoring Progress Kerja"
        subtitle={`${greeting}, ${adminName}`}
        role="admin"
        onLogout={handleLogout}
      />

      <main className="max-w-[96%] mx-auto px-0 pt-24 pb-12 space-y-8 flex-1 w-full">
        <ProgressCharts
          pieDataStatus={pieDataStatusFormatted}
          pieDataKategori={countByField('kategori')}
          barDataPic={countByField('pic')}
          stackedDataPicStatus={stackedDataPicStatus}
          tasks={tasks}
        />

        <ProgressForm
          formData={formData}
          setFormData={setFormData}
          currentTask={currentTask}
          onSubmit={handleSubmit}
          onReset={resetForm}
          loading={isSubmitting}
          isAdmin={true}
        />

        {loading ? (
          <div className="text-center py-8 text-slate-500 text-sm">Memuat data...</div>
        ) : (
          <ProgressTable
            tasks={tasks}
            filterKategori={filterKategori}
            setFilterKategori={setFilterKategori}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onUpdateTask={handleUpdateTask}
            onDelete={handleDelete}
            onMarkAsRead={handleMarkAsRead}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

// Dibungkus Suspense untuk mendukung kompatibilitas Next.js App Router
export default function AdminDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">
          Memuat Panel Admin...
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}