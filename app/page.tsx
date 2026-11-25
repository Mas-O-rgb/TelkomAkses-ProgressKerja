// Menandai file ini sebagai Client Component di Next.js App Router
'use client';

// Mengimpor hook React untuk mengelola state dan efek samping
import React, { useEffect, useState } from 'react';
// Mengimpor hook navigasi halaman di Next.js App Router
import { useRouter } from 'next/navigation';
// Mengimpor komponen Image bawaan Next.js untuk optimasi gambar
import Image from 'next/image';
// Mengimpor ikon UI dari lucide-react
import {
  Clock,
  FolderKanban,
  ListCheck,
  Loader2,
  Shield,
  UserCheck,
  Users,
} from 'lucide-react';
// Mengimpor client Supabase untuk mengambil daftar profil pengguna
import { supabase } from '@/lib/supabaseClient';

// Mendefinisikan struktur kolom data dari tabel `profiles` di Supabase
interface Profile {
  // ID unik profil pengguna
  id: string;
  // Alamat email pengguna
  email: string;
  // Peran akses ('admin' atau 'pic')
  role: string;
  // Nama lengkap PIC atau admin
  nama_pic: string | null;
}

// Daftar poin keunggulan yang ditampilkan di sisi kiri halaman portal
const PORTAL_HIGHLIGHTS = [
  // Highlight pemantauan target dan progres
  {
    id: 'target',
    label: 'Pantau Target & Progres',
    icon: ListCheck,
  },
  // Highlight pemantauan status dan batas waktu
  {
    id: 'status',
    label: 'Status & Batas Waktu Terpantau',
    icon: Clock,
  },
  // Highlight pengelolaan dokumen dan riwayat terpusat
  {
    id: 'documents',
    label: 'Dokumen & Riwayat Terpusat',
    icon: FolderKanban,
  },
];

// Komponen latar belakang dekoratif khusus halaman login portal
function PortalBackground() {
  return (
    // Membungkus seluruh lapisan dekorasi agar fixed, tidak menghalangi klik, dan tersembunyi dari screen reader
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Gambar latar belakang utama portal */}
      <img src="/bg-portal.png" alt="" className="w-full h-full object-cover" />

      {/* Lapisan overlay terang agar teks dan kartu di atasnya mudah dibaca */}
      <div className="absolute inset-0 bg-slate-50/50" />

      {/* Aksen cahaya lembut di pojok kanan atas */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-rose-100/70 blur-3xl" />

      {/* Aksen cahaya lembut di pojok kiri bawah */}
      <div className="absolute -bottom-28 -left-24 w-96 h-96 rounded-full bg-sky-300/70 blur-3xl" />

      {/* Pola titik berulang tipis di seluruh area latar belakang */}
      <div
        className="absolute inset-0 opacity-45"
        style={{
          backgroundImage: 'radial-gradient(rgba(100, 116, 139, 0.35) 1.25px, transparent 1.25px)',
          backgroundSize: '20px 20px',
        }}
      />
    </div>
  );
}

/**
 * Halaman masuk (login) berbasis pemilihan akun dari tabel `profiles` di Supabase
 * untuk mengarahkan pengguna ke dashboard `/admin` atau `/pic`.
 */
export default function LoginPage() {
  // Instance router Next.js untuk berpindah halaman setelah memilih akun
  const router = useRouter();
  // Menyimpan daftar profil akun admin dan PIC dari Supabase
  const [profiles, setProfiles] = useState<Profile[]>([]);
  // Menandakan proses pengambilan data profil masih berlangsung
  const [loading, setLoading] = useState(true);

  // Mengambil daftar akun dari tabel `profiles` saat komponen pertama kali dimuat
  useEffect(() => {
    // Penanda agar state tidak di-update setelah komponen di-unmount
    let isMounted = true;

    // Fungsi async internal untuk mengambil seluruh data profil dari Supabase
    async function fetchProfiles() {
      setLoading(true);
      const { data, error } = await supabase.from('profiles').select('*');

      // Menghentikan pembaruan state jika komponen sudah tidak aktif
      if (!isMounted) return;

      if (error) {
        console.error('Gagal memuat profil:', error.message);
      } else if (data) {
        setProfiles(data);
      }

      setLoading(false);
    }

    fetchProfiles();

    // Membersihkan flag isMounted saat komponen dilepas
    return () => {
      isMounted = false;
    };
  }, []);

  // Menyimpan identitas sesi admin ke sessionStorage lalu mengarahkan ke rute `/admin`
  const handleLoginSpecificAdmin = (adminName: string) => {
    sessionStorage.setItem('userRole', 'admin');
    sessionStorage.setItem('userName', adminName);
    router.push('/admin');
  };

  // Menyimpan identitas sesi PIC ke sessionStorage lalu mengarahkan ke rute `/pic`
  const handleLoginPIC = (picName: string) => {
    sessionStorage.setItem('userRole', 'pic');
    sessionStorage.setItem('userName', picName);
    router.push('/pic');
  };

  // Menyaring akun admin yang memiliki nama_pic valid
  const adminProfiles = profiles.filter((profile) => profile.role === 'admin' && profile.nama_pic);
  // Menyaring akun PIC yang memiliki nama_pic valid
  const picProfiles = profiles.filter((profile) => profile.role === 'pic' && profile.nama_pic);

  // Menghitung jumlah kartu PIC penuh pada baris kelipatan 3
  const fullRowPicCount = Math.floor(picProfiles.length / 3) * 3;
  // Daftar kartu PIC untuk grid baris penuh (3 kolom di layar md+)
  const gridPicProfiles = picProfiles.slice(0, fullRowPicCount);
  // Sisa kartu PIC di baris terakhir agar membagi lebar secara merata
  const remainingPicProfiles = picProfiles.slice(fullRowPicCount);

  return (
    // Kontainer utama halaman dengan tinggi minimal satu layar penuh
    <div className="min-h-screen w-full text-slate-800 flex flex-col justify-between relative overflow-x-clip">
      {/* Lapisan background dekoratif halaman */}
      <PortalBackground />

      {/* Wrapper pemusat konten utama secara vertikal dan horizontal */}
      <div className="flex-1 w-full flex items-center justify-center px-5 sm:px-8 lg:px-12 py-8 relative z-10">
        {/* Tata letak utama 2 kolom (5 kolom info kiri, 7 kolom pilihan akun kanan) */}
        <main className="w-full max-w-6xl xl:max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Kolom kiri: logo, judul sambutan, deskripsi, dan highlight fitur */}
          <section className="lg:col-span-5 relative rounded-3xl flex flex-col items-center justify-center py-2 px-2 sm:px-4">
            <div className="relative z-10 space-y-6">
              {/* Logo instansi */}
              <div className="flex justify-center">
                <Image
                  src="/telkom_akses.png"
                  alt="Logo Telkom Akses"
                  width={180}
                  height={64}
                  className="h-12 sm:h-14 w-auto object-contain"
                  priority
                />
              </div>

              {/* Judul utama dan deskripsi singkat aplikasi */}
              <div className="space-y-2.5 max-w-md text-center">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-800 leading-[1.18]">
                  Selamat Datang di
                  <span className="block text-[#ED1E28] font-extrabold mt-0.5">
                    Monitoring Progress Kerja / Telkom Akses
                  </span>
                </h1>
                <p className="text-sm text-slate-800 leading-relaxed">
                  Pantau perkembangan pekerjaan, pencapaian target, aktivitas tim secara mudah dan terstruktur.
                </p>
              </div>

              {/* Daftar badge keunggulan portal */}
              <div className="flex flex-col items-center gap-2.5 pt-1">
                {PORTAL_HIGHLIGHTS.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <div
                      key={item.id}
                      className="inline-flex items-center gap-3 bg-white/95 backdrop-blur-xs px-3.5 py-2 rounded-full shadow-xs border border-slate-200/80"
                    >
                      <span className="w-7 h-7 rounded-full bg-rose-50 text-[#ED1E28] flex items-center justify-center shrink-0">
                        <IconComponent size={15} />
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-700 pr-1">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Kolom kanan: kartu pemilihan akun Admin dan PIC */}
          <section className="lg:col-span-7 bg-white/95 backdrop-blur-xs rounded-[28px] shadow-[0_18px_45px_rgba(15,23,42,0.07)] border border-slate-100 p-6 sm:p-8 lg:p-9">
            {/* Header kartu pemilihan akun */}
            <div className="text-center mb-7">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent to-rose-300" />
                <Users size={22} className="text-[#ED1E28]" />
                <span className="h-px w-16 sm:w-24 bg-gradient-to-l from-transparent to-rose-300" />
              </div>
              <h2 className="text-2xl sm:text-[26px] font-bold text-slate-800 tracking-tight">
                Pilih Akun Anda
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Silakan pilih akun sesuai dengan peran dan kebutuhan akses Anda untuk melanjutkan.
              </p>
            </div>

            {/* Menampilkan spinner saat data profil dimuat, atau daftar kartu akun setelah siap */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <Loader2 size={32} className="animate-spin text-[#ED1E28]" />
                <p className="text-xs sm:text-sm text-slate-500">Memuat daftar akun...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Kartu khusus akun Admin di bagian paling atas */}
                {adminProfiles.map((admin) => (
                  <button
                    key={admin.id}
                    type="button"
                    onClick={() => handleLoginSpecificAdmin(admin.nama_pic!)}
                    className="group w-full bg-rose-50/80 border-[1.5px] border-[#ED1E28] rounded-2xl px-5 py-4 flex items-center justify-between gap-4 text-left cursor-pointer shadow-2xs hover:-translate-y-1 hover:shadow-lg hover:bg-rose-50 transition-all duration-200 ease-out"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Avatar ikon admin */}
                      <div className="w-12 h-12 rounded-full bg-rose-100/90 text-[#ED1E28] flex items-center justify-center shrink-0 group-hover:bg-[#ED1E28] group-hover:text-white transition-colors">
                        <UserCheck size={22} />
                      </div>

                      {/* Pemisah vertikal antara avatar dan informasi akun */}
                      <span className="h-9 w-px bg-rose-200 shrink-0" />

                      {/* Nama lengkap admin dan label peran */}
                      <div className="min-w-0">
                        <div className="text-sm sm:text-base font-bold text-slate-800 truncate">
                          {admin.nama_pic}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">Admin Dashboard</div>
                      </div>
                    </div>

                    {/* Lencana ikon shield di sisi kanan kartu admin */}
                    <span className="w-6 h-6 rounded-full bg-[#ED1E28] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Shield size={14} strokeWidth={3} />
                    </span>
                  </button>
                ))}

                {/* Grid 3 kolom untuk baris kartu PIC yang penuh */}
                {gridPicProfiles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    {gridPicProfiles.map((profile) => (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => handleLoginPIC(profile.nama_pic!)}
                        className="group bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer shadow-2xs hover:-translate-y-1 hover:shadow-lg hover:border-[#ED1E28] hover:bg-rose-50/30 transition-all duration-200 ease-out"
                      >
                        <div className="w-11 h-11 rounded-full bg-slate-200/80 text-slate-600 group-hover:bg-[#ED1E28] group-hover:text-white flex items-center justify-center mb-2.5 transition-colors">
                          <UserCheck size={20} />
                        </div>
                        <span className="text-xs sm:text-[13px] font-bold text-slate-800 line-clamp-2 leading-snug">
                          {profile.nama_pic}
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5">PIC Dashboard</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Baris terakhir untuk sisa kartu PIC agar memenuhi lebar secara seimbang */}
                {remainingPicProfiles.length > 0 && (
                  <div className="flex flex-col sm:flex-row gap-3.5">
                    {remainingPicProfiles.map((profile) => (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => handleLoginPIC(profile.nama_pic!)}
                        className="group flex-1 bg-white border border-slate-200/90 rounded-2xl px-5 py-3.5 flex items-center justify-center gap-3.5 text-left cursor-pointer shadow-2xs hover:-translate-y-1 hover:shadow-lg hover:border-[#ED1E28] hover:bg-rose-50/30 transition-all duration-200 ease-out"
                      >
                        <div className="w-11 h-11 rounded-full bg-slate-200/80 text-slate-600 group-hover:bg-[#ED1E28] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                          <UserCheck size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                            {profile.nama_pic}
                          </div>
                          <div className="text-[11px] text-slate-500">PIC Dashboard</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Footer hak cipta di bagian bawah halaman */}
      <footer className="w-full max-w-6xl xl:max-w-7xl mx-auto px-6 pb-6 pt-2 relative z-10 flex items-center justify-between">
        <div className="flex-1 flex items-center justify-center gap-4">
          <span className="hidden sm:block h-px w-36 bg-gradient-to-r from-transparent to-slate-300" />
          <p className="text-xs text-slate-500 text-center">
            &copy; 2026 PT Telkom Akses. Sistem Monitoring Progress Kerja.
          </p>
          <span className="hidden sm:block h-px w-36 bg-gradient-to-l from-transparent to-slate-300" />
        </div>
      </footer>
    </div>
  );
}