// Menandai file ini sebagai Client Component di Next.js App Router
'use client';

// Mengimpor hook React dan Suspense untuk state, efek samping, callback, serta fallback render
import React, { useState, useEffect, useCallback, Suspense } from 'react';
// Mengimpor hook parameter rute dinamis dan navigasi dari Next.js App Router
import { useParams, useRouter } from 'next/navigation';
// Mengimpor komponen tabel progress beserta tipe data Task
import ProgressTable, { Task } from '@/components/ProgressTable';
// Mengimpor instance client Supabase untuk query database dan penyimpanan file
import { supabase } from '@/lib/supabaseClient';
// Mengimpor komponen header halaman
import Header from '@/components/Header';
// Mengimpor komponen footer halaman
import Footer from '@/components/Footer';
// Mengimpor helper perhitungan status dan penyelesaian tanggal terpusat
import { calculateTaskStatus, resolveCompletedAt } from '@/utils/helpers';

// Mendefinisikan struktur kolom baris data dari tabel Supabase progress_targets
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

// Mengubah baris data Supabase (snake_case) menjadi objek Task (camelCase)
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
  // Memetakan dokumen dengan fallback null jika belum ada
  dokumen: row.dokumen || null,
  // Memetakan completed_at ke completedAt dengan fallback null
  completedAt: row.completed_at || null,
});

// Menentukan teks sapaan berdasarkan jam lokal perangkat
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

// Memformat waktu saat ini sesuai format lokal Indonesia (id-ID)
const formatTimestamp = (): string => {
  // Mengambil waktu perangkat saat ini
  const now = new Date();
  // Menggabungkan tanggal lokal dan jam:menit
  return `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID', {
    // Format jam dua digit
    hour: '2-digit',
    // Format menit dua digit
    minute: '2-digit',
  })}`;
};

// Menyisipkan entri dokumen baru di paling depan riwayat dokumen menggunakan pemisah '│'
const appendDocumentHistory = (
  // Riwayat dokumen sebelumnya
  existingDokumen: string | null | undefined,
  // URL publik dokumen baru
  newPublicUrl: string,
  // Nama pengunggah dokumen (PIC)
  uploaderName: string
): string => {
  // Membentuk format entri baru lengkap dengan timestamp dan nama pengunggah
  const newEntry = `[${formatTimestamp()}] ${uploaderName}::${newPublicUrl}`;
  // Mengambil riwayat lama jika valid dan bukan placeholder kosong
  const previousDocs =
    existingDokumen && existingDokumen !== '-' && existingDokumen !== 'Upluad File'
      ? existingDokumen
      : '';

  // Menggabungkan entri baru dengan riwayat lama jika tersedia
  return previousDocs ? `${newEntry}│${previousDocs}` : newEntry;
};

// Komponen utama konten dashboard PIC
function PicDashboardContent() {
  // Mengambil parameter dinamis dari URL (/pic/[nama])
  const params = useParams();
  // Mengambil instance router untuk navigasi
  const router = useRouter();
  // Mendekode nama PIC dari parameter URL
  const picName = decodeURIComponent((params?.nama as string) || '');

  // State daftar tugas milik PIC yang sedang dibuka
  const [tasks, setTasks] = useState<Task[]>([]);
  // State filter kategori pada tabel
  const [filterKategori, setFilterKategori] = useState('ALL');
  // State kata kunci pencarian pada tabel
  const [searchTerm, setSearchTerm] = useState('');
  // State status loading saat mengambil data awal
  const [loading, setLoading] = useState(true);
  // State ucapan sapaan sesuai waktu
  const [greeting, setGreeting] = useState('Selamat Datang');

  // Memperbarui ucapan sapaan waktu secara berkala setiap 1 menit
  useEffect(() => {
    // Fungsi sinkronisasi sapaan berdasarkan jam saat ini
    const syncGreeting = () => {
      setGreeting(getTimeGreeting(new Date().getHours()));
    };

    // Menjalankan sinkronisasi sapaan saat komponen dimuat
    syncGreeting();
    // Menjadwalkan pembaruan sapaan tiap 60.000 ms (1 menit)
    const interval = setInterval(syncGreeting, 60000);
    // Membersihkan interval saat komponen di-unmount
    return () => clearInterval(interval);
  }, []);

  // Mengambil daftar target khusus untuk PIC aktif dari Supabase
  const fetchTasksForPIC = useCallback(async (silent = false) => {
    // Menghentikan proses jika nama PIC kosong
    if (!picName) return;

    // Menampilkan spinner loading hanya jika bukan mode silent
    if (!silent) {
      setLoading(true);
    }

    // Mengambil baris data dengan pic sesuai picName diurutkan dari id terbaru
    const { data } = await supabase
      .from(TARGET_TABLE_NAME)
      .select('*')
      .eq('pic', picName)
      .order('id', { ascending: false });

    // Memetakan data hasil query menjadi array Task
    if (data) {
      setTasks((data as ProgressTargetRow[]).map(mapRowToTask));
    }

    // Mematikan spinner loading jika bukan mode silent
    if (!silent) {
      setLoading(false);
    }
  }, [picName]);

  // Memuat data awal dan mendengarkan perubahan Supabase Realtime khusus milik PIC ini
  useEffect(() => {
    // Menghentikan proses jika nama PIC belum tersedia
    if (!picName) return;

    // Memuat daftar tugas awal
    fetchTasksForPIC();

    // Membuat channel Realtime untuk memantau perubahan pada tabel progress_targets
    const channel = supabase
      .channel('pic-dashboard-silent-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TARGET_TABLE_NAME },
        (payload) => {
          // Mengambil jenis event perubahan (INSERT, UPDATE, DELETE)
          const eventType = payload.eventType;

          // Menambahkan tugas baru ke daftar jika diperuntukkan bagi PIC ini
          if (eventType === 'INSERT') {
            const insertedRow = payload.new as ProgressTargetRow;
            if (insertedRow.pic === picName) {
              setTasks((prev) => [mapRowToTask(insertedRow), ...prev]);
            }
          // Memperbarui data tugas yang berubah pada state lokal
          } else if (eventType === 'UPDATE') {
            const updatedRow = payload.new as ProgressTargetRow;
            if (updatedRow.pic === picName) {
              setTasks((prev) =>
                prev.map((task) =>
                  task.id === updatedRow.id
                    ? {
                        // Mempertahankan field yang tidak diubah
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
                        // Memperbarui keterangan
                        keterangan: updatedRow.keterangan || '',
                        // Memperbarui dokumen dengan fallback dokumen sebelumnya
                        dokumen: updatedRow.dokumen || task.dokumen,
                        // Menyinkronkan tanggal selesai dari kolom completed_at
                        completedAt: updatedRow.completed_at ?? null,
                      }
                    : task
                )
              );
            }
          // Menghapus tugas dari state jika dihapus di database
          } else if (eventType === 'DELETE') {
            const deletedId = (payload.old as { id: number }).id;
            setTasks((prev) => prev.filter((task) => task.id !== deletedId));
          }
        }
      )
      .subscribe();

    // Membersihkan langganan channel Realtime saat komponen di-unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [picName, fetchTasksForPIC]);

  // Mengunggah dokumen baru oleh PIC ke Supabase Storage dan mengembalikan public URL-nya
  const uploadDocumentToStorage = async (file: File): Promise<string | null> => {
    // Mengambil ekstensi file
    const fileExt = file.name.split('.').pop();
    // Menyusun nama file unik dengan prefix pic_
    const fileName = `pic_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Mengunggah file ke bucket dokumen-progress
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .upload(fileName, file);

    // Menampilkan pesan jika upload gagal
    if (uploadError) {
      alert('Gagal mengunggah dokumen: ' + uploadError.message);
      return null;
    }

    // Mengambil URL publik dari file yang berhasil diunggah
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .getPublicUrl(fileName);

    // Mengembalikan URL publik dokumen
    return publicUrlData.publicUrl;
  };

  // Menyimpan pembaruan progres, tanggal selesai, status, keterangan, atau dokumen dari sisi PIC
  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      // Menjaga riwayat dokumen yang sudah ada
      let finalDokumenUrl = updatedTask.dokumen || '-';

      // Jika PIC melampirkan file dokumen baru, unggah lalu tambahkan ke riwayat dokumen
      if (updatedTask.fileDokumen) {
        const uploadedUrl = await uploadDocumentToStorage(updatedTask.fileDokumen);
        if (!uploadedUrl) return;
        finalDokumenUrl = appendDocumentHistory(
          updatedTask.dokumen,
          uploadedUrl,
          updatedTask.pic
        );
      }

      // Menentukan tanggal selesai berdasarkan progres dan completedAt yang sudah ada
      const nextCompletedAt = resolveCompletedAt(updatedTask.progress, updatedTask.completedAt);

      // Memperbarui baris target di Supabase beserta completed_at dan status terhitung
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

      // Menampilkan alert jika gagal update, atau memuat ulang data secara silent jika berhasil
      if (error) {
        alert('Gagal memperbarui progress: ' + error.message);
      } else {
        await fetchTasksForPIC(true);
      }
    } catch (err: unknown) {
      // Menangkap error tak terduga dan menampilkannya ke layar
      const message = err instanceof Error ? err.message : String(err);
      alert('Terjadi kesalahan: ' + message);
    }
  };

  // Menandai catatan/keterangan pada tugas tertentu sebagai sudah dibaca oleh PIC
  const handleMarkAsRead = async (taskId: number, cleanedKeterangan: string) => {
    // Memperbarui state lokal agar badge belum dibaca langsung hilang
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, keterangan: cleanedKeterangan } : task))
    );

    // Menyimpan keterangan bersih ke database Supabase
    const { error } = await supabase
      .from(TARGET_TABLE_NAME)
      .update({ keterangan: cleanedKeterangan })
      .eq('id', taskId);

    // Mencatat error di console jika update status baca gagal
    if (error) {
      console.error('Gagal memperbarui status baca:', error.message);
    }
  };

  // Menghapus data sessionStorage dan mengarahkan kembali ke halaman utama/login
  const handleLogout = () => {
    sessionStorage.clear();
    router.push('/');
  };

  // Merender tampilan utama dashboard PIC
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Header halaman PIC dengan sapaan dan tombol logout */}
      <Header
        title="PROGRESS KERJA"
        subtitle={`${greeting}, ${picName}`}
        role="pic"
        onLogout={handleLogout}
      />

      {/* Konten utama halaman */}
      <main className="max-w-[96%] mx-auto px-0 pt-24 pb-12 space-y-8 flex-1 w-full">
        {/* Menampilkan indikator loading atau tabel progres tugas PIC */}
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