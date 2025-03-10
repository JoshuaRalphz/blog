'use server'; // Mark this as server-only
import { auth } from '@clerk/nextjs/server';

export async function getAuthData(request) {
  try {
    // Get the auth state from the request
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('No user ID found');
    }

    return { clerkUserId: userId }; // Ensure this is a plain object
  } catch (error) {
    console.error('Error in getAuthData:', error);
    throw error;
  }
} 