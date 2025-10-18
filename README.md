# 🎬 CineVerse - Movie Review Platform

A modern, full-stack movie review platform built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## ✨ Features

- **Authentication**: Complete auth system with email/password and OAuth (Google, GitHub)
- **Landing Page**: Beautiful hero section with movie carousel and features showcase
- **Dashboard**: Intuitive dashboard with sidebar navigation and activity tracking
- **Dark Mode**: Seamless dark/light theme switching with persistence
- **Responsive Design**: Mobile-first design that works on all devices
- **Type Safety**: Full TypeScript support with strict typing
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Animations**: Smooth transitions powered by Framer Motion

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd CineVerse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env.local`:
   ```bash
   copy .env.example .env.local
   ```

   Update the following variables in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. **Set up Supabase database**

   - Create a new project at [supabase.com](https://supabase.com)
   - Go to the SQL Editor in your Supabase dashboard
   - Run the SQL script from `supabase/schema.sql`
   - This will create all necessary tables, indexes, and RLS policies

5. **Configure Supabase Auth**

   In your Supabase dashboard:
   - Go to Authentication → Settings
   - Configure your site URL: `http://localhost:3000`
   - Enable Email provider
   - (Optional) Enable Google and GitHub OAuth providers
   - Add redirect URLs:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/auth/login`

## 🏃‍♂️ Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
CineVerse/
├── app/                        # Next.js app directory
│   ├── auth/                   # Authentication pages
│   │   ├── login/             # Login page
│   │   ├── signup/            # Sign up page
│   │   ├── reset-password/    # Password reset page
│   │   ├── callback/          # OAuth callback
│   │   └── actions.ts         # Server actions for auth
│   ├── dashboard/             # Protected dashboard pages
│   │   ├── layout.tsx         # Dashboard layout
│   │   └── page.tsx           # Dashboard home
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Landing page
│   └── globals.css            # Global styles
├── components/                 # React components
│   ├── ui/                    # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   └── label.tsx
│   ├── theme-provider.tsx     # Theme context provider
│   └── theme-toggle.tsx       # Dark mode toggle
├── lib/                       # Utility functions
│   ├── supabase/              # Supabase client setup
│   │   ├── client.ts          # Browser client
│   │   ├── server.ts          # Server client
│   │   └── middleware.ts      # Auth middleware
│   └── utils.ts               # Helper functions
├── types/                     # TypeScript types
│   ├── database.types.ts      # Database types
│   ├── auth.types.ts          # Auth types
│   └── index.ts               # Type exports
├── supabase/                  # Supabase configuration
│   └── schema.sql             # Database schema
├── middleware.ts              # Next.js middleware
├── tailwind.config.ts         # Tailwind configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies
```

## 🎨 Customization

### Theme Colors

The primary color is purple (#8B5CF6). To change it, update the colors in:
- `tailwind.config.ts` - Primary color variants
- `app/globals.css` - CSS variables

### Dark Mode

Dark mode is enabled by default. The theme toggle is in the navigation bar.

## 🔐 Authentication Flow

1. **Sign Up**: Users create an account with email/password or OAuth
2. **Email Verification**: Supabase sends verification email (optional)
3. **Login**: Users sign in with credentials or OAuth
4. **Protected Routes**: Middleware redirects unauthenticated users
5. **Session Management**: Automatic session refresh and validation

## 📊 Database Schema

### Users Table
- Extends Supabase auth.users
- Stores profile information (username, avatar, bio)

### Movies Table
- Stores movie information from TMDB
- Includes poster URLs and genres

### Reviews Table
- Links users to movies
- Stores ratings (1-10) and review content
- One review per user per movie

## 🚧 Upcoming Features

- [ ] Integration with TMDB API for real movie data
- [ ] Movie search and filtering
- [ ] User profiles with review history
- [ ] Social features (follow users, like reviews)
- [ ] Trending movies and recommendations
- [ ] Review comments and discussions

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `NEXT_PUBLIC_SITE_URL` | Your site URL (for OAuth redirects) | Yes |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)

---

Built with ❤️ by the CineVerse team
