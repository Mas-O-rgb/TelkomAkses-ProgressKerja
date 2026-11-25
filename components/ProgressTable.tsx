// Menandai file ini sebagai Client Component di Next.js App Router
'use client';

// Mengimpor hook React untuk state dan efek samping
import React, { useEffect, useState } from 'react';
// Mengimpor ikon-ikon UI dari lucide-react
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Plus,
  Save,
  Send,
  X,
} from 'lucide-react';
// Mengimpor library JSZip untuk mengompres beberapa dokumen menjadi satu file .zip
import JSZip from 'jszip';
// Mengimpor daftar PIC bawaan dan helper penentuan gaya badge status
import { DAFTAR_PIC, getStatusInfo } from '@/utils/helpers';

// ==================== TIPE DATA & KONSTANTA ====================

// Mendefinisikan struktur data objek Task yang digunakan di tabel dan modal
export interface Task {
  // ID unik target di database
  id: number;
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
  // Riwayat URL dokumen (bisa dipisah karakter '│')
  dokumen?: string | null;
  // Riwayat catatan/keterangan
  keterangan?: string | null;
  // Tanggal saat progres mencapai 100% (YYYY-MM-DD)
  completedAt?: string | null;
  // File baru yang dipilih saat mode edit/update baris
  fileDokumen?: File | null;
}

// Mendefinisikan struktur item dokumen yang ditampilkan di modal pratinjau
interface PreviewDocumentItem {
  // URL file dokumen
  url: string;
  // Nama pengunggah file
  uploader: string;
  // Waktu unggah file
  time: string;
}

// Mendefinisikan props komponen ProgressTable
interface ProgressTableProps {
  // Daftar seluruh target yang akan difilter, dipaginasi, dan ditampilkan
  tasks: Task[];
  // Nilai filter kategori aktif ('ALL' untuk semua kategori)
  filterKategori: string;
  // Setter untuk mengubah filter kategori
  setFilterKategori: (val: string) => void;
  // Kata kunci pencarian aktif
  searchTerm: string;
  // Setter untuk mengubah kata kunci pencarian
  setSearchTerm: (val: string) => void;
  // Callback untuk menyimpan perubahan data baris target
  onUpdateTask?: (updatedTask: Task) => Promise<void> | void;
  // Callback untuk menghapus target berdasarkan ID (khusus tampilan admin)
  onDelete?: (id: number) => Promise<void> | void;
  // Penanda apakah tabel sedang dirender pada halaman PIC
  isPicView?: boolean;
  // Callback untuk menandai riwayat keterangan sebagai sudah dibaca di database
  onMarkAsRead?: (taskId: number, cleanedKeterangan: string) => Promise<void> | void;
  // Callback untuk membuka modal pop-up tambah target baru (khusus admin)
  onOpenAddModal?: () => void;
  // Urutan nama kategori yang sama dengan donut chart kategori (opsional)
  categoryOrder?: string[];
}

// Gaya badge kategori yang diurutkan sama persis dengan KATEGORI_COLORS di ProgressCharts
const KATEGORI_BADGE_COLORS = [
  'bg-slate-100 text-slate-700 border-slate-300',
  'bg-red-50 text-red-700 border-red-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-violet-50 text-violet-700 border-violet-200',
  'bg-cyan-50 text-cyan-700 border-cyan-200',
];

// Daftar pilihan persentase progres yang tersedia saat edit/update baris
const PROGRESS_OPTIONS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
// Pemisah antar entri dalam riwayat keterangan
const HISTORY_DIVIDER = '────────────────';
// Pemisah antar versi file dalam riwayat dokumen
const DOCUMENT_DIVIDER = '│';
// Nama pengirim bawaan ketika balasan/catatan dikirim dari sisi admin
const ADMIN_SENDER_NAME = 'Hendra Hadiyatna Djatnika';

// Nilai awal kosong untuk state formulir edit baris
const EMPTY_EDIT_FORM: Task = {
  id: 0,
  kategori: '',
  namaTarget: '',
  waktuMulai: '',
  tenggatWaktu: '',
  progress: 0,
  pic: '',
  dokumen: '',
  keterangan: '',
  completedAt: null,
  fileDokumen: null,
};

// ==================== HELPER MURNI ====================

// Menentukan kelas Tailwind badge berdasarkan posisi kategori pada urutan donut chart
const getKategoriBadgeClass = (kategori: string, orderList: string[]): string => {
  const index = orderList.findIndex(
    (item) => item.trim().toLowerCase() === kategori.trim().toLowerCase()
  );
  const safeIndex = index >= 0 ? index : 0;
  return KATEGORI_BADGE_COLORS[safeIndex % KATEGORI_BADGE_COLORS.length];
};

// Memeriksa apakah string merupakan URL HTTP atau HTTPS yang valid
const isValidHttpUrl = (url?: string | null): boolean =>
  Boolean(url && (url.startsWith('http://') || url.startsWith('https://')));

// Memeriksa apakah kolom dokumen berisi tautan file asli (bukan placeholder/kosong)
const hasDocumentLink = (dokumen?: string | null): boolean =>
  Boolean(dokumen && dokumen !== 'Upluad File' && dokumen !== '-');

// Memformat waktu saat ini ke format lokal Indonesia (tanggal + jam:menit)
const formatCurrentTimestamp = (): string => {
  const now = new Date();
  return `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

// Menghapus tag penanda belum dibaca ([UNREAD_BY_ADMIN] / [UNREAD_BY_PIC]) dari teks
const stripUnreadTags = (text: string): string =>
  text
    .replace(/^\[UNREAD_BY_ADMIN\]\s*/g, '')
    .replace(/^\[UNREAD_BY_PIC\]\s*/g, '')
    .replace(/\[UNREAD_BY_(ADMIN|PIC)\]/g, '')
    .trim();

// Menambahkan catatan atau balasan baru ke bagian paling atas riwayat keterangan
const appendNotesEntry = (
  existingNotes: string | null | undefined,
  senderName: string,
  unreadTag: string,
  message: string
): string => {
  const cleanExisting = stripUnreadTags(existingNotes || '-');
  const newEntry = `${unreadTag} [${formatCurrentTimestamp()}] ${senderName}: ${message}`;
  return cleanExisting && cleanExisting !== '-'
    ? `${newEntry}\n${HISTORY_DIVIDER}\n${cleanExisting}`
    : newEntry;
};

// Mengambil nama file dari URL penyimpanan atau memakai nama fallback jika gagal
const extractFilenameFromUrl = (url: string, fallbackName: string): string => {
  try {
    const cleanUrl = url.split('?')[0];
    const parts = cleanUrl.split('/');
    const rawName = parts[parts.length - 1];
    return rawName ? decodeURIComponent(rawName) : fallbackName;
  } catch {
    return fallbackName;
  }
};

// Mengurai string riwayat dokumen menjadi array item untuk modal pratinjau
const parseDocumentHistory = (dokumenString: string): PreviewDocumentItem[] =>
  dokumenString.split(DOCUMENT_DIVIDER).map((entry) => {
    if (entry.includes('::')) {
      const [meta, url] = entry.split('::');
      const timeMatch = meta.match(/\[(.*?)\]/);
      const time = timeMatch ? timeMatch[1] : '';
      const uploader = meta.replace(/\[.*?\]\s*/, '').trim();
      return { url: url.trim(), uploader, time };
    }
    return { url: entry.trim(), uploader: '', time: '' };
  });

// ==================== KOMPONEN TABEL ====================

/**
 * Komponen tabel utama monitoring progress target dengan fitur:
 * - Filter kategori, pencarian kata kunci, & tombol tambah target (Admin)
 * - Edit/update inline per baris (termasuk unggah file & catatan baru)
 * - Modal riwayat keterangan + balas pesan + indikator belum dibaca (BARU)
 * - Modal pratinjau multi-dokumen + unduh per file atau unduh semua dalam format ZIP
 */
export default function ProgressTable({
  tasks,
  filterKategori,
  setFilterKategori,
  searchTerm,
  setSearchTerm,
  onUpdateTask,
  onDelete,
  isPicView = false,
  onMarkAsRead,
  onOpenAddModal,
  categoryOrder,
}: ProgressTableProps) {
  // --- STATE MODE EDIT & LOADING BARIS ---

  // State ID baris yang sedang dalam mode edit/update (null jika tidak ada)
  const [editingId, setEditingId] = useState<number | null>(null);
  // State data formulir saat baris sedang diedit
  const [editForm, setEditForm] = useState<Task>(EMPTY_EDIT_FORM);
  // State ID baris yang sedang memproses aksi simpan/hapus
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // --- STATE PAGINASI ---

  // State jumlah baris per halaman
  const [itemsPerPage, setItemsPerPage] = useState(25);
  // State nomor halaman paginasi aktif
  const [currentPage, setCurrentPage] = useState(1);
  // State nilai teks pada kotak input "Ke hal"
  const [pageInput, setPageInput] = useState('1');

  // --- STATE MODAL RIWAYAT KETERANGAN ---

  // State data task yang sedang dibuka pada modal riwayat keterangan
  const [activeHistoryTask, setActiveHistoryTask] = useState<Task | null>(null);
  // State daftar ID task yang sudah dibaca secara lokal di sesi browser saat ini
  const [locallyReadIds, setLocallyReadIds] = useState<number[]>([]);
  // State isi teks balasan pada modal riwayat keterangan
  const [replyMessage, setReplyMessage] = useState('');
  // State indikator pengiriman balasan pada modal riwayat
  const [isSendingReply, setIsSendingReply] = useState(false);

  // --- STATE MODAL PRATINJAU DOKUMEN ---

  // State daftar dokumen pada modal pratinjau
  const [previewDocs, setPreviewDocs] = useState<PreviewDocumentItem[]>([]);
  // State indeks tab dokumen yang sedang aktif dilihat
  const [activeDocIndex, setActiveDocIndex] = useState<number>(0);
  // State judul target pada header modal pratinjau
  const [previewTitle, setPreviewTitle] = useState<string>('');
  // State indikator proses pembuatan file ZIP
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  // --- DATA TURUNAN (FILTER, KATEGORI & PAGINASI) ---

  // Mengambil daftar kategori unik dari data tasks untuk dropdown filter & fallback urutan warna
  const uniqueCategories = Array.from(new Set(tasks.map((task) => task.kategori).filter(Boolean)));
  // Menggunakan urutan kategori dari donut chart jika tersedia, atau fallback ke kategori unik pada tabel
  const activeCategoryOrder =
    categoryOrder && categoryOrder.length > 0 ? categoryOrder : uniqueCategories;

  // Tag unread yang dicek untuk peran aktif (PIC atau Admin)
  const activeUnreadTag = isPicView ? '[UNREAD_BY_PIC]' : '[UNREAD_BY_ADMIN]';
  // Tag unread yang disematkan saat mengirim pesan baru ke pihak lawan
  const outgoingUnreadTag = isPicView ? '[UNREAD_BY_ADMIN]' : '[UNREAD_BY_PIC]';

  // Menyaring data tasks berdasarkan filter kategori dan kata kunci pencarian
  const filteredTasks = tasks.filter((task) => {
    const matchKategori = filterKategori === 'ALL' || task.kategori === filterKategori;
    const keyword = searchTerm.toLowerCase();
    const matchSearch =
      task.namaTarget.toLowerCase().includes(keyword) ||
      task.pic.toLowerCase().includes(keyword) ||
      Boolean(task.keterangan?.toLowerCase().includes(keyword));
    return matchKategori && matchSearch;
  });

  // Menghitung total halaman berdasarkan jumlah data terfilter dan jumlah baris per halaman
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / itemsPerPage));
  // Menghitung indeks akhir data pada halaman aktif
  const indexOfLastItem = currentPage * itemsPerPage;
  // Menghitung indeks awal data pada halaman aktif
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // Mengambil potongan data yang ditampilkan di halaman aktif
  const currentTasks = filteredTasks.slice(indexOfFirstItem, indexOfLastItem);

  // --- EFEK SAMPING (SINKRONISASI MODAL & PAGINASI) ---

  // Menyinkronkan isi modal riwayat jika data task di state induk berubah
  useEffect(() => {
    if (!activeHistoryTask) return;
    const latestUpdated = tasks.find((task) => task.id === activeHistoryTask.id);
    if (latestUpdated && latestUpdated.keterangan !== activeHistoryTask.keterangan) {
      setActiveHistoryTask(latestUpdated);
    }
  }, [tasks, activeHistoryTask]);

  // Menghapus ID dari locallyReadIds jika ada pesan baru masuk lagi dari server
  useEffect(() => {
    tasks.forEach((task) => {
      const hasUnread = task.keterangan?.includes(activeUnreadTag);
      if (hasUnread && locallyReadIds.includes(task.id)) {
        setLocallyReadIds((prev) => prev.filter((id) => id !== task.id));
      }
    });
  }, [tasks, activeUnreadTag, locallyReadIds]);

  // Memastikan nomor halaman aktif selalu berada dalam rentang 1..totalPages
  useEffect(() => {
    setCurrentPage((prev) => Math.min(Math.max(prev, 1), totalPages));
  }, [totalPages]);

  // Menyamakan isi kotak input halaman dengan halaman aktif saat ini
  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  // --- HANDLER FILTER, PENCARIAN & PAGINASI ---

  // Menangani perubahan dropdown filter kategori dan mereset ke halaman 1
  const handleFilterChange = (categoryValue: string) => {
    setFilterKategori(categoryValue);
    setCurrentPage(1);
  };

  // Menangani perubahan input pencarian dan mereset ke halaman 1
  const handleSearchChange = (keywordValue: string) => {
    setSearchTerm(keywordValue);
    setCurrentPage(1);
  };

  // Memvalidasi dan mengarahkan tabel ke nomor halaman yang diketik pengguna
  const commitPageInput = () => {
    const parsedPage = parseInt(pageInput, 10);

    if (Number.isNaN(parsedPage)) {
      setPageInput(String(currentPage));
      return;
    }

    const validPage = Math.min(Math.max(parsedPage, 1), totalPages);
    setCurrentPage(validPage);
    setPageInput(String(validPage));
  };

  // Menyusun deretan nomor halaman + ellipsis agar bar paginasi tetap ringkas
  const getPageNumbers = (): (number | 'ellipsis-left' | 'ellipsis-right')[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis-left' | 'ellipsis-right')[] = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) pages.push('ellipsis-left');
    for (let p = start; p <= end; p += 1) {
      pages.push(p);
    }
    if (end < totalPages - 1) pages.push('ellipsis-right');
    pages.push(totalPages);

    return pages;
  };

  // --- HANDLER EDIT, HAPUS & RIWAYAT KETERANGAN ---

  // Memulai mode edit baris dengan mengosongkan input catatan baru dan fileDokumen
  const handleStartEdit = (task: Task) => {
    setEditingId(task.id);
    setEditForm({ ...task, keterangan: '', fileDokumen: null });
  };

  // Membatalkan mode edit baris tanpa menyimpan perubahan
  const handleCancelEdit = () => {
    setEditingId(null);
  };

  // Menyimpan perubahan baris yang sedang diedit
  const handleSaveEdit = async () => {
    if (!onUpdateTask) return;
    setActionLoadingId(editForm.id);

    try {
      const oldTask = tasks.find((task) => task.id === editForm.id);
      const baseKeterangan = oldTask?.keterangan || '-';
      const trimmedNote = editForm.keterangan?.trim();

      let finalKeterangan = baseKeterangan;
      if (trimmedNote) {
        const senderName = isPicView ? editForm.pic : ADMIN_SENDER_NAME;
        finalKeterangan = appendNotesEntry(
          baseKeterangan,
          senderName,
          outgoingUnreadTag,
          trimmedNote
        );
      }

      const updatedTask: Task = {
        ...editForm,
        keterangan: finalKeterangan,
      };

      await onUpdateTask(updatedTask);
      setLocallyReadIds((prev) => [...prev.filter((id) => id !== editForm.id), editForm.id]);
      setEditingId(null);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Menangani klik tombol Hapus pada baris target
  const handleDeleteClick = async (taskId: number) => {
    if (!onDelete) return;
    setActionLoadingId(taskId);
    try {
      await onDelete(taskId);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Membuka modal riwayat keterangan sekaligus menandai pesan sebagai sudah dibaca
  const handleOpenHistory = async (task: Task) => {
    setActiveHistoryTask(task);
    setReplyMessage('');

    if (task.keterangan && task.keterangan.includes(activeUnreadTag)) {
      const cleanedKeterangan = task.keterangan
        .replace(new RegExp(`\\s*${activeUnreadTag.replace(/[\[\]]/g, '\\$&')}\\s*`, 'g'), '')
        .trim();

      setActiveHistoryTask({ ...task, keterangan: cleanedKeterangan });

      if (!locallyReadIds.includes(task.id)) {
        setLocallyReadIds((prev) => [...prev, task.id]);
      }

      if (onMarkAsRead) {
        await onMarkAsRead(task.id, cleanedKeterangan);
      }
    }
  };

  // Mengirim balasan atau catatan baru langsung dari dalam modal riwayat
  const handleSendReplyFromModal = async () => {
    if (!activeHistoryTask || !replyMessage.trim() || !onUpdateTask) return;
    setIsSendingReply(true);

    try {
      const originalTask = activeHistoryTask;
      const senderName = isPicView ? originalTask.pic : ADMIN_SENDER_NAME;
      const finalKeterangan = appendNotesEntry(
        originalTask.keterangan,
        senderName,
        outgoingUnreadTag,
        replyMessage.trim()
      );

      const updatedTask: Task = {
        ...originalTask,
        keterangan: finalKeterangan,
      };

      setLocallyReadIds((prev) => [...prev.filter((id) => id !== originalTask.id), originalTask.id]);
      setActiveHistoryTask(updatedTask);
      setReplyMessage('');
      await onUpdateTask(updatedTask);
    } finally {
      setIsSendingReply(false);
    }
  };

  // --- HANDLER PRATINJAU & UNDUH DOKUMEN ---

  // Membuka modal pratinjau dokumen untuk satu target
  const handleOpenPreview = (dokumenString: string, targetTitle: string) => {
    setPreviewDocs(parseDocumentHistory(dokumenString));
    setActiveDocIndex(0);
    setPreviewTitle(targetTitle);
  };

  // Mengunduh seluruh dokumen valid pada target ke dalam satu arsip .zip
  const handleDownloadAllAsZip = async () => {
    const validDocs = previewDocs.filter((doc) => isValidHttpUrl(doc.url));

    if (validDocs.length === 0) {
      alert('Tidak ada file dengan tautan valid untuk diunduh.');
      return;
    }

    setIsDownloadingZip(true);
    try {
      const zip = new JSZip();
      let successCount = 0;

      await Promise.all(
        validDocs.map(async (doc, index) => {
          const versionNumber = previewDocs.length - previewDocs.indexOf(doc);
          const safeUploader = doc.uploader
            ? `_${doc.uploader.replace(/[^a-zA-Z0-9_-]/g, '_')}`
            : '';
          const defaultFileName = `dokumen_versi_${versionNumber}_${index + 1}`;
          const originalFileName = extractFilenameFromUrl(doc.url, defaultFileName);
          const zipEntryName = `Versi_${versionNumber}${safeUploader}_${originalFileName}`;

          try {
            const response = await fetch(doc.url);
            if (!response.ok) return;
            const blob = await response.blob();
            zip.file(zipEntryName, blob);
            successCount += 1;
          } catch {
            // Mengabaikan file yang gagal diunduh dari storage
          }
        })
      );

      if (successCount === 0) {
        alert('Gagal mengunduh file ke ZIP. Periksa koneksi atau pengaturan CORS bucket.');
        return;
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipObjectUrl = URL.createObjectURL(zipBlob);
      const safeTitle = (previewTitle || 'dokumen-target')
        .replace(/[^a-zA-Z0-9-_ ]/g, '')
        .trim()
        .replace(/\s+/g, '_');

      const downloadLink = document.createElement('a');
      downloadLink.href = zipObjectUrl;
      downloadLink.download = `${safeTitle}_semua_dokumen.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      setTimeout(() => URL.revokeObjectURL(zipObjectUrl), 1500);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // --- RENDER VIEWER DOKUMEN ---

  // Merender tampilan pratinjau sesuai jenis/ekstensi file yang sedang dipilih
  const renderDocumentViewer = () => {
    const currentDoc = previewDocs[activeDocIndex];

    if (!isValidHttpUrl(currentDoc?.url)) {
      return (
        <div className="text-center p-8 bg-white rounded-xl shadow-xs border border-slate-200 max-w-md">
          <FileText size={36} className="mx-auto text-slate-300 mb-2" />
          <h5 className="font-bold text-slate-700 text-sm mb-1">
            File Tidak Valid / Format Teks
          </h5>
          <p className="text-xs text-slate-500 mb-3">
            Konten tersimpan:{' '}
            <span className="font-semibold text-slate-700 italic">
              &quot;{currentDoc?.url || '-'}&quot;
            </span>
            . Ini bukan tautan file yang valid untuk dipratinjau.
          </p>
          <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200 inline-block">
            Silakan upload ulang file baru melalui tombol Edit/Update.
          </span>
        </div>
      );
    }

    if (currentDoc.url.match(/\.(jpeg|jpg|png|gif|webp)(\?.*)?$/i)) {
      return (
        <img
          src={currentDoc.url}
          alt="Preview Dokumen"
          className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
        />
      );
    }

    if (currentDoc.url.match(/\.heic(\?.*)?$/i)) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-lg border border-slate-300 p-4">
          <FileText size={42} className="text-sky-600 mb-2" />
          <h5 className="font-bold text-slate-700 text-sm mb-1">Pratinjau File HEIC (Apple)</h5>
          <p className="text-xs text-slate-500 text-center max-w-md mb-4">
            Format HEIC memerlukan penampil khusus agar dapat dirender langsung di browser Windows/Android.
          </p>
          <a
            href={currentDoc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all inline-flex items-center gap-1.5"
          >
            Buka / Download File HEIC Asli
          </a>
        </div>
      );
    }

    if (currentDoc.url.match(/\.(mov|mp4|webm|ogg|m4v)(\?.*)?$/i)) {
      return (
        <video
          src={currentDoc.url}
          controls
          className="max-h-full max-w-full rounded-lg shadow-md bg-black"
        >
          Browser Anda tidak Mendukung Pemutar Video.
        </video>
      );
    }

    if (currentDoc.url.match(/\.(xlsx|xls|docx|doc|pptx|ppt)(\?.*)?$/i)) {
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(currentDoc.url)}`;
      return (
        <iframe
          src={officeViewerUrl}
          title="Office Preview"
          className="w-full h-full rounded-lg border border-slate-300 bg-white shadow-inner"
        />
      );
    }

    return (
      <iframe
        src={currentDoc.url}
        title="Dokumen Preview"
        className="w-full h-full rounded-lg border border-slate-300 bg-white shadow-inner"
      />
    );
  };

  // URL dokumen yang sedang dipilih di modal preview
  const activePreviewUrl = previewDocs[activeDocIndex]?.url;

  // --- RENDER UTAMA ---

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-[11px]">
      {/* Toolbar filter kategori, kolom pencarian, dan tombol tambah target */}
      <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-2 bg-slate-50/50">
        {/* Dropdown filter berdasarkan kategori */}
        <select
          value={filterKategori}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="w-full sm:w-44 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#ED1E28]/30"
        >
          <option value="ALL">Semua Kategori</option>
          {uniqueCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        {/* Sisi kanan: Input pencarian + Tombol Tambah Target */}
        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            placeholder="Cari target atau PIC..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full sm:w-60 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ED1E28]/30"
          />

          {!isPicView && onOpenAddModal && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#ED1E28] hover:bg-[#d41922] text-white rounded-lg font-bold text-[11px] shadow-2xs transition-all cursor-pointer shrink-0"
            >
              <Plus size={13} />
              <span>Tambah Target</span>
            </button>
          )}
        </div>
      </div>

      {/* Pembungkus tabel agar responsif secara horizontal di layar kecil */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            {/* Header kolom tabel */}
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
                const activeProgress = isEditing ? editForm.progress : task.progress;
                const activeCompletedAt =
                  activeProgress === 100
                    ? isEditing
                      ? editForm.completedAt
                      : task.completedAt
                    : null;

                const statusInfo = getStatusInfo(
                  isEditing ? editForm.tenggatWaktu : task.tenggatWaktu,
                  activeProgress,
                  activeCompletedAt
                );
                const rowNumber = indexOfFirstItem + index + 1;
                const hasNotes = Boolean(task.keterangan && task.keterangan !== '-');
                const hasUnreadBadge =
                  hasNotes &&
                  Boolean(task.keterangan?.includes(activeUnreadTag)) &&
                  !locallyReadIds.includes(task.id);
                const notesHistoryCount = hasNotes
                  ? task.keterangan!.split(HISTORY_DIVIDER).length
                  : 0;
                const latestNotePreview = hasNotes
                  ? task.keterangan!
                      .split(HISTORY_DIVIDER)[0]
                      .replace(/^(\[UNREAD_BY_(ADMIN|PIC)\]\s*)?\[.*?\]\s*.*?:/, '')
                      .trim()
                  : '';

                return (
                  <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Kolom nomor urut */}
                    <td className="py-2 px-1.5 text-center text-slate-500">{rowNumber}</td>

                    {/* Kolom kategori dengan warna badge tersinkronisasi ke donut chart */}
                    <td className="py-2 px-1.5 font-semibold text-slate-700">
                      {isEditing && !isPicView ? (
                        <input
                          type="text"
                          value={editForm.kategori}
                          onChange={(e) => setEditForm({ ...editForm, kategori: e.target.value })}
                          className="w-full px-1 py-0.5 bg-white border border-slate-300 rounded text-[11px]"
                        />
                      ) : (
                        <span
                          className={`px-1.5 py-0.5 rounded border inline-block ${getKategoriBadgeClass(
                            task.kategori,
                            activeCategoryOrder
                          )}`}
                        >
                          {task.kategori}
                        </span>
                      )}
                    </td>

                    {/* Kolom rincian target */}
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

                    {/* Kolom waktu mulai */}
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

                    {/* Kolom due date / tenggat waktu */}
                    <td className="py-2 px-1.5 text-slate-600 whitespace-nowrap text-center">
                      {isEditing && !isPicView ? (
                        <input
                          type="date"
                          value={editForm.tenggatWaktu}
                          onChange={(e) =>
                            setEditForm({ ...editForm, tenggatWaktu: e.target.value })
                          }
                          className="w-full px-1 py-0.5 bg-white border border-slate-300 rounded text-[10px]"
                        />
                      ) : (
                        task.tenggatWaktu
                      )}
                    </td>

                    {/* Kolom persentase progress */}
                    <td className="py-2 px-1.5 text-center">
                      {isEditing ? (
                        <select
                          value={editForm.progress}
                          onChange={(e) =>
                            setEditForm({ ...editForm, progress: Number(e.target.value) })
                          }
                          className="w-full p-1 border border-slate-300 rounded bg-white text-slate-800 text-[11px] font-semibold focus:outline-none focus:ring-1 focus:ring-[#ED1E28]"
                        >
                          {PROGRESS_OPTIONS.map((progressValue) => (
                            <option key={progressValue} value={progressValue}>
                              {progressValue}%
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="font-semibold text-slate-700">{task.progress}%</span>
                      )}
                    </td>

                    {/* Kolom badge status */}
                    <td className="py-2 px-1.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.className}`}
                      >
                        {statusInfo.text}
                      </span>
                    </td>

                    {/* Kolom PIC */}
                    <td className="py-2 px-1.5 text-slate-700 font-medium text-center">
                      {isEditing && !isPicView ? (
                        <select
                          value={editForm.pic}
                          onChange={(e) => setEditForm({ ...editForm, pic: e.target.value })}
                          className="w-full px-1 py-0.5 bg-white border border-slate-300 rounded text-[11px]"
                        >
                          {DAFTAR_PIC.map((picName) => (
                            <option key={picName} value={picName}>
                              {picName}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="whitespace-normal break-words leading-snug">{task.pic}</span>
                      )}
                    </td>

                    {/* Kolom keterangan dan tombol pembuka riwayat */}
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
                            {hasNotes ? (
                              latestNotePreview
                            ) : (
                              <span className="text-slate-400 italic">-</span>
                            )}
                          </div>

                          {hasNotes && (
                            <button
                              type="button"
                              onClick={() => handleOpenHistory(task)}
                              className="text-left text-[9.5px] font-semibold text-[#ED1E28] hover:underline cursor-pointer inline-flex items-center gap-1.5 mt-0.5 w-fit"
                            >
                              <span className="relative flex h-2 w-2">
                                {hasUnreadBadge && (
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ED1E28] opacity-75" />
                                )}
                                <span
                                  className={`relative inline-flex rounded-full h-2 w-2 ${
                                    hasUnreadBadge ? 'bg-[#ED1E28]' : 'bg-slate-400'
                                  }`}
                                />
                              </span>
                              <span>Riwayat ({notesHistoryCount})</span>
                              {hasUnreadBadge && (
                                <span className="px-1 py-0.2 bg-red-100 text-[#ED1E28] border border-red-200 rounded text-[8px] font-bold tracking-wide">
                                  BARU
                                </span>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Kolom dokumen / input upload file saat edit */}
                    <td className="py-2 px-1.5 text-slate-700">
                      {isEditing ? (
                        <input
                          type="file"
                          onChange={(e) =>
                            setEditForm({ ...editForm, fileDokumen: e.target.files?.[0] || null })
                          }
                          className="w-28 text-[9px] text-slate-600 file:mr-1 file:py-0.5 file:px-1 file:rounded file:border-0 file:bg-slate-200 file:text-slate-600 file:cursor-pointer hover:file:bg-slate-400 hover:file:text-slate-900 file:transition-colors cursor-pointer"
                        />
                      ) : hasDocumentLink(task.dokumen) ? (
                        <button
                          type="button"
                          onClick={() => handleOpenPreview(task.dokumen!, task.namaTarget)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-sky-50 text-sky-700 rounded text-[10px] font-semibold border border-sky-200 hover:bg-sky-100 cursor-pointer transition-all"
                        >
                          <FileText size={11} /> Preview ({task.dokumen!.split(DOCUMENT_DIVIDER).length})
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Tidak Ada Dokumen</span>
                      )}
                    </td>

                    {/* Kolom tombol aksi baris */}
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

      {/* Footer tabel: ringkasan jumlah data & tombol navigasi halaman */}
      <div className="p-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-2 bg-slate-50/50 text-[11px] text-slate-600">
        <div>
          Menampilkan{' '}
          <span className="font-semibold">
            {filteredTasks.length > 0 ? indexOfFirstItem + 1 : 0}
          </span>{' '}
          sampai{' '}
          <span className="font-semibold">{Math.min(indexOfLastItem, filteredTasks.length)}</span>{' '}
          dari <span className="font-semibold">{filteredTasks.length}</span> data target
        </div>

        {/* Bar paginasi kapsul: < 1 2 3 > | 25 / hal | Ke hal [ ] */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              aria-label="Halaman sebelumnya"
              className="w-7 h-7 inline-flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft size={14} />
            </button>

            {getPageNumbers().map((item) => {
              if (item === 'ellipsis-left' || item === 'ellipsis-right') {
                return (
                  <span
                    key={item}
                    className="w-6 h-7 inline-flex items-center justify-center text-slate-400 select-none"
                  >
                    …
                  </span>
                );
              }

              const isActive = item === currentPage;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCurrentPage(item)}
                  className={`min-w-7 h-7 px-1.5 inline-flex items-center justify-center rounded-full text-[11px] transition-all cursor-pointer ${
                    isActive
                      ? 'bg-red-50 text-[#ED1E28] font-bold border border-[#ED1E28]/50'
                      : 'text-slate-600 font-medium hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {item}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              aria-label="Halaman berikutnya"
              className="w-7 h-7 inline-flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            aria-label="Jumlah data per halaman"
            className="px-3 py-1 rounded-full border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:border-[#ED1E28] cursor-pointer"
          >
            <option value={25}>25 / hal</option>
            <option value={50}>50 / hal</option>
            <option value={75}>75 / hal</option>
            <option value={100}>100 / hal</option>
          </select>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <span className="font-medium whitespace-nowrap">Ke hal</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              disabled={totalPages <= 1}
              value={pageInput}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={commitPageInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitPageInput();
                  e.currentTarget.blur();
                } else if (e.key === 'Escape') {
                  setPageInput(String(currentPage));
                  e.currentTarget.blur();
                }
              }}
              aria-label="Nomor halaman tujuan"
              className="w-12 h-7 px-2 text-center rounded-full border border-slate-200 bg-white text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-[#ED1E28] disabled:bg-slate-50 disabled:text-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
      </div>

      {/* Modal Riwayat Keterangan & Kirim Balasan */}
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

            <div className="p-4 overflow-y-auto space-y-3 text-xs flex-1">
              {activeHistoryTask.keterangan ? (
                activeHistoryTask.keterangan.split(HISTORY_DIVIDER).map((entry, entryIndex) => {
                  const timeMatch = entry.match(/\[([\d\/]+\s+[\d\.]+)\]/);
                  const timestamp = timeMatch ? timeMatch[1] : '';
                  const cleanEntry = stripUnreadTags(entry);
                  const colonIndex = cleanEntry.indexOf(':');
                  const rawSender =
                    colonIndex !== -1
                      ? cleanEntry.slice(0, colonIndex).replace(/\[.*?\]/g, '').trim()
                      : '';
                  const isAdminMessage = rawSender.toUpperCase().includes('HENDRA');
                  const senderName = isAdminMessage ? ADMIN_SENDER_NAME : activeHistoryTask.pic;
                  const messageBody =
                    colonIndex !== -1 ? cleanEntry.slice(colonIndex + 1).trim() : cleanEntry;

                  return (
                    <div
                      key={entryIndex}
                      className={`p-3 rounded-xl border transition-all ${
                        entryIndex === 0
                          ? 'bg-green-50/80 border-green-400 text-slate-800 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-slate-200/60 text-[10px]">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          👤 {senderName}
                        </span>
                        <div className="flex items-center gap-2">
                          {timestamp && (
                            <span className="text-slate-400 font-medium">🕒 {timestamp}</span>
                          )}
                          {entryIndex === 0 && (
                            <span className="px-1.5 py-0.2 bg-[#2fd800] text-white text-[8.5px] font-bold rounded uppercase tracking-wider">
                              Pesan Terbaru
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="whitespace-pre-wrap leading-relaxed text-[11px] text-slate-800 font-normal">
                        {messageBody}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-400 italic text-center py-4">Belum ada riwayat catatan.</p>
              )}
            </div>

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

      {/* Modal Pratinjau & Riwayat Dokumen */}
      {previewDocs.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col h-[88vh]">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={14} className="text-sky-600" /> Pratinjau & Riwayat Dokumen (
                  {previewDocs.length} File)
                </h4>
                <p className="text-[11px] text-slate-500 truncate max-w-[500px]">
                  {previewTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDocs([])}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 cursor-pointer transition-all"
              >
                ✕
              </button>
            </div>

            <div className="px-4 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
              {previewDocs.map((doc, docIndex) => (
                <button
                  key={docIndex}
                  type="button"
                  onClick={() => setActiveDocIndex(docIndex)}
                  className={`px-3 py-1.5 rounded-lg text-[10.5px] font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                    activeDocIndex === docIndex
                      ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>📁 Dokumen {previewDocs.length - docIndex}</span>
                  {doc.uploader && <span className="opacity-85 font-normal">• {doc.uploader}</span>}
                  {doc.time && <span className="opacity-75 text-[9.5px]">({doc.time})</span>}
                </button>
              ))}
            </div>

            <div className="flex-1 bg-slate-200/70 p-2 overflow-hidden flex items-center justify-center">
              {renderDocumentViewer()}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 shrink-0 flex justify-between items-center gap-2">
              <span className="text-[10px] text-slate-500">
                Menampilkan file ke-{activeDocIndex + 1} dari {previewDocs.length} dokumen terunggah.
              </span>
              <div className="flex items-center gap-2">
                {previewDocs.length > 1 && (
                  <button
                    type="button"
                    onClick={handleDownloadAllAsZip}
                    disabled={isDownloadingZip}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    {isDownloadingZip ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Mengompres ZIP...</span>
                      </>
                    ) : (
                      <>
                        <Archive size={13} />
                        <span>Unduh Semua ({previewDocs.length} File · ZIP)</span>
                      </>
                    )}
                  </button>
                )}

                {isValidHttpUrl(activePreviewUrl) && (
                  <a
                    href={activePreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all inline-flex items-center gap-1 shadow-2xs"
                  >
                    <Download size={13} />
                    <span>Unduh File Ini</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setPreviewDocs([])}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-all"
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