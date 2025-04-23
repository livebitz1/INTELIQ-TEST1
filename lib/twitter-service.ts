import axios from 'axios';

export async function fetchTwitterUserTweets(username: string) {
  try {
    // First get user ID from username
    const userResponse = await axios.get(
      `https://api.twitter.com/2/users/by/username/${username}`, 
      {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
        }
      }
    );
    
    const userId = userResponse.data.data.id;
    
    // Then fetch user's tweets with expanded information
    const tweetsResponse = await axios.get(
      `https://api.twitter.com/2/users/${userId}/tweets`,
      {
        params: {
          max_results: 10,
          'tweet.fields': 'created_at,public_metrics',
          expansions: 'author_id',
          'user.fields': 'profile_image_url,username,name'
        },
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
        }
      }
    );
    
    return tweetsResponse.data;
  } catch (error) {
    console.error('Error fetching Twitter data:', error);
    throw error;
  }
}
