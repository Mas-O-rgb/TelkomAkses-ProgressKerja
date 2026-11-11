'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DAFTAR_PIC } from '@/utils/helpers';
import { Lock, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const [selectedPic, setSelectedPic] = useState(DAFTAR_PIC[0]);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPic || selectedPic === '-') {
      alert('Silakan pilih nama PIC yang valid!');
      return;
    }

    // Simpan sesi login PIC ke localStorage
    localStorage.setItem('logged_pic', selectedPic);
    
    // Redirect ke halaman utama dashboard
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border-t-4 border-[#ED1E28]">
        <div className="p-6 bg-slate-900 text-white text-center">
          <div className="inline-flex bg-[#ED1E28] p-3 rounded-xl mb-3 shadow">
            <Lock size={24} className="text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-wide">LOGIN PIC / PEGAWAI</h1>
          <p className="text-xs text-slate-400 mt-1">Pilih nama Anda untuk mengakses Form Target Progress</p>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Nama Pegawai / PIC</label>
            <select
              value={selectedPic}
              onChange={(e) => setSelectedPic(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white text-slate-800 focus:ring-2 focus:ring-[#ED1E28] focus:outline-none"
            >
              {DAFTAR_PIC.filter(name => name !== '-').map((nama, idx) => (
                <option key={idx} value={nama}>{nama}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#ED1E28] hover:bg-[#c91720] text-white rounded-lg text-sm font-semibold shadow transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <UserCheck size={16} /> Masuk ke Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}