'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ShieldCheck, UserCheck, LogOut, ArrowLeft } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
// Mengimpor state React, ikon kunci, dan komponen modal ubah password
import { KeyRound } from 'lucide-react';
import { ChangePasswordModal } from '@/components/ChangePasswordModal';

interface HeaderProps {
  title: string;
  subtitle: string;
  role: 'admin' | 'pic';
  onLogout: () => void;
  onBack?: () => void;
}

/**
 * Header tetap (fixed top) untuk halaman Admin dan PIC, lengkap dengan
 * logo perusahaan, informasi peran/sapaan, serta modal konfirmasi keluar/ganti akun.
 */
export default function Header({
  title,
  subtitle,
  role,
  onLogout,
  onBack,
}: HeaderProps) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // State di dalam komponen Header untuk mengontrol buka/tutup modal ubah password
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Sesuaikan teks pesan dan tombol berdasarkan peran pengguna
  const logoutMessage =
    role === 'admin'
      ? 'Apakah Anda yakin ingin keluar dari Panel Admin?'
      : 'Apakah Anda yakin ingin mengganti akun PIC?';

  const logoutButtonLabel = role === 'admin' ? 'Keluar' : 'Ganti Akun';

  return (
    <>
      <header className="bg-slate-950 border-b-4 border-[#ED1E28] shadow-xl fixed top-0 left-0 w-full z-50">
        <div className="max-w-[96%] mx-auto px-4 py-4 flex justify-between items-center">
          {/* Bagian kiri: tombol kembali opsional, logo, judul, dan sapaan/peran */}
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer transition-all"
                title="Kembali"
              >
                <ArrowLeft size={16} />
              </button>
            )}

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

          // Tombol pemicu modal ubah password di area header/navbar
          <button
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#ED1E28]" />
            <span>Ubah Password</span>
          </button>

          {/* Tombol pemicu modal konfirmasi keluar / ganti akun */}
          <button
            type="button"
            onClick={() => setIsLogoutModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer border border-slate-700 transition-all shadow-sm"
          >
            <LogOut size={14} /> {logoutButtonLabel}
          </button>
        </div>
      </header>

      {/* Modal konfirmasi sebelum mengeksekusi onLogout */}
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="Konfirmasi Keluar"
        message={logoutMessage}
        confirmText="Ya, Keluar"
        cancelText="Batal"
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={onLogout}
      />

      // Merender modal ubah password yang terhubung ke state isPasswordModalOpen
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  );
}
