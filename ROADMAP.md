# KnowFlow Development Roadmap

## Project Overview

**KnowFlow** is an AI-assisted question-routing app built with Next.js (Pages Router), designed to be minimal, practical, and developer-friendly. The app routes questions to appropriate moderators/experts using AI detection while maintaining simplicity and readability.

---

## Technology Stack

### Core Technologies

- **Framework**: Next.js with App Router (JavaScript, not TypeScript)
- **Database**: MongoDB + Mongoose
- **Authentication**: Auth.js (NextAuth v5) with MongoDB integration
- **Password Hashing**: bcryptjs with pre-save middleware
- **Email**: Nodemailer with background processing
- **Background Jobs**: Inngest (for email and AI processing)
- **AI Integration**: Google Gemini API
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui components as base primitives

### Development Philosophy

- Keep it minimal and practical - no over-engineering
- No microservices or complicated abstractions
- Simple, readable, developer-made feel
- Reuse shadcn/ui components with small custom wrappers
- Store only text in DB (files/links as text URLs)

---

## Phase 1: Project Setup & Foundation ✅

### 1.1 Initial Setup Commands ✅

```bash
# Project initialization (completed)
npx create-next-app@latest knowflow

# Core dependencies installed ✅
npm install mongoose nodemailer inngest @google/genai
npm install next-auth @next-auth/mongodb-adapter
npm install bcryptjs jsonwebtoken

# Development dependencies (completed) ✅
npm install -D @tailwindcss/postcss tailwindcss

# Setup shadcn/ui (completed) ✅
npx shadcn-ui@latest init
npx shadcn-ui@latest add input button form card label
```

### 1.2 Environment Configuration ✅

Create `.env.local` with:

```env
MONGODB_URI=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
EMAIL_SERVER_HOST=
EMAIL_SERVER_PORT=
EMAIL_SERVER_USER=
EMAIL_SERVER_PASS=
EMAIL_FROM=
GOOGLE_GEMINI_API_KEY=
INNGEST_API_KEY= # optional
```

---

## Phase 2: Database & Core Infrastructure ✅

### 2.1 Database Connection ✅

**File**: `/src/lib/mongodb.js`

- ✅ Minimal mongoose connection helper
- ✅ Export `connectDB()` and `disconnectDB()`
- ✅ Handle connection reuse and error management

### 2.2 User Model ✅

**File**: `/src/models/User.js`

```js
// Mongoose user schema (implemented) ✅
{
  name: String (required, trim),
  email: String (required, unique, lowercase, trim),
  password: String (required), // bcrypt hashed
  role: Enum ['user','moderator','admin'] (default: 'user'),
  skills: [String] (default: []), // managed by admin only
  approved: Boolean (default: false), // admin approval for moderators
  verified: Boolean (default: false), // email verification
  verificationToken: String,
  createdAt: Date (default: Date.now)
}
```

### 2.3 Authentication Configuration ✅

**File**: `/auth.js` (root level)

- ✅ Auth.js configuration with GitHub and Google OAuth
- ✅ MongoDB integration for user management  
- ✅ Custom user creation for OAuth users
- ✅ Session and JWT configuration

---

## Phase 3: Authentication System ✅

### 3.1 Auth.js Configuration ✅

**File**: `/auth.js`

- ✅ Configure GitHub and Google OAuth providers
- ✅ Custom signIn callback for user creation
- ✅ JWT and session callbacks for custom fields
- ✅ Pages configuration for custom sign-in/sign-up

### 3.2 Custom Registration API ✅

**File**: `/src/app/api/auth/register/route.js`

- ✅ Accept: `{ name, email, password }` (skills removed from signup)
- ✅ Validate input with proper error handling
- ✅ Hash password with bcryptjs pre-save middleware
- ✅ Create user with `verified: false`, `approved: false`
- ✅ Generate verification token
- ✅ Trigger email verification (non-blocking)

### 3.3 Email Verification ✅

**File**: `/src/app/api/auth/verify-email/route.js`

- ✅ GET route with `?token=...`
- ✅ Find user by verification token
- ✅ Set `verified: true`, clear token
- ✅ Send welcome email on verification
- ✅ Return success response

### 3.4 JWT Authentication ✅

- ✅ `/src/app/api/auth/login/route.js` - JWT login endpoint
- ✅ `/src/app/api/auth/me/route.js` - Protected user profile endpoint
- ✅ `/src/app/api/auth/logout/route.js` - Logout endpoint
- ✅ `/src/lib/auth-middleware.js` - JWT verification middleware
- ✅ Support for both JWT and OAuth sessions

---

## Phase 4: Client-Side Authentication & UI ✅

### 4.1 Registration Page ✅

**File**: `/src/app/signup/page.jsx` & `/src/components/signup-form.jsx`

- ✅ Use shadcn Input + Button components
- ✅ Form fields: name, email, password, confirmPassword (skills removed)
- ✅ POST to `/api/auth/register` endpoint
- ✅ GitHub and Google OAuth buttons
- ✅ Client-side validation with error handling
- ✅ Success messages and auto-redirect

### 4.2 Login Page ✅

**File**: `/src/app/login/page.jsx` & `/src/components/login-form.jsx`

- ✅ Use shadcn form components
- ✅ Support both JWT login and OAuth (GitHub/Google)
- ✅ Redirect to `/dashboard` on success
- ✅ Proper error handling and loading states

### 4.3 Dashboard ✅

**File**: `/src/app/dashboard/page.jsx`

- ✅ Protected route with authentication check
- ✅ Role-based content display
- ✅ User profile information
- ✅ Skills display (admin-managed)
- ✅ Quick action buttons (placeholder)

### 4.4 Landing Page & Navigation ✅

**Files**: `/src/app/page.jsx` & `/src/components/navbar.jsx`

- ✅ Beautiful responsive landing page
- ✅ Gradient design with blue/purple theme
- ✅ Hero section with clear value proposition
- ✅ Features showcase
- ✅ How it works section
- ✅ Responsive navigation with auth state
- ✅ Mobile-friendly design

### 4.5 Authentication Context ✅

**File**: `/src/lib/auth-context.js`

- ✅ React context for auth state management
- ✅ Support for both JWT and OAuth users
- ✅ Custom hooks for authentication checks
- ✅ Centralized auth logic

---

## Phase 5: API Services & Utilities ✅

### 5.1 API Service Layer ✅

**File**: `/src/lib/api-service.js`

- ✅ Centralized API service for all HTTP requests
- ✅ JWT token management (localStorage)
- ✅ User state management
- ✅ Simple methods for auth operations
- ✅ Error handling and request configuration

### 5.2 Email Service ✅

**File**: `/src/lib/email.js`

- ✅ Nodemailer configuration with transporter
- ✅ Email verification functionality
- ✅ Welcome email after verification
- ✅ Test email configuration utility
- ✅ Error handling and logging

### 5.3 AI Integration (Gemini) ✅

**File**: `/src/lib/gemini.js`

- ✅ Google Gemini API integration
- ✅ Question analysis for skill matching
- ✅ Question summary generation
- ✅ Fallback mechanisms for API failures
- ✅ Skills-based routing logic

---

## Phase 6: AI Integration & Question Routing

### 5.1 AI Helper Module

**File**: `/lib/ai.js`

```js
// TODO: Implement OpenAI integration
async function detectStackAndFixGrammar(text) {
  // TODO: call OpenAI API
  // TODO: return { languages: [], frameworks: [], cleanedText }
  return { languages: [], frameworks: [], cleanedText: text };
}
```

### 5.2 Ticket Submission API

**File**: `/pages/api/tickets/submit.js`

- Accept user text input
- Call `detectStackAndFixGrammar` (placeholder)
- Return suggested assignment (empty for now)
- Store as temporary object or log

---

## Phase 6: UI Components & Styling

### 6.1 shadcn/ui Integration

**Directory**: `/components/ui/`

- Small custom wrappers around shadcn primitives
- Keep components reusable and minimal
- Base components: Input, Button, Form

### 6.2 Layout & Styling

- Minimal layout with simple header
- Login/signup navigation links
- Container with max-width
- Tailwind CSS for all styling
- Clean, developer-friendly design

---

## Phase 7: Email & Background Processing

### 7.1 Email Service

- Nodemailer configuration
- Verification email templates
- Background processing via Inngest or `setImmediate`
- Non-blocking email sending

### 7.2 Background Jobs

- Inngest event triggers for:
  - Email verification sending
  - AI processing (future)
  - Notification system (future)

---

## NextAuth.js Implementation Notes

### Why NextAuth.js

- **Built-in Session Management**: Automatic session handling and refresh
- **Security Best Practices**: CSRF protection, secure cookies, JWT rotation
- **MongoDB Integration**: Seamless adapter for user and session storage
- **Email Verification**: Built-in email provider support
- **Extensibility**: Easy to add OAuth providers later (Google, GitHub, etc.)
- **Community Support**: Well-maintained with extensive documentation

### Key Implementation Points

- Use MongoDB adapter for session persistence
- Custom Credentials provider for email/password authentication
- Custom registration flow outside of NextAuth.js for role/skill collection
- Session callbacks to include custom user fields (role, skills, approved)
- Protected routes using `getServerSession()` in `getServerSideProps`

---

## Future Development Phases (TODOs)

### Phase 8: Ticket System

- [ ] Create Ticket model with MongoDB schema
- [ ] Implement ticket assignment logic
- [ ] Add ticket status management
- [ ] Create ticket list/detail views

### Phase 9: AI Integration (Full Implementation)

- [ ] Implement OpenAI detection in `/lib/ai.js`
- [ ] Add grammar correction functionality
- [ ] Integrate tech stack detection
- [ ] Add confidence scoring for assignments

### Phase 10: Advanced Features

- [ ] Admin UI for moderator approval
- [ ] Manual ticket assignment interface
- [ ] Ticket filtering and pagination
- [ ] Search functionality
- [ ] Email notification system

### Phase 11: Moderation & Audit

- [ ] Moderation audit logs
- [ ] Response quality tracking
- [ ] User feedback system
- [ ] Performance analytics

### Phase 12: Enhancement & Optimization

- [ ] File upload support (stored as URLs)
- [ ] Real-time notifications
- [ ] Advanced routing algorithms
- [ ] Mobile responsiveness
- [ ] Performance optimizations

---

## Development Guidelines

### Code Quality

- Prefer clarity over cleverness
- Keep functions small and well-commented
- Mark all TODOs clearly
- Handle async/await errors properly
- Close DB connections appropriately

### Security Best Practices

- Store JWT_SECRET in environment variables
- Use HTTP-only cookies for authentication
- Hash passwords with bcrypt
- Validate all user inputs
- Sanitize data before database operations

### Testing Strategy

- Unit tests for utility functions
- Integration tests for API routes
- E2E tests for critical user flows
- Manual testing for UI components

---

## File Structure Summary

``` markdown
lib/
├── mongodb.js          # Database connection helper
└── ai.js              # AI integration (placeholder)

models/
└── User.js            # Mongoose user schema

pages/
├── api/
│   ├── auth/
│   │   ├── [...nextauth].js  # NextAuth.js configuration
│   │   ├── register.js      # Custom user registration
│   │   └── verify-email.js  # Email verification
│   └── tickets/
│       └── submit.js  # Ticket submission (placeholder)
├── signup.jsx         # Registration page
├── signin.jsx         # Login page (NextAuth.js convention)
├── pending-approval.jsx # Approval waiting page
└── dashboard.jsx      # User dashboard

components/
└── ui/                # shadcn/ui component wrappers
```

---

## Success Metrics

### Phase 1 Success Criteria

- [ ] Project setup complete with all dependencies
- [ ] Database connection established
- [ ] Authentication flow working end-to-end
- [ ] Basic UI components functional
- [ ] Email verification system operational

### Long-term Success Criteria

- [ ] Full AI-powered question routing
- [ ] Efficient moderator assignment system
- [ ] Comprehensive admin panel
- [ ] Scalable background job processing
- [ ] Production-ready deployment

---

This roadmap provides a clear, step-by-step approach to building KnowFlow with NextAuth.js as the authentication solution while maintaining simplicity and allowing for future enhancements. The modular structure allows for iterative development with modern authentication best practices built-in from the start.
