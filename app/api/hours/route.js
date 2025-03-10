import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthData } from '@/utils/clerkAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export async function GET(request) {
  try {
    // Remove the authentication check
    const [hoursData, blogData] = await Promise.all([
      supabase
        .from('hours')
        .select('*')
        .order('date', { ascending: false }),
      supabase
        .from('blog_posts')
        .select('publish_date, hours')
    ])

    if (hoursData.error || blogData.error) {
      throw hoursData.error || blogData.error
    }

    // Combine data
    const combinedData = [
      ...hoursData.data,
      ...blogData.data.map(post => ({
        date: post.publish_date,
        hours: post.hours || 0
      }))
    ]

    return NextResponse.json({ data: combinedData }, { status: 200 })
  } catch (error) {
    console.error('Error fetching hours:', error)
    return NextResponse.json({ 
      error: {
        message: error.message,
        code: 'SERVER_ERROR'
      } 
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { hours, description } = await request.json()

    const { data, error } = await supabase
      .from('hours')
      .insert([{ 
        user_id: userId,
        hours: parseFloat(hours),
        description 
      }])

    if (error) {
      return NextResponse.json({ 
        error: {
          message: error.message,
          code: error.code
        }
      }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.json({ 
      error: {
        message: 'Authentication failed',
        code: 'AUTH_ERROR'
      }
    }, { status: 500 })
  }
} 