'use client';

import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar,
} from 'recharts';

interface ChartItem {
  name: string;
  value: number;
  jumlah?: number;
}

interface StackedPicStatusItem {
  name: string;
  'BELUM DIKERJAKAN': number;
  'ON PROGRESS': number;
  OVERDUE: number;
  'SUDAH SELESAI': number;
}

interface TaskLike {
  tenggatWaktu?: string;
  tenggat_waktu?: string;
}

interface ProgressChartsProps {
  pieDataStatus: ChartItem[];
  pieDataKategori: ChartItem[];
  barDataPic?: ChartItem[];
  stackedDataPicStatus?: StackedPicStatusItem[];
  tasks?: TaskLike[];
}

// Palet warna kategori target dan pemetaan warna per status pengerjaan
const CATEGORY_COLORS = ['#94a3b8', '#ED1E28', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

const STATUS_COLORS: Record<string, string> = {
  'SUDAH SELESAI': '#10b981',
  OVERDUE: '#ED1E28',
  'ON PROGRESS': '#f59e0b',
  'BELUM DIKERJAKAN': '#94a3b8',
};

const getStatusColor = (statusName: string): string => STATUS_COLORS[statusName] ?? '#94a3b8';

/**
 * Komponen visualisasi grafik ringkasan target:
 * - Donut chart distribusi status target
 * - Donut chart kategori target
 * - Line chart tren jumlah target berdasarkan tanggal deadline
 * - Horizontal stacked bar chart rincian status per PIC
 */
export default function ProgressCharts({
  pieDataStatus,
  pieDataKategori,
  stackedDataPicStatus = [],
  tasks = [],
}: ProgressChartsProps) {
  // Kelompokkan dan urutkan jumlah target per tanggal deadline untuk line chart
  const deadlineTrendData = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];

    const countByDeadline: Record<string, number> = {};
    tasks.forEach((task) => {
      // Mendukung kedua format nama properti (camelCase maupun snake_case)
      const deadlineDate = task.tenggatWaktu || task.tenggat_waktu;
      if (deadlineDate) {
        countByDeadline[deadlineDate] = (countByDeadline[deadlineDate] || 0) + 1;
      }
    });

    return Object.keys(countByDeadline)
      .sort()
      .map((date) => ({
        tanggal: date,
        jumlah: countByDeadline[date],
      }));
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Baris atas: 3 grafik ringkasan utama */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik 1: Distribusi Status Target */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 text-center mb-4">
            Distribusi Status Target
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieDataStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ percent }: { percent?: number }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {pieDataStatus.map((entry, index) => (
                    <Cell key={`status-cell-${index}`} fill={getStatusColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legenda manual untuk grafik status */}
          <div className="flex flex-wrap justify-center gap-3 mt-2 text-[11px] font-semibold text-slate-600">
            {pieDataStatus.map((entry, index) => (
              <div key={`status-legend-${index}`} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: getStatusColor(entry.name) }}
                />
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grafik 2: Distribusi Kategori */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 text-center mb-4">
            Kategori
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieDataKategori}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieDataKategori.map((_, index) => (
                    <Cell
                      key={`category-cell-${index}`}
                      fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legenda manual untuk grafik kategori */}
          <div className="flex flex-wrap justify-center gap-2 mt-2 text-[11px] font-semibold text-slate-600">
            {pieDataKategori.map((entry, index) => (
              <div key={`category-legend-${index}`} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                />
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grafik 3: Tren Tenggat Waktu (Deadline) */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 text-center mb-4">
            Tren Tenggat Waktu (Deadline)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={deadlineTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="tanggal" tick={{ fontSize: 10 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 10 }} stroke="#64748b" allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="jumlah"
                  name="Jumlah Target"
                  stroke="#ED1E28"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#ED1E28' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Baris bawah: rincian status pengerjaan per PIC */}
      {stackedDataPicStatus.length > 0 && (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4 text-center">
            Status Pengerjaan per PIC (Rincian)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedDataPicStatus} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="SUDAH SELESAI" stackId="a" fill="#10b981" barSize={22} />
                <Bar dataKey="ON PROGRESS" stackId="a" fill="#f59e0b" barSize={22} />
                <Bar dataKey="OVERDUE" stackId="a" fill="#ED1E28" barSize={22} />
                <Bar dataKey="BELUM DIKERJAKAN" stackId="a" fill="#94a3b8" barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
