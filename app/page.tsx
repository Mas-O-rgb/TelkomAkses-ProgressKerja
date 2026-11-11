'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ProgressCharts from '@/components/ProgressCharts';
import ProgressForm from '@/components/ProgressForm';
import ProgressTable from '@/components/ProgressTable';
import { getStatusInfo, DAFTAR_PIC } from '@/utils/helpers';
import { supabase } from '@/lib/supabaseClient';
import { ShieldCheck, UserCheck, LogOut, Lock } from 'lucide-react';

export default function DashboardProgressKerja() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [filterKategori, setFilterKategori] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State untuk Sistem Login / Pemilihan Peran
  const [role, setRole] = useState<'CHOICE' | 'ADMIN' | 'PIC'>('CHOICE');
  const [selectedPic, setSelectedPic] = useState<string>(DAFTAR_PIC[0]);
  const [adminPassword, setAdminPassword] = useState('');

  const initialFormState = {
    kategori: 'QMS',
    namaTarget: '',
    waktuMulai: '',
    tenggatWaktu: '',
    progress: 0,
    pic: DAFTAR_PIC[0],
    dokumen: null as any,
  };

  const [formData, setFormData] = useState(initialFormState);

  // Ambil data dari Database
  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('progress_targets')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Gagal mengambil data:', error);
    } else if (data) {
      const mappedTasks = data.map((item) => ({
        id: item.id,
        kategori: item.kategori,
        namaTarget: item.nama_target,
        waktuMulai: item.waktu_mulai,
        tenggatWaktu: item.tenggat_waktu,
        progress: item.progress,
        pic: item.pic,
        dokumen: item.dokumen || 'Dokumen.pdf',
      }));
      setTasks(mappedTasks);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const resetForm = useCallback(() => {
    setCurrentTask(null);
    setFormData({
      ...initialFormState,
      pic: role === 'PIC' ? selectedPic : DAFTAR_PIC[0]
    });
  }, [role, selectedPic]);

  // Handle Login Admin
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'admin123') { // Password bebas bisa disesuaikan
      setRole('ADMIN');
      setAdminPassword('');
    } else {
      alert('Password Admin salah! (Gunakan: admin123)');
    }
  };

  // Handle Login PIC
  const handlePicLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPic || selectedPic === '-') {
      alert('Silakan pilih nama PIC yang valid!');
      return;
    }
    setRole('PIC');
    setFormData(prev => ({ ...prev, pic: selectedPic }));
  };

  // Simpan / Update ke Database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.namaTarget || !formData.waktuMulai || !formData.tenggatWaktu) {
      alert('Mohon isi Nama Target, Waktu Mulai, dan Tenggat Waktu!');
      return;
    }

    setIsSubmitting(true);

    try {
      let dokumenUrl = currentTask?.dokumen || null;

      if (formData.dokumen && typeof formData.dokumen !== 'string') {
        const file = formData.dokumen;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('dokumen-progress')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Gagal mengunggah file:', uploadError);
          alert('Gagal mengunggah dokumen ke server.');
          setIsSubmitting(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('dokumen-progress')
          .getPublicUrl(filePath);

        dokumenUrl = publicUrlData.publicUrl;
      }

      const payload = {
        kategori: formData.kategori,
        nama_target: formData.namaTarget,
        waktu_mulai: formData.waktuMulai,
        tenggat_waktu: formData.tenggatWaktu,
        progress: formData.progress,
        pic: role === 'PIC' ? selectedPic : formData.pic, // Jika login sebagai PIC, kunci PIC sesuai akun login
        dokumen: dokumenUrl,
      };

      const { error } = currentTask
        ? await supabase.from('progress_targets').update(payload).eq('id', currentTask.id)
        : await supabase.from('progress_targets').insert([payload]);

      if (error) {
        console.error(currentTask ? 'Gagal update data:' : 'Gagal tambah data:', error);
      } else {
        resetForm();
        await fetchTasks();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hapus Data
  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus target ini?')) {
      const { error } = await supabase.from('progress_targets').delete().eq('id', id);

      if (error) {
        console.error('Gagal menghapus data:', error);
      } else {
        if (currentTask?.id === id) resetForm();
        fetchTasks();
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

  // Filter tugas khusus PIC yang sedang login
  const displayedTasks = role === 'PIC' 
    ? tasks.filter(t => t.pic === selectedPic) 
    : tasks;

  // Kalkulasi data grafik
  const statusCounts = displayedTasks.reduce((acc: any, task) => {
    const statusObj = getStatusInfo(task.tenggatWaktu, task.progress);
    acc[statusObj.text] = (acc[statusObj.text] || 0) + 1;
    return acc;
  }, {});
  const pieDataStatusFormatted = Object.keys(statusCounts).map(key => ({ name: key, value: statusCounts[key] }));

  const countByField = (field: string) => {
    const counts = displayedTasks.reduce((acc: any, task) => {
      const key = task[field];
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map(key => ({ name: key, value: counts[key], jumlah: counts[key] }));
  };

  const pieDataKategori = countByField('kategori');
  const barDataPic = role === 'ADMIN' ? countByField('pic') : [];

  // TAMPILAN 1: HALAMAN PEMILIHAN LOGIN (CHOICE)
  if (role === 'CHOICE') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 border-t-4 border-[#ED1E28]">
          <div className="text-center mb-8">
            <div className="bg-[#ED1E28] text-white w-12 h-12 rounded-xl flex items-center justify-center font-black mx-auto mb-3 text-xl shadow">
              TA
            </div>
            <h1 className="text-xl font-bold text-slate-900">TELKOM AKSES</h1>
            <p className="text-xs text-slate-500 mt-1">Portal Monitoring & Pengelolaan Progress Kerja</p>
          </div>

          <div className="space-y-6">
            {/* Form Login Admin */}
            <form onSubmit={handleAdminLogin} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h2 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-[#ED1E28]" /> Login Sebagai Admin
              </h2>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-3 text-slate-400" />
                <input 
                  type="password" 
                  placeholder="Masukkan Password Admin (admin123)"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#ED1E28]"
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow transition-all cursor-pointer"
              >
                Masuk Dashboard Admin
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-[10px] uppercase font-semibold">Atau</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Form Login PIC */}
            <form onSubmit={handlePicLogin} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h2 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <UserCheck size={16} className="text-[#ED1E28]" /> Login Sebagai Pegawai / PIC
              </h2>
              <select 
                value={selectedPic}
                onChange={(e) => setSelectedPic(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#ED1E28]"
              >
                {DAFTAR_PIC.filter(p => p !== '-').map((nama, idx) => (
                  <option key={idx} value={nama}>{nama}</option>
                ))}
              </select>
              <button 
                type="submit"
                className="w-full py-2 bg-[#ED1E28] hover:bg-[#c91720] text-white rounded-lg text-xs font-semibold shadow transition-all cursor-pointer"
              >
                Masuk Dashboard PIC
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // TAMPILAN 2 & 3: DASHBOARD ADMIN / PIC
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="bg-slate-900 border-b-4 border-[#ED1E28] shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-[#ED1E28] text-white p-2 rounded-lg font-black tracking-wider text-xl shadow">
              TA
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">TELKOM AKSES</h1>
              <p className="text-xs text-slate-400 font-medium">
                {role === 'ADMIN' ? 'Dashboard Monitoring Utama (Admin)' : `Dashboard Kerja PIC: ${selectedPic}`}
              </p>
            </div>
          </div>

          <button 
            onClick={() => setRole('CHOICE')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all cursor-pointer border border-slate-700"
          >
            <LogOut size={14} /> Keluar / Ganti Akun
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Grafik Monitoring */}
        <ProgressCharts 
          pieDataStatus={pieDataStatusFormatted} 
          pieDataKategori={pieDataKategori} 
          barDataPic={barDataPic} 
        />

        {/* Form Input Target (Admin bisa input/edit semua, PIC otomatis menginput atas nama PIC tersebut) */}
        <ProgressForm 
          formData={role === 'PIC' ? { ...formData, pic: selectedPic } : formData}
          setFormData={setFormData}
          currentTask={currentTask}
          onSubmit={handleSubmit}
          onReset={resetForm}
          loading={isSubmitting} 
        />

        {loading ? (
          <div className="text-center py-8 text-slate-500 text-sm">Memuat data dari database...</div>
        ) : (
          <ProgressTable 
            tasks={displayedTasks}
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