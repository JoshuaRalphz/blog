'use server'; // Mark this as server-only
import { auth } from '@clerk/nextjs/server';

export async function getAuthData() {
  try {
    const { userId } = auth();
    return { clerkUserId: userId };
  } catch (error) {
    console.error('Error in getAuthData:', error);
    throw error;
  }
} 