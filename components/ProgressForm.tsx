'use client';

import React from 'react';
import { PlusCircle, X, Loader2 } from 'lucide-react';
import { DAFTAR_PIC } from '@/utils/helpers';

interface TaskFormState {
  kategori: string;
  namaTarget: string;
  waktuMulai: string;
  tenggatWaktu: string;
  progress: number;
  pic: string;
  dokumen: any;
}

interface ProgressFormProps {
  formData: TaskFormState;
  setFormData: React.Dispatch<React.SetStateAction<TaskFormState>>;
  currentTask: any;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  loading?: boolean;
}

const inputStyle = "w-full border border-slate-300 rounded-lg p-2 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-[#ED1E28] focus:outline-none";

export default function ProgressForm({ 
  formData, 
  setFormData, 
  currentTask, 
  onSubmit, 
  onReset,
  loading = false
}: ProgressFormProps) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 px-6 py-3 border-b-4 border-[#ED1E28] flex justify-between items-center">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 tracking-wide uppercase">
          <PlusCircle size={18} className="text-[#ED1E28]" /> 
          {currentTask ? 'Form Edit Target Progress' : 'Form Input Target Progress Baru'}
        </h2>
        {currentTask && (
          <button 
            type="button" 
            onClick={onReset}
            className="text-xs text-slate-300 hover:text-white underline flex items-center gap-1 cursor-pointer"
          >
            <X size={14} /> Batal Edit
          </button>
        )}
      </div>

      <form onSubmit={onSubmit} className="p-6 space-y-4">
        {/* Grid 7 Kolom Input */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Kategori</label>
            <input 
              type="text" 
              required
              placeholder="Contoh: QMS, HSE..."
              value={formData.kategori}
              onChange={(e) => setFormData({...formData, kategori: e.target.value})}
              className={inputStyle}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Rincian Target</label>
            <input 
              type="text" 
              required
              placeholder="Ketik rincian target..."
              value={formData.namaTarget}
              onChange={(e) => setFormData({...formData, namaTarget: e.target.value})}
              className={inputStyle}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Waktu Mulai</label>
            <input 
              type="date" 
              required
              value={formData.waktuMulai}
              onChange={(e) => setFormData({...formData, waktuMulai: e.target.value})}
              className={inputStyle}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Tenggat Waktu</label>
            <input 
              type="date" 
              required
              value={formData.tenggatWaktu}
              onChange={(e) => setFormData({...formData, tenggatWaktu: e.target.value})}
              className={inputStyle}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Progress (%)</label>
            <select 
              value={formData.progress}
              onChange={(e) => setFormData({...formData, progress: Number(e.target.value)})}
              className={inputStyle}
              disabled={loading}
            >
              <option value={0}>0% (Belum Dikerjakan)</option>
              <option value={50}>10% - 90% (On Progress)</option>
              <option value={100}>100% (Sudah Selesai)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">PIC</label>
            <select 
              value={formData.pic}
              onChange={(e) => setFormData({...formData, pic: e.target.value})}
              className={inputStyle}
              disabled={loading}
            >
              {DAFTAR_PIC.map((nama, idx) => (
                <option key={idx} value={nama}>{nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Dokumen</label>
            <input 
              type="file" 
              onChange={(e) => setFormData({...formData, dokumen: e.target.files?.[0] || null})}
              className="w-full text-xs text-slate-500 border border-slate-300 rounded-lg p-1.5 bg-white file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#ED1E28] file:text-white hover:file:bg-[#c91720]"
              disabled={loading}
            />
          </div>
        </div>

        {/* Tombol Action */}
        <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
          {currentTask && (
            <button 
              type="button" 
              onClick={onReset}
              disabled={loading}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs text-slate-600 hover:bg-slate-100 font-medium cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
          )}
          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-2 bg-[#ED1E28] hover:bg-[#c91720] text-white rounded-lg text-xs font-semibold shadow transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Mengunggah...' : (currentTask ? 'Update' : 'Upload')}
          </button>
        </div>
      </form>
    </section>
  );
}