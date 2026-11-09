'use client';

import React from 'react';
import { Search, Filter, FileText, Edit3, Trash2 } from 'lucide-react';
import { hitungStatus } from '@/utils/helpers';

interface ProgressTableProps {
  tasks: any[];
  filterKategori: string;
  setFilterKategori: (val: string) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  onEdit: (task: any) => void;
  onDelete: (id: number) => void;
}

export default function ProgressTable({
  tasks,
  filterKategori,
  setFilterKategori,
  searchTerm,
  setSearchTerm,
  onEdit,
  onDelete,
}: ProgressTableProps) {
  const filteredTasks = tasks.filter(task => {
    const matchKategori = filterKategori === 'ALL' || task.kategori === filterKategori;
    const matchSearch = task.namaTarget.toLowerCase().includes(searchTerm.toLowerCase()) || task.pic.toLowerCase().includes(searchTerm.toLowerCase());
    return matchKategori && matchSearch;
  });

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={18} className="text-slate-500" />
          <select 
            value={filterKategori} 
            onChange={(e) => setFilterKategori(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ED1E28]"
          >
            <option value="ALL">Semua Kategori (QMS, HSE, MARVEL)</option>
            <option value="QMS">QMS</option>
            <option value="HSE">HSE</option>
            <option value="MARVEL">MARVEL</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari target atau PIC..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ED1E28]"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
              <th className="p-3 text-center">No</th>
              <th className="p-3">Kategori</th>
              <th className="p-3">Nama Target</th>
              <th className="p-3">Waktu Mulai</th>
              <th className="p-3">Tenggat Waktu</th>
              <th className="p-3 text-center">Progress</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3">PIC</th>
              <th className="p-3">Dokumen</th>
              <th className="p-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task, index) => {
                const statusInfo = hitungStatus(task.progress, task.tenggatWaktu);
                return (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-center text-slate-500">{index + 1}</td>
                    <td className="p-3 font-semibold text-slate-700">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs border border-slate-200">{task.kategori}</span>
                    </td>
                    <td className="p-3 font-medium text-slate-900">{task.namaTarget}</td>
                    <td className="p-3 text-slate-600 text-xs">{task.waktuMulai}</td>
                    <td className="p-3 text-slate-600 text-xs">{task.tenggatWaktu}</td>
                    <td className="p-3 text-center font-bold text-slate-700">{task.progress}%</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">{task.pic}</td>
                    <td className="p-3">
                      <span className="text-xs text-blue-600 underline flex items-center gap-1 cursor-pointer">
                        <FileText size={12} /> {task.dokumen || 'Lihat'}
                      </span>
                    </td>
                    <td className="p-3 text-center space-x-2">
                      <button onClick={() => onEdit(task)} className="text-blue-600 hover:text-blue-800 p-1" title="Edit">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => onDelete(task.id)} className="text-red-600 hover:text-red-800 p-1" title="Hapus">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-400">
                  Tidak ada data target yang ditemukan. Silakan isi form di atas untuk menambahkan data baru.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}