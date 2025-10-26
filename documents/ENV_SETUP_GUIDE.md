# 🔑 Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in your project root with these variables:

```bash
# ============================================
# TMDB API (Required - for movie data)
# ============================================
NEXT_PUBLIC_TMDB_API_KEY=9d1a0985764201bee0eb1602d8214ed9
NEXT_PUBLIC_TMDB_ACCESS_TOKEN=your_tmdb_access_token

# ============================================
# Google Gemini AI (Optional - for AI recommendations)
# ============================================
# Get your key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Alternative name (either works):
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# ============================================
# Supabase (Required - for database)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ============================================
# Twitter/X API (Optional - for social feeds)
# ============================================
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
```

## ⚠️ Important Notes

### **Gemini API Key - OPTIONAL**
- The For You page will work WITHOUT this key
- It will automatically use TMDB fallback recommendations
- Add it only if you want AI-powered recommendations
- Free tier: 60 requests per minute

### **How to Get Gemini API Key:**
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key
5. Add to `.env.local`
6. Restart your development server

### **Testing Without Gemini:**
```bash
# The system will show:
⚠️ Gemini AI not available - using TMDB fallback
🎯 Using TMDB fallback for genres: Action, Drama
✅ TMDB fallback returned 12 movies
```

### **Testing With Gemini:**
```bash
# The system will show:
🤖 Gemini AI: Generating 12 recommendations for genres: Action, Drama
📥 Gemini AI raw response...
✨ Gemini returned 12 recommendations
```

## 🔒 Security

- **Never commit `.env.local`** to git (it's in .gitignore)
- Use `.env.example` for reference
- Different keys for development/production
- Keep service role keys secure (server-side only)

## 📝 Example `.env.local`

```bash
# Working example (use your own keys!)
NEXT_PUBLIC_TMDB_API_KEY=9d1a0985764201bee0eb1602d8214ed9
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
GEMINI_API_KEY=AIzaSyD...  # Optional - for AI features
```

## ✅ Verification

After adding keys, test:

1. **TMDB Working:**
   - Visit any movie page
   - Should load movie details

2. **Supabase Working:**
   - Try to sign in
   - Should authenticate successfully

3. **Gemini Working (if added):**
   - Go to For You page
   - Select genres and language
   - Should get AI recommendations
   - Check browser console for "🤖 Gemini AI" logs

4. **Gemini Fallback Working (if not added):**
   - Go to For You page
   - Select genres and language
   - Should still get recommendations
   - Check browser console for "🎯 Using TMDB fallback" logs
