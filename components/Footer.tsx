import React from 'react';

/**
 * Footer global aplikasi dengan tahun berjalan otomatis.
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-slate-900 border-t border-slate-800 py-4 text-center text-slate-400 text-xs mt-auto">
      <div className="max-w-[96%] mx-auto px-4">
        &copy; {currentYear} PT Telkom Akses. Sistem Monitoring Progress Kerja.
      </div>
    </footer>
  );
}
