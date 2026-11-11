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
  'BELUM DIKERJAKAN': '#94a3b8', 
  'ON PROGRESS': '#f59e0b',      
  'SUDAH SELESAI': '#10b981',    
  'OVERDUE': '#ED1E28',          
};

const STATUS_COLORSS: { [key: string]: string } = {
  'A': '#94a3b8', 
  'B': '#f59e0b',      
  'C': '#10b981',    
  'D': '#ED1E28',          
};

// 2. Buat daftar array palet warna dinamis
const DYNAMIC_COLORS = [
  '#ED1E28', // Telkom Red
  '#3B82F6', // Blue
  '#1E293B', // Dark Slate
  '#10b981', // Emerald Green
  '#F59E0B', // Amber / Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
];

// 3. Pemetaan Warna PIC
const PIC_COLORS: { [key: string]: string } = {
  'ANOM YUDOSENO AJI': '#ED1E28',
  'ISHMI KHAFISHAH NASUTION': '#3B82F6',
  'GHALY QORI MUBAROQ': '#10b981',
  'ANDY AKBAR MAKMUR': '#F59E0B',
  'ARDIANSYAH': '#7400bd',
};
const DEFAULT_PIC_COLOR = '#8B5CF6';

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
    <div className="w-full h-56 flex items-center justify-center">
      {hasData ? children : <p className="text-xs text-slate-400 italic">Belum ada data</p>}
    </div>
  </div>
);

// Custom Label untuk menampilkan persentase di luar donut chart
const renderCustomizedLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 20; // Jarak label dari lingkaran pie
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent === 0) return null;

  return (
    <text 
      x={x} 
      y={y} 
      fill="#334155" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="text-[11px] font-bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function ProgressCharts({ pieDataStatus, pieDataKategori, barDataPic }: ProgressChartsProps) {
  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Grafik 1: Kategori (Donut Chart dengan Label Persentase) */}
        <ChartCard 
          title="Distribusi Kategori" 
          icon={<PieIcon size={16} className="text-[#ED1E28]" />} 
          hasData={pieDataKategori.length > 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <Pie 
                data={pieDataKategori} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                innerRadius={30} 
                outerRadius={55} 
                label={renderCustomizedLabel}
              >
                {pieDataKategori.map((entry, index) => (
                  <Cell 
                    key={`cell-cat-${index}`} 
                    fill={DYNAMIC_COLORS[index % DYNAMIC_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Grafik 2: Status Pekerjaan (Donut Chart) */}
        <ChartCard 
          title="Distribusi Status Pekerjaan" 
          icon={<PieIcon size={16} className="text-[#ED1E28]" />} 
          hasData={pieDataStatus.length > 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <Pie 
                data={pieDataStatus} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                innerRadius={30} 
                outerRadius={55} 
                label={renderCustomizedLabel}
              >
                {pieDataStatus.map((entry, index) => (
                  <Cell 
                    key={`cell-status-${index}`} 
                    fill={STATUS_COLORS[entry.name] || '#94a3b8'} 
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Grafik 3: Cadangan */}
        <ChartCard 
          title="-" 
          icon={<PieIcon size={16} className="text-[#ED1E28]" />} 
          hasData={pieDataStatus.length > 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <Pie 
                data={pieDataStatus} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                innerRadius={30} 
                outerRadius={55} 
                label={renderCustomizedLabel}
              >
                {pieDataStatus.map((entry, index) => (
                  <Cell 
                    key={`cell-status-${index}`} 
                    fill={STATUS_COLORSS[entry.name] || '#94a3b8'} 
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Grafik 4: PIC (Horizontal Bar Chart) */}
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