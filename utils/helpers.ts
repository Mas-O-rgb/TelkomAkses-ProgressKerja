// utils/helpers.ts

export const DAFTAR_PIC = [
  'ANOM YUDOSENO AJI', 
  'ANDY AKBAR MAKMUR', 
  'GHALY QORI MUBAROQ', 
  'ISHMI KHAFISHAH NASUTION', 
  'ARDIANSYAH',
  'NUR FAKHRIZA',
  'SHAKILA LARASATI'
];

export const getStatusInfo = (tenggatWaktu: string, progress: number) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDate = new Date(tenggatWaktu);
  dueDate.setHours(0, 0, 0, 0);

  // Cek apakah sudah melewati tenggat waktu (dan belum selesai mutlak atau dipaksa overdue)
  if (today > dueDate) {
    return {
      text: 'OVERDUE',
      className: 'bg-red-100 text-red-700 border border-red-300 font-bold px-2.5 py-1 rounded-full text-[10px]'
    };
  }

  // Jika belum lewat tenggat waktu, cek progress
  if (progress === 100) {
    return {
      text: 'SUDAH SELESAI',
      className: 'bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-full text-[10px]'
    };
  } else if (progress > 0) {
    return {
      text: 'ON PROGRESS',
      className: 'bg-amber-100 text-amber-700 font-bold px-2.5 py-1 rounded-full text-[10px]'
    };
  } else {
    return {
      text: 'BELUM DIKERJAKAN',
      className: 'bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full text-[10px]'
    };
  }
};