
import { createClient } from '@supabase/supabase-js';

// No Vercel, você deve configurar estas chaves em: 
// Project Settings > Environment Variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://ylwxarufuopefmqfvvis.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_3m6vMlZSDMvaW210omrKWg_6uRC-hbi';

export const supabase = createClient(supabaseUrl, supabaseKey);
