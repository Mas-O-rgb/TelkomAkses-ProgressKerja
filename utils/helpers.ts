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

// ==================== KONFIGURASI & HELPER WARNA KATEGORI ====================

// Mendefinisikan pasangan warna hex (untuk grafik) dan kelas badge Tailwind (untuk tabel)
export interface CategoryColorTheme {
  // Kode warna hex untuk elemen chart/indikator titik kategori
  hex: string;
  // Kelas Tailwind untuk latar, teks, dan border badge kategori
  badgeClass: string;
}

// 10 warna berbeda untuk kategori-kategori yang muncul
export const CATEGORY_COLOR_PALETTE: CategoryColorTheme[] = [
  { hex: '#EF4444', badgeClass: 'bg-red-50 text-red-700 border-red-200' },         // 1. Merah
  { hex: '#F59E0B', badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' },   // 2. Kuning/Amber
  { hex: '#10B981', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' }, // 3. Hijau
  { hex: '#3B82F6', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },       // 4. Biru
  { hex: '#8B5CF6', badgeClass: 'bg-violet-50 text-violet-700 border-violet-200' }, // 5. Ungu
  { hex: '#EC4899', badgeClass: 'bg-pink-50 text-pink-700 border-pink-200' },       // 6. Pink
  { hex: '#06B6D4', badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200' },       // 7. Cyan
  { hex: '#F97316', badgeClass: 'bg-orange-50 text-orange-700 border-orange-200' }, // 8. Oranye
  { hex: '#6366F1', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' }, // 9. Indigo
  { hex: '#64748B', badgeClass: 'bg-slate-100 text-slate-700 border-slate-300' },   // 10. Abu-abu/Slate
];

// Membuat peta warna (nama kategori ternormalisasi -> tema warna) berdasarkan daftar kategori yang ada
export const buildCategoryColorMap = (
  categories: string[]
): Record<string, CategoryColorTheme> => {
  const colorMap: Record<string, CategoryColorTheme> = {};
  let nextColorIndex = 0;

  for (const rawCategory of categories) {
    const normalized = (rawCategory || '').trim().toLowerCase();
    if (!normalized) continue;

    // Jika kategori sudah pernah dipetakan, pertahankan warna yang sama
    if (!colorMap[normalized]) {
      colorMap[normalized] =
        CATEGORY_COLOR_PALETTE[nextColorIndex % CATEGORY_COLOR_PALETTE.length];
      nextColorIndex += 1;
    }
  }

  return colorMap;
};

// Mengambil tema warna kategori berdasarkan map yang sudah dibentuk (fallback ke hash jika map kosong)
export const getCategoryTheme = (
  categoryName?: string | null,
  colorMap?: Record<string, CategoryColorTheme>
): CategoryColorTheme => {
  const normalized = (categoryName || '').trim().toLowerCase();

  if (colorMap && normalized && colorMap[normalized]) {
    return colorMap[normalized];
  }

  // Fallback deterministik jika dipanggil tanpa colorMap
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  const fallbackIndex = Math.abs(hash) % CATEGORY_COLOR_PALETTE.length;
  return CATEGORY_COLOR_PALETTE[fallbackIndex];
};