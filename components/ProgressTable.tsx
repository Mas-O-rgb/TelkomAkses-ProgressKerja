'use client';

import React, { useState, useEffect } from 'react';
import { Save, X, FileText, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { DAFTAR_PIC, getStatusInfo } from '@/utils/helpers';

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
  onUpdateTask?: (updatedTask: Task) => Promise<void> | void;
  onDelete?: (id: number) => Promise<void> | void;
  isPicView?: boolean;
}

const PROGRESS_OPTIONS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const ITEMS_PER_PAGE = 25;

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
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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

  const uniqueCategories = Array.from(new Set(tasks.map((t) => t.kategori).filter(Boolean)));

  // Filter data berdasarkan kategori dan pencarian
  const filteredTasks = tasks.filter((task) => {
    const matchKategori = filterKategori === 'ALL' || task.kategori === filterKategori;
    const keyword = searchTerm.toLowerCase();
    const matchSearch =
      task.namaTarget.toLowerCase().includes(keyword) ||
      task.pic.toLowerCase().includes(keyword) ||
      Boolean(task.keterangan?.toLowerCase().includes(keyword));
    return matchKategori && matchSearch;
  });

  // Logika Paginasi (25 baris per halaman)
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / ITEMS_PER_PAGE));
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentTasks = filteredTasks.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(Math.max(prev, 1), totalPages));
  }, [totalPages]);

  const handleFilterChange = (val: string) => {
    setFilterKategori(val);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleStartEdit = (task: Task) => {
    setEditingId(task.id);
    setEditForm({ ...task, fileDokumen: null });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async () => {
    if (!onUpdateTask) return;
    setActionLoadingId(editForm.id);
    try {
      await onUpdateTask(editForm);
      setEditingId(null);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteClick = async (id: number) => {
    if (!onDelete) return;
    setActionLoadingId(id);
    try {
      await onDelete(id);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Baris Filter & Pencarian */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/50">
        <select
          value={filterKategori}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#ED1E28]/30"
        >
          <option value="ALL">Semua Kategori</option>
          {uniqueCategories.map((kat) => (
            <option key={kat} value={kat}>
              {kat}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Cari target atau PIC..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#ED1E28]/30"
        />
      </div>

      {/* Tabel Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs table-auto">
          <thead>
            <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <th className="py-2.5 px-2 text-center w-12">No</th>
              <th className="py-2.5 px-2 text-left w-20">Kategori</th>
              <th className="py-2.5 px-2 text-left min-w-[180px] max-w-[240px]">Rincian Target</th>
              <th className="py-2.5 px-2 text-left w-28">Mulai</th>
              <th className="py-2.5 px-2 text-left w-28">Due Date</th>
              <th className="py-2.5 px-2 text-center w-20">Progress</th>
              <th className="py-2.5 px-2 text-center w-28">Status</th>
              <th className="py-2.5 px-2 text-left w-36">PIC</th>
              <th className="py-2.5 px-2 text-left min-w-[220px]">Keterangan</th>
              <th className="py-2.5 px-2 text-left w-28">Dokumen</th>
              <th className="py-2.5 px-2 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentTasks.length > 0 ? (
              currentTasks.map((task, index) => {
                const isEditing = editingId === task.id;
                const isRowLoading = actionLoadingId === task.id;
                const statusInfo = getStatusInfo(
                  isEditing ? editForm.tenggatWaktu : task.tenggatWaktu,
                  isEditing ? editForm.progress : task.progress
                );
                const absoluteIndex = indexOfFirstItem + index + 1;

                return (
                  <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-2 text-center text-slate-500">{absoluteIndex}</td>

                    {/* Kategori */}
                    <td className="py-2.5 px-2 font-semibold text-slate-700">
                      {isEditing && !isPicView ? (
                        <input
                          type="text"
                          value={editForm.kategori}
                          onChange={(e) => setEditForm({ ...editForm, kategori: e.target.value })}
                          className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded text-xs"
                        />
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] border border-slate-200 inline-block">
                          {task.kategori}
                        </span>
                      )}
                    </td>

                    {/* Rincian Target */}
                    <td className="py-2.5 px-2 font-medium text-slate-900 min-w-[260px]">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.namaTarget}
                          onChange={(e) => setEditForm({ ...editForm, namaTarget: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#ED1E28]"
                        />
                      ) : (
                        <div className="whitespace-normal break-words leading-relaxed">
                          {task.namaTarget}
                        </div>
                      )}
                    </td>

                    {/* Waktu Mulai */}
                    <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap">
                      {isEditing && !isPicView ? (
                        <input
                          type="date"
                          value={editForm.waktuMulai}
                          onChange={(e) => setEditForm({ ...editForm, waktuMulai: e.target.value })}
                          className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded text-[11px]"
                        />
                      ) : (
                        task.waktuMulai
                      )}
                    </td>

                    {/* Tenggat Waktu */}
                    <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap">
                      {isEditing && !isPicView ? (
                        <input
                          type="date"
                          value={editForm.tenggatWaktu}
                          onChange={(e) => setEditForm({ ...editForm, tenggatWaktu: e.target.value })}
                          className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded text-[11px]"
                        />
                      ) : (
                        task.tenggatWaktu
                      )}
                    </td>

                    {/* Progress */}
                    <td className="py-2.5 px-2">
                      {isEditing ? (
                        <select
                          value={editForm.progress}
                          onChange={(e) => setEditForm({ ...editForm, progress: Number(e.target.value) })}
                          className="w-full p-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#ED1E28]"
                        >
                          {PROGRESS_OPTIONS.map((val) => (
                            <option key={val} value={val}>
                              {val}%
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="font-semibold text-slate-700">{task.progress}%</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.className}`}>
                        {statusInfo.text}
                      </span>
                    </td>

                    {/* PIC */}
                    <td className="py-2.5 px-2 text-slate-700 font-medium">
                      {isEditing && !isPicView ? (
                        <select
                          value={editForm.pic}
                          onChange={(e) => setEditForm({ ...editForm, pic: e.target.value })}
                          className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded text-xs"
                        >
                          {DAFTAR_PIC.map((namaPic) => (
                            <option key={namaPic} value={namaPic}>
                              {namaPic}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="whitespace-normal break-words">{task.pic}</span>
                      )}
                    </td>

                    {/* Keterangan */}
                    <td className="py-2.5 px-2 text-slate-600 align-top">
                      {isEditing ? (
                        <div className="relative h-7 w-36">
                          <textarea
                            rows={1}
                            placeholder="Catatan..."
                            value={editForm.keterangan || ''}
                            onChange={(e) => setEditForm({ ...editForm, keterangan: e.target.value })}
                            className="w-full h-7 focus:absolute focus:top-0 focus:right-0 focus:w-72 focus:h-24 px-2 py-1 bg-white border border-slate-300 rounded text-xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#ED1E28]/30 focus:border-[#ED1E28] resize-none z-20 shadow-sm focus:shadow-lg"
                          />
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap break-words text-xs text-slate-700 leading-relaxed max-w-[200px]">
                          {task.keterangan || <span className="text-slate-400 italic">-</span>}
                        </div>
                      )}
                    </td>

                    {/* Dokumen */}
                    <td className="py-2.5 px-2 text-slate-700">
                      {isEditing ? (
                        <input
                          type="file"
                          onChange={(e) => setEditForm({ ...editForm, fileDokumen: e.target.files?.[0] || null })}
                          className="w-32 text-[10px] text-slate-600 file:mr-1 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:bg-slate-200 file:text-slate-700 cursor-pointer"
                        />
                      ) : task.dokumen && task.dokumen !== 'Upluad File' && task.dokumen !== '-' ? (
                        <a
                          href={task.dokumen}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-700 rounded text-xs font-semibold border border-sky-200 hover:bg-sky-100"
                        >
                          <FileText size={12} /> Buka
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Tidak Ada Dokumen</span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={handleSaveEdit}
                              disabled={isRowLoading}
                              className="inline-flex items-center gap-1 px-2 py-1 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 disabled:opacity-60 cursor-pointer transition-all"
                              title="Simpan"
                            >
                              {isRowLoading ? (
                                <>
                                  <Loader2 size={13} className="animate-spin" />
                                  <span className="text-[11px] font-semibold">Menyimpan...</span>
                                </>
                              ) : (
                                <Save size={13} />
                              )}
                            </button>
                            {!isRowLoading && (
                              <button
                                onClick={handleCancelEdit}
                                className="p-1 text-slate-600 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 cursor-pointer"
                                title="Batal"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(task)}
                              disabled={isRowLoading}
                              className="px-2 py-0.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 font-medium disabled:opacity-50 cursor-pointer"
                            >
                              {isPicView ? 'Update' : 'Edit'}
                            </button>

                            {!isPicView && onDelete && (
                              <button
                                onClick={() => handleDeleteClick(task.id)}
                                disabled={isRowLoading}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-red-600 bg-red-50 rounded hover:bg-red-100 font-medium disabled:opacity-60 cursor-pointer transition-all"
                              >
                                {isRowLoading ? (
                                  <>
                                    <Loader2 size={12} className="animate-spin" />
                                    <span>Menghapus...</span>
                                  </>
                                ) : (
                                  'Hapus'
                                )}
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

      {/* Kontrol Navigasi Paginasi */}
      <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/50 text-xs text-slate-600">
        <div>
          Menampilkan <span className="font-semibold">{filteredTasks.length > 0 ? indexOfFirstItem + 1 : 0}</span> sampai{' '}
          <span className="font-semibold">{Math.min(indexOfLastItem, filteredTasks.length)}</span> dari{' '}
          <span className="font-semibold">{filteredTasks.length}</span> data target
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            <ChevronLeft size={14} /> Sebelumnya
          </button>

          <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800">
            Halaman {currentPage} dari {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            Berikutnya <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}