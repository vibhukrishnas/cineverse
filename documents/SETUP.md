# CineVerse Setup Guide

## Quick Start

Follow these steps to get CineVerse running on your local machine:

### 1. Install Dependencies

```powershell
npm install
```

This will install all required packages including:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Supabase client libraries
- shadcn/ui components
- Framer Motion
- Lucide icons

### 2. Set Up Supabase

1. **Create a Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up for a free account
   - Create a new project

2. **Get Your Credentials**
   - In your Supabase dashboard, go to Settings → API
   - Copy your Project URL
   - Copy your `anon` public key

3. **Configure Environment Variables**
   - Copy `.env.example` to `.env.local`:
     ```powershell
     copy .env.example .env.local
     ```
   - Open `.env.local` and add your credentials:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     NEXT_PUBLIC_SITE_URL=http://localhost:3000
     ```

### 3. Set Up Database

1. **Run the Schema Script**
   - In your Supabase dashboard, go to SQL Editor
   - Click "New Query"
   - Copy the entire contents of `supabase/schema.sql`
   - Paste into the editor and click "Run"
   - This creates all tables, indexes, and security policies

2. **Verify Tables Created**
   - Go to Table Editor in Supabase
   - You should see: `users`, `movies`, and `reviews` tables

### 4. Configure Authentication

1. **Email Authentication**
   - In Supabase dashboard, go to Authentication → Settings
   - Ensure "Enable Email Signup" is checked
   - Configure "Site URL": `http://localhost:3000`

2. **OAuth Providers (Optional)**
   - To enable Google OAuth:
     - Go to Authentication → Providers
     - Enable Google
     - Add your Google OAuth credentials
   - To enable GitHub OAuth:
     - Enable GitHub
     - Add your GitHub OAuth credentials
   - Add redirect URL: `http://localhost:3000/auth/callback`

### 5. Run Development Server

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing the Application

### 1. Test Landing Page
- Visit http://localhost:3000
- Verify the movie carousel animates
- Test the dark mode toggle
- Click navigation buttons

### 2. Test Authentication
- Click "Sign Up"
- Create a new account with email/password
- Check your email for verification (if enabled)
- Test login with your credentials
- Try "Forgot Password" flow
- (Optional) Test OAuth with Google/GitHub

### 3. Test Dashboard
- After logging in, you should be redirected to `/dashboard`
- Verify sidebar navigation works
- Test search bar
- Check notifications bell
- Test logout functionality
- Try different screen sizes (mobile, tablet, desktop)

## Common Issues & Solutions

### Issue: TypeScript/ESLint Errors
**Solution**: These are expected before running `npm install`. They will resolve after dependencies are installed.

### Issue: Supabase Connection Error
**Solution**: 
- Verify your `.env.local` file exists and has correct credentials
- Restart the dev server after adding environment variables
- Check that your Supabase project is active

### Issue: Authentication Not Working
**Solution**:
- Verify Site URL in Supabase settings matches `http://localhost:3000`
- Check that redirect URLs are configured correctly
- Ensure RLS policies were created (run schema.sql again if needed)

### Issue: Dark Mode Not Persisting
**Solution**: This is normal on first load. The theme will persist after the first toggle.

## Development Tips

1. **Hot Reload**: Changes to code will automatically refresh the browser
2. **Database Changes**: After modifying the schema, you may need to update TypeScript types
3. **Styling**: Use Tailwind classes directly in components
4. **Icons**: All icons come from `lucide-react` package

## Next Steps

After setup is complete:
1. Customize the theme colors in `tailwind.config.ts`
2. Add TMDB API integration for real movie data
3. Implement movie search functionality
4. Build out user profile pages
5. Add review creation and editing features

## Need Help?

- Check the main README.md for detailed documentation
- Review Supabase documentation: [docs.supabase.com](https://docs.supabase.com)
- Check Next.js documentation: [nextjs.org/docs](https://nextjs.org/docs)

---

Happy coding! 🎬
