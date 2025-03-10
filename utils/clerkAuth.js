'use server'; // Mark this as server-only
import { auth } from '@clerk/nextjs/server';

export async function getAuthData() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    return { clerkUserId: userId };
  } catch (error) {
    console.error('Error in getAuthData:', error);
    throw error;
  }
} 