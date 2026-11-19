'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
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
  currentTask: Task | null; // sebelumnya: Record<string, unknown> | null
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  loading: boolean;
  isAdmin?: boolean;
}

// Pilihan persentase progress kelipatan 10%
const PROGRESS_OPTIONS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

// Gaya input standar agar konsisten di seluruh field form
const FIELD_INPUT_CLASS =
  'w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#ED1E28]/30 focus:border-[#ED1E28]';

/**
 * Form input untuk menambah target baru atau mengedit target yang sedang dipilih (khusus Admin).
 */
export default function ProgressForm({
  formData,
  setFormData,
  currentTask,
  onSubmit,
  onReset,
  loading,
  isAdmin = true,
}: ProgressFormProps) {
  // Sembunyikan form jika bukan mode Admin
  if (!isAdmin) return null;

  // Tentukan label tombol submit sesuai status loading dan mode edit/tambah
  const submitButtonLabel = loading
    ? 'Menyimpan Data...'
    : currentTask
      ? 'Update Target'
      : 'Tambah Target';

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
      <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
        {currentTask ? 'Edit Target' : 'Tambah Target Baru'}
      </h2>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Baris 1: Kategori, Rincian Target, Waktu Mulai, dan Due Date */}
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

        {/* Baris 2: Progress, PIC, Keterangan opsional, dan upload Dokumen opsional */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Progress (%)
            </label>
            <select
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
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
              {DAFTAR_PIC.map((picName) => (
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
              onChange={(e) => setFormData({ ...formData, dokumen: e.target.files?.[0] || null })}
              className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#ED1E28] file:text-white hover:file:bg-[#d41922] cursor-pointer"
            />
          </div>
        </div>

        {/* Tombol batal (saat mode edit) dan tombol simpan */}
        <div className="flex justify-end gap-2 pt-2">
          {currentTask && !loading && (
            <button
              type="button"
              onClick={onReset}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-all"
            >
              Batal
            </button>
          )}
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
  );
}
