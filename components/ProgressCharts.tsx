'use client';

import React from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  Tooltip, Legend, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { BarChart3, PieChart as PieIcon } from 'lucide-react';

interface ProgressChartsProps {
  pieDataStatus: any[];
  pieDataKategori: any[];
  barDataPic: any[];
}

const COLORS = ['#ED1E28', '#3B82F6', '#F59E0B', '#10B981', '#64748B'];

export default function ProgressCharts({ pieDataStatus, pieDataKategori, barDataPic }: ProgressChartsProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Grafik 1: Status */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center">
        <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
          <PieIcon size={16} className="text-[#ED1E28]" /> Distribusi Status Pekerjaan
        </h3>
        <div className="w-full h-52 flex items-center justify-center">
          {pieDataStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieDataStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                  {pieDataStatus.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-slate-400 italic">Belum ada data grafik</p>
          )}
        </div>
      </div>

      {/* Grafik 2: Kategori */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center">
        <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
          <PieIcon size={16} className="text-[#ED1E28]" /> Distribusi Kategori (QMS/HSE/MARVEL)
        </h3>
        <div className="w-full h-52 flex items-center justify-center">
          {pieDataKategori.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieDataKategori} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                  {pieDataKategori.map((_, index) => (
                    <Cell key={`cell-cat-${index}`} fill={['#ED1E28', '#1E293B', '#3B82F6'][index % 3]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-slate-400 italic">Belum ada data grafik</p>
          )}
        </div>
      </div>

      {/* Grafik 3: PIC */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center">
        <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
          <BarChart3 size={16} className="text-[#ED1E28]" /> Jumlah Target per PIC
        </h3>
        <div className="w-full h-52 flex items-center justify-center">
          {barDataPic.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barDataPic}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="jumlah" fill="#ED1E28" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-slate-400 italic">Belum ada data grafik</p>
          )}
        </div>
      </div>
    </section>
  );
}