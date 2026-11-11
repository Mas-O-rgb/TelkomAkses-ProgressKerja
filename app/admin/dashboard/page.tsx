'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProgressCharts from '@/components/ProgressCharts';
import ProgressForm from '@/components/ProgressForm';
import ProgressTable from '@/components/ProgressTable';
import { getStatusInfo, DAFTAR_PIC } from '@/utils/helpers';
import { supabase } from '@/lib/supabaseClient';
import { ShieldCheck, LogOut } from 'lucide-react';

export default function AdminDashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [filterKategori, setFilterKategori] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();

  const initialFormState = {
    kategori: '',
    namaTarget: '',
    waktuMulai: '',
    tenggatWaktu: '',
    progress: 0,
    pic: DAFTAR_PIC[0],
    dokumen: null as any,
  };

  const [formData, setFormData] = useState(initialFormState);

  // Verifikasi Sesi Autentikasi Admin
  useEffect(() => {
    const checkAdminAuth = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push('/');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || profile?.role !== 'admin') {
        await supabase.auth.signOut();
        router.push('/');
        return;
      }

      setUserEmail(user.email || 'Admin');
      fetchTasks();
    };

    checkAdminAuth();
  }, [router]);

  const fetchTasks = async () => {
    setLoading(true);
    const { data } = await supabase.from('progress_targets').select('*').order('id', { ascending: false });
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

  const resetForm = useCallback(() => {
    setCurrentTask(null);
    setFormData(initialFormState);
  }, []);

  // Fungsi Tambah / Update Target oleh Admin
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
        pic: formData.pic,
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

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      await supabase.auth.signOut();
      sessionStorage.clear();
      router.push('/');
    }
  };

  // Kalkulasi Grafik
  const statusCounts = tasks.reduce((acc: any, task) => {
    const statusObj = getStatusInfo(task.tenggatWaktu, task.progress);
    acc[statusObj.text] = (acc[statusObj.text] || 0) + 1;
    return acc;
  }, {});
  const pieDataStatusFormatted = Object.keys(statusCounts).map(key => ({ name: key, value: statusCounts[key] }));

  const countByField = (field: string) => {
    const counts = tasks.reduce((acc: any, task) => {
      const key = task[field];
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map(key => ({ name: key, value: counts[key], jumlah: counts[key] }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="bg-slate-900 border-b-4 border-[#ED1E28] shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-[#ED1E28] text-white p-2 rounded-lg font-black tracking-wider text-xl">TA</div>
            <div>
              <h1 className="text-xl font-bold text-white">TELKOM AKSES</h1>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <ShieldCheck size={12} className="text-[#ED1E28]" /> Panel Kontrol Admin ({userEmail})
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

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <ProgressCharts 
          pieDataStatus={pieDataStatusFormatted} 
          pieDataKategori={countByField('kategori')} 
          barDataPic={countByField('pic')} 
        />

        {/* Form Input / Edit Target untuk Admin */}
        <ProgressForm 
          formData={formData}
          setFormData={setFormData}
          currentTask={currentTask}
          onSubmit={handleSubmit}
          onReset={resetForm}
          loading={isSubmitting} 
        />

        {loading ? (
          <div className="text-center py-8 text-slate-500 text-sm">Memuat data...</div>
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