import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Use the values directly from the .env file
const supabaseUrl = 'https://dihqqtlkdevykrpepdbx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpaHFxdGxrZGV2eWtycGVwZGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MjAxMjEsImV4cCI6MjA1OTM5NjEyMX0.D9yTm8mALtSfz5K4r2i5nPUGBk95cX_KDAJbuBQrkuQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}); 