// utils/helpers.ts

export const DAFTAR_PIC = [
  'ANOM YUDOSENO AJI', 
  'ANDY AKBAR MAKMUR', 
  'GHALY QORI MUBAROQ', 
  'ISHMI KHAFISHAH NASUTION', 
  'PIC Lainnya'
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
  } else if (progress >= 10 && progress <= 30) {
    return { label: 'BARU MULAI', color: 'bg-blue-100 text-blue-700 border-blue-300' };
  } else if (progress >= 40 && progress <= 70) {
    return { label: 'SETENGAH PENGERJAAN', color: 'bg-amber-100 text-amber-700 border-amber-300' };
  } else if (progress >= 80 && progress <= 90) {
    return { label: 'HAMPIR SELESAI', color: 'bg-indigo-100 text-indigo-700 border-indigo-300' };
  } else if (progress === 100) {
    return { label: 'SUDAH SELESAI', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' };
  } else {
    return { label: 'BELUM DIKERJAKAN', color: 'bg-gray-100 text-gray-700 border-gray-300' };
  }
};