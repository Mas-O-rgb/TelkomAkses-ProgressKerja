import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-slate-900 border-t border-slate-800 py-4 text-center text-slate-400 text-xs mt-auto">
      <div className="max-w-[96%] mx-auto px-4">
        &copy; {new Date().getFullYear()} PT Telkom Akses. Sistem Monitoring Progress Kerja.
      </div>
    </footer>
  );
}