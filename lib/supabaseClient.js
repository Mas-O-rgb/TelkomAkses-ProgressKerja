// Mengimpor fungsi factory createClient dari SDK resmi Supabase JS
import { createClient } from '@supabase/supabase-js';

// Mengambil URL proyek Supabase dari environment variable publik Next.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Mengambil Anon/Publishable API Key Supabase dari environment variable publik Next.js
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Membuat dan mengekspor instance client Supabase agar bisa dipakai di seluruh komponen/halaman
export const supabase = createClient(supabaseUrl, supabaseAnonKey);