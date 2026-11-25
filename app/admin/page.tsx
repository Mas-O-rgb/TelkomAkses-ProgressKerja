// Menandai file ini sebagai Client Component di Next.js App Router
'use client';

// Mengimpor hook React dan Suspense untuk state, efek samping, callback, serta fallback render
import React, { Suspense, useCallback, useEffect, useState } from 'react';
// Mengimpor hook navigasi halaman di Next.js App Router
import { useRouter } from 'next/navigation';
// Mengimpor komponen footer halaman
import Footer from '@/components/Footer';
// Mengimpor komponen header halaman
import Header from '@/components/Header';
// Mengimpor komponen grafik monitoring progress
import ProgressCharts from '@/components/ProgressCharts';
// Mengimpor komponen form input target beserta tipe data form-nya
import ProgressForm, { TargetFormData } from '@/components/ProgressForm';
// Mengimpor komponen tabel progress beserta tipe data Task
import ProgressTable, { Task } from '@/components/ProgressTable';
// Mengimpor instance client Supabase untuk akses database dan storage
import { supabase } from '@/lib/supabaseClient';
// Mengimpor daftar PIC serta helper perhitungan status dan tanggal selesai
import { DAFTAR_PIC, calculateTaskStatus, resolveCompletedAt } from '@/utils/helpers';

// ==================== TIPE DATA & KONSTANTA ====================

// Struktur data baris profil dari tabel `profiles` di Supabase
interface ProfileRow {
  // ID unik akun
  id: string;
  // Peran akun ('admin' atau 'pic')
  role: string;
  // Nama PIC yang tampil di dropdown dan grafik
  nama_user: string | null;
}

// Struktur data baris target dari tabel `progress_targets` di Supabase
interface ProgressTargetRow {
  // ID unik target
  id: number;
  // Nama kategori target
  kategori: string;
  // Judul atau rincian target
  nama_target: string;
  // Tanggal mulai target (YYYY-MM-DD)
  waktu_mulai: string;
  // Tanggal jatuh tempo target (YYYY-MM-DD)
  tenggat_waktu: string;
  // Persentase progres target (0 - 100)
  progress: number;
  // Nama PIC yang bertanggung jawab
  pic: string;
  // Riwayat keterangan atau catatan target
  keterangan: string | null;
  // Riwayat URL dokumen terunggah
  dokumen: string | null;
  // Tanggal penyelesaian saat progres menyentuh 100% (YYYY-MM-DD)
  completed_at?: string | null;
}

// Nama pengunggah bawaan untuk aksi pembaruan dari sisi admin
const ADMIN_UPLOADER_NAME = 'Hendra Hadiyatna Djatnika';
// Nama bucket penyimpanan file di Supabase Storage
const STORAGE_BUCKET_NAME = 'dokumen-progress';
// Nama tabel utama data target di database Supabase
const TARGET_TABLE_NAME = 'progress_targets';
// Nama tabel profil akun/PIC di database Supabase
const PROFILES_TABLE_NAME = 'profiles';

// Nilai awal state form tambah/edit target
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

// ==================== HELPER MURNI ====================

// Mengonversi baris data Supabase (snake_case) menjadi objek Task (camelCase)
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
  completedAt: row.completed_at || null,
});

// Menentukan ucapan sapaan berdasarkan jam lokal saat ini
const getTimeGreeting = (hour: number): string => {
  if (hour >= 4 && hour < 11) return 'Selamat Pagi';
  if (hour >= 11 && hour < 15) return 'Selamat Siang';
  if (hour >= 15 && hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
};

// Memformat tanggal dan jam saat ini sesuai lokal Indonesia (id-ID)
const formatTimestamp = (): string => {
  const now = new Date();
  return `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

// Menambahkan entri dokumen baru di bagian paling depan riwayat dokumen dengan pemisah '│'
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

// ==================== KOMPONEN KONTEN ADMIN ====================

// Komponen utama konten dashboard admin untuk memantau, menambah, mengedit, dan menghapus target
function AdminDashboardContent() {
  // Instance router Next.js untuk navigasi atau redirect
  const router = useRouter();

  // State daftar seluruh target yang ditampilkan di grafik dan tabel
  const [tasks, setTasks] = useState<Task[]>([]);
  // State buka/tutup modal pop-up tambah/edit target
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // State target yang sedang dipilih untuk diedit (null jika mode tambah baru)
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  // State filter kategori aktif pada tabel ('ALL' untuk semua kategori)
  const [filterKategori, setFilterKategori] = useState('ALL');
  // State kata kunci pencarian pada tabel
  const [searchTerm, setSearchTerm] = useState('');
  // State indikator loading saat memuat data awal
  const [loading, setLoading] = useState(true);
  // State indikator proses submit/update agar tombol tidak ditekan ganda
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State nilai input pada form tambah/edit target
  const [formData, setFormData] = useState<TargetFormData>(INITIAL_FORM_STATE);
  // State nama admin yang sedang login
  const [adminName, setAdminName] = useState('Administrator');
  // State teks sapaan waktu dinamis sesuai jam
  const [greeting, setGreeting] = useState('Selamat Datang');
  // State daftar nama PIC dinamis yang diambil dari tabel profiles
  const [picOptions, setPicOptions] = useState<string[]>([]);

  // --- FUNGSI PENGAMBILAN & SINKRONISASI DATA ---

  // Mengambil seluruh data target dari Supabase (silent=true agar tidak memunculkan spinner loading)
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

  // Mengambil daftar nama PIC unik dari tabel profiles agar PIC baru otomatis tersedia di form
  const fetchPicOptions = useCallback(async () => {
    const { data, error } = await supabase
      .from(PROFILES_TABLE_NAME)
      .select('id, role, nama_user')
      .eq('role', 'pic')
      .order('nama_user', { ascending: true });

    if (error) {
      console.error('Gagal mengambil daftar PIC:', error.message);
      return;
    }

    const names = Array.from(
      new Set(
        ((data as ProfileRow[] | null) || [])
          .map((item) => item.nama_user?.trim() || '')
          .filter((name) => name.length > 0)
      )
    );

    setPicOptions(names);

    // Mengisi otomatis pilihan PIC pada form jika masih kosong
    setFormData((prev) => {
      if (prev.pic) return prev;
      return {
        ...prev,
        pic: names[0] || DAFTAR_PIC[0] || '',
      };
    });
  }, []);

  // Mengembalikan form ke kondisi awal dengan PIC default dari daftar terbaru
  const resetForm = useCallback(() => {
    setCurrentTask(null);
    setFormData({
      ...INITIAL_FORM_STATE,
      pic: picOptions[0] || DAFTAR_PIC[0] || '',
    });
  }, [picOptions]);

  // --- EFEK SAMPING (SESSION, SAPAAN WAKTU & REALTIME) ---

  // Memuat nama admin dari sessionStorage dan memperbarui sapaan waktu tiap 1 menit
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

  // Memeriksa hak akses admin, memuat data awal, dan berlangganan perubahan Realtime Supabase
  useEffect(() => {
    const role = sessionStorage.getItem('userRole');
    if (role !== 'admin') {
      router.push('/');
      return;
    }

    fetchTasks();
    fetchPicOptions();

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
                      completedAt: updatedRow.completed_at ?? null,
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
  }, [router, fetchTasks, fetchPicOptions]);

  // --- HANDLER AKSI CRUD & SESI ---

  // Mengunggah file ke Supabase Storage lalu mengembalikan URL publiknya
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

  // Menangani submit form tambah target baru atau simpan perubahan target yang diedit
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

      const nextCompletedAt = resolveCompletedAt(formData.progress, currentTask?.completedAt);

      const payload = {
        kategori: formData.kategori,
        nama_target: formData.namaTarget,
        waktu_mulai: formData.waktuMulai,
        tenggat_waktu: formData.tenggatWaktu,
        progress: formData.progress,
        completed_at: nextCompletedAt,
        status: calculateTaskStatus(formData.tenggatWaktu, formData.progress, nextCompletedAt),
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

  // Menangani pembaruan data target langsung dari baris tabel atau balasan riwayat
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

      const nextCompletedAt = resolveCompletedAt(updatedTask.progress, updatedTask.completedAt);

      const { error } = await supabase
        .from(TARGET_TABLE_NAME)
        .update({
          kategori: updatedTask.kategori,
          nama_target: updatedTask.namaTarget,
          waktu_mulai: updatedTask.waktuMulai,
          tenggat_waktu: updatedTask.tenggatWaktu,
          progress: updatedTask.progress,
          completed_at: nextCompletedAt,
          status: calculateTaskStatus(
            updatedTask.tenggatWaktu,
            updatedTask.progress,
            nextCompletedAt
          ),
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

  // Menghapus target berdasarkan ID setelah konfirmasi pengguna
  const handleDelete = async (taskId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus target ini?')) return;

    const { error } = await supabase.from(TARGET_TABLE_NAME).delete().eq('id', taskId);

    if (error) {
      console.error('Gagal menghapus data:', error);
    } else if (currentTask?.id === taskId) {
      resetForm();
    }
  };

  // Menghapus data sesi dan kembali ke halaman pemilihan akun/login
  const handleLogout = () => {
    sessionStorage.clear();
    router.push('/');
  };

  // Menandai riwayat keterangan pada target tertentu sebagai sudah dibaca oleh admin
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

  // --- AGREGASI DATA GRAFIK ---

  // Menghitung jumlah kemunculan tiap nilai pada field terpilih ('kategori' atau 'pic')
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

  // Menghitung jumlah target per status untuk grafik distribusi status
  const statusCounts = tasks.reduce<Record<string, number>>((acc, task) => {
    const status = calculateTaskStatus(task.tenggatWaktu, task.progress, task.completedAt);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Mengubah statusCounts menjadi format array untuk donut chart status
  const pieDataStatusFormatted = Object.keys(statusCounts).map((statusKey) => ({
    name: statusKey,
    value: statusCounts[statusKey],
  }));

  // Menyusun rekap jumlah status per PIC untuk stacked bar chart
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
    const statusText = calculateTaskStatus(task.tenggatWaktu, task.progress, task.completedAt);

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

  // Menyusun data kategori sekali agar urutan slice donut chart dan badge tabel konsisten
  const kategoriChartData: { name: string; value: number; jumlah: number }[] =
    countByField('kategori');

  // --- RENDER HALAMAN ---

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Header halaman admin dengan sapaan dan tombol logout */}
      <Header
        title="Monitoring Progress Kerja"
        subtitle={`${greeting}, ${adminName}`}
        role="admin"
        onLogout={handleLogout}
      />

      {/* Konten utama dashboard admin */}
      <main className="max-w-[96%] mx-auto px-0 pt-24 pb-12 space-y-8 flex-1 w-full">
        {/* Grafik ringkasan status, kategori target, tren deadline, dan performa per PIC */}
        <ProgressCharts
          pieDataStatus={pieDataStatusFormatted}
          pieDataKategori={kategoriChartData}
          stackedDataPicStatus={stackedDataPicStatus}
          tasks={tasks}
          loading={loading}
        />

        {/* Modal/form tambah atau edit target oleh admin */}
        <ProgressForm
          formData={formData}
          setFormData={setFormData}
          currentTask={currentTask}
          onSubmit={handleSubmit}
          onReset={resetForm}
          loading={isSubmitting}
          isAdmin={true}
          picOptions={picOptions}
          isOpen={isAddModalOpen}
          setIsOpen={setIsAddModalOpen}
          showHeaderBar={false}
        />

        {/* Indikator loading atau tabel daftar target */}
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
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        )}
      </main>

      {/* Footer halaman */}
      <Footer />
    </div>
  );
}

// Membungkus AdminDashboardContent dengan Suspense untuk mendukung Next.js App Router
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