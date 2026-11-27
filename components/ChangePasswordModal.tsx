// Menandakan komponen ini berjalan di sisi klien (browser) di Next.js App Router
'use client';

// Mengimpor hook React untuk state dan efek samping siklus hidup komponen
import React, { useEffect, useState } from 'react';
// Mengimpor ikon UI dari lucide-react
import { Eye, EyeOff, KeyRound, Loader2, X } from 'lucide-react';
// Mengimpor client Supabase untuk verifikasi dan pembaruan password akun
import { supabase } from '@/lib/supabaseClient';

// Mendefinisikan tipe props komponen modal ubah password
interface ChangePasswordModalProps {
  // Menentukan apakah pop-up modal sedang tampil atau tersembunyi
  isOpen: boolean;
  // Fungsi callback untuk menutup modal dari komponen induk
  onClose: () => void;
}

/**
 * Komponen pop-up modal untuk mengganti password akun yang sedang login
 * menggunakan Supabase Auth, lengkap dengan validasi dan verifikasi password lama.
 */
export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  // Menyimpan nilai input password lama, password baru, dan konfirmasi password baru
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Mengatur status tampil/sembunyi (teks biasa vs titik) untuk tiap kolom password
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Menyimpan pesan umpan balik error, sukses, serta status loading saat proses simpan
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Mereset seluruh input dan pesan saat modal dibuka, serta mendaftarkan pintasan tombol Escape
  useEffect(() => {
    if (!isOpen) return;

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(false);

    // Menutup modal ketika tombol Escape ditekan selama proses penyimpanan tidak berjalan
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  // Tidak merender apa pun ke DOM ketika modal dalam keadaan tertutup
  if (!isOpen) return null;

  // Menutup modal secara aman saat tidak sedang memproses perubahan password
  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  // Memvalidasi input, memverifikasi password lama, lalu memperbarui password di Supabase Auth
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Memastikan panjang password baru memenuhi batas minimal Supabase Auth
    if (newPassword.length < 6) {
      setErrorMsg('Password baru minimal 6 karakter.');
      return;
    }

    // Memastikan password baru dan konfirmasinya identik
    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi password baru tidak cocok.');
      return;
    }

    // Mencegah pengguna mengatur password baru yang sama persis dengan password lama
    if (currentPassword === newPassword) {
      setErrorMsg('Password baru tidak boleh sama dengan password lama.');
      return;
    }

    setLoading(true);
    try {
      // Mengambil data pengguna aktif untuk mendapatkan email akun saat ini
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const userEmail = userData.user?.email;

      if (userError || !userEmail) {
        setErrorMsg('Sesi login tidak ditemukan. Silakan login ulang.');
        return;
      }

      // Memverifikasi password lama dengan menguji kredensial ke Supabase Auth
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (verifyError) {
        setErrorMsg('Password lama yang Anda masukkan salah.');
        return;
      }

      // Memperbarui password akun yang sedang terautentikasi ke password baru
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setErrorMsg(updateError.message || 'Gagal memperbarui password.');
        return;
      }

      // Menampilkan pesan sukses, mengosongkan field, lalu menutup modal otomatis
      setSuccessMsg('Password berhasil diubah!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan saat mengubah password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Lapisan backdrop gelap; klik di luar kotak dialog akan menutup modal
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4"
      onClick={handleClose}
    >
      {/* Kotak dialog utama; stopPropagation mencegah klik di dalam form menutup modal */}
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
      >
        {/* Header modal dengan judul fitur dan tombol tutup */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-[#ED1E28] flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Ubah Password</h3>
              <p className="text-xs text-slate-500">
                Perbarui kata sandi akun Anda secara berkala
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form input password lama, password baru, dan konfirmasi password baru */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Kolom input password lama beserta tombol toggle visibilitas */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Password Lama
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan password saat ini"
                required
                disabled={loading}
                className="w-full pr-10 pl-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ED1E28]/25 focus:border-[#ED1E28]"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Kolom input password baru beserta tombol toggle visibilitas */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Password Baru
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
                disabled={loading}
                className="w-full pr-10 pl-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ED1E28]/25 focus:border-[#ED1E28]"
              />
              <button
                type="button"
                onClick={() => setShowNew((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Kolom konfirmasi password baru beserta tombol toggle visibilitas */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                required
                disabled={loading}
                className="w-full pr-10 pl-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ED1E28]/25 focus:border-[#ED1E28]"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Menampilkan pesan error validasi/autentikasi atau pesan sukses pembaruan */}
          {errorMsg && (
            <p className="text-xs font-medium text-[#ED1E28]">{errorMsg}</p>
          )}
          {successMsg && (
            <p className="text-xs font-medium text-emerald-600">{successMsg}</p>
          )}

          {/* Tombol batal dan simpan perubahan password */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#ED1E28] text-xs font-semibold text-white hover:bg-[#d1151e] transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}