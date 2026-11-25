// Menandai file ini sebagai Client Component di Next.js App Router
'use client';

// Mengimpor React untuk rendering komponen
import React from 'react';
// Mengimpor komponen grafik dari Recharts untuk visualisasi status, kategori, deadline, dan PIC
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// ==================== TIPE DATA & KONSTANTA ====================

// Mendefinisikan struktur item data untuk donut chart status dan kategori
interface ChartDataItem {
  // Label nama status atau kategori
  name: string;
  // Nilai numerik utama untuk grafik
  value: number;
  // Jumlah opsional jika data berasal dari agregasi jumlah item
  jumlah?: number;
}

// Mendefinisikan struktur rekap jumlah tiap status per PIC
interface StackedPicStatusItem {
  // Nama PIC
  name: string;
  // Jumlah target berstatus BELUM DIKERJAKAN
  'BELUM DIKERJAKAN': number;
  // Jumlah target berstatus ON PROGRESS
  'ON PROGRESS': number;
  // Jumlah target berstatus OVERDUE
  OVERDUE: number;
  // Jumlah target berstatus SUDAH SELESAI
  'SUDAH SELESAI': number;
}

// Mendefinisikan struktur minimal data task untuk grafik tren deadline
interface TaskItem {
  // Tanggal tenggat waktu target (YYYY-MM-DD)
  tenggatWaktu?: string;
}

// Mendefinisikan props komponen ProgressCharts
interface ProgressChartsProps {
  // Data distribusi jumlah target berdasarkan status
  pieDataStatus: ChartDataItem[];
  // Data distribusi jumlah target berdasarkan kategori
  pieDataKategori: ChartDataItem[];
  // Data rekap status pengerjaan per PIC
  stackedDataPicStatus: StackedPicStatusItem[];
  // Daftar target untuk menghitung tren deadline dan total target
  tasks: TaskItem[];
  // Status loading saat data awal sedang diambil
  loading?: boolean;
}

// Urutan tetap status agar rincian di sisi kanan grafik selalu konsisten
const ORDERED_STATUS_LIST = [
  'BELUM DIKERJAKAN',
  'ON PROGRESS',
  'OVERDUE',
  'SUDAH SELESAI',
];

// Pemetaan warna hex untuk setiap status target
const STATUS_COLORS: Record<string, string> = {
  'BELUM DIKERJAKAN': '#8E9BAE',
  'ON PROGRESS': '#F59E0B',
  OVERDUE: '#ED1E28',
  'SUDAH SELESAI': '#10B981',
};

// Palet warna kategori target (selaras dengan urutan badge kategori di ProgressTable)
const KATEGORI_COLORS = [
  '#64748b',
  '#ef4444',
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
];

// Gaya standar tooltip agar tampilan konsisten di seluruh grafik
const TOOLTIP_STYLE = {
  fontSize: '11px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
};

// ==================== KOMPONEN SKELETON LOADING ====================

// Komponen skeleton loading untuk baris atas (3 kartu ringkas: status, kategori, tren deadline)
function TopChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[0, 1, 2].map((cardIdx) => (
        <div
          key={cardIdx}
          className="bg-white p-4 rounded-xl border border-white border-b-7 shadow-2xs flex flex-col justify-between animate-pulse"
        >
          {/* Placeholder judul kartu dan label ringkas di pojok kanan */}
          <div className="flex items-center justify-between mb-3">
            <div className="h-3 w-28 bg-slate-200 rounded" />
            <div className="h-2.5 w-14 bg-slate-100 rounded" />
          </div>

          {cardIdx < 2 ? (
            // Placeholder donut chart + daftar rincian di sisi kanan untuk 2 kartu pertama
            <div className="flex flex-col sm:flex-row items-center gap-4 min-h-[176px] my-auto">
              <div className="w-36 h-36 rounded-full border-[14px] border-slate-100 shrink-0" />
              <div className="flex-1 w-full space-y-2.5">
                {[0, 1, 2, 3].map((rowIdx) => (
                  <div key={rowIdx} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-200 shrink-0" />
                      <div className="h-2.5 w-24 bg-slate-200 rounded" />
                    </div>
                    <div className="h-2.5 w-10 bg-slate-100 rounded shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Placeholder grafik batang/area untuk kartu ketiga (Tren Deadline)
            <div className="h-44 w-full flex items-end gap-2 pt-6 px-2">
              {[40, 65, 50, 80, 55, 70, 45].map((heightPct, barIdx) => (
                <div
                  key={barIdx}
                  className="flex-1 bg-slate-100 rounded-t"
                  style={{ height: `${heightPct}%` }}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ==================== KOMPONEN GRAFIK UTAMA ====================

/**
 * Komponen visualisasi grafik monitoring progress kerja:
 * - Baris atas: Distribusi Status, Kategori Target, dan Tren Deadline
 * - Baris bawah: Status Pengerjaan per PIC
 */
export default function ProgressCharts({
  pieDataStatus,
  pieDataKategori,
  stackedDataPicStatus,
  tasks,
  loading = false,
}: ProgressChartsProps) {
  // --- AGREGASI DATA GRAFIK ---

  // Mengagregasi jumlah target per tanggal tenggat waktu
  const deadlineCounts = tasks.reduce<Record<string, number>>((acc, task) => {
    if (task.tenggatWaktu) {
      acc[task.tenggatWaktu] = (acc[task.tenggatWaktu] || 0) + 1;
    }
    return acc;
  }, {});

  // Menyusun data grafik tren deadline terurut berdasarkan tanggal (format MM-DD)
  const trendDeadlineData = Object.keys(deadlineCounts)
    .sort()
    .map((date) => ({
      tanggal: date.slice(5),
      jumlah: deadlineCounts[date],
    }));

  // Menghitung total seluruh target aktif
  const totalTasks = tasks.length;

  // Menghitung total nilai kategori untuk persentase rincian Kategori Target
  const totalKategori = pieDataKategori.reduce(
    (sum, item) => sum + (item.value || 0),
    0
  );

  // --- TAMPILAN SKELETON SAAT LOADING AWAL ---

  if (loading && totalTasks === 0) {
    return (
      <div className="space-y-6">
        <TopChartsSkeleton />
        {/* Placeholder skeleton untuk grafik bawah (Status Pengerjaan per PIC) */}
        <div className="bg-white p-4 rounded-xl border border-white border-b-7 shadow-2xs animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-3 w-36 bg-slate-200 rounded" />
            <div className="h-2.5 w-48 bg-slate-100 rounded" />
          </div>
          <div className="h-52 w-full bg-slate-100/70 rounded-lg" />
        </div>
      </div>
    );
  }

  // --- RENDER GRAFIK ---

  return (
    <div className="space-y-6">
      {/* Baris Atas: 3 Grafik Ringkas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Kartu Distribusi Status */}
        <div className="bg-white p-4 rounded-xl border border-white border-b-7 hover:border-b-red-500 transition-colors duration-300 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Distribusi Status
            </h3>
            <span className="text-[10px] font-medium text-slate-400">
              Total: {totalTasks}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 min-h-[176px] my-auto">
            {/* Donut chart distribusi status */}
            <div className="w-36 h-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieDataStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={54}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {pieDataStatus.map((entry, index) => (
                      <Cell
                        key={`status-cell-${index}`}
                        fill={STATUS_COLORS[entry.name] || '#94A3B8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Rincian jumlah dan persentase tiap status */}
            <div className="flex-1 w-full space-y-2.5">
              {ORDERED_STATUS_LIST.map((statusName) => {
                const found = pieDataStatus.find((item) => item.name === statusName);
                const count = found ? found.value || 0 : 0;
                const percentage =
                  totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
                const color = STATUS_COLORS[statusName] || '#94A3B8';

                return (
                  <div
                    key={statusName}
                    className="flex items-center justify-between text-xs border-b border-slate-100 pb-1.5 last:border-b-0 last:pb-0 gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span
                        className="font-semibold text-slate-600 truncate"
                        title={statusName}
                      >
                        {statusName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-bold text-slate-800 shrink-0">
                      <span>{count}</span>
                      <span className="text-[11px] font-normal text-slate-400">
                        ({percentage}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. Kartu Kategori Target */}
        <div className="bg-white p-4 rounded-xl border border-white border-b-7 hover:border-b-red-500 transition-colors duration-300 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Kategori Target
            </h3>
            <span className="text-[10px] font-medium text-slate-400">
              {pieDataKategori.length} Kategori
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 min-h-[176px] my-auto">
            {/* Donut chart kategori target */}
            <div className="w-36 h-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieDataKategori}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={54}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {pieDataKategori.map((_, idx) => (
                      <Cell
                        key={`kategori-cell-${idx}`}
                        fill={KATEGORI_COLORS[idx % KATEGORI_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Rincian jumlah dan persentase tiap kategori */}
            <div className="flex-1 w-full space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {pieDataKategori.length === 0 ? (
                <p className="text-[11px] text-slate-400">Belum ada data kategori.</p>
              ) : (
                pieDataKategori.map((item, idx) => {
                  const color = KATEGORI_COLORS[idx % KATEGORI_COLORS.length];
                  const count = item.value || 0;
                  const percentage =
                    totalKategori > 0 ? Math.round((count / totalKategori) * 100) : 0;

                  return (
                    <div
                      key={item.name || idx}
                      className="flex items-center justify-between text-[11px] border-b border-slate-100 pb-1 last:border-b-0 last:pb-0 gap-2"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span
                          className="font-medium text-slate-600 truncate"
                          title={item.name}
                        >
                          {item.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 font-bold text-slate-800 shrink-0">
                        <span>{count}</span>
                        <span className="text-[10px] font-normal text-slate-400">
                          ({percentage}%)
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 3. Kartu Tren Deadline */}
        <div className="bg-white p-4 rounded-xl border border-white border-b-7 hover:border-b-red-500 transition-colors duration-300 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Tren Deadline
            </h3>
            <span className="text-[10px] font-medium text-slate-400">Per Tanggal</span>
          </div>

          {/* Area chart jumlah tenggat waktu per tanggal */}
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendDeadlineData}
                margin={{ top: 8, right: 10, left: -24, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="deadlineFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ED1E28" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#ED1E28" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="tanggal"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area
                  type="monotone"
                  dataKey="jumlah"
                  name="Target"
                  stroke="#ED1E28"
                  strokeWidth={2}
                  fill="url(#deadlineFill)"
                  dot={{ r: 3, fill: '#ED1E28', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Baris Bawah: Grafik Status Pengerjaan per PIC */}
      {stackedDataPicStatus.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-white border-b-7 hover:border-b-red-500 transition-colors duration-300 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Status Pengerjaan per PIC
            </h3>

            {/* Legenda warna status per PIC */}
            <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#94a3b8]" /> Belum Dikerjakan
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> On Progress
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#ED1E28]" /> Overdue
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#10b981]" /> Sudah Selesai
              </span>
            </div>
          </div>

          {/* Bar chart perbandingan status tiap PIC */}
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stackedDataPicStatus}
                barGap={6}
                barCategoryGap="24%"
                margin={{ top: 6, right: 8, left: -24, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#475569' }}
                  tickFormatter={(val: string) => val.split(' ')[0]}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={TOOLTIP_STYLE} />
                <Bar
                  dataKey="BELUM DIKERJAKAN"
                  name="Belum Dikerjakan"
                  fill="#94a3b8"
                  barSize={30}
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="ON PROGRESS"
                  name="On Progress"
                  fill="#f59e0b"
                  barSize={30}
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="OVERDUE"
                  name="Overdue"
                  fill="#ED1E28"
                  barSize={30}
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="SUDAH SELESAI"
                  name="Sudah Selesai"
                  fill="#10b981"
                  barSize={30}
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}