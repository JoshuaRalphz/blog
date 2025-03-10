import { NextResponse } from 'next/server';
import { getAuthData } from '@/utils/clerkAuth';
import { getSupabaseClient } from '@/utils/supabase';

export async function POST(request) {
  try {
    const supabase = await getSupabaseClient();
    
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

    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ reactions: currentReactions })
      .eq('id', postId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      hasReacted: countChange === 1,
      count: currentReactions[reactionType] || 0
    });

  } catch (error) {
    console.error('Error in reactions API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 