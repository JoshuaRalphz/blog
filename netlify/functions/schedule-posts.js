import { createClient } from '@supabase/supabase-js';

exports.handler = async function(event, context) {
  try {
    // Skip authorization check in development
    if (process.env.NODE_ENV !== 'development') {
      if (event.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Unauthorized' })
        };
      }
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NODE_ENV === 'development' 
        ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
        : process.env.SUPABASE_SERVICE_KEY
    );

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('blog_posts')
      .update({ 
        status: 'published',
        published_at: now
      })
      .lte('publish_date', now)
      .eq('status', 'scheduled');

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        updatedPosts: data 
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message 
      })
    };
  }
}; 