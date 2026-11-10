// utils/helpers.ts

export const DAFTAR_PIC = [
  'ANOM YUDOSENO AJI', 
  'ANDY AKBAR MAKMUR', 
  'GHALY QORI MUBAROQ', 
  'ISHMI KHAFISHAH NASUTION', 
  '-',
  '-'
];

export const hitungStatus = (progress: number, tenggatWaktu: string) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Jika tanggal hari ini melewati tenggat waktu dan progress belum mencapai 100%
  const isOverdue = tenggatWaktu < today && progress < 100;

  if (isOverdue) {
    return { label: 'OVERDUE', color: 'bg-red-100 text-red-700 border-red-300' };
  }
  
  // Pemetaan rentang progress ke status otomatis
  if (progress === 0) {
    return { label: 'BELUM DIKERJAKAN', color: 'bg-gray-100 text-gray-700 border-gray-300' };
  } else if (progress >= 10 && progress <= 90) {
    return { label: 'ON PROGRESS', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' };
  } else if (progress === 100) {
    return { label: 'SUDAH SELESAI', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' };
  } else {
    return { label: 'BELUM DIKERJAKAN', color: 'bg-gray-100 text-gray-700 border-gray-300' };
  }
};