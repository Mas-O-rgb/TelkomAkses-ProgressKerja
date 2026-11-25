// ==================== KONSTANTA & TIPE DATA ====================

// Daftar nama PIC bawaan sebagai cadangan jika data profil belum dimuat dari database
export const DAFTAR_PIC = [
  'ANDY AKBAR MAKMUR',
  'ANOM YUDOSENO AJI',
  'GHALY QORI MUBAROQ',
  'ISHMI KAFISHAH NASUTION',
  'MUHAMMAD ARDIANSYAH',
  'NUR FAKHRIZA',
  'SHAKILA LARASATI',
];

// Tipe union untuk label status pengerjaan target yang diakui sistem
export type TaskStatusText =
  | 'SUDAH SELESAI'
  | 'OVERDUE'
  | 'ON PROGRESS'
  | 'BELUM DIKERJAKAN';

// Struktur informasi status lengkap dengan gaya kelas badge Tailwind
export interface StatusInfo {
  // Label teks status target
  text: TaskStatusText;
  // Kelas warna latar, teks, dan border untuk badge status
  className: string;
}

// ==================== FUNGSI HELPER WAKTU & STATUS ====================

// Mengambil tanggal hari ini (format YYYY-MM-DD) sesuai zona waktu Asia/Jakarta
export const getTodayJakarta = (): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
};

// Menentukan nilai tanggal penyelesaian (completed_at) saat target baru atau diperbarui
export const resolveCompletedAt = (
  progress: number,
  existingCompletedAt?: string | null
): string | null => {
  // Jika progres mencapai 100%, pertahankan tanggal selesai lama atau isi dengan tanggal hari ini
  if (progress === 100) {
    return existingCompletedAt || getTodayJakarta();
  }
  // Jika progres belum 100%, kosongkan tanggal penyelesaian
  return null;
};

// Menghitung teks status target secara terpusat berdasarkan tenggat, progres, dan tanggal selesai
export const calculateTaskStatus = (
  tenggat: string,
  progress: number,
  completedAt?: string | null
): TaskStatusText => {
  const today = getTodayJakarta();

  // 1. Jika progres 100%, bandingkan tanggal selesai dengan tenggat waktu
  if (progress === 100) {
    const finishDate = completedAt || today;
    if (tenggat && finishDate > tenggat) {
      return 'OVERDUE';
    }
    return 'SUDAH SELESAI';
  }

  // 2. Jika progres belum 100% dan hari ini sudah melewati tenggat waktu
  if (tenggat && tenggat < today) {
    return 'OVERDUE';
  }

  // 3. Jika progres berada di antara 1% - 99%
  if (progress > 0) {
    return 'ON PROGRESS';
  }

  // 4. Jika progres masih 0% dan belum melewati tenggat
  return 'BELUM DIKERJAKAN';
};

// Mengembalikan teks status sekaligus gaya kelas badge Tailwind untuk tampilan tabel
export const getStatusInfo = (
  tenggat: string,
  progress: number,
  completedAt?: string | null
): StatusInfo => {
  const statusText = calculateTaskStatus(tenggat, progress, completedAt);

  if (statusText === 'SUDAH SELESAI') {
    return {
      text: 'SUDAH SELESAI',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }

  if (statusText === 'OVERDUE') {
    return {
      text: 'OVERDUE',
      className: 'bg-red-50 text-red-700 border-red-200',
    };
  }

  if (statusText === 'ON PROGRESS') {
    return {
      text: 'ON PROGRESS',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }

  return {
    text: 'BELUM DIKERJAKAN',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  };
};