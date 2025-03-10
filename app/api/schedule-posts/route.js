import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  try {
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

    return NextResponse.json({ 
      success: true,
      updatedPosts: data 
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
} 