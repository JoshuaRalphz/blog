import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Helper function to build the query
const buildQuery = (userId, filters = {}) => {
  let query = supabase
    .from('blog_posts')
    .select('*');

  if (filters.id) {
    query = query.eq('id', filters.id);
  }

  // Apply status filter if provided
  if (filters.status) {
    query = query.eq('status', filters.status);
  } else {
    // Show only published posts for public access
    query = query.eq('status', 'published');
  }

  // Remove user filter for public access
  // if (userId) {
  //   query = query.eq('user_id', userId);
  // }

  // Apply date range filter if provided
  if (filters.startDate && filters.endDate) {
    query = query
      .gte('published_at', filters.startDate)
      .lte('published_at', filters.endDate);
  }

  // Apply ordering
  query = query.order('published_at', { ascending: filters.sort === 'asc' });

  return query;
};

export async function getBlogPosts(userId = null, filters = {}) {
  try {
    const query = buildQuery(userId, filters);
    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

export async function getBlogPostById(postId) {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    if (!data) {
      console.error('No data found for postId:', postId);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching blog post:', {
      message: error.message,
      stack: error.stack,
      details: error.details
    });
    return null;
  }
}

export async function getBlogPostsByTag(tag, userId = null) {
  try {
    const query = buildQuery(userId)
      .contains('tags', [tag]);

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching blog posts by tag:', error);
    return [];
  }
} 