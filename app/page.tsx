// Menandai file ini sebagai Client Component di Next.js App Router
'use client';

// Mengimpor hook React untuk state dan efek samping
import React, { useState, useEffect } from 'react';
// Mengimpor hook navigasi halaman dari Next.js App Router
import { useRouter } from 'next/navigation';
// Mengimpor komponen Image bawaan Next.js untuk optimasi gambar
import Image from 'next/image';
// Mengimpor ikon UI dari lucide-react
import {
  ShieldCheck,
  UserCheck,
  Loader2,
  Zap,
  TrendingUp,
  Users,
  Shield,
  ListCheck,
  Clock,
  FolderKanban,
} from 'lucide-react';
// Mengimpor instance client Supabase untuk mengambil daftar profil pengguna
import { supabase } from '@/lib/supabaseClient';

// Mendefinisikan struktur kolom data dari tabel profiles di Supabase
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

// Menyimpan tahun berjalan untuk teks hak cipta di footer
const CURRENT_YEAR = new Date().getFullYear();

// Daftar poin keunggulan yang ditampilkan di sisi kiri portal
const PORTAL_HIGHLIGHTS = [
  // Poin pertama tentang keamanan akses
  {
    id: 'target',
    label: 'Pantau Target & Progres',
    icon: ListCheck,
  },
  // Poin kedua tentang kecepatan akses
  {
    id: 'status',
    label: 'Status & Batas Waktu Terpantau',
    icon: Clock,
  },
  // Poin ketiga tentang dukungan produktivitas tim
  {
    id: 'documents',
    label: 'Dokumen & Riwayat Terpusat',
    icon: FolderKanban,
  },
];

// Komponen khusus untuk mengatur background halaman (silakan isi/ubah sesuai desain yang kamu inginkan)
function PortalBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <img src="/bg-portal.png" alt="" className="w-full h-full object-cover" />

      {/* Dasar latar belakang terang bersih */}
      <div className="absolute inset-0 bg-slate-50/50" />

      {/* Aksen cahaya lembut di pojok kanan atas */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-rose-100/70 blur-3xl" />

      {/* Aksen cahaya lembut di pojok kiri bawah */}
      <div className="absolute -bottom-28 -left-24 w-96 h-96 rounded-full bg-sky-3  00/70 blur-3xl" />

      {/* Pola totol berulang tipis di seluruh background */}
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
 * Halaman masuk (login) berbasis pemilihan peran/akun dari tabel `profiles` di Supabase
 * dengan tema terang, komponen background terpisah, dan tata letak terpusat.
 */
export default function LoginPage() {
  // Instance router untuk perpindahan halaman
  const router = useRouter();
  // State daftar profil akun dari Supabase
  const [profiles, setProfiles] = useState<Profile[]>([]);
  // State indikator loading saat memuat daftar akun
  const [loading, setLoading] = useState(true);

  // Mengambil daftar akun admin dan PIC saat halaman pertama kali dibuka
  useEffect(() => {
    // Penanda agar tidak memperbarui state setelah komponen unmount
    let isMounted = true;

    async function fetchProfiles() {
      // Mengaktifkan status loading
      setLoading(true);
      // Mengambil seluruh baris data dari tabel profiles
      const { data, error } = await supabase.from('profiles').select('*');

      // Menghentikan pembaruan state jika komponen sudah tidak aktif
      if (!isMounted) return;

      // Mencatat error jika gagal, atau menyimpan data profil jika berhasil
      if (error) {
        console.error('Gagal memuat profil:', error.message);
      } else if (data) {
        setProfiles(data);
      }

      // Mematikan status loading
      setLoading(false);
    }

    // Menjalankan pengambilan data profil
    fetchProfiles();

    // Membersihkan flag isMounted saat komponen dilepas
    return () => {
      isMounted = false;
    };
  }, []);

  // Menyimpan sesi admin ke sessionStorage lalu mengarahkan ke dashboard admin
  const handleLoginSpecificAdmin = (adminName: string) => {
    sessionStorage.setItem('userRole', 'admin');
    sessionStorage.setItem('userName', adminName);
    router.push('/admin/dashboard');
  };

  // Mengarahkan langsung ke halaman dinamis PIC sesuai nama yang dipilih
  const handleLoginPIC = (picName: string) => {
    router.push(`/pic/${encodeURIComponent(picName)}`);
  };

  // Menyaring profil dengan peran admin yang memiliki nama lengkap
  const adminProfiles = profiles.filter((profile) => profile.role === 'admin' && profile.nama_pic);
  // Menyaring profil dengan peran PIC yang memiliki nama lengkap
  const picProfiles = profiles.filter((profile) => profile.role === 'pic' && profile.nama_pic);

  // Memisahkan kartu PIC penuh (kelipatan 3) dan sisa baris bawah agar tampil melebar
  const fullRowPicCount = Math.floor(picProfiles.length / 3) * 3;
  const gridPicProfiles = picProfiles.slice(0, fullRowPicCount);
  const remainingPicProfiles = picProfiles.slice(fullRowPicCount);

  // Merender keseluruhan halaman portal pemilihan akun
  return (
    <div className="min-h-screen w-full text-slate-800 flex flex-col justify-between relative overflow-x-clip">
      {/* Memanggil komponen background terpisah */}
      <PortalBackground />

      {/* Wrapper pemusat vertikal & horizontal agar tetap seimbang di berbagai skala/zoom */}
      <div className="flex-1 w-full flex items-center justify-center px-5 sm:px-8 lg:px-12 py-8 relative z-10">
        {/* Konten utama split 2 kolom dengan batas lebar adaptif */}
        <main className="w-full max-w-6xl xl:max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Kolom kiri: brand, sambutan, dan badge keunggulan */}
          <section className="lg:col-span-5 relative rounded-3xl flex flex-col items-center justify-center py-2 px-2 sm:px-4">
            <div className="relative z-10 space-y-6">
              {/* Logo Telkom Akses */}
              <div className='flex justify-center'>
                <Image
                  src="/telkom_akses.png"
                  alt="Logo Telkom Akses"
                  width={180}
                  height={64}
                  className="h-12 sm:h-14 w-auto object-contain"
                  priority
                />
              </div>

              {/* Judul sambutan dan deskripsi singkat */}
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

              {/* Daftar pill badge keunggulan portal */}
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

          {/* Kolom kanan: kartu putih utama "Pilih Akun Anda" */}
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

            {/* Indikator loading atau daftar kartu akun Admin & PIC */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <Loader2 size={32} className="animate-spin text-[#ED1E28]" />
                <p className="text-xs sm:text-sm text-slate-500">Memuat daftar akun...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Kartu akses Admin utama berbingkai merah menonjol di bagian atas */}
                {adminProfiles.map((admin) => (
                  <button
                    key={admin.id}
                    type="button"
                    onClick={() => handleLoginSpecificAdmin(admin.nama_pic!)}
                    className="group w-full bg-rose-50/80 border-[1.5px] border-[#ED1E28] rounded-2xl px-5 py-4 flex items-center justify-between gap-4 text-left cursor-pointer shadow-2xs hover:-translate-y-1 hover:shadow-lg hover:bg-rose-50 transition-all duration-200 ease-out"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Ikon avatar admin */}
                      <div className="w-12 h-12 rounded-full bg-rose-100/90 text-[#ED1E28] flex items-center justify-center shrink-0 group-hover:bg-[#ED1E28] group-hover:text-white transition-colors">
                        <UserCheck size={22} />
                      </div>

                      {/* Garis pemisah vertikal tipis */}
                      <span className="h-9 w-px bg-rose-200 shrink-0" />

                      {/* Nama admin dan label Admin Dashboard */}
                      <div className="min-w-0">
                        <div className="text-sm sm:text-base font-bold text-slate-800 truncate">
                          {admin.nama_pic}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">Admin Dashboard</div>
                      </div>
                    </div>

                    {/* Badge ikon shield merah di sisi kanan kartu admin */}
                    <span className="w-6 h-6 rounded-full bg-[#ED1E28] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Shield size={14} strokeWidth={3} />
                    </span>
                  </button>
                ))}

                {/* Grid 3 kolom untuk baris penuh (kelipatan 3) */}
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

{/* Sisa kartu di baris terakhir membagi lebar rata dalam satu baris */}
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