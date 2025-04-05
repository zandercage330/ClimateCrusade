import 'react-native-url-polyfill/auto'; // Required for Supabase on React Native
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

// Type guard to ensure env variables are strings
function ensureString(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

const supabaseUrl = ensureString(SUPABASE_URL, 'SUPABASE_URL');
const supabaseAnonKey = ensureString(SUPABASE_ANON_KEY, 'SUPABASE_ANON_KEY');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // Use AsyncStorage for session persistence
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important for React Native
  },
}); 