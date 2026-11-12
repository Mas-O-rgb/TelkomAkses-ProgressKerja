'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, UserCheck } from 'lucide-react';
import { DAFTAR_PIC } from '@/utils/helpers';

export default function LoginPage() {
  const router = useRouter();

  // Handler saat Admin dipilih
  const handleLoginAdmin = () => {
    sessionStorage.setItem('userRole', 'admin');
    sessionStorage.setItem('userName', 'Administrator');
    router.push('/admin/dashboard');
  };

  // Handler saat PIC dipilih
  const handleLoginPIC = (picName: string) => {
    // Mengarahkan ke rute dinamis /pic/NAMA_PIC
    router.push(`/pic/${encodeURIComponent(picName)}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
      {/* Background Glow */}
      <div className="absolute w-[500px] h-[500px] bg-[#ED1E28]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-4xl relative z-10 space-y-8">
        
        {/* Header Judul */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center bg-[#ED1E28] text-white p-3 rounded-2xl font-black text-2xl tracking-wider shadow-lg mb-2">
            TA
          </div>
          <h1 className="text-2xl font-bold tracking-wide">TELKOM AKSES</h1>
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck size={14} className="text-[#ED1E28]" /> Pilih Akses Masuk Sesuai Peran Anda
          </p>
        </div>

        {/* Grid Kartu Login (Admin & PIC) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          
          {/* Tombol Kartu Admin */}
          <button
            onClick={handleLoginAdmin}
            className="group relative bg-[#ED1E28] hover:bg-[#d91922] p-8 rounded-2xl shadow-xl transition-all duration-200 transform hover:-translate-y-1 flex flex-col items-center justify-center text-center cursor-pointer border border-red-400/30"
          >
            <div className="bg-white/10 p-3 rounded-xl mb-4 text-white group-hover:scale-110 transition-transform">
              <ShieldCheck size={32} />
            </div>
            <span className="text-lg font-black tracking-wider uppercase text-white">
              Admin
            </span>
            <span className="text-xs text-white/80 mt-1">
              Kontrol & Kelola Semua Target
            </span>
          </button>

          {/* Tombol Kartu Daftar PIC (Muncul otomatis sesuai data di DAFTAR_PIC) */}
          {DAFTAR_PIC.map((picName, index) => (
            <button
              key={index}
              onClick={() => handleLoginPIC(picName)}
              className="group relative bg-slate-900 hover:bg-slate-800 p-8 rounded-2xl shadow-xl transition-all duration-200 transform hover:-translate-y-1 flex flex-col items-center justify-center text-center cursor-pointer border border-slate-800 hover:border-slate-700"
            >
              <div className="bg-slate-800 p-3 rounded-xl mb-4 text-slate-400 group-hover:text-white group-hover:bg-[#ED1E28] group-hover:scale-110 transition-all">
                <UserCheck size={32} />
              </div>
              <span className="text-sm font-bold tracking-wide text-slate-200 group-hover:text-white line-clamp-2">
                {picName}
              </span>
              <span className="text-[11px] text-slate-500 mt-1">
                PIC Dashboard
              </span>
            </button>
          ))}

        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-slate-900">
          <p className="text-xs text-slate-500">
            &copy; 2026 PT Telkom Akses. Sistem Monitoring Progress Kerja.
          </p>
        </div>

      </div>
    </div>
  );
}