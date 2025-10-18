# 🎬 Actor Social Feed - Visual Component Guide

## 📐 Component Layout Reference

This guide shows the visual structure and layout of all actor-related components.

---

## 1. Actor Profile Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ACTOR PROFILE HEADER (Full Width)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ┌──────────┐  Name: Christopher Nolan               │  │
│  │  │          │  Known For: Director                    │  │
│  │  │  Photo   │  Bio preview (3 lines)...              │  │
│  │  │ 256x320  │  Stats: 1,234 followers | 25 movies    │  │
│  │  │          │  [Follow] [Share] [Official Site] [IMDb]│  │
│  │  └──────────┘                                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────┬──────────────────────────────────────┐ │
│  │  SIDEBAR       │  MAIN CONTENT                         │ │
│  │  (Sticky)      │                                       │ │
│  │                │  ┌──────────────────────────────────┐│ │
│  │  Personal Info │  │ TABS                             ││ │
│  │  ┌──────────┐  │  │ [Biography] [Movies] [Crew] [...] ││ │
│  │  │ Birthday  │  │  └──────────────────────────────────┘│ │
│  │  │ Birthplace│  │                                       │ │
│  │  │ Gender    │  │  TAB CONTENT:                         │ │
│  │  │ Also Known│  │  - Biography: Full text + stats       │ │
│  │  │ As        │  │  - Movies: Grid by decade             │ │
│  │  └──────────┘  │  - Crew: Grid by decade               │ │
│  │                │  - Photos: Image gallery               │ │
│  │  Social Links  │                                       │ │
│  │  ┌──────────┐  │                                       │ │
│  │  │Instagram │  │                                       │ │
│  │  │Twitter   │  │                                       │ │
│  │  │Facebook  │  │                                       │ │
│  │  │YouTube   │  │                                       │ │
│  │  │TikTok    │  │                                       │ │
│  │  │IMDb      │  │                                       │ │
│  │  └──────────┘  │                                       │ │
│  └────────────────┴──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

Desktop: 25% sidebar | 75% content
Mobile: Stacked (Sidebar below content)
```

---

## 2. ActorProfileHeader Component

```
┌──────────────────────────────────────────────────────────────┐
│  ▓▓▓▓▓▓ Gradient Background ▓▓▓▓▓▓                          │
│                                                               │
│  ┌─────────────┐  ┌────────────────────────────────────────┐│
│  │             │  │ Name: Leonardo DiCaprio                ││
│  │             │  │ Badge: [Actor]                         ││
│  │   Profile   │  │                                        ││
│  │   Photo     │  │ Bio Preview (3 lines with line-clamp):││
│  │   256x320   │  │ "Leonardo Wilhelm DiCaprio is an       ││
│  │             │  │ American actor and film producer..."   ││
│  │             │  │                                        ││
│  │             │  │ Stats:                                 ││
│  │             │  │ 👥 2,543 followers | 🎬 45 movies      ││
│  │             │  │ Popularity: 85.3                       ││
│  │             │  │                                        ││
│  │             │  │ Buttons:                               ││
│  │             │  │ [➕ Follow] [🔗 Share]                 ││
│  │             │  │ [🌐 Official Site] [🎬 IMDb]          ││
│  └─────────────┘  └────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘

States:
- Following: [✅ Unfollow] button with outline style
- Not Following: [➕ Follow] button with primary style
- Loading: Disabled state with spinner
```

---

## 3. ActorFilmography Component

```
┌──────────────────────────────────────────────────────────────┐
│  2020s                                                        │
│  ┌──────────┬──────────┬──────────┬──────────┐              │
│  │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │              │
│  │ │Poster│ │ │Poster│ │ │Poster│ │ │Poster│ │              │
│  │ │ 2:3  │ │ │ 2:3  │ │ │ 2:3  │ │ │ 2:3  │ │              │
│  │ │      │ │ │      │ │ │      │ │ │      │ │              │
│  │ │ ⭐8.5│ │ │ ⭐7.9│ │ │ ⭐8.1│ │ │ ⭐7.5│ │              │
│  │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │              │
│  │ Title    │ │ Title  │ │ Title  │ │ Title  │              │
│  │ 📅 2023  │ │ 2022   │ │ 2021   │ │ 2020   │              │
│  │ as Name  │ │ as Name│ │ as Name│ │ as Name│              │
│  └──────────┴──────────┴──────────┴──────────┘              │
│                                                               │
│  2010s                                                        │
│  ┌──────────┬──────────┬──────────┬──────────┐              │
│  │ ...more movies in grid...                  │              │
│  └──────────┴──────────┴──────────┴──────────┘              │
└──────────────────────────────────────────────────────────────┘

Grid: 2 cols mobile | 3 cols tablet | 4 cols desktop
Hover: Scale up + shadow
Click: Navigate to movie page
```

---

## 4. ActorSocialLinks Component

```
┌────────────────────────────────┐
│  🔗 Social Media               │
│  ┌──────────────────────────┐ │
│  │ 📷 Instagram         →   │ │
│  └──────────────────────────┘ │
│  ┌──────────────────────────┐ │
│  │ 🐦 Twitter           →   │ │
│  └──────────────────────────┘ │
│  ┌──────────────────────────┐ │
│  │ 👥 Facebook          →   │ │
│  └──────────────────────────┘ │
│  ┌──────────────────────────┐ │
│  │ 📹 YouTube           →   │ │
│  └──────────────────────────┘ │
│  ┌──────────────────────────┐ │
│  │ 🎵 TikTok            →   │ │
│  └──────────────────────────┘ │
│  ┌──────────────────────────┐ │
│  │ 🎬 IMDb              →   │ │
│  └──────────────────────────┘ │
└────────────────────────────────┘

Features:
- Colored icons (brand colors)
- External link indicator
- Opens in new tab
- Only shows available platforms
```

---

## 5. ActorImageGallery Component

### Grid View:
```
┌──────────────────────────────────────────────────────────────┐
│  ┌──────────┬──────────┬──────────┬──────────┐              │
│  │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │              │
│  │ │Photo │ │ │Photo │ │ │Photo │ │ │Photo │ │              │
│  │ │ 2:3  │ │ │ 2:3  │ │ │ 2:3  │ │ │ 2:3  │ │              │
│  │ │      │ │ │      │ │ │      │ │ │      │ │              │
│  │ │ ⭐9.2│ │ │ ⭐8.8│ │ │ ⭐8.5│ │ │ ⭐9.0│ │              │
│  │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │              │
│  └──────────┴──────────┴──────────┴──────────┘              │
│  ┌──────────┬──────────┬──────────┬──────────┐              │
│  │ ...more photos in grid...                  │              │
│  └──────────┴──────────┴──────────┴──────────┘              │
└──────────────────────────────────────────────────────────────┘
```

### Modal View:
```
┌──────────────────────────────────────────────────────────────┐
│  ╔════════════════════════════════════════════════════════╗  │
│  ║ ✕ Close                                                ║  │
│  ║                                                        ║  │
│  ║    ◀                                              ▶    ║  │
│  ║         ┌──────────────────────────────┐              ║  │
│  ║         │                              │              ║  │
│  ║         │                              │              ║  │
│  ║         │      Full Size Image         │              ║  │
│  ║         │      (Original Quality)      │              ║  │
│  ║         │                              │              ║  │
│  ║         │                              │              ║  │
│  ║         └──────────────────────────────┘              ║  │
│  ║                                                        ║  │
│  ║  Photo 3 of 15          ⭐ 9.2 (156 votes)   ⬇ Download║  │
│  ╚════════════════════════════════════════════════════════╝  │
└──────────────────────────────────────────────────────────────┘

Features:
- Black background
- Previous/Next buttons
- Image counter
- Rating display
- Download button
- Escape to close
```

---

## 6. ActorCard Component

### Full Card:
```
┌──────────────────────────┐
│  ┌────────────────────┐  │
│  │                    │  │
│  │   Profile Photo    │  │
│  │      (2:3)         │  │
│  │                    │  │
│  │                    │  │
│  └────────────────────┘  │
│  Name: Margot Robbie     │
│  Badge: [Actress]        │
│                          │
│  🎬 Known for:           │
│  • Barbie         ⭐8.7 │
│  • Wolf of Wall   ⭐8.2 │
│  • Suicide Squad  ⭐7.5 │
│                          │
│  ──────────────────────  │
│  Popularity: 87.5        │
└──────────────────────────┘

Hover: Scale + shadow
Click: Navigate to /actor/[id]
```

### Compact Card:
```
┌────────────────────────────────────┐
│ ┌────┐  Name: Tom Hanks            │
│ │    │  Badge: [Actor]             │
│ │ 👤 │  Known for: Forrest Gump,   │
│ │    │  Saving Private Ryan        │
│ └────┘                              │
└────────────────────────────────────┘

Used in: Horizontal lists, search results
```

---

## 7. Popular Actors Page

```
┌──────────────────────────────────────────────────────────────┐
│  Popular Actors                                               │
│  Discover the most popular actors and actresses in cinema.   │
│                                                               │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐   │
│  │ActorCard │ActorCard │ActorCard │ActorCard │ActorCard │   │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘   │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐   │
│  │ActorCard │ActorCard │ActorCard │ActorCard │ActorCard │   │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘   │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐   │
│  │ActorCard │ActorCard │ActorCard │ActorCard │ActorCard │   │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘   │
│                                                               │
│       [← Previous]  Page 1 of 500  [Next →]                  │
└──────────────────────────────────────────────────────────────┘

Grid: 2 cols mobile | 3 tablet | 4 desktop | 5 xl
Pagination: Server-side
URL: /actors/popular?page=1
```

---

## 8. Actor Search Page

```
┌──────────────────────────────────────────────────────────────┐
│  Search Actors                                                │
│  Find your favorite actors and actresses.                    │
│                                                               │
│  ┌──────────────────────────────────────────┐                │
│  │ 🔍 Search for actors...                  │ [Search]       │
│  └──────────────────────────────────────────┘                │
│                                                               │
│  Found results for "Tom Hanks"                               │
│                                                               │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐   │
│  │ActorCard │ActorCard │ActorCard │ActorCard │ActorCard │   │
│  │Tom Hanks │Tom Hardy │...       │...       │...       │   │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘   │
│                                                               │
│       [← Previous]  Page 1 of 5  [Next →]                    │
└──────────────────────────────────────────────────────────────┘

States:
- Empty: Search icon + prompt
- Loading: Spinner animation
- Results: Actor grid + pagination
- No results: "No actors found" message
```

---

## 9. Updated Cast Card (Movie Page)

### Before:
```
┌──────────────┐
│ ┌──────────┐ │
│ │  Photo   │ │ Non-clickable
│ └──────────┘ │
│ Name         │
│ Character    │
└──────────────┘
```

### After:
```
┌──────────────┐
│ ┌──────────┐ │ ← Clickable! Links to /actor/[id]
│ │  Photo   │ │
│ └──────────┘ │
│ Name         │ ← Hover: text-primary
│ Character    │
└──────────────┘

Features:
- Wrapped in Link component
- Cursor pointer
- Hover shadow effect
- Smooth transitions
```

---

## 📱 Responsive Breakpoints

### Mobile (< 768px)
- **Profile:** Stacked layout (photo → content → sidebar)
- **Filmography:** 2 columns
- **Gallery:** 2 columns
- **Actor Grid:** 2 columns

### Tablet (768px - 1024px)
- **Profile:** Sidebar + content (30/70)
- **Filmography:** 3 columns
- **Gallery:** 3 columns
- **Actor Grid:** 3 columns

### Desktop (1024px - 1280px)
- **Profile:** Sidebar + content (25/75)
- **Filmography:** 4 columns
- **Gallery:** 4 columns
- **Actor Grid:** 4 columns

### XL (> 1280px)
- **Profile:** Sidebar + content (20/80)
- **Filmography:** 4 columns
- **Gallery:** 4 columns
- **Actor Grid:** 5 columns

---

## 🎨 Color Scheme

### Buttons
- **Follow:** Primary color (purple)
- **Unfollow:** Outline style
- **Share:** Outline style
- **External Links:** Outline style

### Badges
- **Rating:** Yellow star + black background
- **Department:** Secondary badge
- **Known For:** Secondary badge

### Social Icons (Brand Colors)
- **Instagram:** Pink (#E1306C)
- **Twitter:** Blue (#1DA1F2)
- **Facebook:** Dark Blue (#4267B2)
- **YouTube:** Red (#FF0000)
- **TikTok:** Black/White
- **IMDb:** Yellow (#F5C518)

---

## ⚡ Animations & Interactions

### Hover Effects
- **Cards:** Scale 1.05 + shadow
- **Buttons:** Slight brighten
- **Images:** Scale 1.05 (inside container)

### Loading States
- **Follow Button:** Spinner + disabled
- **Search:** Loader animation
- **Pagination:** Disabled state

### Transitions
- **Scale:** 200ms ease
- **Color:** 300ms ease
- **Shadow:** 200ms ease

---

## 🔗 Navigation Flow

```
Movie Page
    ↓ (Click cast card)
Actor Profile
    ↓ (Browse filmography)
Movie Page
    ↓ (Click another cast)
Actor Profile
    ↓ (Click social link)
External Social Platform

Search Page
    ↓ (Enter query)
Search Results
    ↓ (Click actor)
Actor Profile

Popular Page
    ↓ (Browse grid)
Actor Profile
```

---

## 📊 Data Flow

```
User Action
    ↓
Client Component (onClick)
    ↓
Server Action (app/actions/actors.ts)
    ↓
┌─────────────┬──────────────┐
│ TMDB API    │  Supabase DB │
│ (Actor Data)│  (Follows)   │
└─────────────┴──────────────┘
    ↓
Server Action Returns
    ↓
Client Component State Update
    ↓
UI Re-renders
```

---

## 🎯 Key User Journeys

### 1. Discover & Follow Actor
```
1. View movie → Click cast card
2. View actor profile → Read bio
3. Click "Follow" button
4. See follower count increase
5. Browse filmography
6. Click movie from filmography
```

### 2. Search for Actor
```
1. Go to /actors/search
2. Type actor name
3. Press Enter
4. View results
5. Click actor
6. Follow actor
```

### 3. Explore Social Media
```
1. View actor profile
2. Scroll to social links sidebar
3. Click Instagram/Twitter/etc
4. Opens in new tab
5. View actor's official social profile
```

---

## 📐 Component Size Reference

| Component | Width | Height | Aspect Ratio |
|-----------|-------|--------|--------------|
| Profile Photo | 256px | 320px | 4:5 |
| Movie Poster | Variable | Variable | 2:3 |
| Cast Card Photo | 150px | 225px | 2:3 |
| Actor Card Photo | Variable | Variable | 2:3 |
| Gallery Photo | Variable | Variable | 2:3 |
| Compact Photo | 64px | 96px | 2:3 |

---

## 🖼️ Image URLs

### TMDB Image Base URL
```
https://image.tmdb.org/t/p/{size}{file_path}
```

### Sizes Used
- **w185** - Cast cards, compact cards
- **w342** - Actor cards
- **w500** - Profile photos, gallery thumbnails
- **original** - Fullscreen gallery modal

### Examples
```javascript
// Profile photo
`https://image.tmdb.org/t/p/w500/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg`

// Gallery original
`https://image.tmdb.org/t/p/original/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg`

// Poster
`https://image.tmdb.org/t/p/w342/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg`
```

---

## 🎬 Example Actors for Testing

| Actor | TMDB ID | URL | Known For |
|-------|---------|-----|-----------|
| Christopher Nolan | 525 | `/actor/525` | Director |
| Leonardo DiCaprio | 6193 | `/actor/6193` | Actor |
| Margot Robbie | 234352 | `/actor/234352` | Actress |
| Tom Hanks | 31 | `/actor/31` | Actor |
| Cillian Murphy | 2037 | `/actor/2037` | Actor |

---

**This guide provides a complete visual reference for all actor-related components in CineVerse! 🎬**
