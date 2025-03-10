'use server';
import { auth } from '@clerk/nextjs/server';

export async function getAuthData() {
  const { userId } = auth();
  return { isSignedIn: !!userId };
} 