'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProgressCharts from '@/components/ProgressCharts';
import ProgressTable, { Task } from '@/components/ProgressTable';
import { getStatusInfo } from '@/utils/helpers';
import { supabase } from '@/lib/supabaseClient';
import { UserCheck, LogOut, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function PicDashboardContent() {
  const params = useParams();
  const router = useRouter();
  
  const picName = decodeURIComponent((params?.nama as string) || '');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterKategori, setFilterKategori] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] =useState('Selamat Datang');

  // 1. Logika Penentuan Waktu Real-Time untuk PIC
  useEffect(() => {
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
    const interval = setInterval(updateGreeting, 60000); // Perbarui tiap 1 menit
    return () => clearInterval(interval);
  }, []);

  const fetchTasksForPIC = useCallback(async () => {
    if (!picName) return;
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
        keterangan: item.keterangan || '',
        dokumen: item.dokumen || null,
      })));
    }
    setLoading(false);
  }, [picName]);

  useEffect(() => {
    if (picName) {
      fetchTasksForPIC();
    }
  }, [picName, fetchTasksForPIC]);

  const handleUpdateTask = async (updatedTask: Task) => {
    let dokumenUrl = updatedTask.dokumen;

    if (updatedTask.fileDokumen) {
      const file = updatedTask.fileDokumen;
      const fileExt = file.name.split('.').pop();
      const fileName = `pic_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

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

    const { error } = await supabase
      .from('progress_targets')
      .update({
        nama_target: updatedTask.namaTarget,
        progress: updatedTask.progress,
        keterangan: updatedTask.keterangan,
        dokumen: dokumenUrl,
      })
      .eq('id', updatedTask.id);

    if (error) {
      alert('Gagal memperbarui progress: ' + error.message);
    } else {
      await fetchTasksForPIC();
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    router.push('/');
  };

  const statusCounts = tasks.reduce((acc: any, task) => {
    const statusObj = getStatusInfo(task.tenggatWaktu, task.progress);
    acc[statusObj.text] = (acc[statusObj.text] || 0) + 1;
    return acc;
  }, {});
  const pieDataStatusFormatted = Object.keys(statusCounts).map(key => ({ name: key, value: statusCounts[key] }));

  const countByField = (field: keyof Task) => {
    const counts = tasks.reduce((acc: any, task) => {
      const key = String(task[field] || 'Lainnya');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map(key => ({ name: key, value: counts[key], jumlah: counts[key] }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <Header 
        title="TELKOM AKSES" 
        subtitle={`${greeting}, ${picName}`} 
        role="pic" 
        onLogout={handleLogout} 
      />

      <main className="max-w-[96%] mx-auto px-0 pt-24 pb-12 space-y-8 flex-1 w-full">

        {loading ? (
          <div className="text-center py-8 text-slate-500 text-sm">Memuat data target...</div>
        ) : (
          <ProgressTable 
            tasks={tasks}
            filterKategori={filterKategori}
            setFilterKategori={setFilterKategori}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onUpdateTask={handleUpdateTask}
            isPicView={true}
          />
        )}

      </main>
      <Footer />
    </div>
  );
}

export default function PicDynamicDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">Memuat halaman PIC...</div>}>
      <PicDashboardContent />
    </Suspense>
  );
}