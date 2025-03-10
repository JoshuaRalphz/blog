import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request) {
  try {
    const event = await request.json();
    const { id, email_addresses, first_name, last_name } = event.data;

    // Insert or update user in Supabase
    const { error } = await supabase
      .from('users')
      .upsert({
        id,
        email: email_addresses[0].email_address,
        first_name,
        last_name,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 