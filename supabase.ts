
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ylwxarufuopefmqfvvis.supabase.co';
const supabaseKey = 'sb_publishable_3m6vMlZSDMvaW210omrKWg_6uRC-hbi';

export const supabase = createClient(supabaseUrl, supabaseKey);
