// Menandai file ini sebagai Client Component di Next.js App Router
'use client';

// Mengimpor hook React untuk state, efek samping, dan referensi mutable
import React, { useEffect, useRef, useState } from 'react';
// Mengimpor ikon UI dari lucide-react
import { Loader2, Plus, X } from 'lucide-react';
// Mengimpor tipe Task dari komponen tabel progress
import type { Task } from '@/components/ProgressTable';
// Mengimpor daftar PIC bawaan sebagai fallback pilihan PIC
import { DAFTAR_PIC } from '@/utils/helpers';

// ==================== TIPE DATA & KONSTANTA ====================

// Mendefinisikan struktur data input pada form tambah/edit target
export interface TargetFormData {
  // Kategori target
  kategori: string;
  // Nama atau rincian target
  namaTarget: string;
  // Tanggal mulai target (YYYY-MM-DD)
  waktuMulai: string;
  // Tanggal tenggat waktu / due date target (YYYY-MM-DD)
  tenggatWaktu: string;
  // Persentase progres target (0 - 100)
  progress: number;
  // Nama PIC yang bertanggung jawab
  pic: string;
  // Catatan atau keterangan tambahan (opsional)
  keterangan: string;
  // File dokumen baru atau URL dokumen yang sudah ada
  dokumen: File | string | null;
}

// Mendefinisikan props komponen ProgressForm
interface ProgressFormProps {
  // Nilai input formulir saat ini
  formData: TargetFormData;
  // Setter untuk memperbarui nilai input formulir
  setFormData: React.Dispatch<React.SetStateAction<TargetFormData>>;
  // Data target yang sedang diedit (null jika sedang menambah target baru)
  currentTask: Task | null;
  // Handler submit formulir ke induk/database
  onSubmit: (e: React.FormEvent) => void;
  // Handler mereset formulir kembali ke nilai awal
  onReset: () => void;
  // Status proses penyimpanan data (menonaktifkan tombol saat submit)
  loading: boolean;
  // Penanda apakah pengguna memiliki hak akses admin
  isAdmin?: boolean;
  // Daftar nama PIC dinamis dari database (opsional)
  picOptions?: string[];
  // Kontrol status buka/tutup modal dari komponen induk
  isOpen?: boolean;
  // Setter status buka/tutup modal dari komponen induk
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  // Mengatur apakah tombol pemicu modal di luar komponen ditampilkan
  showHeaderBar?: boolean;
}

// Daftar opsi persentase progres yang dapat dipilih pada dropdown
const PROGRESS_OPTIONS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

// Kelas styling seragam untuk input teks, tanggal, dan select pada form
const FIELD_INPUT_CLASS =
  'w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#ED1E28]/30 focus:border-[#ED1E28]';

// ==================== KOMPONEN FORM ====================

/**
 * Komponen modal formulir tambah dan edit target khusus admin,
 * mendukung kontrol buka/tutup dari luar maupun internal serta unggah dokumen opsional.
 */
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
  // --- STATE & VARIABEL TURUNAN ---

  // State internal buka/tutup modal jika tidak dikontrol penuh dari luar
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  // Ref untuk melacak apakah proses submit baru saja selesai
  const wasSubmittingRef = useRef(false);

  // Menentukan status modal aktif (prioritas state dari parent jika tersedia)
  const isModalOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  // Menentukan setter modal aktif (prioritas setter dari parent jika tersedia)
  const setModalOpen = externalSetIsOpen ?? setInternalIsOpen;

  // Menggunakan daftar PIC dari database jika tersedia, atau fallback ke DAFTAR_PIC
  const daftarPicTersedia =
    picOptions && picOptions.length > 0 ? picOptions : DAFTAR_PIC;

  // Menentukan label tombol submit sesuai status loading dan mode tambah/edit
  const submitButtonLabel = loading
    ? 'Menyimpan Data...'
    : currentTask
      ? 'Update Target'
      : 'Tambah Target';

  // --- EFEK SAMPING ---

  // Membuka modal secara otomatis saat target dipilih untuk diedit
  useEffect(() => {
    if (currentTask) {
      setModalOpen(true);
    }
  }, [currentTask, setModalOpen]);

  // Menutup modal secara otomatis setelah submit selesai dan form berhasil direset
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

  // --- GUARD & HANDLER ---

  // Menyembunyikan seluruh komponen jika bukan tampilan admin
  if (!isAdmin) return null;

  // Menutup modal dan mereset nilai form selama tidak sedang proses simpan
  const handleCloseModal = () => {
    if (loading) return;
    setModalOpen(false);
    onReset();
  };

  // --- RENDER UTAMA ---

  return (
    <>
      {/* Tombol pemicu modal opsional jika showHeaderBar diaktifkan */}
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

      {/* Modal pop-up formulir tambah atau edit target */}
      {isModalOpen && (
        <div
          onClick={handleCloseModal}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4"
        >
          {/* Kontainer kartu modal (mencegah klik di dalam menutup backdrop) */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
          >
            {/* Header modal dengan judul mode dan tombol tutup */}
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

            {/* Formulir utama input data target */}
            <form onSubmit={onSubmit} className="space-y-4 overflow-y-auto pr-1">
              {/* Baris 1: Kategori, Rincian Target, Waktu Mulai, dan Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-2 gap-4">
                {/* Input kategori target */}
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

                {/* Input rincian/nama target */}
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

                {/* Input tanggal mulai target */}
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

                {/* Input tanggal tenggat waktu / due date */}
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

              {/* Baris 2: Progress, PIC, Keterangan, dan Unggah Dokumen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                {/* Dropdown persentase progres */}
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

                {/* Dropdown pemilihan PIC */}
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

                {/* Input catatan/keterangan tambahan (mengembang saat fokus) */}
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

                {/* Input unggah file dokumen pendukung */}
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

              {/* Footer formulir: tombol batal dan tombol simpan/update */}
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