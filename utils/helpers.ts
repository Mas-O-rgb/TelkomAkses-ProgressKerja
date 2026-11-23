export const DAFTAR_PIC = [
  'ANDY AKBAR MAKMUR',
  'ANOM YUDOSENO AJI',
  'GHALY QORI MUBAROQ',
  'ISHMI KAFISHAH NASUTION',
  'MUHAMMAD ARDIANSYAH',
  'NUR FAKHRIZA',
  'SHAKILA LARASATI',
];

export type TaskStatusText =
  | 'SUDAH SELESAI'
  | 'OVERDUE'
  | 'ON PROGRESS'
  | 'BELUM DIKERJAKAN';

export interface StatusInfo {
  text: TaskStatusText;
  className: string;
}

// Ambil tanggal hari ini (YYYY-MM-DD) sesuai zona waktu Asia/Jakarta
export const getTodayJakarta = (): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
};

// Tentukan nilai completed_at saat simpan/update target
export const resolveCompletedAt = (
  progress: number,
  existingCompletedAt?: string | null
): string | null => {
  if (progress === 100) {
    return existingCompletedAt || getTodayJakarta();
  }
  return null;
};

// Hitung teks status secara terpusat berdasarkan tenggat, progress, dan tanggal selesai
export const calculateTaskStatus = (
  tenggat: string,
  progress: number,
  completedAt?: string | null
): TaskStatusText => {
  const today = getTodayJakarta();

  // 1. Jika sudah 100%, cek kapan diselesaikan (completedAt atau tanggal hari ini saat baru 100%)
  if (progress === 100) {
    const finishDate = completedAt || today;
    if (tenggat && finishDate > tenggat) {
      return 'OVERDUE';
    }
    return 'SUDAH SELESAI';
  }

  // 2. Jika belum 100% dan tanggal hari ini sudah melewati tenggat waktu
  if (tenggat && tenggat < today) {
    return 'OVERDUE';
  }

  // 3. Jika sedang dikerjakan (0% < progress < 100%)
  if (progress > 0) {
    return 'ON PROGRESS';
  }

  // 4. Jika belum dikerjakan sama sekali (0%)
  return 'BELUM DIKERJAKAN';
};

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