# 🎬 CineVerse - Quick Start Commands

## Installation & Setup

### 1. Install all dependencies
```powershell
npm install
```

### 2. Create environment file
```powershell
copy .env.example .env.local
```

### 3. Edit .env.local with your Supabase credentials
Open `.env.local` in your editor and add:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_SITE_URL

### 4. Run development server
```powershell
npm run dev
```

## Development Commands

### Start development server
```powershell
npm run dev
```

### Build for production
```powershell
npm run build
```

### Start production server
```powershell
npm start
```

### Run linter
```powershell
npm run lint
```

## Supabase Setup Checklist

- [ ] Create Supabase project
- [ ] Copy Project URL and anon key
- [ ] Update .env.local file
- [ ] Run schema.sql in SQL Editor
- [ ] Configure Site URL in Auth settings
- [ ] Enable Email provider
- [ ] (Optional) Configure OAuth providers
- [ ] Add callback URL: http://localhost:3000/auth/callback

## Testing Checklist

- [ ] Landing page loads
- [ ] Dark mode toggle works
- [ ] Movie carousel animates
- [ ] Sign up creates account
- [ ] Login works with credentials
- [ ] Dashboard is accessible after login
- [ ] Sidebar navigation works
- [ ] Logout redirects to home
- [ ] Password reset sends email
- [ ] OAuth login works (if configured)

## Common URLs

- Development: http://localhost:3000
- Landing Page: http://localhost:3000
- Login: http://localhost:3000/auth/login
- Sign Up: http://localhost:3000/auth/signup
- Dashboard: http://localhost:3000/dashboard
- Supabase Dashboard: https://app.supabase.com

## Troubleshooting

### Dependencies not installing?
```powershell
rm -r node_modules
rm package-lock.json
npm install
```

### TypeScript errors?
```powershell
npm install
# Restart your editor/VSCode
```

### Supabase connection issues?
- Check .env.local exists and has correct values
- Restart dev server after adding env variables
- Verify Supabase project is active

### Port already in use?
```powershell
# Run on different port
npm run dev -- -p 3001
```

## Quick Reference

### Project Structure
- `/app` - Pages and routes
- `/components` - Reusable UI components
- `/lib` - Utility functions and Supabase clients
- `/types` - TypeScript type definitions
- `/supabase` - Database schema

### Key Files
- `app/page.tsx` - Landing page
- `app/auth/login/page.tsx` - Login page
- `app/dashboard/page.tsx` - Dashboard home
- `middleware.ts` - Route protection
- `supabase/schema.sql` - Database schema

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `NEXT_PUBLIC_SITE_URL` - Your site URL (for OAuth)

---

Need help? Check README.md or SETUP.md for detailed guides!
