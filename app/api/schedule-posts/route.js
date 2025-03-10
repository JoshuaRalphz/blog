import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  try {
    // Health check
    if (request.headers.get('x-health-check')) {
      return NextResponse.json({ status: 'healthy' });
    }

    const ip = request.headers.get('x-forwarded-for') || request.ip;
    console.log(`Cron job request from IP: ${ip}`);

    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      console.log('Unauthorized cron job attempt from IP:', ip);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date().toISOString();
    console.log(`Running scheduled posts check at ${now}`);

    const { data, error } = await supabase
      .from('blog_posts')
      .update({ 
        status: 'published',
        published_at: now
      })
      .lte('publish_date', now)
      .eq('status', 'scheduled')
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log(`Updated ${data?.length || 0} posts`);
    if (data?.length > 0) {
      console.log('Updated post IDs:', data.map(post => post.id));
    }

    return NextResponse.json({ 
      success: true,
      updatedPosts: data 
    });
  } catch (error) {
    console.error('Error in schedule-posts:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 