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
  Legend,
  CartesianGrid,
} from 'recharts';

interface ProgressChartsProps {
  pieDataStatus: any[];
  pieDataKategori: any[];
  barDataPic?: any[];
  stackedDataPicStatus?: any[];
}

const COLORS_STATUS: { [key: string]: string } = {
  'SUDAH SELESAI': '#10b981',
  'ON PROGRESS': '#f59e0b',
  'OVERDUE': '#ef4444',
  'BELUM DIKERJAKAN': '#94a3b8',
};

const COLORS_KATEGORI = ['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function ProgressCharts({
  pieDataStatus,
  pieDataKategori,
  barDataPic = [],
  stackedDataPicStatus = [],
}: ProgressChartsProps) {
  const showPicCharts = barDataPic.length > 0 || stackedDataPicStatus.length > 0;

  return (
    <div className="space-y-6">
      {/* BAGIAN ATAS: 3 Kolom (Status, Kategori, dan Total Target PIC) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Chart 1: Status Progress */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">
            Distribusi Status Target
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieDataStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieDataStatus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS_STATUS[entry.name] || '#64748b'}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Kategori Target */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">
            Distribusi Kategori
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieDataKategori}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieDataKategori.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS_KATEGORI[index % COLORS_KATEGORI.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Jumlah Target per PIC (Dipindah ke atas agar jadi item ke-3) */}
        {showPicCharts && (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">
              Jumlah Target per PIC
            </h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barDataPic} layout="vertical" margin={{ left: 5, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={90}
                    tick={{ fontSize: 9 }}
                  />
                  <Tooltip />
                  <Bar dataKey="jumlah" fill="#ED1E28" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* BAGIAN BAWAH: 1 Bar Chart Panjang Penuh Melintang */}
      {showPicCharts && stackedDataPicStatus.length > 0 && (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 w-full">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">
            Status Pengerjaan per PIC (Rincian)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedDataPicStatus} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={140}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="SUDAH SELESAI" stackId="a" fill="#10b981" barSize={22} />
                <Bar dataKey="ON PROGRESS" stackId="a" fill="#f59e0b" barSize={22} />
                <Bar dataKey="OVERDUE" stackId="a" fill="#ef4444" barSize={22} />
                <Bar dataKey="BELUM DIKERJAKAN" stackId="a" fill="#94a3b8" barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}