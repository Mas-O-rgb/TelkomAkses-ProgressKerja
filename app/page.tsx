// Menandai file ini sebagai Client Component di Next.js App Router
'use client';

// Mengimpor hook React untuk mengelola state dan efek samping
import React, { useEffect, useRef, useState } from 'react';
// Mengimpor hook navigasi halaman di Next.js App Router
import { useRouter } from 'next/navigation';
// Mengimpor komponen Image bawaan Next.js untuk optimasi gambar
import Image from 'next/image';
// Mengimpor ikon UI dari lucide-react
import {
  Clock,
  Eye,
  EyeOff,
  FolderKanban,
  ListCheck,
  Loader2,
  Lock,
  Shield,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
// Mengimpor client Supabase untuk autentikasi dan pengambilan daftar profil pengguna
import { supabase } from '@/lib/supabaseClient';

// Mendefinisikan struktur kolom data dari tabel `profiles` di Supabase
interface Profile {
  // ID unik profil pengguna
  id: string;
  // Alamat email pengguna (digunakan untuk `supabase.auth.signInWithPassword`)
  email: string;
  // Peran akses ('admin' atau 'pic')
  role: string;
  // Nama lengkap PIC atau admin
  nama_user: string | null;
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
 * dengan pop-up input password dan verifikasi Supabase Auth (`signInWithPassword`)
 * untuk mengarahkan pengguna ke dashboard `/admin` atau `/pic`.
 */
export default function LoginPage() {
  // Instance router Next.js untuk berpindah halaman setelah login berhasil
  const router = useRouter();
  // Menyimpan daftar profil akun admin dan PIC dari Supabase
  const [profiles, setProfiles] = useState<Profile[]>([]);
  // Menandakan proses pengambilan data profil masih berlangsung
  const [loading, setLoading] = useState(true);

  // Menyimpan profil akun yang sedang diklik untuk memunculkan pop-up password
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  // Menyimpan input password yang diketik pengguna pada pop-up
  const [password, setPassword] = useState('');
  // Mengatur apakah password ditampilkan sebagai teks biasa atau disamarkan
  const [showPassword, setShowPassword] = useState(false);
  // Menyimpan pesan kesalahan saat verifikasi password gagal
  const [errorMsg, setErrorMsg] = useState('');
  // Menandakan proses login ke Supabase Auth sedang berjalan
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ref untuk mengarahkan fokus otomatis ke input password saat pop-up terbuka
  const passwordInputRef = useRef<HTMLInputElement>(null);

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

  // Mengatur fokus otomatis dan pintasan tombol Escape saat pop-up password aktif
  useEffect(() => {
    if (!selectedProfile) return;

    // Fokuskan input password setelah modal muncul
    const timer = setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 30);

    // Tutup pop-up saat tombol Escape ditekan, selama tidak sedang proses submit
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        handleCloseModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  // Membuka pop-up password untuk akun yang diklik dan mereset state form sebelumnya
  const handleOpenPasswordModal = (profile: Profile) => {
    if (!profile.email) {
      setSelectedProfile(profile);
      setPassword('');
      setShowPassword(false);
      setErrorMsg('Email akun belum terdaftar pada profil ini.');
      return;
    }

    setSelectedProfile(profile);
    setPassword('');
    setShowPassword(false);
    setErrorMsg('');
    setIsSubmitting(false);
  };

  // Menutup pop-up password dan membersihkan input sensitif
  const handleCloseModal = () => {
    if (isSubmitting) return;
    setSelectedProfile(null);
    setPassword('');
    setShowPassword(false);
    setErrorMsg('');
  };

  // Memverifikasi password ke Supabase Auth lalu mengarahkan ke halaman sesuai role
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile || isSubmitting) return;

    if (!selectedProfile.email) {
      setErrorMsg('Email akun tidak ditemukan di data profil.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Autentikasi menggunakan email profil dan password yang diinput pengguna
      const { data, error } = await supabase.auth.signInWithPassword({
        email: selectedProfile.email,
        password,
      });

      if (error || !data.user) {
        setErrorMsg('Password salah. Silakan coba lagi.');
        passwordInputRef.current?.focus();
        return;
      }

      const displayName = selectedProfile.nama_user || data.user.email || 'Pengguna';
      const normalizedRole = selectedProfile.role === 'admin' ? 'admin' : 'pic';

      // Menyimpan identitas tampilan sesi ke sessionStorage bersama sesi aktif Supabase Auth
      sessionStorage.setItem('userRole', normalizedRole);
      sessionStorage.setItem('userName', displayName);

      // Reset state pop-up sebelum berpindah rute
      setSelectedProfile(null);
      setPassword('');
      setShowPassword(false);
      setErrorMsg('');

      // Mengarahkan ke dashboard sesuai peran akun
      if (normalizedRole === 'admin') {
        router.push('/admin');
      } else {
        router.push('/pic');
      }
      router.refresh();
    } catch {
      setErrorMsg('Terjadi kesalahan saat menghubungi layanan autentikasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Menyaring akun admin yang memiliki nama_user valid
  const adminProfiles = profiles.filter((profile) => profile.role === 'admin' && profile.nama_user);
  // Menyaring akun PIC yang memiliki nama_user valid
  const picProfiles = profiles.filter((profile) => profile.role === 'pic' && profile.nama_user);

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
                    onClick={() => handleOpenPasswordModal(admin)}
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
                          {admin.nama_user}
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
                        onClick={() => handleOpenPasswordModal(profile)}
                        className="group bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer shadow-2xs hover:-translate-y-1 hover:shadow-lg hover:border-[#ED1E28] hover:bg-rose-50/30 transition-all duration-200 ease-out"
                      >
                        <div className="w-11 h-11 rounded-full bg-slate-200/80 text-slate-600 group-hover:bg-[#ED1E28] group-hover:text-white flex items-center justify-center mb-2.5 transition-colors">
                          <UserCheck size={20} />
                        </div>
                        <span className="text-xs sm:text-[13px] font-bold text-slate-800 line-clamp-2 leading-snug">
                          {profile.nama_user}
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
                        onClick={() => handleOpenPasswordModal(profile)}
                        className="group flex-1 bg-white border border-slate-200/90 rounded-2xl px-5 py-3.5 flex items-center justify-center gap-3.5 text-left cursor-pointer shadow-2xs hover:-translate-y-1 hover:shadow-lg hover:border-[#ED1E28] hover:bg-rose-50/30 transition-all duration-200 ease-out"
                      >
                        <div className="w-11 h-11 rounded-full bg-slate-200/80 text-slate-600 group-hover:bg-[#ED1E28] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                          <UserCheck size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                            {profile.nama_user}
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

      {/* Pop-up modal input password saat salah satu card akun diklik */}
      {selectedProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4"
          onClick={handleCloseModal}
        >
          {/* Mencegah klik di dalam area modal menutup pop-up */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-account-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
          >
            {/* Header pop-up: menampilkan nama dan dashboard akun yang dipilih */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    selectedProfile.role === 'admin'
                      ? 'bg-rose-100 text-[#ED1E28]'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3
                    id="modal-account-title"
                    className="text-sm font-bold text-slate-800 truncate"
                  >
                    {selectedProfile.nama_user}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    {selectedProfile.role === 'admin' ? 'Admin Dashboard' : 'PIC Dashboard'}
                  </p>
                </div>
              </div>

              {/* Tombol tutup pop-up */}
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                aria-label="Tutup pop-up"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form input password dan tombol submit */}
            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="account-password-input"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    ref={passwordInputRef}
                    id="account-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password akun"
                    required
                    disabled={isSubmitting}
                    className="w-full pr-10 pl-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED1E28]/25 focus:border-[#ED1E28] disabled:bg-slate-50"
                  />

                  {/* Tombol tampilkan / sembunyikan password */}
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={isSubmitting}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Pesan error jika password salah atau autentikasi gagal */}
              {errorMsg && (
                <p className="text-xs font-medium text-[#ED1E28]">{errorMsg}</p>
              )}

              {/* Tombol Batal dan Masuk */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#ED1E28] text-xs font-semibold text-white hover:bg-[#d1151e] transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Memverifikasi...
                    </>
                  ) : (
                    'Masuk'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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