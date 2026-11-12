'use client';

import React, { useState } from 'react';
import { Pencil, Trash2, Save, X, FileText, Upload } from 'lucide-react';

export interface Task {
  id: number;
  kategori: string;
  namaTarget: string;
  waktuMulai: string;
  tenggatWaktu: string;
  progress: number;
  pic: string;
  dokumen?: string | null;
  keterangan?: string | null;
  fileDokumen?: File | null;
}

interface ProgressTableProps {
  tasks: Task[];
  filterKategori: string;
  setFilterKategori: (val: string) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  onUpdateTask?: (updatedTask: Task) => void;
  onDelete?: (id: number) => void;
  isPicView?: boolean;
}

export default function ProgressTable({
  tasks,
  filterKategori,
  setFilterKategori,
  searchTerm,
  setSearchTerm,
  onUpdateTask,
  onDelete,
  isPicView = false,
}: ProgressTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Task>({
    id: 0,
    kategori: '',
    namaTarget: '',
    waktuMulai: '',
    tenggatWaktu: '',
    progress: 0,
    pic: '',
    dokumen: '',
    keterangan: '',
    fileDokumen: null,
  });

  const getStatusInfo = (tenggat: string, progress: number) => {
    if (progress === 100) {
      return { text: 'SUDAH SELESAI', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    const today = new Date().toISOString().split('T')[0];
    if (tenggat && tenggat < today) {
      return { text: 'OVERDUE', className: 'bg-red-50 text-red-700 border-red-200' };
    }
    if (progress > 0) {
      return { text: 'ON PROGRESS', className: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { text: 'BELUM', className: 'bg-slate-100 text-slate-600 border-slate-200' };
  };

  const handleStartEdit = (task: Task) => {
    setEditingId(task.id);
    setEditForm({ ...task, fileDokumen: null });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = () => {
    if (onUpdateTask) {
      onUpdateTask(editForm);
    }
    setEditingId(null);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesCategory = filterKategori === 'ALL' || task.kategori === filterKategori;
    const matchesSearch =
      task.namaTarget.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.pic.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Filter & Search Bar Minimalis */}
      <div className="p-3 border-b border-slate-200 flex flex-col md:flex-row justify-between gap-3 bg-slate-50/50">
        <select
          value={filterKategori}
          onChange={(e) => setFilterKategori(e.target.value)}
          className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#ED1E28]"
        >
          <option value="ALL">Semua Kategori</option>
          {Array.from(new Set(tasks.map((t) => t.kategori))).map((kat) => (
            <option key={kat} value={kat}>
              {kat}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Cari target atau PIC..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-700 w-full md:w-64 focus:outline-none focus:ring-1 focus:ring-[#ED1E28]"
        />
      </div>

      {/* Tabel Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <th className="py-2.5 px-3 text-center w-10">No</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Kat</th>
              <th className="py-2.5 px-3 min-w-[260px]">Rincian Target</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Mulai</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Tenggat</th>
              <th className="py-2.5 px-3 text-center whitespace-nowrap">Prog</th>
              <th className="py-2.5 px-3 text-center whitespace-nowrap">Status</th>
              <th className="py-2.5 px-3 whitespace-nowrap">PIC</th>
              <th className="py-2.5 px-3 min-w-[150px]">Keterangan</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Dokumen</th>
              <th className="py-2.5 px-3 text-center whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task, index) => {
                const isEditing = editingId === task.id;
                const statusInfo = getStatusInfo(
                  isEditing ? editForm.tenggatWaktu : task.tenggatWaktu,
                  isEditing ? editForm.progress : task.progress
                );

                return (
                  <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-500">{index + 1}</td>

                    {/* Kategori (Hanya Admin yang bisa ubah saat edit) */}
                    <td className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                      {isEditing && !isPicView ? (
                        <input
                          type="text"
                          value={editForm.kategori}
                          onChange={(e) => setEditForm({ ...editForm, kategori: e.target.value })}
                          className="w-20 px-1.5 py-0.5 border border-slate-300 rounded text-xs"
                        />
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] border border-slate-200">
                          {task.kategori}
                        </span>
                      )}
                    </td>

                   {/* Rincian Target (Bisa diedit oleh Admin maupun PIC) */}
                  <td className="py-2.5 px-3 font-medium text-slate-900 min-w-[260px]">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.namaTarget}
                        onChange={(e) => setEditForm({ ...editForm, namaTarget: e.target.value })}
                        className="w-full px-1.5 py-0.5 border border-slate-300 rounded text-xs"
                      />
                    ) : (
                      task.namaTarget
                    )}
                  </td>

                    {/* Waktu Mulai (Terkunci jika isPicView = true) */}
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      {isEditing && !isPicView ? (
                        <input
                          type="date"
                          value={editForm.waktuMulai}
                          onChange={(e) => setEditForm({ ...editForm, waktuMulai: e.target.value })}
                          className="px-1.5 py-0.5 border border-slate-300 rounded text-[11px]"
                        />
                      ) : (
                        task.waktuMulai
                      )}
                    </td>

                    {/* Tenggat Waktu (Terkunci jika isPicView = true) */}
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      {isEditing && !isPicView ? (
                        <input
                          type="date"
                          value={editForm.tenggatWaktu}
                          onChange={(e) => setEditForm({ ...editForm, tenggatWaktu: e.target.value })}
                          className="px-1.5 py-0.5 border border-slate-300 rounded text-[11px]"
                        />
                      ) : (
                        task.tenggatWaktu
                      )}
                    </td>

                    {/* Progress (Admin & PIC bisa edit) */}
                    <td className="py-2.5 px-3 text-center font-bold text-slate-700 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editForm.progress}
                          onChange={(e) => setEditForm({ ...editForm, progress: Number(e.target.value) })}
                          className="w-14 px-1 py-0.5 border border-slate-300 rounded text-xs text-center"
                        />
                      ) : (
                        `${task.progress}%`
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.className}`}>
                        {statusInfo.text}
                      </span>
                    </td>

                    {/* PIC */}
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap font-medium">
                      {isEditing && !isPicView ? (
                        <input
                          type="text"
                          value={editForm.pic}
                          onChange={(e) => setEditForm({ ...editForm, pic: e.target.value })}
                          className="w-36 px-1.5 py-0.5 border border-slate-300 rounded text-xs"
                        />
                      ) : (
                        task.pic
                      )}
                    </td>

                    {/* Keterangan (Admin & PIC bisa edit) */}
                    <td className="py-2.5 px-3 text-slate-600 min-w-[150px]">
                      {isEditing ? (
                        <input
                          type="text"
                          placeholder="Catatan progress..."
                          value={editForm.keterangan || ''}
                          onChange={(e) => setEditForm({ ...editForm, keterangan: e.target.value })}
                          className="w-full px-1.5 py-0.5 border border-slate-300 rounded text-xs"
                        />
                      ) : (
                        task.keterangan || <span className="text-slate-400 italic">-</span>
                      )}
                    </td>

                    {/* Dokumen / Upload Bukti Kerja (Admin & PIC bisa unggah file baru saat edit) */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {isEditing ? (
                        <label className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded cursor-pointer hover:bg-blue-100 text-[11px] font-medium">
                          <Upload size={12} />
                          <span>{editForm.fileDokumen ? editForm.fileDokumen.name.slice(0, 12) + '...' : 'Pilih File'}</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                setEditForm({ ...editForm, fileDokumen: e.target.files[0] });
                              }
                            }}
                          />
                        </label>
                      ) : task.dokumen && task.dokumen.trim() !== '' && task.dokumen !== 'null' && task.dokumen !== '-' ? (
                        <a
                          href={task.dokumen}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
                        >
                          <FileText size={13} /> Buka
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">-</span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {isEditing ? (
                          <>
                            <button
                              onClick={handleSaveEdit}
                              className="p-1 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 cursor-pointer"
                              title="Simpan"
                            >
                              <Save size={13} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 text-slate-600 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 cursor-pointer"
                              title="Batal"
                            >
                              <X size={13} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(task)}
                              className="px-2 py-1 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 font-medium cursor-pointer"
                            >
                              {isPicView ? 'Update' : 'Edit'}
                            </button>
                            {!isPicView && onDelete && (
                              <button
                                onClick={() => onDelete(task.id)}
                                className="px-2 py-1 text-red-600 bg-red-50 rounded hover:bg-red-100 font-medium cursor-pointer"
                              >
                                Hapus
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={11} className="p-6 text-center text-slate-400">
                  Tidak ada data target yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}