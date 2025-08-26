// Placeholder for Supabase client. Configure when '@supabase/supabase-js' is available.
let client = null;

export const getSupabase = () => {
  if (!client) {
    throw new Error('Supabase client not configured');
  }
  return client;
};

export default client;

