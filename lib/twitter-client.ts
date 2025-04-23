import axios from 'axios';
import crypto from 'crypto';

// Cache for Twitter responses
let twitterCache: {
  data: any;
  timestamp: number;
  expiry: number;
} | null = null;

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache

export class TwitterClient {
  private bearerToken: string;

  constructor() {
    this.bearerToken = process.env.TWITTER_BEARER_TOKEN || '';
    
    if (!this.bearerToken) {
      console.error('Twitter Bearer Token not configured!');
    }
  }

  async getUserTweets(username: string, useCache = true) {
    // Check cache first
    if (useCache && twitterCache && 
        (Date.now() - twitterCache.timestamp) < twitterCache.expiry) {
      console.log('Using cached Twitter response');
      return twitterCache.data;
    }

    try {
      // First get user ID
      const userId = await this.getUserId(username);
      
      // Then get tweets
      const endpoint = `https://api.twitter.com/2/users/${userId}/tweets`;
      const params = {
        max_results: 5,  // Reduced from 10 to 5 to help with rate limits
        'tweet.fields': 'created_at,public_metrics',
        expansions: 'author_id',
        'user.fields': 'profile_image_url,username,name',
      };
      
      const response = await axios.get(endpoint, {
        params,
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      // Cache the successful response
      twitterCache = {
        data: response.data,
        timestamp: Date.now(),
        expiry: CACHE_TTL,
      };

      return response.data;
    } catch (error: any) {
      // If rate limited, increase cache expiry to avoid hammering the API
      if (error.response && error.response.status === 429) {
        // If we have cached data, extend its expiry and return it
        if (twitterCache) {
          console.log('Rate limited - using cached data');
          twitterCache.expiry = 15 * 60 * 1000; // 15 minutes on rate limit
          return twitterCache.data;
        }
        
        // Calculate retry-after from headers or default to 5 minutes
        const retryAfter = parseInt(error.response.headers['retry-after'] || '300', 10);
        throw new Error(`Rate limited. Try again after ${retryAfter} seconds.`);
      }
      throw error;
    }
  }

  private async getUserId(username: string): Promise<string> {
    try {
      const response = await axios.get(
        `https://api.twitter.com/2/users/by/username/${username}`,
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.data?.data?.id) {
        throw new Error('User ID not found');
      }

      return response.data.data.id;
    } catch (error) {
      console.error('Error getting user ID:', error);
      throw error;
    }
  }
}
