'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Cek sesi aktif yang terbentuk saat user klik link reset password dari email
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setHasRecoverySession(Boolean(data.session));
      setCheckingSession(false);
    });

    // Dengarkan event PASSWORD_RECOVERY atau SIGNED_IN dari link email
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'PASSWORD_RECOVERY' || Boolean(session)) {
        setHasRecoverySession(true);
        setCheckingSession(false);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    if (password.length < 6) {
      setIsError(true);
      setMessage('Password baru minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setIsError(true);
      setMessage('Konfirmasi password tidak sesuai.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setIsError(true);
        setMessage(error.message || 'Gagal memperbarui password.');
        return;
      }

      // Keluar dari sesi recovery agar user masuk normal lewat halaman pemilihan akun
      await supabase.auth.signOut();
      setIsError(false);
      setMessage('Password berhasil diperbarui. Mengarahkan ke halaman pilih akun...');

      setTimeout(() => {
        router.replace('/');
        router.refresh();
      }, 1200);
    } catch {
      setIsError(true);
      setMessage('Terjadi kesalahan saat menyimpan password baru.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Atur Password Baru</h1>
          <p className="text-xs text-slate-500 mt-1">
            Masukkan password baru untuk akun Anda.
          </p>
        </div>

        {checkingSession ? (
          <p className="text-xs text-slate-500 py-4">Memverifikasi tautan reset password...</p>
        ) : !hasRecoverySession ? (
          <div className="space-y-3">
            <p className="text-xs text-red-600 font-medium">
              Sesi reset password tidak ditemukan atau tautan sudah kedaluwarsa. Silakan minta ulang tautan reset password.
            </p>
            <button
              type="button"
              onClick={() => router.replace('/')}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Kembali ke Halaman Akun
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Password Baru
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#ED1E28]/25 focus:border-[#ED1E28]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Konfirmasi Password Baru
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#ED1E28]/25 focus:border-[#ED1E28]"
              />
            </div>

            {message && (
              <p className={`text-xs font-medium ${isError ? 'text-red-600' : 'text-emerald-600'}`}>
                {message}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => router.replace('/')}
                disabled={submitting}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-[#ED1E28] text-xs font-semibold text-white hover:bg-[#d1151e] disabled:opacity-50"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}