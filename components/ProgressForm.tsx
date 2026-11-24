'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { DAFTAR_PIC } from '@/utils/helpers';
import type { Task } from '@/components/ProgressTable';

export interface TargetFormData {
  kategori: string;
  namaTarget: string;
  waktuMulai: string;
  tenggatWaktu: string;
  progress: number;
  pic: string;
  keterangan: string;
  dokumen: File | string | null;
}

interface ProgressFormProps {
  formData: TargetFormData;
  setFormData: React.Dispatch<React.SetStateAction<TargetFormData>>;
  currentTask: Task | null;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  loading: boolean;
  isAdmin?: boolean;
  picOptions?: string[];
  // Kontrol modal dari luar (misalnya tombol Tambah Target di toolbar ProgressTable)
  isOpen?: boolean;
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  showHeaderBar?: boolean;
}

const PROGRESS_OPTIONS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

const FIELD_INPUT_CLASS =
  'w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#ED1E28]/30 focus:border-[#ED1E28]';

export default function ProgressForm({
  formData,
  setFormData,
  currentTask,
  onSubmit,
  onReset,
  loading,
  isAdmin = true,
  picOptions,
  isOpen: externalIsOpen,
  setIsOpen: externalSetIsOpen,
  showHeaderBar = false,
}: ProgressFormProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const wasSubmittingRef = useRef(false);

  const isModalOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setModalOpen = externalSetIsOpen ?? setInternalIsOpen;

  const daftarPicTersedia =
    picOptions && picOptions.length > 0 ? picOptions : DAFTAR_PIC;

  useEffect(() => {
    if (currentTask) {
      setModalOpen(true);
    }
  }, [currentTask, setModalOpen]);

  useEffect(() => {
    if (loading) {
      wasSubmittingRef.current = true;
      return;
    }

    if (wasSubmittingRef.current) {
      wasSubmittingRef.current = false;
      if (!formData.namaTarget) {
        setModalOpen(false);
      }
    }
  }, [loading, formData.namaTarget, setModalOpen]);

  if (!isAdmin) return null;

  const handleCloseModal = () => {
    if (loading) return;
    setModalOpen(false);
    onReset();
  };

  const submitButtonLabel = loading
    ? 'Menyimpan Data...'
    : currentTask
      ? 'Update Target'
      : 'Tambah Target';

  return (
    <>
      {showHeaderBar && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#ED1E28] hover:bg-[#d41922] text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-xs"
          >
            <Plus size={14} />
            <span>Tambah Target</span>
          </button>
        </div>
      )}

      {isModalOpen && (
        <div
          onClick={handleCloseModal}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 rounded-xl shadow-2xl border border-slate-200 w-full max-w-6xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 shrink-0">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {currentTask ? 'Edit Target' : 'Tambah Target Baru'}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={loading}
                aria-label="Tutup form"
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Kategori <span className="text-[#ED1E28]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: QMS, HSE..."
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    className={FIELD_INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Rincian Target <span className="text-[#ED1E28]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ketik rincian target..."
                    value={formData.namaTarget}
                    onChange={(e) => setFormData({ ...formData, namaTarget: e.target.value })}
                    className={FIELD_INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Waktu Mulai <span className="text-[#ED1E28]">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.waktuMulai}
                    onChange={(e) => setFormData({ ...formData, waktuMulai: e.target.value })}
                    className={FIELD_INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Due Date <span className="text-[#ED1E28]">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.tenggatWaktu}
                    onChange={(e) => setFormData({ ...formData, tenggatWaktu: e.target.value })}
                    className={FIELD_INPUT_CLASS}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Progress (%)
                  </label>
                  <select
                    value={formData.progress}
                    onChange={(e) =>
                      setFormData({ ...formData, progress: Number(e.target.value) })
                    }
                    className={FIELD_INPUT_CLASS}
                  >
                    {PROGRESS_OPTIONS.map((progressValue) => (
                      <option key={progressValue} value={progressValue}>
                        {progressValue}%
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    PIC <span className="text-[#ED1E28]">*</span>
                  </label>
                  <select
                    value={formData.pic}
                    onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                    className={FIELD_INPUT_CLASS}
                  >
                    {daftarPicTersedia.map((picName) => (
                      <option key={picName} value={picName}>
                        {picName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Keterangan / Catatan{' '}
                    <span className="text-[10px] text-slate-400 font-normal ml-0.5 align-baseline">
                      (Opsional)
                    </span>
                  </label>
                  <textarea
                    rows={1}
                    placeholder="Catatan tambahan..."
                    value={formData.keterangan || ''}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    className={`${FIELD_INPUT_CLASS} transition-all duration-200 focus:h-20 resize-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Dokumen{' '}
                    <span className="text-[10px] text-slate-400 font-normal ml-0.5 align-baseline">
                      (Opsional)
                    </span>
                  </label>
                  <input
                    type="file"
                    onChange={(e) =>
                      setFormData({ ...formData, dokumen: e.target.files?.[0] || null })
                    }
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#ED1E28] file:text-white hover:file:bg-[#d41922] cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={loading}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-all disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#ED1E28] hover:bg-[#d41922] disabled:bg-slate-400 text-white rounded-lg text-xs font-bold cursor-pointer disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {submitButtonLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}