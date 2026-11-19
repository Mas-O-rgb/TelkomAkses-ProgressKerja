'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Modal konfirmasi kustom sebagai pengganti dialog bawaan browser (window.confirm)
 * agar tampilan konsisten dengan tema gelap aplikasi.
 */
export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Ya, Keluar',
  cancelText = 'Batal',
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  // Jangan render apa pun jika modal sedang tertutup
  if (!isOpen) return null;

  // Jalankan aksi konfirmasi lalu tutup modal
  const handleConfirmAndClose = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-100 relative overflow-hidden">
        {/* Garis aksen merah di bagian atas kartu modal */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[#ED1E28]" />

        {/* Tombol tutup (X) di pojok kanan atas */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup modal"
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Konten utama: ikon peringatan, judul, dan pesan */}
        <div className="flex items-start gap-4 mt-2">
          <div className="p-3 bg-[#ED1E28]/10 text-[#ED1E28] rounded-xl border border-[#ED1E28]/20 shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">{title}</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Tombol batal dan tombol konfirmasi */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-slate-700"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirmAndClose}
            className="px-4 py-2 bg-[#ED1E28] hover:bg-[#d91922] text-white rounded-xl text-xs font-semibold shadow-lg shadow-red-900/30 transition-all cursor-pointer border border-red-500/30"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
