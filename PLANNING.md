# Flyer Builder - Project Planning Document

## Project Overview

A web application for realtors partnered with Katalyst Team loan officers to create branded property flyers featuring the Kickstart mortgage program incentive.

**Core Flow:** Realtor requests access → LO approves → Realtor completes profile → Realtor creates flyers → Downloads PDF/Instagram versions

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Hosting | Vercel |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| File Storage | Supabase Storage |
| PDF Generation | @react-pdf/renderer |
| Image Generation | html-to-image |
| Photo Cropping | react-image-crop |
| Styling | Tailwind CSS |

---

## Database Schema

### Table: `loan_officers`
LOs are added manually by admin. They don't sign up - they're pre-configured when joining Katalyst Team.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| created_at | timestamp | Auto-generated |
| email | text | Contact email |
| name | text | Full name |
| phone | text | Contact phone |
| nmls_number | text | NMLS license number |
| headshot_url | text | URL to photo in Supabase Storage |
| qr_code_url | text | URL to their calculator QR code |
| calculator_url | text | Their specific calculator page URL |
| website_url | text | thekatalystteam.com or personal site |
| webhook_url | text | GHL webhook for notifications |
| is_active | boolean | Can be deactivated without deletion |

### Table: `brokerages`
Pre-loaded library of common brokerage logos.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | e.g., "Keller Williams", "RE/MAX" |
| logo_url | text | URL to logo in Supabase Storage |
| is_active | boolean | Show in selection list |

### Table: `realtors`
Created when realtor requests access. Starts as pending, then approved, then completes onboarding.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| created_at | timestamp | When they requested access |
| user_id | uuid | References auth.users (created after approval) |
| loan_officer_id | uuid | References loan_officers |
| email | text | Contact/login email |
| name | text | Full name |
| phone | text | Contact phone |
| license_number | text | Real estate license |
| team_name | text | e.g., "THE REAL ESTATE HOUND" (optional) |
| headshot_url | text | URL to photo in Supabase Storage |
| brokerage_id | uuid | References brokerages (nullable) |
| custom_brokerage_logo_url | text | If they upload their own logo |
| website_url | text | Their website |
| approval_status | text | 'pending', 'approved', 'denied' |
| approved_at | timestamp | When LO approved them |
| approved_by | uuid | Which LO approved them |
| onboarding_completed | boolean | Have they filled out their profile? |

### Table: `flyers`
Each saved flyer with all property data and calculated values.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| created_at | timestamp | When created |
| updated_at | timestamp | Last modified |
| realtor_id | uuid | References realtors |
| status | text | 'draft', 'active', 'archived' |
| template_id | text | Which layout template (for future) |
| **Property Details** | | |
| property_address | text | Street address |
| property_city | text | City |
| property_state | text | State |
| property_zip | text | ZIP code |
| property_price | integer | Price in dollars |
| bedrooms | integer | Number of beds |
| bathrooms | numeric | Number of baths (allows 2.5) |
| square_footage | integer | Square feet |
| property_photo_url | text | URL to uploaded photo |
| photo_position_x | numeric | Horizontal position (0-100%) |
| photo_position_y | numeric | Vertical position (0-100%) |
| photo_zoom | numeric | Zoom/scale level (1 = 100%) |
| **Calculated Values** | | |
| interest_rate | numeric | Rate used for calculation |
| down_payment_percent | numeric | Down payment % used |
| loan_amount | integer | Calculated loan amount |
| standard_payment | numeric | Monthly P&I at standard rate |
| kickstart_payment | numeric | Monthly P&I at reduced rate |
| monthly_savings | numeric | Difference per month |
| annual_savings | numeric | Yearly savings (capped at $6,000) |
| lender_credit | numeric | Credit amount shown |

### Table: `flyer_downloads`
Track downloads for basic analytics (optional, Phase 4).

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| flyer_id | uuid | References flyers |
| downloaded_at | timestamp | When downloaded |
| format | text | 'pdf', 'instagram_post', 'instagram_story' |

---

## File Structure

```
flyerbuilder/
├── app/
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Landing page (public)
│   ├── globals.css                   # Global styles
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx            # Login form
│   │   ├── signup/page.tsx           # Request access form
│   │   └── callback/route.ts         # Supabase auth callback
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Dashboard layout (checks auth)
│   │   ├── onboarding/page.tsx       # Realtor profile setup
│   │   │
│   │   ├── realtor/
│   │   │   ├── page.tsx              # Realtor dashboard (flyer list)
│   │   │   ├── profile/page.tsx      # Edit profile
│   │   │   └── flyers/
│   │   │       ├── new/page.tsx      # Create new flyer
│   │   │       └── [id]/
│   │   │           ├── page.tsx      # View flyer
│   │   │           └── edit/page.tsx # Edit flyer
│   │   │
│   │   └── lo/
│   │       ├── page.tsx              # LO dashboard (overview)
│   │       ├── pending/page.tsx      # Pending access requests
│   │       └── realtors/
│   │           ├── page.tsx          # All realtors list
│   │           └── [id]/page.tsx     # Specific realtor's flyers
│   │
│   └── api/
│       ├── webhooks/
│       │   └── route.ts              # Incoming webhooks (if needed)
│       ├── generate-pdf/
│       │   └── route.ts              # PDF generation endpoint
│       └── generate-image/
│           └── route.ts              # Instagram image generation
│
├── components/
│   ├── ui/                           # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   │
│   ├── flyer/
│   │   ├── FlyerForm.tsx             # Property input form
│   │   ├── FlyerPreview.tsx          # Live preview component
│   │   ├── PropertyPhotoUpload.tsx   # Photo upload + crop
│   │   ├── PaymentComparison.tsx     # The comparison box
│   │   ├── SavingsBreakdown.tsx      # Savings display box
│   │   └── templates/
│   │       ├── Template1.tsx         # Main template (from reference)
│   │       └── index.ts              # Template registry
│   │
│   ├── dashboard/
│   │   ├── FlyerCard.tsx             # Flyer thumbnail in grid
│   │   ├── RealtorCard.tsx           # Realtor in LO's list
│   │   ├── PendingRequestCard.tsx    # Access request card
│   │   └── StatsCard.tsx             # Analytics card
│   │
│   └── layout/
│       ├── Navbar.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # Server client
│   │   └── middleware.ts             # Auth middleware
│   │
│   ├── calculator/
│   │   └── kickstart.ts              # Mortgage calculation logic
│   │
│   ├── pdf/
│   │   └── generate.ts               # PDF generation logic
│   │
│   ├── image/
│   │   └── generate.ts               # Instagram image generation
│   │
│   └── utils/
│       ├── formatters.ts             # Currency, phone formatting
│       └── validators.ts             # Input validation
│
├── types/
│   └── database.ts                   # TypeScript types for all tables
│
├── public/
│   ├── logos/
│   │   ├── ethos.png                 # ETHOS Lending logo
│   │   └── katalyst.png              # Katalyst Team logo
│   └── fonts/                        # Any custom fonts for PDF
│
├── supabase/
│   └── migrations/                   # Database migration files
│       └── 001_initial_schema.sql
│
└── config files...
    ├── package.json
    ├── tailwind.config.js
    ├── next.config.js
    └── .env.local                    # Supabase keys (not committed)
```

---

## Build Phases

### Phase 1: Foundation
**Goal:** Create a flyer and download it as PDF. Ugly is fine. Prove it works.

- [ ] Initialize Next.js project with TypeScript and Tailwind
- [ ] Set up Supabase project (database + auth + storage)
- [ ] Create database tables (loan_officers, realtors, flyers)
- [ ] Build basic auth (login/signup pages, no approval flow yet)
- [ ] Create flyer form (property details input)
- [ ] Build flyer preview component (matches reference design)
- [ ] Implement calculator logic (standard vs kickstart payment)
- [ ] Add PDF generation (download button works)
- [ ] Deploy to Vercel
- [ ] Test end-to-end: login → create flyer → download PDF

**Deliverable:** Working prototype where you can log in, enter property details, see preview, download PDF.

---

### Phase 2: User System
**Goal:** Proper roles, approval workflow, realtor profiles.

- [ ] Add user roles (LO vs Realtor) via Supabase
- [ ] Build "Request Access" flow (name + email submission)
- [ ] Create LO dashboard with pending requests list
- [ ] Build approve/deny functionality
- [ ] Send webhook to GHL on approval (LO-specific)
- [ ] Create realtor onboarding flow (profile setup)
- [ ] Add headshot upload with crop/reposition
- [ ] Add brokerage selection (library + custom upload)
- [ ] Build realtor profile edit page
- [ ] Seed brokerages table with common logos
- [ ] Add first LO(s) to database for testing

**Deliverable:** Full user lifecycle works - request access, get approved, complete profile, create flyers.

---

### Phase 3: Flyer Management
**Goal:** Save, edit, organize flyers. Polish the experience.

- [ ] Save flyers to database (draft/active status)
- [ ] Build realtor dashboard (grid of saved flyers)
- [ ] Add flyer edit functionality
- [ ] Add archive/unarchive feature
- [ ] Add search by address
- [ ] Property photo upload with crop/reposition
- [ ] Store photo position data in database
- [ ] Make preview update live as user types
- [ ] LO can view any realtor's flyers
- [ ] LO can edit any realtor's flyers

**Deliverable:** Realtors can manage multiple flyers, come back and edit them, organize their work.

---

### Phase 4: Instagram + Polish
**Goal:** Instagram versions, captions, better UX.

- [ ] Generate Instagram Post image (1080x1080)
- [ ] Generate Instagram Story image (1080x1920)
- [ ] Design IG-specific layouts (may differ from PDF)
- [ ] Auto-generate Instagram caption
- [ ] Add "Copy Caption" button
- [ ] Improve PDF quality/styling
- [ ] Add multiple template options
- [ ] Half-page flyer version
- [ ] Basic analytics on LO dashboard

**Deliverable:** Full product with all download formats, ready for real use.

---

### Phase 5: Nice-to-Haves (Future)
Not building now, but architecture supports these:

- [ ] Zillow/Realtor.com link auto-fill
- [ ] Direct Instagram posting via API
- [ ] Additional mortgage programs (beyond Kickstart)
- [ ] QR code scan tracking
- [ ] Batch flyer creation from CSV
- [ ] Detailed analytics dashboard

---

## Key Technical Decisions

### Authentication Flow
1. User visits /signup → enters name + email
2. Creates `realtors` record with `approval_status: 'pending'`
3. Webhook fires to GHL (alerts the appropriate LO)
4. LO logs in → sees pending request → approves
5. System creates Supabase auth user, sends invite email
6. Realtor clicks email link → sets password → redirected to onboarding
7. Realtor completes profile → `onboarding_completed: true`
8. Realtor can now access dashboard and create flyers

### Calculator Integration
- Calculator logic lives in `/lib/calculator/kickstart.ts`
- Same math as existing calculator at thekatalystteam.com/kickstart
- **Interest rate is auto-fetched** from API (+ 10 bps) - realtors cannot edit it
- Rate is fetched when creating a new flyer and stored with the flyer
- If API is down, fall back to last known rate or default (6.99%)
- Results stored in flyer record (snapshot at time of creation)
- Realtors who want to explore rate scenarios should use the main calculator

### Photo Repositioning
- Use `react-image-crop` for crop/zoom UI
- Store position as x%, y%, zoom in database
- On PDF/image generation, apply same transform
- Same system for realtor headshot and property photo

### Flyer Templates
- Each template is a React component
- Receives same props (property data, realtor data, LO data, calculations)
- Template1 matches the reference image layout
- Adding templates = adding new components, selecting from dropdown

### GHL Webhook Integration
- Each LO has their own `webhook_url` in database
- On realtor approval: POST to that LO's webhook
- On flyer creation: optional webhook (can add later)
- Keeps notifications LO-specific automatically

---

## Environment Variables Needed

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## Questions to Resolve During Build

1. ~~**Exact calculator formula**~~ - DONE: Extracted to `/lib/calculator/kickstart.ts`
2. **Font choices for PDF** - Need to match brand guidelines
3. **Color hex codes** - Extract from brand assets (ethos-tan: #FAF5F0, ethos-brown: #403e36)
4. ~~**Default interest rate source**~~ - DONE: API (api-ninjas.com) + 10 bps, auto-fetched, not editable by realtors
5. **Image quality requirements** - Minimum resolution for uploads

---

## Reference

**Sample Flyer Layout (from provided image):**
- Top ~35%: Property photo (edge to edge)
- ETHOS logo: top right corner (circular, overlaid on photo)
- Realtor team name: top left (overlaid on photo)
- Price banner: bottom of photo ("FOR SALE: $XXX,XXX")
- Headline: "KATALYST KICKSTART / 1% RATE REDUCTION"
- Address + bed/bath/sqft line
- Payment comparison box (standard vs kickstart)
- Savings breakdown box (monthly, annual, lender credit)
- "$6,000 Program Maximum" note
- Disclaimer text
- Bottom bar: Realtor photo + info (left), Katalyst info (right), QR code (far right)

---

## Next Steps

1. Review this document, confirm it matches your vision
2. Start Phase 1: Initialize project and set up infrastructure
3. Get Supabase project created and connected
4. Build first working flyer
