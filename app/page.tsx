'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { User, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(''); // Bisa diisi Username atau Email
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let targetEmail = identifier.trim();

      // Cek apakah input BUKAN email (tidak mengandung karakter '@')
      if (!targetEmail.includes('@')) {
        // Cari email di tabel profiles berdasarkan username
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email, role, nama_pic, username')
          .eq('username', targetEmail)
          .single();

        if (profileError || !profileData) {
          alert('Login gagal: Username tidak ditemukan.');
          setLoading(false);
          return;
        }

        targetEmail = profileData.email; // Ambil email aslinya dari database
      }

      // Lakukan login ke Supabase Auth menggunakan email yang valid
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });

      if (authError || !authData.user) {
        alert('Login gagal: Password salah atau akun tidak valid.');
        setLoading(false);
        return;
      }

      // Ambil role pengguna dari tabel profiles untuk pengarahan halaman
      const { data: profileData, error: roleError } = await supabase
        .from('profiles')
        .select('role, nama_pic, username')
        .eq('id', authData.user.id)
        .single();

      if (roleError || !profileData) {
        alert('Gagal mengambil data hak akses pengguna.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Arahkan halaman berdasarkan role ('admin' atau 'pic')
      if (profileData.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (profileData.role === 'pic') {
        sessionStorage.setItem('loggedInPic', profileData.nama_pic || profileData.username);
        router.push('/pic/dashboard');
      } else {
        alert('Role akun tidak dikenali.');
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Terjadi kesalahan:', err);
      alert('Terjadi kesalahan sistem saat login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-8 border-t-4 border-[#ED1E28]">
        <div className="text-center mb-6">
          <div className="bg-[#ED1E28] text-white w-12 h-12 rounded-xl flex items-center justify-center font-black mx-auto mb-3 text-xl shadow">
            TA
          </div>
          <h1 className="text-xl font-bold text-slate-900">TELKOM AKSES</h1>
          <p className="text-xs text-slate-500 mt-1">Login Email atau Username</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email / Username</label>
            <div className="relative">
              <User size={14} className="absolute left-3.5 top-3 text-slate-400" />
              <input 
                type="text" 
                placeholder="Ketik email atau username..."
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#ED1E28]"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-3 text-slate-400" />
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#ED1E28]"
                required
                disabled={loading}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-[#ED1E28] hover:bg-[#c91720] text-white rounded-lg text-xs font-semibold shadow transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Memverifikasi...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}