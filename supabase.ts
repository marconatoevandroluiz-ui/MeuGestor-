import { createClient } from '@supabase/supabase-js';

// No ambiente local, estas variáveis vêm do arquivo .env
// No Vercel, devem ser configuradas em Project Settings > Environment Variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://ylwxarufuopefmqfvvis.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_3m6vMlZSDMvaW210omrKWg_6uRC-hbi';

if (!supabaseUrl || !supabaseKey) {
  console.warn("Aviso: Chaves do Supabase não encontradas. Verifique as variáveis de ambiente.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);