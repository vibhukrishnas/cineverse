// PostHog Analytics Client for CineVerse
// Provides: User behavior tracking, feature usage analytics, A/B testing

'use client'

import posthog from 'posthog-js'

let initialized = false

// Initialize PostHog (call once in app)
export function initPostHog() {
  if (initialized || typeof window === 'undefined') return
  
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          posthog.debug()
        }
      },
      capture_pageview: false, // We'll handle this manually
      capture_pageleave: true,
      autocapture: false // Explicit tracking only
    })
    initialized = true
  }
}

// Track page view
export function trackPageView(path: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return
  
  posthog.capture('$pageview', {
    $current_url: path,
    ...properties
  })
}

// Track user events
export function trackEvent(
  eventName: string,
  properties?: Record<string, any>
) {
  if (typeof window === 'undefined') return
  
  posthog.capture(eventName, properties)
}

// Common event trackers for CineVerse

export const analytics = {
  // Movie interactions
  movieViewed: (movieId: number, movieTitle: string) => {
    trackEvent('movie_viewed', { movie_id: movieId, movie_title: movieTitle })
  },
  
  movieRated: (movieId: number, rating: number) => {
    trackEvent('movie_rated', { movie_id: movieId, rating })
  },
  
  movieAddedToWatchlist: (movieId: number) => {
    trackEvent('movie_added_to_watchlist', { movie_id: movieId })
  },
  
  movieRemovedFromWatchlist: (movieId: number) => {
    trackEvent('movie_removed_from_watchlist', { movie_id: movieId })
  },

  // Review interactions
  reviewCreated: (reviewId: string, movieId: number, rating: number) => {
    trackEvent('review_created', { review_id: reviewId, movie_id: movieId, rating })
  },
  
  reviewLiked: (reviewId: string) => {
    trackEvent('review_liked', { review_id: reviewId })
  },
  
  reviewShared: (reviewId: string, platform: string) => {
    trackEvent('review_shared', { review_id: reviewId, platform })
  },

  // Social interactions
  userFollowed: (followedUserId: string) => {
    trackEvent('user_followed', { followed_user_id: followedUserId })
  },
  
  userUnfollowed: (unfollowedUserId: string) => {
    trackEvent('user_unfollowed', { unfollowed_user_id: unfollowedUserId })
  },

  // Channel interactions
  channelJoined: (channelId: string, channelName: string) => {
    trackEvent('channel_joined', { channel_id: channelId, channel_name: channelName })
  },
  
  channelLeft: (channelId: string) => {
    trackEvent('channel_left', { channel_id: channelId })
  },
  
  postCreated: (postId: string, channelId: string) => {
    trackEvent('post_created', { post_id: postId, channel_id: channelId })
  },
  
  postVoted: (postId: string, voteType: 'up' | 'down') => {
    trackEvent('post_voted', { post_id: postId, vote_type: voteType })
  },
  
  commentCreated: (commentId: string, postId: string) => {
    trackEvent('comment_created', { comment_id: commentId, post_id: postId })
  },

  // Search & Discovery
  searchPerformed: (query: string, resultCount: number) => {
    trackEvent('search_performed', { query, result_count: resultCount })
  },
  
  filterApplied: (filterType: string, filterValue: string) => {
    trackEvent('filter_applied', { filter_type: filterType, filter_value: filterValue })
  },

  // AI Features
  aiRecommendationRequested: () => {
    trackEvent('ai_recommendation_requested')
  },
  
  aiRecommendationAccepted: (movieId: number) => {
    trackEvent('ai_recommendation_accepted', { movie_id: movieId })
  },
  
  aiChatMessageSent: (messageLength: number) => {
    trackEvent('ai_chat_message_sent', { message_length: messageLength })
  },

  // Video interactions
  trailerPlayed: (movieId: number, videoId: string) => {
    trackEvent('trailer_played', { movie_id: movieId, video_id: videoId })
  },
  
  reviewVideoWatched: (videoId: string, duration: number) => {
    trackEvent('review_video_watched', { video_id: videoId, duration })
  },

  // Notification interactions
  notificationReceived: (notificationType: string) => {
    trackEvent('notification_received', { notification_type: notificationType })
  },
  
  notificationClicked: (notificationType: string) => {
    trackEvent('notification_clicked', { notification_type: notificationType })
  },

  // Conversion events
  signupCompleted: (method: 'email' | 'oauth') => {
    trackEvent('signup_completed', { method })
  },
  
  loginCompleted: (method: 'email' | 'oauth') => {
    trackEvent('login_completed', { method })
  },

  // Feature usage
  featureUsed: (featureName: string, context?: Record<string, any>) => {
    trackEvent('feature_used', { feature_name: featureName, ...context })
  }
}

// Identify user (call after login)
export function identifyUser(userId: string, traits?: {
  email?: string
  username?: string
  created_at?: string
  [key: string]: any
}) {
  if (typeof window === 'undefined') return
  
  posthog.identify(userId, traits)
}

// Reset user (call on logout)
export function resetUser() {
  if (typeof window === 'undefined') return
  
  posthog.reset()
}

// A/B testing - check if user is in feature flag
export function isFeatureEnabled(flagKey: string): boolean {
  if (typeof window === 'undefined') return false
  
  return posthog.isFeatureEnabled(flagKey) || false
}

// Get feature flag variant
export function getFeatureVariant(flagKey: string): string | boolean {
  if (typeof window === 'undefined') return false
  
  return posthog.getFeatureFlag(flagKey) || false
}

// Set user properties
export function setUserProperties(properties: Record<string, any>) {
  if (typeof window === 'undefined') return
  
  posthog.people.set(properties)
}
