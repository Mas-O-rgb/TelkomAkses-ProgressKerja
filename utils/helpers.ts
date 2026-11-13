export const DAFTAR_PIC = [
  'ANOM YUDOSENO AJI',
  'ANDY AKBAR MAKMUR',
  'GHALY QORI MUBAROQ',
  'ISHMI KAFISHAH NASUTION',
  'MUHAMMAD ARDIANSYAH',
  'NUR FAKHRIZA',
  'SHAKILA LARASATI'
];

export const getStatusInfo = (tenggat: string, progress: number) => {
  const today = new Date().toISOString().split('T')[0];

  // 1. PRIORITAS UTAMA: Jika tanggal hari ini SUDAH MELEWATI tenggat waktu,
  // maka statusnya TETAP OVERDUE meskipun progress sudah 100%
  if (tenggat && tenggat < today) {
    return { text: 'OVERDUE', className: 'bg-red-50 text-red-700 border-red-200' };
  }

  // 2. Jika belum melewati tenggat, baru cek apakah sudah 100%
  if (progress === 100) {
    return { text: 'SUDAH SELESAI', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }

  // 3. Jika sedang dikerjakan (0% < progress < 100%)
  if (progress > 0) {
    return { text: 'ON PROGRESS', className: 'bg-amber-50 text-amber-700 border-amber-200' };
  }

  // 4. Jika belum dikerjakan sama sekali (0%)
  return { text: 'BELUM DIKERJAKAN', className: 'bg-slate-100 text-slate-600 border-slate-200' };
};