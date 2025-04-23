import { NextResponse } from 'next/server';
import { TwitterClient } from '@/lib/twitter-client';

// Track API call timestamps to implement our own rate limiting
let lastApiCall = 0;
const MIN_CALL_INTERVAL = 10000; // 10 seconds minimum between calls

export async function GET() {
  try {
    // Implement our own rate limiting
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    
    if (lastApiCall > 0 && timeSinceLastCall < MIN_CALL_INTERVAL) {
      const waitTime = MIN_CALL_INTERVAL - timeSinceLastCall;
      console.log(`Rate limiting: Too many requests. Wait ${waitTime}ms`);
      return NextResponse.json(
        { error: `Too many requests. Please wait ${Math.ceil(waitTime/1000)} seconds.` },
        { status: 429 }
      );
    }
    
    lastApiCall = now;
    console.log('API route: Fetching tweets...');
    
    const twitter = new TwitterClient();
    const twitterUsername = 'inteliq_xyz';
    const twitterData = await twitter.getUserTweets(twitterUsername);
    
    return NextResponse.json(twitterData);
  } catch (error: any) {
    console.error('Twitter API error:', error);
    
    // Check if it's a rate limit error
    if (error.message && error.message.includes('Rate limited')) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 429 }
      );
    }
    
    // Other errors
    const statusCode = error.response?.status || 500;
    const errorMessage = error.message || 'Failed to fetch tweets';
    
    return NextResponse.json(
      { error: errorMessage }, 
      { status: statusCode }
    );
  }
}
