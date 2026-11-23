// Menandai file ini sebagai Client Component di Next.js App Router
'use client';

// Mengimpor hook dan komponen Suspense dari React
import React, { useState, useEffect, useCallback, Suspense } from 'react';
// Mengimpor hook navigasi halaman dari Next.js
import { useRouter } from 'next/navigation';
// Mengimpor komponen grafik monitoring progress
import ProgressCharts from '@/components/ProgressCharts';
// Mengimpor komponen form input target beserta tipe data form-nya
import ProgressForm, { TargetFormData } from '@/components/ProgressForm';
// Mengimpor komponen tabel progress beserta tipe data Task
import ProgressTable, { Task } from '@/components/ProgressTable';
// Mengimpor daftar PIC dan helper perhitungan status serta tanggal selesai terpusat
import { DAFTAR_PIC, calculateTaskStatus, resolveCompletedAt } from '@/utils/helpers';
// Mengimpor instance client Supabase untuk akses database dan storage
import { supabase } from '@/lib/supabaseClient';
// Mengimpor komponen header halaman
import Header from '@/components/Header';
// Mengimpor komponen footer halaman
import Footer from '@/components/Footer';

// Mendefinisikan struktur kolom baris data dari tabel Supabase progress_targets
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

// Nama pengunggah bawaan untuk aksi dari sisi admin
const ADMIN_UPLOADER_NAME = 'Hendra Hadiyatna Djatnika';
// Nama bucket penyimpanan file di Supabase Storage
const STORAGE_BUCKET_NAME = 'dokumen-progress';
// Nama tabel utama di database Supabase
const TARGET_TABLE_NAME = 'progress_targets';

// Nilai awal state form tambah/edit target
const INITIAL_FORM_STATE: TargetFormData = {
  // Kategori kosong saat awal
  kategori: '',
  // Nama target kosong saat awal
  namaTarget: '',
  // Waktu mulai kosong saat awal
  waktuMulai: '',
  // Tenggat waktu kosong saat awal
  tenggatWaktu: '',
  // Progres awal 0%
  progress: 0,
  // PIC default mengambil elemen pertama dari DAFTAR_PIC
  pic: DAFTAR_PIC[0],
  // Keterangan awal kosong
  keterangan: '',
  // File dokumen awal null
  dokumen: null,
};

// Mengonversi baris data Supabase (snake_case) menjadi objek Task (camelCase)
const mapRowToTask = (row: ProgressTargetRow): Task => ({
  // Memetakan id
  id: row.id,
  // Memetakan kategori
  kategori: row.kategori,
  // Memetakan nama_target ke namaTarget
  namaTarget: row.nama_target,
  // Memetakan waktu_mulai ke waktuMulai
  waktuMulai: row.waktu_mulai,
  // Memetakan tenggat_waktu ke tenggatWaktu
  tenggatWaktu: row.tenggat_waktu,
  // Memetakan progress
  progress: row.progress,
  // Memetakan pic
  pic: row.pic,
  // Memetakan keterangan dengan fallback string kosong
  keterangan: row.keterangan || '',
  // Memetakan dokumen dengan fallback placeholder 'Upluad File'
  dokumen: row.dokumen || 'Upluad File',
  // Memetakan completed_at ke completedAt dengan fallback null
  completedAt: row.completed_at || null,
});

// Menentukan ucapan sapaan berdasarkan jam lokal saat ini
const getTimeGreeting = (hour: number): string => {
  // Sapaan pagi untuk jam 04:00 - 10:59
  if (hour >= 4 && hour < 11) return 'Selamat Pagi';
  // Sapaan siang untuk jam 11:00 - 14:59
  if (hour >= 11 && hour < 15) return 'Selamat Siang';
  // Sapaan sore untuk jam 15:00 - 17:59
  if (hour >= 15 && hour < 18) return 'Selamat Sore';
  // Sapaan malam untuk jam lainnya
  return 'Selamat Malam';
};

// Memformat tanggal dan jam saat ini sesuai lokal Indonesia (id-ID)
const formatTimestamp = (): string => {
  // Mengambil objek waktu saat ini
  const now = new Date();
  // Menggabungkan format tanggal lokal dan jam:menit
  return `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID', {
    // Menampilkan jam 2 digit
    hour: '2-digit',
    // Menampilkan menit 2 digit
    minute: '2-digit',
  })}`;
};

// Menambahkan entri dokumen baru di bagian paling depan riwayat dokumen menggunakan pemisah '│'
const appendDocumentHistory = (
  // Riwayat dokumen yang sudah ada sebelumnya
  existingDokumen: string | null | undefined,
  // URL publik dokumen yang baru diunggah
  newPublicUrl: string,
  // Nama pengunggah dokumen
  uploaderName: string
): string => {
  // Membentuk format entri dokumen baru
  const newEntry = `[${formatTimestamp()}] ${uploaderName}::${newPublicUrl}`;
  // Menyaring riwayat lama agar placeholder kosong tidak ikut terbawa
  const previousDocs =
    existingDokumen && existingDokumen !== '-' && existingDokumen !== 'Upluad File'
      ? existingDokumen
      : '';

  // Menggabungkan entri baru dengan riwayat lama jika ada
  return previousDocs ? `${newEntry}│${previousDocs}` : newEntry;
};

// Komponen utama konten dashboard admin
function AdminDashboardContent() {
  // State daftar seluruh target yang tampil di grafik dan tabel
  const [tasks, setTasks] = useState<Task[]>([]);
  // State target yang sedang dipilih untuk diedit dari form atas (null jika mode tambah baru)
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  // State filter kategori pada tabel
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
  // State teks sapaan waktu dinamis
  const [greeting, setGreeting] = useState('Selamat Datang');
  // Instance router untuk navigasi atau redirect
  const router = useRouter();

  // Mengambil seluruh data target dari Supabase (silent=true agar tidak mereset spinner loading)
  const fetchTasks = useCallback(async (silent = false) => {
    // Menampilkan indikator loading hanya jika bukan mode silent
    if (!silent) {
      setLoading(true);
    }

    // Mengambil semua baris target diurutkan dari id terbaru
    const { data } = await supabase
      .from(TARGET_TABLE_NAME)
      .select('*')
      .order('id', { ascending: false });

    // Memetakan hasil query ke state tasks jika data tersedia
    if (data) {
      setTasks((data as ProgressTargetRow[]).map(mapRowToTask));
    }

    // Mematikan indikator loading jika bukan mode silent
    if (!silent) {
      setLoading(false);
    }
  }, []);

  // Memuat nama admin dari sessionStorage dan menyinkronkan sapaan waktu tiap 1 menit
  useEffect(() => {
    // Membaca nama pengguna tersimpan di sessionStorage
    const storedName = sessionStorage.getItem('userName');
    // Memperbarui state nama admin jika tersedia
    if (storedName) {
      setAdminName(storedName);
    }

    // Fungsi internal untuk memperbarui sapaan sesuai jam berjalan
    const syncGreeting = () => {
      setGreeting(getTimeGreeting(new Date().getHours()));
    };

    // Menjalankan sinkronisasi sapaan saat pertama kali mount
    syncGreeting();
    // Menjadwalkan pembaruan sapaan setiap 60.000 ms (1 menit)
    const interval = setInterval(syncGreeting, 60000);
    // Membersihkan interval saat komponen di-unmount
    return () => clearInterval(interval);
  }, []);

  // Memeriksa hak akses admin, memuat data awal, dan berlangganan perubahan Realtime Supabase
  useEffect(() => {
    // Mengecek role pengguna di sessionStorage
    const role = sessionStorage.getItem('userRole');
    // Mengarahkan ke halaman utama jika bukan admin
    if (role !== 'admin') {
      router.push('/');
      return;
    }

    // Memuat data awal target
    fetchTasks();

    // Membuat channel Realtime untuk memantau perubahan pada tabel progress_targets
    const channel = supabase
      .channel('admin-dashboard-silent-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TARGET_TABLE_NAME },
        (payload) => {
          // Mengambil jenis event perubahan (INSERT, UPDATE, DELETE)
          const eventType = payload.eventType;

          // Menambahkan baris baru ke bagian atas daftar saat ada INSERT
          if (eventType === 'INSERT') {
            const insertedTask = mapRowToTask(payload.new as ProgressTargetRow);
            setTasks((prev) => [insertedTask, ...prev]);
          // Memperbarui baris terkait di state saat ada UPDATE
          } else if (eventType === 'UPDATE') {
            const updatedRow = payload.new as ProgressTargetRow;
            setTasks((prev) =>
              prev.map((task) =>
                task.id === updatedRow.id
                  ? {
                      // Mempertahankan properti lama yang tidak ikut berubah
                      ...task,
                      // Memperbarui kategori
                      kategori: updatedRow.kategori,
                      // Memperbarui nama target
                      namaTarget: updatedRow.nama_target,
                      // Memperbarui waktu mulai
                      waktuMulai: updatedRow.waktu_mulai,
                      // Memperbarui tenggat waktu
                      tenggatWaktu: updatedRow.tenggat_waktu,
                      // Memperbarui persentase progres
                      progress: updatedRow.progress,
                      // Memperbarui PIC
                      pic: updatedRow.pic,
                      // Memperbarui keterangan
                      keterangan: updatedRow.keterangan || '',
                      // Memperbarui dokumen dengan fallback dokumen lama
                      dokumen: updatedRow.dokumen || task.dokumen,
                      // Menyinkronkan tanggal selesai dari kolom completed_at
                      completedAt: updatedRow.completed_at ?? null,
                    }
                  : task
              )
            );
          // Menghapus baris dari state saat ada DELETE
          } else if (eventType === 'DELETE') {
            const deletedId = (payload.old as { id: number }).id;
            setTasks((prev) => prev.filter((task) => task.id !== deletedId));
          }
        }
      )
      .subscribe();

    // Membersihkan channel Realtime saat komponen di-unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, fetchTasks]);

  // Mengembalikan form ke kondisi kosong dan keluar dari mode edit target tertentu
  const resetForm = useCallback(() => {
    setCurrentTask(null);
    setFormData(INITIAL_FORM_STATE);
  }, []);

  // Mengunggah file ke Supabase Storage lalu mengembalikan URL publiknya
  const uploadDocumentToStorage = async (file: File, prefix?: string): Promise<string | null> => {
    // Mengambil ekstensi file dari nama file asli
    const fileExt = file.name.split('.').pop();
    // Membuat token unik kombinasi timestamp dan string acak
    const uniqueToken = `${Date.now()}_${Math.random().toString(36).substring(2)}`;
    // Menyusun nama file penyimpanan dengan opsional prefix
    const fileName = prefix ? `${prefix}_${uniqueToken}.${fileExt}` : `${uniqueToken}.${fileExt}`;

    // Mengunggah file ke bucket dokumen-progress
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .upload(fileName, file);

    // Menangani jika proses upload gagal
    if (uploadError) {
      console.error('Gagal mengunggah file:', uploadError);
      alert('Gagal mengunggah dokumen ke server.');
      return null;
    }

    // Mengambil URL publik file yang baru diunggah
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .getPublicUrl(fileName);

    // Mengembalikan URL publik file
    return publicUrlData.publicUrl;
  };

  // Menangani submit form tambah target baru atau simpan perubahan target yang diedit
  const handleSubmit = async (e: React.FormEvent) => {
    // Mencegah reload halaman bawaan form
    e.preventDefault();

    // Validasi field wajib sebelum menyimpan ke database
    if (!formData.namaTarget || !formData.waktuMulai || !formData.tenggatWaktu) {
      alert('Mohon isi Nama Target, Waktu Mulai, dan Due Date!');
      return;
    }

    // Mengaktifkan status submitting
    setIsSubmitting(true);

    try {
      // Menjaga URL dokumen lama jika sedang mengedit target
      let dokumenUrl = typeof currentTask?.dokumen === 'string' ? currentTask.dokumen : null;

      // Mengunggah file baru jika pengguna memilih file dari form
      if (formData.dokumen && typeof formData.dokumen !== 'string') {
        const uploadedUrl = await uploadDocumentToStorage(formData.dokumen);
        if (!uploadedUrl) return;
        dokumenUrl = uploadedUrl;
      }

      // Menentukan nilai completed_at berdasarkan progres dan riwayat tanggal selesai sebelumnya
      const nextCompletedAt = resolveCompletedAt(formData.progress, currentTask?.completedAt);

      // Menyusun payload data untuk disimpan ke tabel progress_targets
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

      // Menjalankan UPDATE jika sedang mengedit target, atau INSERT jika target baru
      const { error } = currentTask
        ? await supabase.from(TARGET_TABLE_NAME).update(payload).eq('id', currentTask.id)
        : await supabase.from(TARGET_TABLE_NAME).insert([payload]);

      // Mencatat error jika gagal, atau mereset form jika berhasil
      if (error) {
        console.error(currentTask ? 'Gagal update data:' : 'Gagal tambah data:', error);
      } else {
        resetForm();
      }
    } finally {
      // Mematikan status submitting setelah proses selesai
      setIsSubmitting(false);
    }
  };

  // Menangani pembaruan data target langsung dari baris tabel atau balasan riwayat
  const handleUpdateTask = async (updatedTask: Task) => {
    // Mengaktifkan status submitting
    setIsSubmitting(true);

    try {
      // Menjaga riwayat dokumen yang sudah ada
      let finalDokumenUrl = updatedTask.dokumen || '-';

      // Jika ada file baru diunggah pada baris tabel, unggah dan sisipkan ke riwayat dokumen
      if (updatedTask.fileDokumen) {
        const uploadedUrl = await uploadDocumentToStorage(updatedTask.fileDokumen, 'admin');
        if (!uploadedUrl) return;
        finalDokumenUrl = appendDocumentHistory(
          updatedTask.dokumen,
          uploadedUrl,
          ADMIN_UPLOADER_NAME
        );
      }

      // Menentukan tanggal selesai terbaru berdasarkan progres dan completedAt yang ada
      const nextCompletedAt = resolveCompletedAt(updatedTask.progress, updatedTask.completedAt);

      // Mengirim pembaruan data ke Supabase berdasarkan id target
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

      // Menampilkan alert jika update gagal, atau me-refresh data secara silent jika berhasil
      if (error) {
        alert('Gagal memperbarui data: ' + error.message);
      } else {
        await fetchTasks(true);
      }
    } catch (err: unknown) {
      // Menangkap error tak terduga dan menampilkannya ke pengguna
      const message = err instanceof Error ? err.message : String(err);
      alert('Terjadi kesalahan: ' + message);
    } finally {
      // Mematikan status submitting
      setIsSubmitting(false);
    }
  };

  // Menghapus target berdasarkan ID setelah konfirmasi pengguna
  const handleDelete = async (taskId: number) => {
    // Membatalkan penghapusan jika pengguna menekan Cancel
    if (!confirm('Apakah Anda yakin ingin menghapus target ini?')) return;

    // Menghapus baris target di Supabase
    const { error } = await supabase.from(TARGET_TABLE_NAME).delete().eq('id', taskId);
    // Mencatat error jika gagal, atau mereset form jika target yang dihapus sedang diedit
    if (error) {
      console.error('Gagal menghapus data:', error);
    } else if (currentTask?.id === taskId) {
      resetForm();
    }
  };

  // Menghapus data sesi dan kembali ke halaman login/pemilihan peran
  const handleLogout = () => {
    sessionStorage.clear();
    router.push('/');
  };

  // Menandai riwayat keterangan pada target tertentu sebagai sudah dibaca oleh admin
  const handleMarkAsRead = async (taskId: number, cleanedKeterangan: string) => {
    // Memperbarui state lokal terlebih dahulu agar indikator langsung hilang
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, keterangan: cleanedKeterangan } : task))
    );

    // Menyimpan keterangan yang sudah dibersihkan tag unread-nya ke database
    const { error } = await supabase
      .from(TARGET_TABLE_NAME)
      .update({ keterangan: cleanedKeterangan })
      .eq('id', taskId);

    // Mencatat error jika pembaruan status baca gagal
    if (error) {
      console.error('Gagal memperbarui status baca:', error.message);
    }
  };

  // Menghitung jumlah target per status untuk grafik distribusi status
  const statusCounts = tasks.reduce<Record<string, number>>((acc, task) => {
    // Menghitung status target dengan memperhitungkan completedAt
    const status = calculateTaskStatus(task.tenggatWaktu, task.progress, task.completedAt);
    // Menambahkan hitungan pada kategori status terkait
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Mengubah objek statusCounts menjadi array siap pakai untuk grafik pie/donut
  const pieDataStatusFormatted = Object.keys(statusCounts).map((statusKey) => ({
    name: statusKey,
    value: statusCounts[statusKey],
  }));

  // Menyiapkan struktur penampung rekap jumlah status per PIC untuk stacked bar chart
  const picStatusMap: Record<
    string,
    {
      'BELUM DIKERJAKAN': number;
      'ON PROGRESS': number;
      OVERDUE: number;
      'SUDAH SELESAI': number;
    }
  > = {};

  // Mengisi rekap status setiap PIC berdasarkan daftar tasks
  tasks.forEach((task) => {
    // Menggunakan nama PIC atau fallback 'Tanpa PIC'
    const picKey = task.pic || 'Tanpa PIC';
    // Menghitung status target dengan memperhitungkan completedAt
    const statusText = calculateTaskStatus(task.tenggatWaktu, task.progress, task.completedAt);

    // Menginisialisasi counter status jika PIC belum ada di map
    if (!picStatusMap[picKey]) {
      picStatusMap[picKey] = {
        'BELUM DIKERJAKAN': 0,
        'ON PROGRESS': 0,
        OVERDUE: 0,
        'SUDAH SELESAI': 0,
      };
    }

    // Menambah jumlah pada status yang sesuai untuk PIC tersebut
    if (statusText in picStatusMap[picKey]) {
      picStatusMap[picKey][statusText as keyof (typeof picStatusMap)[string]] += 1;
    }
  });

  // Mengubah picStatusMap menjadi array objek per PIC untuk grafik stacked bar
  const stackedDataPicStatus = Object.keys(picStatusMap).map((picKey) => ({
    name: picKey,
    ...picStatusMap[picKey],
  }));

  // Menghitung jumlah target berdasarkan field tertentu ('kategori' atau 'pic')
  const countByField = (field: 'kategori' | 'pic') => {
    // Menghitung kemunculan tiap nilai pada field terpilih
    const counts = tasks.reduce<Record<string, number>>((acc, task) => {
      const key = task[field];
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // Mengembalikan array data untuk grafik kategori atau bar PIC
    return Object.keys(counts).map((key) => ({
      name: key,
      value: counts[key],
      jumlah: counts[key],
    }));
  };

  // Merender layout utama dashboard admin
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Header halaman admin dengan sapaan dan tombol logout */}
      <Header
        title="Monitoring Progress Kerja"
        subtitle={`${greeting}, ${adminName}`}
        role="admin"
        onLogout={handleLogout}
      />

      {/* Konten utama halaman */}
      <main className="max-w-[96%] mx-auto px-0 pt-24 pb-12 space-y-8 flex-1 w-full">
        {/* Bagian grafik ringkasan status, kategori, dan performa per PIC */}
        <ProgressCharts
          pieDataStatus={pieDataStatusFormatted}
          pieDataKategori={countByField('kategori')}
          barDataPic={countByField('pic')}
          stackedDataPicStatus={stackedDataPicStatus}
          tasks={tasks}
        />

        {/* Bagian form tambah atau edit target oleh admin */}
        <ProgressForm
          formData={formData}
          setFormData={setFormData}
          currentTask={currentTask}
          onSubmit={handleSubmit}
          onReset={resetForm}
          loading={isSubmitting}
          isAdmin={true}
        />

        {/* Menampilkan indikator loading atau tabel daftar target */}
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