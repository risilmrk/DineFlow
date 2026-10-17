import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://jbazhuhwzbnjxnqfuffh.supabase.co';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYXpodWh3emJuanhucWZ1ZmZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNTE3NzAsImV4cCI6MjEwNzYyNzc3MH0.Pfghm8qsOCnQfQjy9RVm5YfnB_lx4NSRB4HQyEqc5Vg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-ref'));
};
