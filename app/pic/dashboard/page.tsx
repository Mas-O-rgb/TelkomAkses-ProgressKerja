'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProgressForm from '@/components/ProgressForm';
import ProgressTable from '@/components/ProgressTable';
import { supabase } from '@/lib/supabaseClient';
import { UserCheck, LogOut } from 'lucide-react';

export default function PicDashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [filterKategori, setFilterKategori] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loggedInPic, setLoggedInPic] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();

  // 1. Verifikasi Sesi & Ambil Identitas PIC yang Sedang Login
  useEffect(() => {
  // 1. Ambil nama PIC dari sesi login
  const loggedInPicName = sessionStorage.getItem('loggedInPic') || '';
  
  setLoggedInPic(loggedInPicName);

  // 2. Kunci nilai PIC di dalam formData
  setFormData((prev) => ({
    ...prev,
    pic: loggedInPicName
  }));
}, []);

  // 2. Ambil Data Target KHUSUS Milik PIC Tersebut
  const fetchTasks = async (picName: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('progress_targets')
      .select('*')
      .eq('pic', picName)
      .order('id', { ascending: false });

    if (data) {
      setTasks(data.map(item => ({
        id: item.id,
        kategori: item.kategori,
        namaTarget: item.nama_target,
        waktuMulai: item.waktu_mulai,
        tenggatWaktu: item.tenggat_waktu,
        progress: item.progress,
        pic: item.pic,
        dokumen: item.dokumen || 'Dokumen.pdf',
      })));
    }
    setLoading(false);
  };

  const initialFormState = {
    kategori: '',
    namaTarget: '',
    waktuMulai: '',
    tenggatWaktu: '',
    progress: 0,
    pic: loggedInPic,
    dokumen: null as any,
  };

  const [formData, setFormData] = useState(initialFormState);

  const resetForm = useCallback(() => {
    setCurrentTask(null);
    setFormData({ ...initialFormState, pic: loggedInPic });
  }, [loggedInPic]);

  // 3. Fungsi Tambah / Update Target Mandiri oleh PIC
// 3. Fungsi Tambah / Update Target Mandiri oleh PIC
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Kirim data ke Supabase menggunakan nama tabel yang benar: 'progress_targets'
    const { error } = await supabase.from('progress_targets').insert([
      {
        kategori: formData.kategori,
        nama_target: formData.namaTarget,
        waktu_mulai: formData.waktuMulai,
        tenggat_waktu: formData.tenggatWaktu,
        progress: formData.progress,
        pic: loggedInPic, // Menggunakan nama PIC dari akun yang login
        dokumen: formData.dokumen || null, // Menggunakan state dokumen yang sesuai dari form
      }
    ]);

    if (error) {
      alert('Gagal menyimpan: ' + error.message);
    } else {
      alert('Target berhasil disimpan!');
      resetForm();
      fetchTasks(loggedInPic); // Refresh data tabel setelah disimpan
    }
    setIsSubmitting(false);
  };

  // 4. Hapus Target Mandiri
  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus target ini?')) {
      const { error } = await supabase.from('progress_targets').delete().eq('id', id);
      if (error) {
        console.error('Gagal menghapus data:', error);
      } else {
        if (currentTask?.id === id) resetForm();
        fetchTasks(loggedInPic);
      }
    }
  };

  const handleEdit = (task: any) => {
    setCurrentTask(task);
    setFormData({
      kategori: task.kategori,
      namaTarget: task.namaTarget,
      waktuMulai: task.waktuMulai,
      tenggatWaktu: task.tenggatWaktu,
      progress: task.progress,
      pic: task.pic,
      dokumen: task.dokumen,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      await supabase.auth.signOut();
      sessionStorage.clear();
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Header Khusus PIC */}
      <header className="bg-slate-900 border-b-4 border-[#ED1E28] shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-[#ED1E28] text-white p-2 rounded-lg font-black tracking-wider text-xl">TA</div>
            <div>
              <h1 className="text-xl font-bold text-white">TELKOM AKSES</h1>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <UserCheck size={12} className="text-[#ED1E28]" /> Portal Input Target PIC: <span className="text-white font-semibold">{loggedInPic}</span> ({userEmail})
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer border border-slate-700 transition-all"
          >
            <LogOut size={14} /> Keluar
          </button>
        </div>
      </header>

      {/* Konten Utama: Fokus ke Form Input & Tabel Pekerjaan Pribadi */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Form Input Target Baru (Field PIC terkunci otomatis sesuai akun login) */}
        <ProgressForm
          formData={{ ...formData, pic: loggedInPic }}
          setFormData={setFormData}
          currentTask={currentTask}
          onSubmit={handleSubmit}
          onReset={resetForm}
          loading={isSubmitting}
        />

        {/* Tabel Daftar Target Milik PIC Tersebut */}
        {loading ? (
          <div className="text-center py-8 text-slate-500 text-sm">Memuat data rincian target...</div>
        ) : (
          <ProgressTable 
            tasks={tasks}
            filterKategori={filterKategori}
            setFilterKategori={setFilterKategori}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </main>
    </div>
  );
}