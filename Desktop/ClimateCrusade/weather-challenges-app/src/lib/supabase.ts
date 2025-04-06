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

// Function to invoke the get-weather Edge Function
export async function getWeatherForCoords(latitude: number, longitude: number) {
  if (!latitude || !longitude) {
    console.error('getWeatherForCoords called with invalid coordinates:', { latitude, longitude });
    throw new Error('Invalid coordinates provided.');
  }

  console.log(`Invoking Supabase function 'get-weather' for lat: ${latitude}, lon: ${longitude}`);

  const { data, error } = await supabase.functions.invoke('get-weather', {
    body: { latitude, longitude }, // Pass coordinates in the body
  });

  if (error) {
    console.error('Error invoking Supabase function \'get-weather\':', error);

    // Attempt to parse Supabase function error body if available
    // Supabase functions error context might be complex, safely extract message
    let detailedErrorMessage = error.message;
    if (error.context && typeof error.context === 'object' && 'message' in error.context) {
       // Sometimes the detailed error is nested within the context
       detailedErrorMessage = error.context.message || error.message;
    } else if (typeof error.context === 'string') {
        detailedErrorMessage = error.context;
    } else {
      // Fallback for other structures or if context is not helpful
      try {
        // Try to stringify context if it exists
        const contextStr = error.context ? JSON.stringify(error.context) : '';
        detailedErrorMessage = `${error.message}${contextStr ? ` (${contextStr})` : ''}`;
      } catch (stringifyError) {
        detailedErrorMessage = error.message; // Default if stringify fails
      }
    }

    // Re-throw a more informative error
    throw new Error(`Failed to get weather: ${detailedErrorMessage}`);
  }

  console.log('Successfully received weather data from Supabase function:', data);
  return data; // Return the weather data received from the function
} 