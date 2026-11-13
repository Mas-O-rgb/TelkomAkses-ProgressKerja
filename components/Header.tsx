'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ShieldCheck, UserCheck, LogOut, ArrowLeft } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal'; // <-- 1. Import ConfirmModal

interface HeaderProps {
  title: string;
  subtitle: string;
  role: 'admin' | 'pic';
  onLogout: () => void;
  onBack?: () => void;
}

export default function Header({
  title,
  subtitle,
  role,
  onLogout,
  onBack,
}: HeaderProps) {
  // 2. State untuk mengontrol pop-up konfirmasi keluar
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <>
      <header className="bg-slate-950 border-b-4 border-[#ED1E28] shadow-xl fixed top-0 left-0 w-full z-50">
        <div className="max-w-[96%] mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Tombol Kembali (Opsional, biasa dipakai di panel PIC) */}
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer transition-all"
                title="Kembali"
              >
                <ArrowLeft size={16} />
              </button>
            )}

            {/* Logo Kotak Gambar "TA" */}
            <div className="logo">
              <Image 
                src="/telkom_akses.png" 
                alt="Logo Telkom Akses" 
                width={120} 
                height={120} 
                className="object-contain"
                priority
              />
            </div>

            <div className="flex flex-col pl-7">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white uppercase tracking-wide">{title}</h1>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                {role === 'admin' ? (
                  <ShieldCheck size={12} className="text-[#ED1E28]" />
                ) : (
                  <UserCheck size={12} className="text-[#ED1E28]" />
                )}
                {subtitle}
              </p>
            </div>
          </div>

          {/* Tombol Keluar / Ganti Akun memicu Modal */}
          <button 
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer border border-slate-700 transition-all shadow-sm"
          >
            <LogOut size={14} /> {role === 'admin' ? 'Keluar' : 'Ganti Akun'}
          </button>
        </div>
      </header>

      {/* Komponen Pop-up Konfirmasi Kustom */}
      <ConfirmModal 
        isOpen={showLogoutModal}
        title="Konfirmasi Keluar"
        message={role === 'admin' ? "Apakah Anda yakin ingin keluar dari Panel Admin?" : "Apakah Anda yakin ingin mengganti akun PIC?"}
        confirmText="Ya, Keluar"
        cancelText="Batal"
        onClose={() => setShowLogoutModal(false)}
        onConfirm={onLogout}
      />
    </>
  );
}