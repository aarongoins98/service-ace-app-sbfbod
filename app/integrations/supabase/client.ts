import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://vvqlpbydvugqrbeftckc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2cWxwYnlkdnVncXJiZWZ0Y2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MTU1OTksImV4cCI6MjA3ODQ5MTU5OX0.qo3MERO4p1H7eLpkV5_OiWMBM1OdbFKpw-10wo8rIuU";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
