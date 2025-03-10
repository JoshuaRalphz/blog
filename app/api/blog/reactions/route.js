import { NextResponse } from 'next/server';
import { getAuthData } from '@/utils/clerkAuth';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    // Initialize Supabase client directly instead of using getSupabaseClient
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Get authenticated user
    const { clerkUserId } = await getAuthData(request);
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { postId, reactionType } = await request.json();
    if (!postId || !reactionType) {
      return NextResponse.json(
        { error: 'postId and reactionType are required' },
        { status: 400 }
      );
    }

    // Check if user has already reacted
    const { data: existingReaction, error: checkError } = await supabase
      .from('blog_reactions')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', clerkUserId)
      .eq('reaction_type', reactionType)
      .single();

    let countChange = 0;
    
    if (existingReaction) {
      // Remove reaction
      const { error: deleteError } = await supabase
        .from('blog_reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (deleteError) throw deleteError;
      countChange = -1;
    } else {
      // Add reaction
      const { error: insertError } = await supabase
        .from('blog_reactions')
        .insert([{
          post_id: postId,
          user_id: clerkUserId,
          reaction_type: reactionType
        }]);

      if (insertError) throw insertError;
      countChange = 1;
    }

    // Update post reaction count
    const { data: post, error: getError } = await supabase
      .from('blog_posts')
      .select('reactions')
      .eq('id', postId)
      .single();

    if (getError) throw getError;

    const currentReactions = post.reactions || {};
    currentReactions[reactionType] = (currentReactions[reactionType] || 0) + countChange;

    // Update the post with new reaction counts
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ reactions: currentReactions })
      .eq('id', postId);

    if (updateError) throw updateError;

    return NextResponse.json({ 
      success: true,
      reactions: currentReactions
    }, { status: 200 });
  } catch (error) {
    console.error('Error in reactions route:', error);
    return NextResponse.json(
      { 
        error: {
          message: error.message || 'Failed to process reaction',
          code: 'SERVER_ERROR'
        } 
      },
      { status: 500 }
    );
  }
} 