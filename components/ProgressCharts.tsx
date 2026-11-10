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

// 1. Pemetaan Warna Berdasarkan Nama Status
const STATUS_COLORS: { [key: string]: string } = {
  'BELUM DIKERJAKAN': '#94a3b8', // Slate (Abu-abu)
  'ON PROGRESS': '#f59e0b',      // Amber (Kuning/Oranye)
  'SUDAH SELESAI': '#10b981',    // Emerald (Hijau)
  'OVERDUE': '#ED1E28',          // Telkom Red (Merah)
};

// 2. Pemetaan Warna Berdasarkan Nama Kategori
const KATEGORI_COLORS: { [key: string]: string } = {
  'QMS': '#ED1E28',    // Telkom Red
  'HSE': '#3B82F6',    // Blue
  'MARVEL': '#1E293B', // Dark Slate
};

// 3. Pemetaan Warna Berdasarkan Nama PIC (Atau fallback warna default jika nama tidak ada)
const PIC_COLORS: { [key: string]: string } = {
  'ANOM YUDOSENO AJI': '#ED1E28',
  'ISHMI KHAFISHAH NASUTION': '#3B82F6',
  'GHALY QORI MUBAROQ': '#10b981',
  'ANDY AKBAR MAKMUR': '#F59E0B',
  'ARDIANSYAH': '#7400bd',
};
const DEFAULT_PIC_COLOR = '#8B5CF6';

// Komponen Helper Internal untuk Card Grafik
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
      {hasData ? children : <p className="text-xs text-slate-400 italic">Belum ada data</p>}
    </div>
  </div>
);

export default function ProgressCharts({ pieDataStatus, pieDataKategori, barDataPic }: ProgressChartsProps) {
  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Grafik 1: Kategori */}
        <ChartCard 
          title="Distribusi Kategori (QMS/HSE/MARVEL)" 
          icon={<PieIcon size={16} className="text-[#ED1E28]" />} 
          hasData={pieDataKategori.length > 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieDataKategori} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                {pieDataKategori.map((entry, index) => (
                  <Cell 
                    key={`cell-cat-${index}`} 
                    fill={KATEGORI_COLORS[entry.name] || '#3B82F6'} 
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Grafik 2: Status */}
        <ChartCard 
          title="Distribusi Status Pekerjaan" 
          icon={<PieIcon size={16} className="text-[#ED1E28]" />} 
          hasData={pieDataStatus.length > 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieDataStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                {pieDataStatus.map((entry, index) => (
                  <Cell 
                    key={`cell-status-${index}`} 
                    fill={STATUS_COLORS[entry.name] || '#94a3b8'} 
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Grafik 3: - */}
        <ChartCard 
          title="-" 
          icon={<PieIcon size={16} className="text-[#ED1E28]" />} 
          hasData={pieDataStatus.length > 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieDataStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                {pieDataStatus.map((entry, index) => (
                  <Cell 
                    key={`cell-status-${index}`} 
                    fill={STATUS_COLORS[entry.name] || '#94a3b8'} 
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Grafik 4: PIC */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-[#ED1E28]" /> Jumlah Target per PIC
        </h3>
        <div className="w-full h-64">
          {barDataPic.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={barDataPic} 
                layout="vertical"
                margin={{ top: 5, right: 40, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 11, fontWeight: 500 }} />
                <Tooltip />
                <Bar dataKey="jumlah" barSize={22} radius={[0, 4, 4, 0]}>
                  {barDataPic.map((entry, index) => (
                    <Cell 
                      key={`cell-pic-${index}`} 
                      fill={PIC_COLORS[entry.name] || DEFAULT_PIC_COLOR} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-xs text-slate-400 italic">Belum ada data</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}