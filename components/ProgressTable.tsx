'use client';

import React, { useState, useEffect } from 'react';
import { Save, X, FileText, Loader2, ChevronLeft, ChevronRight, Send } from 'lucide-react';
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
  
  // Menggunakan state mandiri untuk modal agar tidak ikut ter-reset/tertutup saat tabel di-refresh
  const [activeHistoryTask, setActiveHistoryTask] = useState<Task | null>(null);

  const [locallyReadIds, setLocallyReadIds] = useState<number[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Sinkronisasi data real-time ke dalam modal yang sedang terbuka secara mandiri
  useEffect(() => {
    if (activeHistoryTask) {
      const latestUpdated = tasks.find(t => t.id === activeHistoryTask.id);
      if (latestUpdated && latestUpdated.keterangan !== activeHistoryTask.keterangan) {
        setActiveHistoryTask(latestUpdated);
      }
    }
  }, [tasks]);

  const handleOpenHistory = (task: Task) => {
    setActiveHistoryTask(task);
    setReplyMessage('');

    if (!locallyReadIds.includes(task.id)) {
      setLocallyReadIds((prev) => [...prev, task.id]);
    }
  };

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

  const filteredTasks = tasks.filter((task) => {
    const matchKategori = filterKategori === 'ALL' || task.kategori === filterKategori;
    const keyword = searchTerm.toLowerCase();
    const matchSearch =
      task.namaTarget.toLowerCase().includes(keyword) ||
      task.pic.toLowerCase().includes(keyword) ||
      Boolean(task.keterangan?.toLowerCase().includes(keyword));
    return matchKategori && matchSearch;
  });

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
    setEditForm({ ...task, keterangan: '', fileDokumen: null });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async () => {
    if (!onUpdateTask) return;
    setActionLoadingId(editForm.id);
    try {
      const now = new Date();
      const timeString = `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;

      const oldTask = tasks.find((t) => t.id === editForm.id);
      let finalKeterangan = oldTask?.keterangan || '-';

      const cleanOldKeterangan = finalKeterangan
        .replace(/^\[UNREAD_BY_ADMIN\]\s*/g, '')
        .replace(/^\[UNREAD_BY_PIC\]\s*/g, '');

      if (editForm.keterangan && editForm.keterangan.trim() !== '') {
        const modifier = isPicView ? `${editForm.pic}` : `HENDRA HADIYATNA DJATNIKA`;
        const unreadTag = isPicView ? '[UNREAD_BY_ADMIN]' : '[UNREAD_BY_PIC]';

        const newEntry = `${unreadTag} [${timeString}] ${modifier}: ${editForm.keterangan.trim()}`;

        finalKeterangan =
          cleanOldKeterangan && cleanOldKeterangan !== '-'
            ? `${newEntry}\n────────────────\n${cleanOldKeterangan}`
            : newEntry;
      }

      const updatedData = {
        ...editForm,
        keterangan: finalKeterangan,
      };

      await onUpdateTask(updatedData);
      setLocallyReadIds((prev) => prev.filter((id) => id !== editForm.id));
      setEditingId(null);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Fungsi mengirim balasan dari dalam modal tanpa menutup modal
  const handleSendReplyFromModal = async () => {
    if (!activeHistoryTask || !replyMessage.trim() || !onUpdateTask) return;
    setIsSendingReply(true);

    try {
      const now = new Date();
      const timeString = `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;

      const originalTask = activeHistoryTask;
      const cleanOldKeterangan = (originalTask.keterangan || '-')
        .replace(/^\[UNREAD_BY_ADMIN\]\s*/g, '')
        .replace(/^\[UNREAD_BY_PIC\]\s*/g, '');

      const modifier = isPicView ? `${originalTask.pic}` : `HENDRA HADIYATNA DJATNIKA`;
      const unreadTag = isPicView ? '[UNREAD_BY_ADMIN]' : '[UNREAD_BY_PIC]';

      const newEntry = `${unreadTag} [${timeString}] ${modifier}: ${replyMessage.trim()}`;
      const finalKeterangan =
        cleanOldKeterangan && cleanOldKeterangan !== '-'
          ? `${newEntry}\n────────────────\n${cleanOldKeterangan}`
          : newEntry;

      const updatedData = {
        ...originalTask,
        keterangan: finalKeterangan,
      };

      // Update tampilan modal seketika secara lokal agar langsung responsif
      setActiveHistoryTask(updatedData);
      setReplyMessage('');

      // Kirim ke database (supabase)
      await onUpdateTask(updatedData);
    } finally {
      setIsSendingReply(false);
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-[11px]">
      {/* Baris Filter & Pencarian */}
      <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-2 bg-slate-50/50">
        <select
          value={filterKategori}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="w-full sm:w-44 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#ED1E28]/30"
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
          className="w-full sm:w-60 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ED1E28]/30"
        />
      </div>

      {/* Tabel Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <th className="py-2 px-1.5 text-center w-10">No</th>
              <th className="py-2 px-1.5 text-left w-20">Kategori</th>
              <th className="py-2 px-1.5 text-left min-w-[180px]">Rincian Target</th>
              <th className="py-2 px-1.5 text-center w-24">Waktu Mulai</th>
              <th className="py-2 px-1.5 text-center w-24">Due Date</th>
              <th className="py-2 px-1.5 text-center w-16">Progress</th>
              <th className="py-2 px-1.5 text-center w-24">Status</th>
              <th className="py-2 px-1.5 text-center w-44">PIC</th>
              <th className="py-2 px-1.5 text-left min-w-[160px]">Keterangan</th>
              <th className="py-2 px-1.5 text-left w-24">Dokumen</th>
              <th className="py-2 px-1.5 text-center w-24">Aksi</th>
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
                    <td className="py-2 px-1.5 text-center text-slate-500">{absoluteIndex}</td>

                    {/* Kategori */}
                    <td className="py-2 px-1.5 font-semibold text-slate-700">
                      {isEditing && !isPicView ? (
                        <input
                          type="text"
                          value={editForm.kategori}
                          onChange={(e) => setEditForm({ ...editForm, kategori: e.target.value })}
                          className="w-full px-1 py-0.5 bg-white border border-slate-300 rounded text-[11px]"
                        />
                      ) : (
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 inline-block">
                          {task.kategori}
                        </span>
                      )}
                    </td>

                    {/* Rincian Target */}
                    <td className="py-2 px-2 font-medium text-slate-900">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.namaTarget}
                          onChange={(e) => setEditForm({ ...editForm, namaTarget: e.target.value })}
                          className="w-full px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-[#ED1E28]"
                        />
                      ) : (
                        <div className="whitespace-normal break-words leading-snug">
                          {task.namaTarget}
                        </div>
                      )}
                    </td>

                    {/* Waktu Mulai */}
                    <td className="py-2 px-1.5 text-slate-600 whitespace-nowrap text-center">
                      {isEditing && !isPicView ? (
                        <input
                          type="date"
                          value={editForm.waktuMulai}
                          onChange={(e) => setEditForm({ ...editForm, waktuMulai: e.target.value })}
                          className="w-full px-1 py-0.5 bg-white border border-slate-300 rounded text-[10px]"
                        />
                      ) : (
                        task.waktuMulai
                      )}
                    </td>

                    {/* Tenggat Waktu */}
                    <td className="py-2 px-1.5 text-slate-600 whitespace-nowrap text-center">
                      {isEditing && !isPicView ? (
                        <input
                          type="date"
                          value={editForm.tenggatWaktu}
                          onChange={(e) => setEditForm({ ...editForm, tenggatWaktu: e.target.value })}
                          className="w-full px-1 py-0.5 bg-white border border-slate-300 rounded text-[10px]"
                        />
                      ) : (
                        task.tenggatWaktu
                      )}
                    </td>

                    {/* Progress */}
                    <td className="py-2 px-1.5 text-center">
                      {isEditing ? (
                        <select
                          value={editForm.progress}
                          onChange={(e) =>
                            setEditForm({ ...editForm, progress: Number(e.target.value) })
                          }
                          className="w-full p-1 border border-slate-300 rounded bg-white text-slate-800 text-[11px] font-semibold focus:outline-none focus:ring-1 focus:ring-[#ED1E28]"
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
                    <td className="py-2 px-1.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.className}`}
                      >
                        {statusInfo.text}
                      </span>
                    </td>

                    {/* PIC */}
                    <td className="py-2 px-1.5 text-slate-700 font-medium text-center">
                      {isEditing && !isPicView ? (
                        <select
                          value={editForm.pic}
                          onChange={(e) => setEditForm({ ...editForm, pic: e.target.value })}
                          className="w-full px-1 py-0.5 bg-white border border-slate-300 rounded text-[11px]"
                        >
                          {DAFTAR_PIC.map((namaPic) => (
                            <option key={namaPic} value={namaPic}>
                              {namaPic}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="whitespace-normal break-words leading-snug">{task.pic}</span>
                      )}
                    </td>

                    {/* Keterangan */}
                    <td className="py-1.5 px-1.5 text-slate-600 align-top text-[10.5px]">
                      {isEditing ? (
                        <div className="relative h-6 w-28">
                          <textarea
                            rows={1}
                            placeholder="Catatan baru..."
                            value={editForm.keterangan || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, keterangan: e.target.value })
                            }
                            className="w-full h-6 focus:absolute focus:top-0 focus:right-0 focus:w-60 focus:h-20 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-[#ED1E28] resize-none z-20 shadow-sm"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <div className="whitespace-normal break-words leading-tight text-slate-700 line-clamp-2">
                            {task.keterangan && task.keterangan !== '-' ? (
                              task.keterangan
                                .split('────────────────')[0]
                                .replace(/^(\[UNREAD_BY_(ADMIN|PIC)\]\s*)?\[.*?\]\s*.*?:/, '')
                                .trim()
                            ) : (
                              <span className="text-slate-400 italic">-</span>
                            )}
                          </div>

                          {task.keterangan &&
                            task.keterangan !== '-' &&
                            (() => {
                              const hasUnreadTag = isPicView
                                ? task.keterangan.startsWith('[UNREAD_BY_PIC]')
                                : task.keterangan.startsWith('[UNREAD_BY_ADMIN]');
                              const showNewBadge =
                                hasUnreadTag && !locallyReadIds.includes(task.id);
                              const totalUpdates =
                                task.keterangan.split('────────────────').length;

                              return (
                                <button
                                  type="button"
                                  onClick={() => handleOpenHistory(task)}
                                  className="text-left text-[9.5px] font-semibold text-[#ED1E28] hover:underline cursor-pointer inline-flex items-center gap-1.5 mt-0.5 w-fit"
                                >
                                  <span className="relative flex h-2 w-2">
                                    {showNewBadge && (
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ED1E28] opacity-75"></span>
                                    )}
                                    <span
                                      className={`relative inline-flex rounded-full h-2 w-2 ${
                                        showNewBadge ? 'bg-[#ED1E28]' : 'bg-slate-400'
                                      }`}
                                    ></span>
                                  </span>
                                  <span>Riwayat ({totalUpdates})</span>
                                  {showNewBadge && (
                                    <span className="px-1 py-0.2 bg-red-100 text-[#ED1E28] border border-red-200 rounded text-[8px] font-bold tracking-wide">
                                      BARU
                                    </span>
                                  )}
                                </button>
                              );
                            })()}
                        </div>
                      )}
                    </td>

                    {/* Dokumen */}
                    <td className="py-2 px-1.5 text-slate-700">
                      {isEditing ? (
                        <input
                          type="file"
                          onChange={(e) =>
                            setEditForm({ ...editForm, fileDokumen: e.target.files?.[0] || null })
                          }
                          className="w-28 text-[9px] text-slate-600 file:mr-1 file:py-0.5 file:px-1 file:rounded file:border-0 file:bg-slate-200 file:text-slate-700 cursor-pointer"
                        />
                      ) : task.dokumen && task.dokumen !== 'Upluad File' && task.dokumen !== '-' ? (
                        <a
                          href={task.dokumen}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded text-[10px] font-semibold border border-sky-200 hover:bg-sky-100"
                        >
                          <FileText size={11} /> Buka
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Tidak Ada Dokumen</span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="py-2 px-1.5 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={handleSaveEdit}
                              disabled={isRowLoading}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 disabled:opacity-60 cursor-pointer transition-all text-[10px]"
                              title="Simpan"
                            >
                              {isRowLoading ? (
                                <>
                                  <Loader2 size={11} className="animate-spin" />
                                  <span>Simpan...</span>
                                </>
                              ) : (
                                <Save size={11} />
                              )}
                            </button>
                            {!isRowLoading && (
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="p-0.5 text-slate-600 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 cursor-pointer"
                                title="Batal"
                              >
                                <X size={11} />
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(task)}
                              disabled={isRowLoading}
                              className="px-1.5 py-0.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 font-medium disabled:opacity-50 cursor-pointer text-[10px]"
                            >
                              {isPicView ? 'Update' : 'Edit'}
                            </button>

                            {!isPicView && onDelete && (
                              <button
                                type="button"
                                onClick={() => handleDeleteClick(task.id)}
                                disabled={isRowLoading}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-red-600 bg-red-50 rounded hover:bg-red-100 font-medium disabled:opacity-60 cursor-pointer transition-all text-[10px]"
                              >
                                {isRowLoading ? (
                                  <>
                                    <Loader2 size={11} className="animate-spin" />
                                    <span>Hapus</span>
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
      <div className="p-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-2 bg-slate-50/50 text-[11px] text-slate-600">
        <div>
          Menampilkan{' '}
          <span className="font-semibold">{filteredTasks.length > 0 ? indexOfFirstItem + 1 : 0}</span>{' '}
          sampai{' '}
          <span className="font-semibold">{Math.min(indexOfLastItem, filteredTasks.length)}</span>{' '}
          dari <span className="font-semibold">{filteredTasks.length}</span> data target
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            <ChevronLeft size={13} /> Sebelumnya
          </button>

          <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800">
            Halaman {currentPage} dari {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            Berikutnya <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Modal Popup Riwayat Keterangan dengan Kolom Balas Pesan */}
      {activeHistoryTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Riwayat Keterangan Target
                </h4>
                <p className="text-[11px] text-slate-500 truncate max-w-[320px]">
                  {activeHistoryTask.namaTarget}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveHistoryTask(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/60 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* List Riwayat Pesan */}
            <div className="p-4 overflow-y-auto space-y-2.5 text-xs flex-1">
              {activeHistoryTask.keterangan ? (
                activeHistoryTask.keterangan.split('────────────────').map((item, idx) => {
                  const cleanedItemText = item
                    .replace(/^\[UNREAD_BY_ADMIN\]\s*/g, '')
                    .replace(/^\[UNREAD_BY_PIC\]\s*/g, '')
                    .trim();

                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border whitespace-pre-wrap leading-relaxed text-[11px] ${
                        idx === 0
                          ? 'bg-green-50/60 border-green-400 text-slate-800 shadow-2xs'
                          : 'bg-slate-50 border-slate-100 text-slate-600'
                      }`}
                    >
                      {idx === 0 && (
                        <span className="inline-block mb-1 px-1.5 py-0.5 bg-[#2fd800] text-white text-[9px] font-bold rounded uppercase tracking-wider">
                          Pesan Terbaru
                        </span>
                      )}
                      <div>{cleanedItemText}</div>
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-400 italic text-center py-4">Belum ada riwayat catatan.</p>
              )}
            </div>

            {/* Kolom Input Balasan Pesan & Tombol Kirim di Bagian Bawah Modal */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 shrink-0 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <textarea
                  rows={2}
                  placeholder="Ketik balasan atau catatan baru..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#ED1E28] resize-none shadow-2xs"
                />
                <button
                  type="button"
                  onClick={handleSendReplyFromModal}
                  disabled={isSendingReply || !replyMessage.trim()}
                  className="inline-flex items-center justify-center gap-1 px-3.5 py-2 bg-[#ED1E28] hover:bg-[#d41922] text-white rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer transition-all shadow-2xs h-fit self-end"
                >
                  {isSendingReply ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={12} /> Kirim
                    </>
                  )}
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveHistoryTask(null)}
                  className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}