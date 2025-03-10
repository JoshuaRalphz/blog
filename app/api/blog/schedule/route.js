import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    // Properly await headers
    const headers = await request.headers;
    const authHeader = headers.get('authorization');
    
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Get current time
    const now = new Date().toISOString();

    // Publish scheduled posts
    const { data, error } = await supabase
      .from('blog_posts')
      .update({ 
        status: 'published',
        published_at: now
      })
      .lte('publish_date', now)
      .eq('status', 'scheduled');

    if (error) throw error;
    return new Response(JSON.stringify({ 
      success: true,
      updatedPosts: data 
    }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { status: 500 });
  }
} 