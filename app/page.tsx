'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, UserCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';

interface Profile {
  id: string;
  email: string;
  role: string;
  nama_pic: string | null;
}

export default function LoginPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfiles() {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error('Gagal memuat profil:', error.message);
      } else if (data) {
        setProfiles(data);
      }
      setLoading(false);
    }

    fetchProfiles();
  }, []);

  // Handler saat Admin Utama / Umum dipilih
  const handleLoginAdmin = () => {
    sessionStorage.setItem('userRole', 'admin');
    sessionStorage.setItem('userName', 'Administrator');
    router.push('/admin/dashboard');
  };

  // Handler saat Admin spesifik dipilih
  const handleLoginSpecificAdmin = (adminName: string) => {
    sessionStorage.setItem('userRole', 'admin');
    sessionStorage.setItem('userName', adminName);
    router.push('/admin/dashboard');
  };

  // Handler saat PIC dipilih
  const handleLoginPIC = (picName: string) => {
    router.push(`/pic/${encodeURIComponent(picName)}`);
  };

  // Memisahkan admin dan PIC dari data supabase
  const adminProfiles = profiles.filter(p => p.role === 'admin');
  const picProfiles = profiles.filter(p => p.role === 'pic' && p.nama_pic);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute w-[500px] h-[500px] bg-[#ED1E28]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-4xl relative z-10 space-y-8">
        
        {/* Header Judul */}
        <div className="text-center space-y-2">
          <div className="logo">
            <Image 
              src="/telkom_akses.png" 
              alt="Logo Telkom Akses" 
              width={120} 
              height={120} 
              className="h-14 w-auto mx-auto mb-3 object-contain"
              priority
            />
          </div>
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck size={14} className="text-[#ED1E28]" /> Pilih Akses Masuk Sesuai Peran Anda
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 size={32} className="animate-spin text-[#ED1E28]" />
            <p className="text-xs text-slate-400">Memuat daftar akun...</p>
          </div>
        ) : (
          /* Grid Kartu Login (Admin & PIC) */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">

            {/* Kartu Admin Tambahan dari Database */}
            {adminProfiles
              .filter(admin => admin.nama_pic) // Ambil yang punya nama lengkap
              .map((admin) => (
                <button
                  key={admin.id}
                  onClick={() => handleLoginSpecificAdmin(admin.nama_pic!)}
                  className="group relative bg-red-900 hover:bg-red-800 p-8 rounded-2xl shadow-xl transition-all duration-200 transform hover:-translate-y-1 flex flex-col items-center justify-center text-center cursor-pointer border border-red-800 hover:border-red-700"
                >
                  <div className="bg-slate-800 p-3 rounded-xl mb-4 text-slate-400 group-hover:text-white group-hover:bg-[#ED1E28] group-hover:scale-110 transition-all">
                    <ShieldCheck size={32} />
                  </div>
                  <span className="text-sm font-bold tracking-wide text-slate-200 group-hover:text-white line-clamp-2">
                    {admin.nama_pic}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">
                    Admin Dashboard
                  </span>
                </button>
            ))}

            {/* Tombol Kartu Daftar PIC Otomatis dari Supabase */}
            {picProfiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleLoginPIC(profile.nama_pic!)}
                className="group relative bg-slate-900 hover:bg-slate-800 p-8 rounded-2xl shadow-xl transition-all duration-200 transform hover:-translate-y-1 flex flex-col items-center justify-center text-center cursor-pointer border border-slate-800 hover:border-slate-700"
              >
                <div className="bg-slate-800 p-3 rounded-xl mb-4 text-slate-400 group-hover:text-white group-hover:bg-[#ED1E28] group-hover:scale-110 transition-all">
                  <UserCheck size={32} />
                </div>
                <span className="text-sm font-bold tracking-wide text-slate-200 group-hover:text-white line-clamp-2">
                  {profile.nama_pic}
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  PIC Dashboard
                </span>
              </button>
            ))}

          </div>
        )}

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