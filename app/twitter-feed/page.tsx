'use client';

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Twitter, RefreshCw, Heart, MessageCircle, Repeat, AlertCircle, Clock } from 'lucide-react';
import styles from './twitter-feed.module.css';

interface Tweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
}

interface User {
  id: string;
  name: string;
  username: string;
  profile_image_url: string;
}

interface TweetsResponse {
  data: Tweet[];
  includes?: {
    users: User[];
  };
}

export default function TwitterFeed() {
  const [tweets, setTweets] = useState<TweetsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [rateLimited, setRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const MAX_RETRIES = 2;

  useEffect(() => {
    if (rateLimited && retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [rateLimited, retryAfter]);

  const fetchTweets = useCallback(async (isRetry = false) => {
    if (rateLimited) return;

    if (!isRetry) {
      setRefreshing(true);
    }

    try {
      console.log('Fetching tweets...');
      const response = await axios.get('/api/tweets', {
        timeout: 15000,
      });

      if (response.data && response.data.data) {
        console.log('Tweets fetched successfully:', response.data);
        setTweets(response.data);
        setError(null);
        setRetryCount(0);
        setRateLimited(false);
      } else {
        throw new Error('Invalid response format from Twitter API');
      }
    } catch (err: any) {
      console.error('Error fetching tweets:', err);

      if (err.response && err.response.status === 429) {
        setRateLimited(true);

        const retryTimeMatch = err.response.data?.error?.match(/after (\d+) seconds/);
        const waitTime = retryTimeMatch ? parseInt(retryTimeMatch[1], 10) : 60;

        setRetryAfter(waitTime);
        setError(`Twitter rate limit exceeded. Please try again in ${waitTime} seconds.`);
        return;
      }

      if (retryCount < MAX_RETRIES && !isRetry) {
        setRetryCount(prev => prev + 1);
        console.log(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`);

        const backoff = Math.pow(2, retryCount) * 1000;
        setTimeout(() => fetchTweets(true), backoff);
        return;
      }

      if (err.response) {
        setError(`Server error: ${err.response.status} - ${err.response.data?.error || 'Unknown error'}`);
      } else if (err.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError(`Error: ${err.message || 'Unknown error occurred'}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [retryCount, rateLimited]);

  useEffect(() => {
    fetchTweets();

    const interval = setInterval(() => {
      if (!rateLimited) {
        fetchTweets();
      }
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchTweets]);

  const handleManualRefresh = () => {
    if (rateLimited) return;

    setRetryCount(0);
    fetchTweets();
  };

  if (loading && !tweets) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading tweets from IntelliQ...</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleContainer}>
            <Twitter className={styles.twitterIcon} />
            <h1>IntelliQ Twitter Feed</h1>
          </div>
          <button 
            onClick={handleManualRefresh} 
            className={`${styles.refreshButton} ${rateLimited ? styles.disabled : ''}`}
            disabled={refreshing || rateLimited}
          >
            {rateLimited ? (
              <>
                <Clock className={styles.refreshIcon} />
                {`Wait ${retryAfter}s`}
              </>
            ) : (
              <>
                <RefreshCw className={`${styles.refreshIcon} ${refreshing ? styles.spinning : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </>
            )}
          </button>
        </div>
      </header>
      
      <main className={styles.container}>
        {error && (
          <div className={styles.errorBanner}>
            <AlertCircle size={20} />
            <p>{error}</p>
            <button onClick={handleManualRefresh} className={styles.retryButton}>
              Try Again
            </button>
          </div>
        )}
        
        <div className={styles.twitterFeed}>
          {tweets && tweets.data && tweets.data.length > 0 ? (
            tweets.data.map((tweet) => {
              const user = tweets.includes?.users.find(u => u.id === tweet.author_id) || 
                { name: 'IntelliQ', username: 'inteliq_xyz', profile_image_url: '' };
              
              return (
                <div key={tweet.id} className={styles.tweet}>
                  <div className={styles.tweetHeader}>
                    <img 
                      src={user.profile_image_url || '/default-profile.png'} 
                      alt={user.name} 
                      className={styles.profileImage}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/default-profile.png';
                      }}
                    />
                    <div className={styles.userInfo}>
                      <span className={styles.name}>{user.name}</span>
                      <span className={styles.username}>@{user.username}</span>
                    </div>
                  </div>
                  <div className={styles.tweetContent}>
                    {tweet.text}
                  </div>
                  <div className={styles.tweetMetrics}>
                    <span className={styles.date}>
                      {tweet.created_at ? new Date(tweet.created_at).toLocaleString() : 'Unknown date'}
                    </span>
                    <div className={styles.metrics}>
                      <span className={styles.metric}>
                        <Heart className={styles.icon} size={16} />
                        {tweet.public_metrics?.like_count || 0}
                      </span>
                      <span className={styles.metric}>
                        <Repeat className={styles.icon} size={16} />
                        {tweet.public_metrics?.retweet_count || 0}
                      </span>
                      <span className={styles.metric}>
                        <MessageCircle className={styles.icon} size={16} />
                        {tweet.public_metrics?.reply_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.noTweets}>
              <p>No tweets available at the moment.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
