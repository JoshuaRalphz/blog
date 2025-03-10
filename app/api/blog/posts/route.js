import { NextResponse } from 'next/server';
import { getBlogPosts } from '@/utils/getBlogPosts';

export async function GET(request) {
  try {
    // Remove the user ID requirement
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tag = searchParams.get('tag');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sort = searchParams.get('sort') || 'desc';

    // Build filters object without user ID
    const filters = {
      status: status || undefined,
      startDate,
      endDate,
      sort
    };

    // Fetch posts without user ID
    const posts = await getBlogPosts(null, filters);

    return NextResponse.json({ data: posts }, { status: 200 });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ 
      error: {
        message: error.message || 'Failed to fetch blog posts',
        code: 'SERVER_ERROR'
      } 
    }, { status: 500 });
  }
} 