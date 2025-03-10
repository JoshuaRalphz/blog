import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAuthData } from '@/utils/clerkAuth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function PUT(request, { params }) {
  try {
    // Await headers before using them
    const headersList = headers();
    const authorization = headersList.get('Authorization');

    const { id } = params;
    const { clerkUserId } = await getAuthData(request);
    const body = await request.json();

    // Update post
    const { data, error } = await supabase
      .from('blog_posts')
      .update({
        ...body,
        publish_date: body.publish_date
      })
      .eq('id', id)
      .eq('user_id', clerkUserId)
      .select();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error in PUT route:', error);
    return NextResponse.json({ 
      error: {
        message: error.message,
        code: 'SERVER_ERROR'
      } 
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    // Properly await the request
    const { id } = params;
    const { clerkUserId } = await getAuthData(request);

    // Delete post
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id)
      .eq('user_id', clerkUserId);

    if (error) throw error;
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ 
      error: {
        message: error.message,
        code: 'SERVER_ERROR'
      } 
    }, { status: 500 });
  }
} 