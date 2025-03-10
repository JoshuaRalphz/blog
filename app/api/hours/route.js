import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthData } from '@/utils/clerkAuth'

// Check for required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
  try {
    // Fetch only published posts from blog_posts
    const { data, error } = await supabase
      .from('blog_posts')
      .select('publish_date, hours')
      .eq('status', 'published')
      .order('publish_date', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Transform data to match expected format
    const transformedData = (data || []).map(post => ({
      date: post.publish_date,
      hours: post.hours || 0
    }));

    return NextResponse.json({ data: transformedData }, { status: 200 });
  } catch (error) {
    console.error('Error in GET route:', error);
    return NextResponse.json(
      { 
        error: {
          message: error.message || 'Failed to fetch hours data',
          code: 'SERVER_ERROR'
        } 
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Insert into blog_posts
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([{
        ...body,
        status: 'published',
        published_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST route:', error);
    return NextResponse.json(
      { 
        error: {
          message: error.message || 'Failed to create hours entry',
          code: 'SERVER_ERROR'
        } 
      }, 
      { status: 500 }
    );
  }
} 