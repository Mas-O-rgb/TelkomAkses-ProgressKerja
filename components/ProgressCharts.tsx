'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

interface ChartDataItem {
  name: string;
  value: number;
  jumlah?: number;
}

interface StackedPicStatusItem {
  name: string;
  'BELUM DIKERJAKAN': number;
  'ON PROGRESS': number;
  'OVERDUE': number;
  'SUDAH SELESAI': number;
}

interface TaskItem {
  tenggatWaktu?: string;
}

interface ProgressChartsProps {
  pieDataStatus: ChartDataItem[];
  pieDataKategori: ChartDataItem[];
  barDataPic: ChartDataItem[];
  stackedDataPicStatus: StackedPicStatusItem[];
  tasks: TaskItem[];
}

const STATUS_COLORS: Record<string, string> = {
  'SUDAH SELESAI': '#10b981',
  'OVERDUE': '#ED1E28',
  'ON PROGRESS': '#f59e0b',
  'BELUM DIKERJAKAN': '#94a3b8',
};

const KATEGORI_COLORS = ['#64748b', '#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4'];

export default function ProgressCharts({
  pieDataStatus,
  pieDataKategori,
  stackedDataPicStatus,
  tasks,
}: ProgressChartsProps) {
  // Agregasi jumlah target berdasarkan tanggal deadline
  const deadlineCounts = tasks.reduce<Record<string, number>>((acc, task) => {
    if (task.tenggatWaktu) {
      acc[task.tenggatWaktu] = (acc[task.tenggatWaktu] || 0) + 1;
    }
    return acc;
  }, {});

  const trendDeadlineData = Object.keys(deadlineCounts)
    .sort()
    .map((date) => ({
      tanggal: date.slice(5), // Tampilkan MM-DD agar ringkas
      jumlah: deadlineCounts[date],
    }));

  const totalTasks = tasks.length;

  return (
    <div className="space-y-6">
      {/* Baris Atas: 3 Grafik Ringkas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Distribusi Status */}
        <div className="bg-white p-4 rounded-xl border border-white border-b-7 hover:border-b-red-500 transition-colors duration-300 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Distribusi Status
            </h3>
            <span className="text-[10px] font-medium text-slate-400">Total: {totalTasks}</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieDataStatus}
                  cx="50%"
                  cy="45%"
                  innerRadius={40}
                  outerRadius={56}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {pieDataStatus.map((entry, idx) => (
                    <Cell key={idx} fill={STATUS_COLORS[entry.name] || '#cbd5e1'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={6}
                  wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Kategori */}
        <div className="bg-white p-4 rounded-xl border border-white border-b-7 hover:border-b-red-500 transition-colors duration-300 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Kategori Target
            </h3>
            <span className="text-[10px] font-medium text-slate-400">
              {pieDataKategori.length} Kategori
            </span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieDataKategori}
                  cx="50%"
                  cy="45%"
                  innerRadius={40}
                  outerRadius={56}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {pieDataKategori.map((_, idx) => (
                    <Cell key={idx} fill={KATEGORI_COLORS[idx % KATEGORI_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={6}
                  wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Tren Deadline */}
        <div className="bg-white p-4 rounded-xl border border-white border-b-7 hover:border-b-red-500 transition-colors duration-300 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Tren Deadline
            </h3>
            <span className="text-[10px] font-medium text-slate-400">Per Tanggal</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendDeadlineData} margin={{ top: 8, right: 10, left: -24, bottom: 0 }}>
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
                <Tooltip
                  contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
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

      {/* Baris Bawah: Status Pengerjaan per PIC */}
      {stackedDataPicStatus.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-white border-b-7 hover:border-b-red-500 transition-colors duration-300 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Status Pengerjaan per PIC
            </h3>
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

          <div className="h-52 w-full ">
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
                  tickFormatter={(val: string) => val.split(' ')[0]} // Tampilkan nama depan di sumbu X agar rapi
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="BELUM DIKERJAKAN" name="Belum Dikerjakan" fill="#94a3b8" barSize={30} radius={[3, 3, 0, 0]} />
                <Bar dataKey="ON PROGRESS" name="On Progress" fill="#f59e0b" barSize={30} radius={[3, 3, 0, 0]} />
                <Bar dataKey="OVERDUE" name="Overdue" fill="#ED1E28" barSize={30} radius={[3, 3, 0, 0]} />
                <Bar dataKey="SUDAH SELESAI" name="Sudah Selesai" fill="#10b981" barSize={30} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}