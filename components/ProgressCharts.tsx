import React from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, BarChart, Bar 
} from 'recharts';

const COLORS = ['#94a3b8', '#ED1E28', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

interface ProgressChartsProps {
  pieDataStatus: any[];
  pieDataKategori: any[];
  barDataPic?: any[];
  stackedDataPicStatus?: any[];
  tasks?: any[];
}

export default function ProgressCharts({ 
  pieDataStatus, 
  pieDataKategori, 
  barDataPic, 
  stackedDataPicStatus = [],
  tasks = [] 
}: ProgressChartsProps) {
  
  // Mengolah data tasks untuk grafik garis berdasarkan tanggal tenggat (tenggatWaktu)
  const lineDataTenggat = React.useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    
    const dateCounts: { [date: string]: number } = {};
    tasks.forEach(task => {
      const date = task.tenggatWaktu || task.tenggat_waktu;
      if (date) {
        dateCounts[date] = (dateCounts[date] || 0) + 1;
      }
    });

    return Object.keys(dateCounts)
      .sort()
      .map(date => ({
        tanggal: date,
        jumlah: dateCounts[date],
      }));
  }, [tasks]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Grafik Donut: Distribusi Status Target */}
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
                  {pieDataStatus.map((entry, index) => {
                    let color = '#94a3b8';
                    if (entry.name === 'SUDAH SELESAI') color = '#10b981';
                    else if (entry.name === 'OVERDUE') color = '#ED1E28';
                    else if (entry.name === 'ON PROGRESS') color = '#f59e0b';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2 text-[11px] font-semibold text-slate-600">
            {pieDataStatus.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ 
                  backgroundColor: entry.name === 'SUDAH SELESAI' ? '#10b981' : entry.name === 'OVERDUE' ? '#ED1E28' : '#f59e0b' 
                }}></span>
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Grafik Donut: Kategori */}
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
                  {pieDataKategori.map((entry, index) => (
                    <Cell key={`cat-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-2 text-[11px] font-semibold text-slate-600">
            {pieDataKategori.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Grafik Garis (Line Chart): Tren Tenggat Waktu */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 text-center mb-4">
            Tren Tenggat Waktu (Deadline)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineDataTenggat} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

      {/* BAGIAN BAWAH: Bar Chart Panjang Penuh Melintang */}
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