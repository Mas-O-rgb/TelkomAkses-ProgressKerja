'use client';

import React, { useState, useEffect } from 'react';
import ProgressCharts from '@/components/ProgressCharts';
import ProgressForm from '@/components/ProgressForm';
import ProgressTable from '@/components/ProgressTable';
import { hitungStatus, DAFTAR_PIC } from '@/utils/helpers';
import { supabase } from '@/lib/supabaseClient';

export default function DashboardProgressKerja() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [filterKategori, setFilterKategori] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    kategori: 'QMS',
    namaTarget: '',
    waktuMulai: '',
    tenggatWaktu: '',
    progress: 0,
    pic: DAFTAR_PIC[0],
    dokumen: null as any,
  });

  // 1. Ambil data dari Database saat pertama kali load
  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('progress_targets')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Gagal mengambil data:', error);
    } else if (data) {
      // Mapping nama kolom database ke state frontend
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

  const resetForm = () => {
    setCurrentTask(null);
    setFormData({
      kategori: 'QMS',
      namaTarget: '',
      waktuMulai: '',
      tenggatWaktu: '',
      progress: 0,
      pic: DAFTAR_PIC[0],
      dokumen: null,
    });
  };

  // 2. Simpan / Update ke Database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.namaTarget || !formData.waktuMulai || !formData.tenggatWaktu) {
      alert('Mohon isi Nama Target, Waktu Mulai, dan Tenggat Waktu!');
      return;
    }

    const payload = {
      kategori: formData.kategori,
      nama_target: formData.namaTarget,
      waktu_mulai: formData.waktuMulai,
      tenggat_waktu: formData.tenggatWaktu,
      progress: formData.progress,
      pic: formData.pic,
      dokumen: formData.dokumen?.name || (typeof formData.dokumen === 'string' ? formData.dokumen : 'Dokumen.pdf'),
    };

    if (currentTask) {
      // Edit Data di Database
      const { error } = await supabase
        .from('progress_targets')
        .update(payload)
        .eq('id', currentTask.id);

      if (error) console.error('Gagal update data:', error);
    } else {
      // Tambah Data Baru ke Database
      const { error } = await supabase
        .from('progress_targets')
        .insert([payload]);

      if (error) console.error('Gagal tambah data:', error);
    }

    resetForm();
    fetchTasks(); // Refresh data dari DB
  };

  // 3. Hapus Data dari Database
  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus target ini?')) {
      const { error } = await supabase
        .from('progress_targets')
        .delete()
        .eq('id', id);

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

  // Kalkulasi data grafik
  const statusCounts = tasks.reduce((acc: any, task) => {
    const statusObj = hitungStatus(task.progress, task.tenggatWaktu);
    acc[statusObj.label] = (acc[statusObj.label] || 0) + 1;
    return acc;
  }, {});
  const pieDataStatus = Object.keys(statusCounts).map(key => ({ name: key, value: statusCounts[key] }));

  const kategoriCounts = tasks.reduce((acc: any, task) => {
    acc[task.kategori] = (acc[task.kategori] || 0) + 1;
    return acc;
  }, {});
  const pieDataKategori = Object.keys(kategoriCounts).map(key => ({ name: key, value: kategoriCounts[key] }));

  const picCounts = tasks.reduce((acc: any, task) => {
    acc[task.pic] = (acc[task.pic] || 0) + 1;
    return acc;
  }, {});
  const barDataPic = Object.keys(picCounts).map(key => ({ name: key, jumlah: picCounts[key] }));

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
              <p className="text-xs text-slate-400 font-medium">Dashboard Monitoring Progress Kerja & Kinerja</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <ProgressCharts 
          pieDataStatus={pieDataStatus} 
          pieDataKategori={pieDataKategori} 
          barDataPic={barDataPic} 
        />

        <ProgressForm 
          formData={formData}
          setFormData={setFormData}
          currentTask={currentTask}
          onSubmit={handleSubmit}
          onReset={resetForm}
        />

        {loading ? (
          <div className="text-center py-8 text-slate-500 text-sm">Memuat data dari database...</div>
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