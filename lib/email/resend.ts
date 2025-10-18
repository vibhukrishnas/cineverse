// Resend Email Client for CineVerse
// Provides: Transactional emails, notifications, digests

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Send welcome email to new users
export async function sendWelcomeEmail(
  to: string,
  username: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'CineVerse <onboarding@cineverse.app>',
      to: [to],
      subject: 'Welcome to CineVerse! 🎬',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">Welcome to CineVerse, ${username}! 🎬</h1>
          <p>We're excited to have you join our movie-loving community!</p>
          
          <h2>Get Started:</h2>
          <ul>
            <li>🔍 <strong>Discover</strong> trending movies and hidden gems</li>
            <li>✍️ <strong>Write</strong> reviews and share your thoughts</li>
            <li>💬 <strong>Join</strong> community channels and discussions</li>
            <li>👥 <strong>Follow</strong> other movie enthusiasts</li>
          </ul>
          
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/explore" 
             style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Start Exploring
          </a>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Happy watching!<br/>
            The CineVerse Team
          </p>
        </div>
      `
    })

    if (error) {
      console.error('Email send error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Resend API error:', error)
    return false
  }
}

// Send notification email
export async function sendNotificationEmail(
  to: string,
  subject: string,
  notificationType: 'comment' | 'follow' | 'like' | 'mention',
  content: {
    actorName: string
    itemTitle?: string
    itemLink?: string
  }
) {
  try {
    const notificationMessages = {
      comment: `${content.actorName} replied to your review`,
      follow: `${content.actorName} started following you`,
      like: `${content.actorName} liked your review`,
      mention: `${content.actorName} mentioned you in a post`
    }

    const { data, error } = await resend.emails.send({
      from: 'CineVerse <notifications@cineverse.app>',
      to: [to],
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">New Notification</h2>
          <p style="font-size: 16px;">${notificationMessages[notificationType]}</p>
          
          ${content.itemTitle ? `<p><strong>${content.itemTitle}</strong></p>` : ''}
          
          ${content.itemLink ? `
            <a href="${content.itemLink}" 
               style="display: inline-block; background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin: 15px 0;">
              View Details
            </a>
          ` : ''}
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            You can manage your notification preferences in your account settings.
          </p>
        </div>
      `
    })

    if (error) {
      console.error('Email send error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Resend API error:', error)
    return false
  }
}

// Send weekly digest email
export async function sendWeeklyDigest(
  to: string,
  username: string,
  digest: {
    trendingMovies: { title: string; poster: string; link: string }[]
    topReviews: { author: string; movie: string; excerpt: string; link: string }[]
    channelActivity: { channel: string; postCount: number; link: string }[]
  }
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'CineVerse <digest@cineverse.app>',
      to: [to],
      subject: '🎬 Your Weekly CineVerse Digest',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">This Week in Movies 🎬</h1>
          <p>Hi ${username}, here's what you missed this week!</p>
          
          <h2 style="margin-top: 30px;">🔥 Trending Movies</h2>
          ${digest.trendingMovies.map(movie => `
            <div style="margin: 15px 0; padding: 10px; background: #f3f4f6; border-radius: 8px;">
              <a href="${movie.link}" style="color: #1f2937; text-decoration: none; font-weight: bold;">
                ${movie.title}
              </a>
            </div>
          `).join('')}
          
          <h2 style="margin-top: 30px;">⭐ Top Reviews</h2>
          ${digest.topReviews.map(review => `
            <div style="margin: 15px 0; padding: 10px; background: #f3f4f6; border-radius: 8px;">
              <p style="margin: 0 0 5px 0;"><strong>${review.author}</strong> on ${review.movie}</p>
              <p style="margin: 0; color: #666; font-size: 14px;">${review.excerpt}</p>
              <a href="${review.link}" style="color: #6366f1; text-decoration: none; font-size: 14px;">Read more →</a>
            </div>
          `).join('')}
          
          <h2 style="margin-top: 30px;">💬 Active Channels</h2>
          ${digest.channelActivity.map(channel => `
            <div style="margin: 10px 0;">
              <a href="${channel.link}" style="color: #6366f1; text-decoration: none;">
                ${channel.channel}
              </a> - ${channel.postCount} new posts
            </div>
          `).join('')}
          
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" 
             style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 30px 0;">
            Visit CineVerse
          </a>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            You're receiving this because you're subscribed to weekly digests.
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/settings/notifications" style="color: #6366f1;">
              Unsubscribe
            </a>
          </p>
        </div>
      `
    })

    if (error) {
      console.error('Email send error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Resend API error:', error)
    return false
  }
}

// Send password reset email
export async function sendPasswordResetEmail(
  to: string,
  resetLink: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'CineVerse <security@cineverse.app>',
      to: [to],
      subject: 'Reset Your CineVerse Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Password Reset Request</h2>
          <p>We received a request to reset your CineVerse password.</p>
          
          <a href="${resetLink}" 
             style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Reset Password
          </a>
          
          <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
          </p>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Or copy and paste this link:<br/>
            ${resetLink}
          </p>
        </div>
      `
    })

    if (error) {
      console.error('Email send error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Resend API error:', error)
    return false
  }
}
