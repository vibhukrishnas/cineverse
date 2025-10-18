export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
        }
      }
      movies: {
        Row: {
          id: string
          tmdb_id: number
          title: string
          poster_url: string | null
          release_date: string | null
          genres: string[]
          created_at: string
        }
        Insert: {
          id?: string
          tmdb_id: number
          title: string
          poster_url?: string | null
          release_date?: string | null
          genres?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          tmdb_id?: number
          title?: string
          poster_url?: string | null
          release_date?: string | null
          genres?: string[]
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          movie_id: number
          rating: number
          content: string
          story_rating: number | null
          acting_rating: number | null
          direction_rating: number | null
          cinematography_rating: number | null
          music_rating: number | null
          is_spoiler: boolean
          sentiment: string | null
          helpful_count: number
          like_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          movie_id: number
          rating: number
          content: string
          story_rating?: number | null
          acting_rating?: number | null
          direction_rating?: number | null
          cinematography_rating?: number | null
          music_rating?: number | null
          is_spoiler?: boolean
          sentiment?: string | null
          helpful_count?: number
          like_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          movie_id?: number
          rating?: number
          content?: string
          story_rating?: number | null
          acting_rating?: number | null
          direction_rating?: number | null
          cinematography_rating?: number | null
          music_rating?: number | null
          is_spoiler?: boolean
          sentiment?: string | null
          helpful_count?: number
          like_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      review_likes: {
        Row: {
          id: string
          user_id: string
          review_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          review_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          review_id?: string
          created_at?: string
        }
      }
      review_helpful: {
        Row: {
          id: string
          user_id: string
          review_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          review_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          review_id?: string
          created_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          content: string | null
          link: string | null
          actor_id: string | null
          reference_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          content?: string | null
          link?: string | null
          actor_id?: string | null
          reference_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          content?: string | null
          link?: string | null
          actor_id?: string | null
          reference_id?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
      social_posts: {
        Row: {
          id: string
          platform: string
          post_id: string
          movie_id: number | null
          content: string | null
          media_url: string | null
          author_name: string | null
          author_handle: string | null
          author_avatar: string | null
          likes_count: number
          comments_count: number
          views_count: number
          external_url: string | null
          created_at: string
          fetched_at: string
        }
        Insert: {
          id?: string
          platform: string
          post_id: string
          movie_id?: number | null
          content?: string | null
          media_url?: string | null
          author_name?: string | null
          author_handle?: string | null
          author_avatar?: string | null
          likes_count?: number
          comments_count?: number
          views_count?: number
          external_url?: string | null
          created_at?: string
          fetched_at?: string
        }
        Update: {
          id?: string
          platform?: string
          post_id?: string
          movie_id?: number | null
          content?: string | null
          media_url?: string | null
          author_name?: string | null
          author_handle?: string | null
          author_avatar?: string | null
          likes_count?: number
          comments_count?: number
          views_count?: number
          external_url?: string | null
          created_at?: string
          fetched_at?: string
        }
      }
      user_online_status: {
        Row: {
          user_id: string
          is_online: boolean
          last_seen: string
          updated_at: string
        }
        Insert: {
          user_id: string
          is_online?: boolean
          last_seen?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          is_online?: boolean
          last_seen?: string
          updated_at?: string
        }
      }
      channels: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          type: 'genre' | 'regional' | 'topic' | 'custom'
          icon: string | null
          banner_url: string | null
          member_count: number
          post_count: number
          moderator_ids: string[]
          rules: string[]
          is_official: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          type: 'genre' | 'regional' | 'topic' | 'custom'
          icon?: string | null
          banner_url?: string | null
          member_count?: number
          post_count?: number
          moderator_ids?: string[]
          rules?: string[]
          is_official?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          type?: 'genre' | 'regional' | 'topic' | 'custom'
          icon?: string | null
          banner_url?: string | null
          member_count?: number
          post_count?: number
          moderator_ids?: string[]
          rules?: string[]
          is_official?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          channel_id: string
          author_id: string
          title: string
          content: string | null
          flair: string | null
          thumbnail_url: string | null
          upvotes: number
          downvotes: number
          score: number
          comment_count: number
          is_pinned: boolean
          is_spoiler: boolean
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          channel_id: string
          author_id: string
          title: string
          content?: string | null
          flair?: string | null
          thumbnail_url?: string | null
          upvotes?: number
          downvotes?: number
          score?: number
          comment_count?: number
          is_pinned?: boolean
          is_spoiler?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          channel_id?: string
          author_id?: string
          title?: string
          content?: string | null
          flair?: string | null
          thumbnail_url?: string | null
          upvotes?: number
          downvotes?: number
          score?: number
          comment_count?: number
          is_pinned?: boolean
          is_spoiler?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          parent_id: string | null
          content: string
          upvotes: number
          downvotes: number
          score: number
          depth: number
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          parent_id?: string | null
          content: string
          upvotes?: number
          downvotes?: number
          score?: number
          depth?: number
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          parent_id?: string | null
          content?: string
          upvotes?: number
          downvotes?: number
          score?: number
          depth?: number
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      channel_members: {
        Row: {
          user_id: string
          channel_id: string
          role: 'member' | 'moderator' | 'admin'
          joined_at: string
        }
        Insert: {
          user_id: string
          channel_id: string
          role?: 'member' | 'moderator' | 'admin'
          joined_at?: string
        }
        Update: {
          user_id?: string
          channel_id?: string
          role?: 'member' | 'moderator' | 'admin'
          joined_at?: string
        }
      }
      votes: {
        Row: {
          user_id: string
          votable_id: string
          votable_type: 'post' | 'comment'
          vote_type: 'up' | 'down'
          created_at: string
        }
        Insert: {
          user_id: string
          votable_id: string
          votable_type: 'post' | 'comment'
          vote_type: 'up' | 'down'
          created_at?: string
        }
        Update: {
          user_id?: string
          votable_id?: string
          votable_type?: 'post' | 'comment'
          vote_type?: 'up' | 'down'
          created_at?: string
        }
      }
    }
  }
}

export type User = Database['public']['Tables']['users']['Row']
export type Movie = Database['public']['Tables']['movies']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type ReviewLike = Database['public']['Tables']['review_likes']['Row']
export type ReviewHelpful = Database['public']['Tables']['review_helpful']['Row']
export type Follow = Database['public']['Tables']['follows']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type SocialPost = Database['public']['Tables']['social_posts']['Row']
export type UserOnlineStatus = Database['public']['Tables']['user_online_status']['Row']
export type Channel = Database['public']['Tables']['channels']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type ChannelMember = Database['public']['Tables']['channel_members']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']
