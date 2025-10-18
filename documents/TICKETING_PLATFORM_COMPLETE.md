# 🎫 Ticketing Platform Integration - TMDB + Theater Database Approach

## Implementation Strategy

Since direct API access to BookMyShow, Paytm Insider, etc. requires commercial partnerships, we're implementing a **hybrid approach** using:

1. **TMDB Release Dates API** - Get theatrical release information
2. **Custom Theater Database** - Store real theater data with audience classification
3. **External Booking Links** - Redirect to official theater websites for final booking

---

## ✅ What's Been Implemented

### 1. **Database Schema** (`supabase/theaters_ticketing.sql`)

#### Tables Created:
- ✅ `cities` - Major cities with coordinates (12 cities: Mumbai, Delhi, Bangalore, etc.)
- ✅ `theater_chains` - PVR, INOX, Cinépolis, Carnival, AMC, Regal, etc.
- ✅ `theaters` - Individual theater locations with audience classification
- ✅ `movie_releases` - TMDB release data by country
- ✅ `showtimes` - Show timings with dynamic pricing
- ✅ `bookings` - User booking tracking (optional)

#### Key Features:
- **Audience Type Integration** - Every theater classified as high_class/celebration/normal
- **Dynamic Pricing** - Prices automatically adjusted based on audience type
- **Amenities Tracking** - IMAX, 4DX, Dolby Atmos, recliners, parking, etc.
- **Location-Based Search** - Find theaters within radius using coordinates
- **RLS Policies** - Secure data access with Row Level Security

#### Helper Functions:
```sql
- get_theaters_by_city_and_type() 
- get_showtimes_for_movie()
- search_nearby_theaters() -- Within radius
```

---

### 2. **TypeScript Types** (`types/theater.ts`)

```typescript
- City
- TheaterChain
- Theater
- TheaterAmenities
- MovieRelease
- Showtime
- Booking
- TheaterSearchParams
- ShowtimeSearchParams
- TheaterWithDetails
- ShowtimeWithDetails
```

---

### 3. **TMDB API Integration** (`lib/tmdb/client.ts`)

#### New Functions:
```typescript
// Get release dates by region
getMovieReleaseDates(movieId: number)

// Check if movie is currently in theaters
isMoviePlayingInRegion(movieId: number, region: string = 'IN'): boolean
```

#### Logic:
- Fetches release dates from TMDB
- Filters for theatrical releases (type 3)
- Checks if released within last 3 months
- Returns true if "currently playing"

---

### 4. **Server Actions** (`app/actions/theaters.ts`)

#### Functions:
```typescript
✅ getCities() 
✅ getTheaterById(theaterId)
✅ searchTheaters(params) 
✅ getTheatersByCity(cityId, audienceType?)
✅ getShowtimesForMovie(params)
✅ getShowtimesForTheater(theaterId, date?)
✅ createBooking(showtimeId, numSeats, totalPrice)
✅ getUserBookings()
✅ searchNearbyTheaters(lat, lng, radius, audienceType?)
```

---

## 📊 Sample Data Included

### Cities (12 major cities):
**India:** Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad  
**International:** New York, Los Angeles, London, Toronto

### Theater Chains (7 chains):
**India:** PVR Cinemas, INOX, Cinépolis, Carnival Cinemas  
**International:** AMC Theatres, Regal Cinemas, Cinemark

### Sample Theaters (4 examples):
1. **PVR Director's Cut** - Vasant Kunj (High Class) - IMAX, Dolby, Recliners
2. **INOX Insignia** - Mumbai (High Class) - Dolby, Recliners
3. **Cinépolis Fun** - Bangalore (Celebration) - Food Court, Family
4. **PVR Priya** - Vasant Vihar (Normal) - 3D, Standard

---

## 🎯 User Flow

### Movie Detail Page → Book Tickets:

```
1. User clicks "Book Tickets" on movie page
   ↓
2. System checks if movie is playing (TMDB API)
   ↓
3. Shows "Select City" dropdown
   ↓
4. Shows "Select Theater Type" filter
   [🌟 High Class] [🎉 Celebration] [🎬 Normal]
   ↓
5. Displays theaters matching criteria
   - Grouped by audience type
   - Shows amenities (IMAX, Dolby, etc.)
   - Shows distance if location enabled
   ↓
6. User selects theater → Shows available dates/times
   ↓
7. User selects showtime → Seat selection UI
   ↓
8. "Confirm Booking" → Opens theater's official booking page
   (e.g., https://www.pvrcinemas.com/buy-tickets/...)
```

---

## 🚀 Next Steps: UI Implementation

### Pages to Create:

#### 1. **Theater Search Page** (`/theaters`)
- City selector
- Audience type filter
- Theater cards with amenities
- Distance sorting
- Map view (optional)

#### 2. **Theater Detail Page** (`/theaters/[id]`)
- Theater information
- Audience type badge
- Amenities list
- Current movies
- Showtimes
- "Book Now" button

#### 3. **Book Tickets Page** (`/movie/[id]/book`)
- Date selector
- Theater list filtered by:
  - City
  - Audience type
  - Amenities (IMAX, Dolby, etc.)
- Showtime cards with pricing
- "Book Now" → External link

#### 4. **Seat Selection Modal** (Component)
- Visual seat layout
- Price display by audience type
- Number of seats selector
- "Continue" → External booking

---

## 💰 Pricing Strategy

### Base Price × Audience Multiplier:

```typescript
High Class:  Base × 2.50 = Premium pricing
Celebration: Base × 1.75 = Mid-tier pricing
Normal:      Base × 1.00 = Standard pricing
```

### Example:
```
Base ticket price: ₹200

🌟 High Class Theater:     ₹200 × 2.50 = ₹500
🎉 Celebration Theater:    ₹200 × 1.75 = ₹350
🎬 Normal Theater:         ₹200 × 1.00 = ₹200
```

---

## 🔗 External Booking Integration

Each theater has a `booking_url` that opens the official website:

```typescript
// Example booking URLs:
PVR:        https://www.pvrcinemas.com/buy-tickets/{movie}
INOX:       https://www.inoxmovies.com/buy-tickets?movie={id}
Cinépolis:  https://www.cinepolis.co.in/buy-tickets
```

### Flow:
1. User selects showtime
2. Clicks "Book Now"
3. Opens theater's official website in new tab
4. User completes booking there
5. (Optional) User can track booking in CineVerse

---

## 📈 Future Enhancements

### Phase 2 (When API Access Available):
1. **Real-Time Availability** - Live seat availability
2. **Direct Booking** - Complete booking within CineVerse
3. **Payment Integration** - Stripe/Razorpay
4. **Booking Confirmation** - Email/SMS notifications
5. **Cancellation/Refunds** - Handle booking changes

### Phase 3 (Monetization):
1. **Affiliate Links** - Earn commission on bookings
2. **Sponsored Theaters** - Featured placement
3. **Premium Features** - Early access to bookings
4. **Group Bookings** - Special rates for celebration types

---

## 🎨 Components Needed

### Theater Components:
```
components/theaters/
  ├── theater-card.tsx          # Theater info card
  ├── theater-search.tsx        # Search & filters
  ├── theater-map.tsx           # Map view
  ├── showtime-card.tsx         # Showtime display
  ├── seat-selector.tsx         # Seat selection UI
  ├── booking-summary.tsx       # Booking details
  └── theater-amenities.tsx     # Amenity icons
```

### Filters:
```
components/filters/
  ├── city-selector.tsx         # City dropdown
  ├── date-picker.tsx           # Date selection
  └── amenity-filter.tsx        # IMAX, Dolby, etc.
```

---

## 📊 Database Population Strategy

### Option 1: Manual Entry
- Add popular theaters in major cities
- Include real theater names and addresses
- Link to official booking URLs

### Option 2: Web Scraping (Legal)
- Scrape theater lists from Google Maps
- Get addresses, coordinates, phone numbers
- Store booking URLs

### Option 3: User Contributions
- Allow users to suggest theaters
- Admin approval workflow
- Crowdsourced data

### Option 4: Google Places API
- Search "movie theaters near me"
- Get theater details
- Supplement with audience classification

---

## ✅ Current Status

### Completed:
- ✅ Database schema with 7 tables
- ✅ TypeScript types
- ✅ TMDB release date integration
- ✅ Server actions for CRUD operations
- ✅ Helper functions for search/filter
- ✅ Sample data for testing
- ✅ Audience type integration
- ✅ Dynamic pricing logic

### Ready for:
- 🔨 UI component development
- 🔨 Theater search page
- 🔨 Booking flow implementation
- 🔨 Integration with movie pages

---

## 🎯 Priority Implementation

**High Priority:**
1. Add "Book Tickets" button to movie detail page
2. Create theater search page with filters
3. Implement showtime display
4. Add external booking links

**Medium Priority:**
1. Seat selection UI (visual layout)
2. Theater detail pages
3. Booking history tracking
4. Map view for theaters

**Low Priority:**
1. Affiliate link integration
2. Advanced filters (wheelchair, parking, etc.)
3. Theater recommendations
4. User reviews of theaters

---

## 🚀 Ready to Proceed!

The backend foundation is complete. We can now:
1. Create UI components
2. Build theater search and booking pages
3. Integrate with existing movie pages
4. Test with sample data
5. Gradually add more theater data

All using **TMDB + custom theater database** approach! 🎬

---

**Files Created:**
- `supabase/theaters_ticketing.sql` - Database schema
- `types/theater.ts` - TypeScript types
- `app/actions/theaters.ts` - Server actions
- `lib/tmdb/client.ts` - Added release date functions
- `TICKETING_PLATFORM_COMPLETE.md` - This documentation

**Status:** Backend Complete | Ready for UI Implementation
