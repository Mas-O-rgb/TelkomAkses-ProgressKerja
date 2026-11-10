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
  Legend, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { BarChart3, PieChart as PieIcon } from 'lucide-react';

interface ChartDataItem {
  name: string;
  value?: number;
  jumlah?: number;
}

interface ProgressChartsProps {
  pieDataStatus: ChartDataItem[];
  pieDataKategori: ChartDataItem[];
  barDataPic: ChartDataItem[];
}

// Konstanta Tema Warna Telkom Akses & Status
const STATUS_COLORS = ['#ED1E28', '#3B82F6', '#F59E0B', '#10B981', '#64748B'];
const KATEGORI_COLORS = ['#ED1E28', '#1E293B', '#3B82F6'];

// Komponen Helper Internal untuk Card Grafik (Menghindari Duplikasi Markup)
interface ChartCardProps {
  title: string;
  icon: React.ReactNode;
  hasData: boolean;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, icon, hasData, children }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center">
    <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
      {icon} {title}
    </h3>
    <div className="w-full h-52 flex items-center justify-center">
      {hasData ? children : <p className="text-xs text-slate-400 italic">Belum ada data grafik</p>}
    </div>
  </div>
);

export default function ProgressCharts({ pieDataStatus, pieDataKategori, barDataPic }: ProgressChartsProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Grafik 1: Status */}
      <ChartCard 
        title="Distribusi Status Pekerjaan" 
        icon={<PieIcon size={16} className="text-[#ED1E28]" />} 
        hasData={pieDataStatus.length > 0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieDataStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
              {pieDataStatus.map((_, index) => (
                <Cell key={`cell-status-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Grafik 2: Kategori */}
      <ChartCard 
        title="Distribusi Kategori (QMS/HSE/MARVEL)" 
        icon={<PieIcon size={16} className="text-[#ED1E28]" />} 
        hasData={pieDataKategori.length > 0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieDataKategori} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
              {pieDataKategori.map((_, index) => (
                <Cell key={`cell-cat-${index}`} fill={KATEGORI_COLORS[index % KATEGORI_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Grafik 3: PIC */}
      <ChartCard 
        title="Jumlah Target per PIC" 
        icon={<BarChart3 size={16} className="text-[#ED1E28]" />} 
        hasData={barDataPic.length > 0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barDataPic}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="jumlah" fill="#ED1E28" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  );
}