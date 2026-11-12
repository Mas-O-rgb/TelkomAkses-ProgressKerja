'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProgressCharts from '@/components/ProgressCharts';
import ProgressTable, { Task } from '@/components/ProgressTable';
import { getStatusInfo } from '@/utils/helpers';
import { supabase } from '@/lib/supabaseClient';
import { UserCheck, LogOut, ArrowLeft } from 'lucide-react';

export default function PicDynamicDashboard() {
  const params = useParams();
  const router = useRouter();
  
  const picName = decodeURIComponent((params?.nama as string) || '');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterKategori, setFilterKategori] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

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

  // Fungsi simpan update progress & unggah dokumen bukti kerja PIC
  const handleUpdateTask = async (updatedTask: Task) => {
    let dokumenUrl = updatedTask.dokumen;

    // Jika PIC memilih file baru saat menekan Update
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

    // Simpan perubahan ke database Supabase
    const { error } = await supabase
      .from('progress_targets')
      .update({
        nama_target: updatedTask.namaTarget, // <--- Tambahkan baris ini agar perubahan Rincian Target tersimpan
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

  // Kalkulasi Grafik Pie untuk PIC
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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="bg-slate-900 border-b-4 border-[#ED1E28] shadow-md">
        <div className="max-w-[96%] mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/')}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer transition-all"
              title="Kembali ke Pilih Akun"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="bg-[#ED1E28] text-white px-2.5 py-1.5 rounded-lg font-black tracking-wider text-sm">PIC</div>
            <div>
              <h1 className="text-base font-bold text-white uppercase">{picName}</h1>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <UserCheck size={12} className="text-[#ED1E28]" /> Panel Dasbor Penanggung Jawab
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer border border-slate-700 transition-all"
          >
            <LogOut size={14} /> Ganti Akun
          </button>
        </div>
      </header>

      <main className="max-w-[96%] mx-auto px-0 py-8 space-y-8">
        <ProgressCharts 
          pieDataStatus={pieDataStatusFormatted} 
          pieDataKategori={countByField('kategori')} 
        />

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
							isPicView={true} // <--- WAJIB ADA agar tanggal Mulai, Tenggat, & Hapus terkunci di PIC
						/>
        )}
      </main>
    </div>
  );
}