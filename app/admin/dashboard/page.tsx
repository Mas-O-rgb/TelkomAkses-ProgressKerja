'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import ProgressCharts from '@/components/ProgressCharts';
import ProgressForm from '@/components/ProgressForm';
import ProgressTable from '@/components/ProgressTable';
import { getStatusInfo, DAFTAR_PIC } from '@/utils/helpers';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Helper terpusat untuk kalkulasi status agar konsisten
const calculateTaskStatus = (tenggatWaktu: string, progress: number): string => {
  const today = new Date().toISOString().split('T')[0];
  if (tenggatWaktu && tenggatWaktu < today) return 'OVERDUE';
  if (progress === 100) return 'SUDAH SELESAI';
  if (progress > 0) return 'ON PROGRESS';
  return 'BELUM DIKERJAKAN';
};

function AdminDashboardContent() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [filterKategori, setFilterKategori] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const [adminName, setAdminName] = useState('Administrator');
  const [greeting, setGreeting] = useState('Selamat Datang');

  // Ambil Nama Admin dari Session & Tentukan Sapaan Waktu Real-Time
  useEffect(() => {
    const storedName = sessionStorage.getItem('userName');
    if (storedName) {
      setAdminName(storedName);
    }

    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 4 && hour < 11) {
        setGreeting('Selamat Pagi');
      } else if (hour >= 11 && hour < 15) {
        setGreeting('Selamat Siang');
      } else if (hour >= 15 && hour < 18) {
        setGreeting('Selamat Sore');
      } else {
        setGreeting('Selamat Malam');
      }
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  const initialFormState = {
    kategori: '',
    namaTarget: '',
    waktuMulai: '',
    tenggatWaktu: '',
    progress: 0,
    pic: DAFTAR_PIC[0],
    keterangan: '',
    dokumen: null as any,
  };

  const [formData, setFormData] = useState(initialFormState);

  // Verifikasi Sesi Autentikasi Admin & Langsung Pasang Supabase Realtime
  useEffect(() => {
    const role = sessionStorage.getItem('userRole');
    if (role !== 'admin') {
      router.push('/');
      return;
    }

    fetchTasks();

    // Mengaktifkan Supabase Realtime agar sinkron otomatis tanpa refresh
    const channel = supabase
      .channel('public:progress_targets')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'progress_targets' },
        () => {
          fetchTasks(); // Ambil data baru otomatis saat ada perubahan di database
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        keterangan: item.keterangan || '',
        dokumen: item.dokumen || 'Upluad File',
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
      alert('Mohon isi Nama Target, Waktu Mulai, dan Due Date!');
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

      const status = calculateTaskStatus(formData.tenggatWaktu, formData.progress);

      const payload = {
        kategori: formData.kategori,
        nama_target: formData.namaTarget,
        waktu_mulai: formData.waktuMulai,
        tenggat_waktu: formData.tenggatWaktu,
        progress: formData.progress,
        status: status,
        pic: formData.pic,
        keterangan: formData.keterangan,
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

  const handleUpdateTask = async (updatedTask: any) => {
    let dokumenUrl = updatedTask.dokumen;

    if (updatedTask.fileDokumen) {
      const file = updatedTask.fileDokumen;
      const fileExt = file.name.split('.').pop();
      const fileName = `admin_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('dokumen-progress')
        .upload(fileName, file);

      if (uploadError) {
        alert('Gagal mengunggah dokumen: ' + uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('dokumen-progress')
        .getPublicUrl(fileName);

      dokumenUrl = publicUrlData.publicUrl;
    }

    const status = calculateTaskStatus(updatedTask.tenggatWaktu, updatedTask.progress);

    const { error } = await supabase
      .from('progress_targets')
      .update({
        kategori: updatedTask.kategori,
        nama_target: updatedTask.namaTarget,
        waktu_mulai: updatedTask.waktuMulai,
        tenggat_waktu: updatedTask.tenggatWaktu,
        progress: updatedTask.progress,
        status: status,
        pic: updatedTask.pic,
        keterangan: updatedTask.keterangan,
        dokumen: dokumenUrl,
      })
      .eq('id', updatedTask.id);

    if (error) {
      alert('Gagal memperbarui data: ' + error.message);
    } else {
      await fetchTasks();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus target ini?')) {
      const { error } = await supabase.from('progress_targets').delete().eq('id', id);
      if (error) {
        console.error('Gagal menghapus data:', error);
      } else {
        if (currentTask?.id === id) resetForm();
        await fetchTasks();
      }
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    router.push('/');
  };

  // Kalkulasi Grafik & Status
  const statusCounts = tasks.reduce((acc: any, task) => {
    const status = calculateTaskStatus(task.tenggatWaktu, task.progress);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  const pieDataStatusFormatted = Object.keys(statusCounts).map(key => ({ name: key, value: statusCounts[key] }));
  
  const picStatusMap: { [picName: string]: { [statusText: string]: number } } = {};
  tasks.forEach(task => {
    const picName = task.pic || 'Tanpa PIC';
    const statusText = calculateTaskStatus(task.tenggatWaktu, task.progress);

    if (!picStatusMap[picName]) {
      picStatusMap[picName] = {
        'BELUM DIKERJAKAN': 0,
        'ON PROGRESS': 0,
        'OVERDUE': 0,
        'SUDAH SELESAI': 0,
      };
    }
    picStatusMap[picName][statusText] = (picStatusMap[picName][statusText] || 0) + 1;
  });

  const stackedDataPicStatus = Object.keys(picStatusMap).map(picName => ({
    name: picName,
    ...picStatusMap[picName],
  }));

  const countByField = (field: string) => {
    const counts = tasks.reduce((acc: any, task) => {
      const key = task[field];
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map(key => ({ name: key, value: counts[key], jumlah: counts[key] }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <Header 
        title="Monitoring Progress Kerja" 
        subtitle={`${greeting}, ${adminName}`} 
        role="admin" 
        onLogout={handleLogout} 
      />

      <main className="max-w-[96%] mx-auto px-0 pt-24 pb-12 space-y-8 flex-1 w-full">
        <ProgressCharts 
          pieDataStatus={pieDataStatusFormatted} 
          pieDataKategori={countByField('kategori')} 
          barDataPic={countByField('pic')}
          stackedDataPicStatus={stackedDataPicStatus}
          tasks={tasks}
        />

        <ProgressForm
          formData={formData}
          setFormData={setFormData}
          currentTask={currentTask}
          onSubmit={handleSubmit}
          onReset={resetForm}
          loading={isSubmitting}
          isAdmin={true}
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
            onUpdateTask={handleUpdateTask}
            onDelete={handleDelete}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

function AdminDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">Memuat Panel Admin...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}

export default AdminDashboard;