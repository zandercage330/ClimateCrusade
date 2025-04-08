import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; // Adjust path if needed

// Define the type for a challenge based on your DB schema
type Challenge = {
  id: string;          // Assuming UUID or similar primary key
  created_at: string;  // Assuming timestamp with time zone
  title: string;
  description: string;
  points_reward: number; // Corrected field name
  criteria?: any;         // Added optional fields from schema
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  // Add any other relevant fields from your 'challenges' table
};

export function useChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchChallenges() {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('challenges')
          .select('*'); // Select all columns, adjust if needed

        if (error) {
          throw error;
        }

        if (data) {
          setChallenges(data);
        }
      } catch (err) {
        console.error("Error fetching challenges:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchChallenges();

    // Optional: Set up a Supabase real-time subscription if needed
    // const channel = supabase
    //   .channel('challenges-changes')
    //   .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, payload => {
    //     console.log('Change received!', payload)
    //     fetchChallenges(); // Refetch on change
    //   })
    //   .subscribe()

    // return () => {
    //   supabase.removeChannel(channel);
    // };

  }, []);

  return { challenges, loading, error };
} 