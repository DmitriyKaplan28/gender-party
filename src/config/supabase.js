import { createClient } from '@supabase/supabase-js';

// КЛЮЧИ ЗАМЕНИШЬ ПОТОМ (после настройки Supabase)
const supabaseUrl = 'https://hjcemkxewjbzfcmluqoq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqY2Vta3hld2piemZjbWx1cW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MDE0OTcsImV4cCI6MjA5NDk3NzQ5N30.3mSIaGC-RwUwqNargzJoO1d8gRPLHz9_lOTuDlPnD6Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);