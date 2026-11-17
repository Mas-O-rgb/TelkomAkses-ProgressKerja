'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProgressCharts from '@/components/ProgressCharts';
import ProgressTable, { Task } from '@/components/ProgressTable';
import { getStatusInfo } from '@/utils/helpers';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Helper terpusat untuk kalkulasi status
const calculateTaskStatus = (tenggatWaktu: string, progress: number): string => {
  const today = new Date().toISOString().split('T')[0];
  if (tenggatWaktu && tenggatWaktu < today) return 'OVERDUE';
  if (progress === 100) return 'SUDAH SELESAI';
  if (progress > 0) return 'ON PROGRESS';
  return 'BELUM DIKERJAKAN';
};

function PicDashboardContent() {
  const params = useParams();
  const router = useRouter();
  
  const picName = decodeURIComponent((params?.nama as string) || '');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterKategori, setFilterKategori] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Selamat Datang');

  // Logika Penentuan Waktu Real-Time untuk PIC
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
    const interval = setInterval(updateGreeting, 60000);
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

  // Mengaktifkan Supabase Realtime dengan pembaruan senyap (Silent Update)
  useEffect(() => {
    if (!picName) return;

    fetchTasksForPIC();

    const channel = supabase
      .channel('pic-dashboard-silent-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'progress_targets' },
        (payload) => {
          const newData = payload.new as any;
          const eventType = payload.eventType;

          if (eventType === 'UPDATE' && newData.pic === picName) {
            setTasks((prev) =>
              prev.map((task) =>
                task.id === newData.id
                  ? {
                      ...task,
                      kategori: newData.kategori,
                      namaTarget: newData.nama_target,
                      waktuMulai: newData.waktu_mulai,
                      tenggatWaktu: newData.tenggat_waktu,
                      progress: newData.progress,
                      keterangan: newData.keterangan || '',
                      dokumen: newData.dokumen || task.dokumen,
                    }
                  : task
              )
            );
          } else if (eventType === 'INSERT' && newData.pic === picName) {
            setTasks((prev) => [
              {
                id: newData.id,
                kategori: newData.kategori,
                namaTarget: newData.nama_target,
                waktuMulai: newData.waktu_mulai,
                tenggatWaktu: newData.tenggat_waktu,
                progress: newData.progress,
                pic: newData.pic,
                keterangan: newData.keterangan || '',
                dokumen: newData.dokumen || null,
              },
              ...prev,
            ]);
          } else if (eventType === 'DELETE') {
            setTasks((prev) => prev.filter((task) => task.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

    // Update data ke Supabase beserta status otomatisnya
    const { error } = await supabase
      .from('progress_targets')
      .update({
        nama_target: updatedTask.namaTarget,
        progress: updatedTask.progress,
        status: calculateTaskStatus(updatedTask.tenggatWaktu, updatedTask.progress),
        keterangan: updatedTask.keterangan,
        dokumen: dokumenUrl,
      })
      .eq('id', updatedTask.id);

    if (error) {
      alert('Gagal memperbarui progress: ' + error.message);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <Header 
        title="PROGRESS KERJA" 
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