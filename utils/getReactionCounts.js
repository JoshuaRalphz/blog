import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function getReactionCounts(postId) {
  try {
    // Use rpc to call a custom SQL function
    const { data, error } = await supabase
      .rpc('get_reaction_counts', { post_id: postId });

    if (error) throw error;

    // Convert the array to an object with reaction types as keys
    return data.reduce((acc, { reaction_type, count }) => {
      acc[reaction_type] = count;
      return acc;
    }, {});
  } catch (error) {
    console.error('Error fetching reaction counts:', error);
    return {};
  }
} 