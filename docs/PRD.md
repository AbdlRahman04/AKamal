# PROJECT PRD

## 0. AI Instructions
You are acting as a Product Manager + Software Architect.
Use the provided project architecture and existing codebase as the source of truth.
Your job is to transform the project's goals, ideas, and requested features into a clear, compact, implementation-ready PRD.

Rules
- Preserve the existing architecture unless a change is explicitly required.
- Do not invent features that were not requested or reasonably required.
- Do not redesign working systems unnecessarily.
- Reuse existing components, APIs, schemas, data structures, and patterns where possible.
- Separate confirmed requirements from assumptions.
- Identify missing information as `OPEN QUESTION` rather than inventing an answer.
- Keep each feature concise and structured.
- Prefer measurable acceptance criteria over vague descriptions.
- Consider both the public website and local admin system where relevant.
- Consider static-export limitations before proposing functionality.
- Never expose server-only secrets or environment variables to the client.
- Flag anything that conflicts with the current architecture.

Output Objective
Convert the project into:
Goal → Requirements → Features → User Flows → Data → UI → API → Validation → Acceptance Criteria

---

## 1. Project Overview

**Project Name**
Abdl Rahman Kamal Portfolio Platform

**One-Sentence Description**
A static-exported dual-portfolio platform for software development and photography work, featuring local content management and optional AI-assisted metadata generation.

**Problem**
A portfolio needs to communicate creative work (both software and photography) while remaining easy to maintain as content grows, without requiring a complex CMS or dynamic hosting infrastructure.

**Primary Goal**
Provide a fast, editorial portfolio platform that combines a polished public experience with a purpose-built local content workspace for managing both dev and photography portfolios.

**Secondary Goals**
- Maintain separation between public static site and local admin infrastructure
- Enable efficient image processing and optimization workflows
- Provide optional AI-assisted metadata generation to reduce manual content entry
- Support structured, typed content models that scale gracefully

**Target Users**
- Primary: Recruiters, clients, and visitors viewing the public portfolios
- Secondary: The portfolio owner (Abdl Rahman Kamal) managing content
- Admin/User responsible for managing content: Portfolio owner via local admin interface

**Project Status**
- Existing project requiring changes
- MVP (functional dual portfolio with admin capabilities)

---

## 2. Existing Architecture

**Framework**
Next.js 15.1.4 with App Router, static export mode (`output: 'export'`), TypeScript 5.7.2 strict mode

**Frontend**
- Next.js App Router with two main routes: `/` (dev portfolio) and `/photography` (photography portfolio)
- Plain CSS with custom properties for styling
- Route-based theming via `SiteChrome` component
- Static export to `out/` directory for deployment

**Backend / Admin**
- Express.js server running locally on port 4000 (not deployed)
- RESTful API endpoints under `/api/`
- Optional authentication via `ADMIN_PASSWORD` environment variable
- Vanilla JS admin UI in `admin/ui/` (not deployed)
- Activity logging and AI usage tracking

**Data Storage**
- Canonical content stored in JSON files: `data/dev.json` and `data/photography.json`
- TypeScript adapters (`data/dev.ts`, `data/photography.ts`) provide type-safe exports
- Source images in `assets/originals/` (not deployed)
- Generated WebP images in `public/photography/` (deployed)

**Deployment Model**
- Static export: Only `out/` directory is deployed
- GitHub Actions builds and uploads `out/` as artifact
- No server-side code in production
- Admin, API, source data, and original assets remain local-only

**Important Constraints**
- Static export: Cannot use dynamic routes, server components with data fetching, or API routes in production
- Local admin server: Admin functionality only available locally, not in production
- JSON-based content: All content must be serializable and stored in JSON files
- Image processing: Sharp pipeline processes images locally before deployment
- Authentication: Optional simple password protection for local admin only
- AI integration: Azure OpenAI is optional and server-side only, never exposed to client
- Other: No database, no external API calls in production, no server-side rendering

**Architecture Rules**
The implementation MUST respect:
- Static export boundary - only `out/` is deployed
- Local admin boundary - admin server and UI never deployed
- JSON as canonical data source - all content edits flow through JSON files
- TypeScript strict mode - no `any` types in production code
- Image pipeline - source images processed through Sharp before deployment
- AI safety - AI credentials and calls remain server-side only
- Activity logging - all data writes logged for audit trail

---

## 3. Product Requirements

### 3.1 Core Requirements

**Requirement R1**
Name: Static Public Portfolio
Description: The project must generate a static export of both dev and photography portfolios that can be deployed to any static hosting service.
Why it exists: To enable fast, secure, and cost-effective deployment without server infrastructure.
Priority: Must

**Requirement R2**
Name: Local Content Management
Description: The project must provide a local admin interface for managing portfolio content without requiring a CMS or database.
Why it exists: To give the portfolio owner full control over content while keeping the public site static.
Priority: Must

**Requirement R3**
Name: Image Processing Pipeline
Description: The project must automatically process uploaded images into optimized WebP formats (full-size and thumbnails) with extracted metadata.
Why it exists: To ensure fast loading images while maintaining quality and providing necessary presentation data.
Priority: Must

**Requirement R4**
Name: Type Safety
Description: All data structures must be typed with TypeScript and validated before deployment.
Why it exists: To prevent data inconsistencies and catch errors during development.
Priority: Must

**Requirement R5**
Name: Optional AI Metadata Generation
Description: The admin interface may optionally suggest metadata (titles, alt text, stories, tags) using Azure OpenAI, but never auto-write without approval.
Why it exists: To reduce manual content entry effort while maintaining human control over quality.
Priority: Should

**Requirement R6**
Name: Activity Logging
Description: All data writes through the admin API must be logged for audit purposes.
Why it exists: To track changes and enable rollback if needed.
Priority: Should

---

## 4. Feature Inventory

| ID | Feature | Area | Priority | Status |
|----|---------|------|----------|--------|
| F001 | Dev Portfolio Display | Public Dev Portfolio | Must | Implemented |
| F002 | Photography Portfolio Display | Public Photography Portfolio | Must | Implemented |
| F003 | Route-based Navigation | Navigation | Must | Implemented |
| F004 | Dev Admin Workspace | Admin | Must | Implemented |
| F005 | Photography Admin Workspace | Admin | Must | Implemented |
| F006 | Image Upload & Processing | Image Management | Must | Implemented |
| F007 | Batch Image Optimization | Image Management | Should | Implemented |
| F008 | AI Photo Metadata Suggestions | AI | Should | Implemented |
| F009 | AI Collection Metadata Suggestions | AI | Could | Implemented |
| F010 | AI Profile Analysis | AI | Could | Implemented |
| F011 | Data Validation Scripts | Validation | Must | Implemented |
| F012 | Activity Logging | Admin | Should | Implemented |
| F013 | Usage Logging (AI) | AI | Should | Implemented |
| F014 | Static Export Build | Deployment | Must | Implemented |
| F015 | GitHub Actions CI | Deployment | Should | Implemented |

---

## 5. Implementation Status

### ✅ Currently Implemented

**Core Portfolio Features:**
- Dev portfolio display at `/` with profile, skills, projects, and journey
- Photography portfolio display at `/photography` with collections and photo viewer
- Route-based navigation (SiteChrome) that switches between dev and photography themes
- Responsive, accessible public UI with keyboard navigation

**Admin System:**
- Dev admin workspace at `/dev-admin` for managing dev portfolio content
- Photography admin workspace at `/photography-admin` for managing collections and photos
- Optional password protection via `ADMIN_PASSWORD` environment variable

**Image Pipeline:**
- Image upload with automatic Sharp processing
- WebP generation (full-size and thumbnails)
- Metadata extraction (aspect ratio, orientation)
- Batch image optimization scripts
- Image validation scripts

**AI Integration:**
- AI photo metadata suggestions (title, alt text, story, tags)
- AI collection metadata suggestions (theme, intro, skills demonstrated)
- AI portfolio profile analysis (about text from portfolio images)
- Azure OpenAI integration with retry logic and error handling
- Usage logging for AI token tracking

**Data & Validation:**
- JSON-based content storage (`dev.json`, `photography.json`)
- TypeScript adapters for type safety
- Validation scripts for both dev and photography data
- Activity logging for all data writes

**Deployment:**
- Static export to `out/` directory
- GitHub Actions CI/CD workflow
- Build scripts and linting

### ❌ Currently NOT Implemented

**Requested but Not Yet Implemented:**
- **Personal Coach Feature** - Upload any image to get AI coaching feedback on composition, lighting, and technique (identified as desirable future addition)
- **Analytics Integration** - Google Analytics or similar for tracking visitor behavior (identified as potential future addition)

**Out of Scope (By Design):**
- Multi-user support (single portfolio owner only)
- Remote admin access (local only)
- Database integration (JSON files only)
- Cloud storage (local file system only)
- User authentication beyond optional admin password
- Payment processing
- Multilingual support (English only)
- Search/filtering on public site
- Social sharing integrations
- Comments or user-generated content
- Video/audio support

**Summary:** The project is functionally complete for its current purpose: a personal dual-portfolio with local content management and optional AI assistance. Future additions (Personal Coach, Analytics) would build on this solid foundation.

---

## 7. Feature Specification

### F001 — Dev Portfolio Display

**Goal**
Showcase software development projects, skills, and professional journey to recruiters and clients.

**User**
Visitors to `/` route

**Trigger**
User navigates to `/` or clicks dev navigation link

**Input**
- User navigation action
- Data from `data/dev.json`

**Expected Behavior**
Display profile information, skills categories, project case studies, and journey timeline in a clean, responsive layout.

**Business / Product Rules**
- Featured projects should be highlighted
- Skills should be grouped by category (Build, Think, Connect, Explore)
- Projects should display type, year, status, and key technologies
- Journey should show timeline progression

**UI Requirements**
- Hero section with profile intro
- Skills grid with 4 categories
- Project cards with expandable details
- Journey timeline
- Responsive design for mobile/tablet/desktop

**Data Requirements**
Reads: `data/dev.json` via `data/dev.ts`
Writes: None (read-only)
Fields affected: All dev data fields

**API Requirements**
None (static site, data embedded at build time)

**Validation**
- Schema validation via TypeScript adapter
- Required fields: profile.name, profile.role, skills[], projects[], journey[]

**Architecture Impact**
- No architectural change
- Existing component modification

**Dependencies**
- Next.js App Router
- `data/dev.ts` adapter

**Edge Cases**
- Empty projects array
- Missing project details
- Broken external links

**Error Handling**
- Graceful fallback for missing data
- Link validation warnings during build

**Security Considerations**
- No user input to sanitize
- External links should be https only

**Acceptance Criteria**
- [ ] Profile information displays correctly
- [ ] Skills are grouped and labeled
- [ ] Projects show all required metadata
- [ ] Journey timeline renders properly
- [ ] Responsive layout works on all devices
- [ ] TypeScript types match data structure

**Out of Scope**
- Dynamic project filtering
- Search functionality
- User submissions

---

### F002 — Photography Portfolio Display

**Goal**
Showcase photography collections with rich metadata and visual presentation.

**User**
Visitors to `/photography` route

**Trigger**
User navigates to `/photography` or clicks photography navigation link

**Input**
- User navigation action
- Data from `data/photography.json`

**Expected Behavior**
Display hero section, collection grid, and individual photo views with metadata.

**Business / Product Rules**
- Primary collections shown first, then archive
- Photos should display thumbnails with full-size on interaction
- Metadata includes title, alt text, story, tags, and technical details
- Hero section should showcase featured work

**UI Requirements**
- Hero with rotating featured images
- Collection grid with cover images
- Photo viewer with metadata sidebar
- Responsive image loading
- Accessibility (alt text, keyboard navigation)

**Data Requirements**
Reads: `data/photography.json` via `data/photography.ts`
Writes: None (read-only)
Fields affected: All photography data fields

**API Requirements**
None (static site, data embedded at build time)

**Validation**
- Schema validation via TypeScript adapter
- Required fields: profile, hero, primaryCollections[]
- Photo asset validation (full and thumbnail must exist)

**Architecture Impact**
- No architectural change
- Existing component modification

**Dependencies**
- Next.js App Router
- `data/photography.ts` adapter
- WebP images in `public/photography/`

**Edge Cases**
- Missing image assets
- Empty collections
- Invalid aspect ratios

**Error Handling**
- Fallback images for missing assets
- Validation errors during build

**Security Considerations**
- No user input to sanitize
- Image paths validated during build

**Acceptance Criteria**
- [ ] Hero section displays featured images
- [ ] Collections render with cover images
- [ ] Photo viewer shows full metadata
- [ ] Images load efficiently (WebP, responsive)
- [ ] Alt text present for all images
- [ ] Keyboard navigation works
- [ ] TypeScript types match data structure

**Out of Scope**
- Image search/filtering
- User uploads
- Social sharing

---

### F004 — Dev Admin Workspace

**Goal**
Provide a local interface for managing dev portfolio content.

**User**
Portfolio owner via local admin at `http://localhost:4000/dev-admin`

**Trigger**
User opens dev admin URL

**Input**
- Form inputs for profile, skills, projects, journey
- API calls to Express server

**Expected Behavior**
Allow editing of all dev portfolio fields with immediate validation and save capability.

**Business / Product Rules**
- All edits must be validated before saving
- Projects must have unique slugs
- Skills should follow the 4-category structure
- Changes are written to `data/dev.json`

**UI Requirements**
- Profile editor
- Skills editor with 4 categories
- Project CRUD interface
- Journey timeline editor
- Save/cancel actions
- Validation feedback

**Data Requirements**
Reads: `data/dev.json` via API
Writes: `data/dev.json` via API
Fields affected: All dev data fields

**API Requirements**
Endpoint: `GET/PUT /api/dev`, `POST/PUT/DELETE /api/dev/projects/:slug`
Method: GET, PUT, POST, DELETE
Request: JSON body with dev data
Response: Updated dev data
Validation: Server-side validation for required fields and formats

**Architecture Impact**
- No architectural change
- Existing component modification

**Dependencies**
- Express server
- `api/routes/dev.mjs`

**Edge Cases**
- Duplicate project slugs
- Invalid URLs in links
- Missing required fields

**Error Handling**
- Validation errors returned with 400 status
- Conflict errors for duplicate slugs (409)
- Not found errors (404)

**Security Considerations**
- Optional password protection via `ADMIN_PASSWORD`
- Input sanitization on server
- URL validation for external links

**Acceptance Criteria**
- [ ] Profile fields can be edited
- [ ] Skills can be updated in 4 categories
- [ ] Projects can be created, updated, deleted
- [ ] Journey entries can be edited
- [ ] Validation prevents invalid data
- [ ] Changes persist to `data/dev.json`
- [ ] Activity logging records changes

**Out of Scope**
- Multi-user support
- Remote access
- Version history

---

### F005 — Photography Admin Workspace

**Goal**
Provide a local interface for managing photography portfolio content and images.

**User**
Portfolio owner via local admin at `http://localhost:4000/photography-admin`

**Trigger**
User opens photography admin URL

**Input**
- Form inputs for collections and photos
- Image uploads via multipart form
- API calls to Express server

**Expected Behavior**
Allow editing of profile, collections, and photos with image upload and processing.

**Business / Product Rules**
- Collections can be moved between primary and archive
- Photos can be reordered within collections
- Image uploads trigger automatic Sharp processing
- AI suggestions are optional and require approval

**UI Requirements**
- Profile editor
- Collection list with move/archive actions
- Photo editor with metadata fields
- Image upload interface
- AI suggestion integration
- Photo reordering interface
- Save/cancel actions

**Data Requirements**
Reads: `data/photography.json` via API
Writes: `data/photography.json` via API
Fields affected: All photography data fields, plus image assets

**API Requirements**
Endpoint: `GET/PUT /api/photography`, `GET/PUT /api/collections/:slug`, `POST /api/collections/:slug/photos`, `PUT /api/collections/:slug/photos/:id`, `PUT /api/collections/:slug/reorder`
Method: GET, PUT, POST
Request: JSON or multipart form data
Response: Updated photography data
Validation: Server-side validation for required fields and image formats

**Architecture Impact**
- No architectural change
- Existing component modification

**Dependencies**
- Express server
- `api/routes/photography.mjs`
- `api/routes/images.mjs`
- Sharp for image processing

**Edge Cases**
- Duplicate photo IDs
- Unsupported image formats
- Large image uploads
- Missing AI configuration

**Error Handling**
- Validation errors returned with 400 status
- File size/type errors
- Not found errors (404)
- AI failure graceful degradation

**Security Considerations**
- Optional password protection via `ADMIN_PASSWORD`
- Image file type validation
- File size limits (50MB)
- AI credentials server-side only

**Acceptance Criteria**
- [ ] Profile fields can be edited
- [ ] Collections can be created, updated, moved, deleted
- [ ] Photos can be uploaded and processed
- [ ] Photo metadata can be edited
- [ ] Photos can be reordered
- [ ] AI suggestions display and can be approved
- [ ] Changes persist to `data/photography.json`
- [ ] Activity logging records changes

**Out of Scope**
- Multi-user support
- Remote access
- Batch image operations (except optimize script)

---

### F006 — Image Upload & Processing

**Goal**
Automatically process uploaded images into optimized WebP formats with metadata extraction.

**User**
Portfolio owner via photography admin

**Trigger**
User uploads image via admin interface

**Input**
- Image file (JPEG, PNG, TIFF, WebP, max 50MB)
- Optional metadata fields

**Expected Behavior**
Process image through Sharp pipeline to generate full-size and thumbnail WebP images, extract dimensions and orientation, save to appropriate directories, and return image paths and metadata.

**Business / Product Rules**
- Original images saved to `assets/originals/photography/`
- Generated WebP images saved to `public/photography/full/` and `public/photography/thumbs/`
- Metadata (aspect ratio, orientation) extracted automatically
- File names preserved or timestamp-prefixed for uniqueness

**UI Requirements**
- File upload input
- Progress indication
- Error messages for invalid files
- Preview of processed image

**Data Requirements**
Reads: Uploaded image buffer
Writes: Image files to assets and public directories
Fields affected: Photo src, thumbnailSrc, aspectRatio, orientation

**API Requirements**
Endpoint: `POST /api/collections/:slug/photos`
Method: POST
Request: Multipart form with file and metadata
Response: Photo object with image paths and metadata
Validation: File type, size limits, Sharp processing success

**Architecture Impact**
- No architectural change
- Existing component modification

**Dependencies**
- Express server
- Multer for multipart handling
- Sharp for image processing

**Edge Cases**
- Corrupt image files
- Unsupported formats
- Extremely large images
- Disk space issues

**Error Handling**
- File type validation errors
- File size limit errors
- Sharp processing errors
- File system errors

**Security Considerations**
- File type whitelist (JPEG, PNG, TIFF, WebP)
- File size limits (50MB)
- No code execution from uploads
- Path traversal prevention

**Acceptance Criteria**
- [ ] Valid image formats are accepted
- [ ] Invalid formats are rejected with clear error
- [ ] Full-size WebP generated in `public/photography/full/`
- [ ] Thumbnail WebP generated in `public/photography/thumbs/`
- [ ] Original saved to `assets/originals/`
- [ ] Aspect ratio extracted correctly
- [ ] Orientation extracted correctly
- [ ] File size limits enforced
- [ ] Processing errors handled gracefully

**Out of Scope**
- Video processing
- Advanced image editing
- Cloud storage integration

---

### F008 — AI Photo Metadata Suggestions

**Goal**
Provide AI-suggested metadata (title, alt text, story, tags) for individual photos to reduce manual entry.

**User**
Portfolio owner via photography admin

**Trigger**
User clicks "Get AI Suggestion" button in photo editor

**Input**
- Photo image data
- Existing metadata (for context)

**Expected Behavior**
Send photo to Azure OpenAI vision model, receive structured JSON with suggested metadata, display to user for review and approval.

**Business / Product Rules**
- Suggestions are read-only until explicitly approved
- Tags are additive (existing tags preserved)
- Maximum 6 tags per photo
- AI credentials never exposed to client
- Failed requests handled gracefully

**UI Requirements**
- "Get AI Suggestion" button
- Loading state during API call
- Suggestion display with approve/edit/reject options
- Error messages for AI failures
- Tag count indicator

**Data Requirements**
Reads: Photo image, existing metadata
Writes: None (suggestions only, not auto-saved)
Fields affected: title, alt, story, tags (upon approval)

**API Requirements**
Endpoint: `POST /api/ai/photo/:slug/:id`
Method: POST
Request: Photo collection and ID
Response: AI suggestion object with title, alt, story, tags
Validation: JSON schema validation of AI response

**Architecture Impact**
- No architectural change
- Existing component modification

**Dependencies**
- Azure OpenAI SDK
- `api/routes/ai.mjs`
- Environment variables for AI configuration

**Edge Cases**
- AI service unavailable
- Rate limits
- Invalid AI response
- Missing credentials
- Network failures

**Error Handling**
- Retry logic with exponential backoff
- JSON repair for malformed responses
- Graceful degradation when AI unavailable
- Clear error messages to user

**Security Considerations**
- API keys server-side only
- AI output treated as untrusted input
- Schema validation before use
- No credentials in client-side code

**Acceptance Criteria**
- [ ] AI suggestion button triggers API call
- [ ] Loading state displays during processing
- [ ] Valid suggestions display in editor
- [ ] User can approve, edit, or reject suggestions
- [ ] Tags are additive (existing preserved)
- [ ] Tag limit enforced (max 6)
- [ ] AI failures handled gracefully
- [ ] API keys never exposed to client
- [ ] Usage logged for cost tracking

**Out of Scope**
- Auto-save of suggestions
- Batch photo analysis (separate feature)
- Custom AI models

---

## 8. User Flows

### Flow 1 — Add New Photography Collection

**Starting Point:** Photography admin workspace

**→ Action:** User clicks "Add Collection" button

**→ System Response:** Displays collection form with fields: title, theme, intro, skills demonstrated

**→ Next State:** User fills in collection details

**→ Action:** User clicks "Save"

**→ System Response:** Validates input, creates collection in `data/photography.json`, records activity log

**→ Completion:** Collection appears in collection list, ready for photo uploads

**→ Failure Cases**
- Validation error: Display field-specific error messages
- Duplicate slug: Show error and suggest alternative
- Save failure: Display error and retry option

---

### Flow 2 — Upload Photo to Collection

**Starting Point:** Collection editor in photography admin

**→ Action:** User selects file and fills in optional metadata

**→ System Response:** Validates file type and size, uploads to server

**→ Next State:** Sharp processes image, generates WebP variants, extracts metadata

**→ Action:** Server saves original to `assets/originals/`, WebP to `public/photography/`

**→ System Response:** Returns photo object with paths and metadata

**→ Completion:** Photo added to collection, displayed in photo list

**→ Failure Cases**
- Invalid file type: Display error, prevent upload
- File too large: Display error with size limit
- Processing failure: Display error, clean up partial files
- Save failure: Display error, retry option

---

### Flow 3 — Get AI Suggestion for Photo

**Starting Point:** Photo editor in photography admin

**→ Action:** User clicks "Get AI Suggestion"

**→ System Response:** Shows loading state, sends image to Azure OpenAI

**→ Next State:** AI analyzes image and returns structured metadata

**→ Action:** System validates response against schema

**→ System Response:** Displays suggested title, alt text, story, and tags

**→ Completion:** User reviews suggestions, can approve, edit, or reject

**→ Failure Cases**
- AI unavailable: Display error, disable AI features
- Rate limit: Display error with retry information
- Invalid response: Display error, fall back to manual entry
- Missing credentials: Display configuration error

---

## 9. Public Website Requirements

### Dev Portfolio

**Pages**
- `/` - Dev portfolio home

**Sections**
- Hero - Profile intro and availability
- About - Brief introduction
- Skills - 4-category skill grid
- Projects - Project case studies
- Journey - Timeline progression
- Contact - Email and social links

**Requirements**
- Responsive layout for mobile/tablet/desktop
- Semantic HTML structure
- Keyboard navigation support
- External link validation
- TypeScript type safety

### Photography Portfolio

**Pages**
- `/photography` - Photography portfolio home

**Sections**
- Hero - Featured image carousel
- Collections - Grid of primary collections
- Archive - Optional archive section
- Photo Viewer - Individual photo with metadata

**Collection Requirements**
- Cover image display
- Title and theme
- Photo count
- Skills demonstrated label

**Photo Requirements**
- Thumbnail grid
- Full-size viewer
- Metadata sidebar (title, alt, story, tags, technical details)
- Previous/next navigation
- Keyboard navigation

**Metadata**
- Title - Required
- Description - Optional (story field)
- Alt text - Required for accessibility
- Tags - Optional, max 6
- Story - Optional detailed description
- Technical: aspectRatio, orientation, focalPoint (optional)

---

## 10. Admin Requirements

### Admin Areas

**Development Portfolio**
Requirements:
- Profile editor (name, role, title, intro, location, email, availability, links)
- Skills editor (4 categories with items)
- Project CRUD (create, read, update, delete)
- Journey timeline editor
- Form validation
- Activity logging

**Photography**
Requirements:
- Profile editor (name, role, intro, about, email, social links)
- Hero section editor (eyebrow, title, description, CTAs, images)
- Collection CRUD (create, read, update, delete, move between sections)
- Photo CRUD within collections
- Photo reordering
- Collection cover image management

**Image Management**
Requirements:
- Multipart upload interface
- File type validation (JPEG, PNG, TIFF, WebP)
- File size limits (50MB)
- Automatic Sharp processing
- Original image preservation
- WebP generation (full and thumbnail)
- Metadata extraction (aspect ratio, orientation)
- Image cleanup on deletion

**AI Tools**
Requirements:
- Photo metadata suggestions (title, alt, story, tags)
- Collection metadata suggestions (theme, intro, skills demonstrated)
- Profile analysis (about text from portfolio images)
- Batch collection analysis (with explicit confirmation)
- AI service status display
- Usage logging
- Retry logic for failures
- JSON repair for malformed responses

**Activity / Usage Logs**
Requirements:
- Append-only activity log for all data writes
- AI usage log with token counts and costs
- Log viewing in admin interface
- Log rotation if needed

---

## 11. Data Model

### Existing Data

**`dev.json`**
Purpose: Canonical source for dev portfolio content
Important structures:
```json
{
  "profile": { name, role, title, intro, location, email, availability, links[] },
  "skills": [{ number, name, description, items[] }],
  "projects": [{ slug, number, title, type, year, status, summary, problem, solution, technologies[], highlights[], githubUrl, liveUrl, featured }],
  "journey": [{ period, title, description }]
}
```

**`photography.json`**
Purpose: Canonical source for photography portfolio content
Important structures:
```json
{
  "profile": { name, role, intro, about, email, socialLinks[] },
  "hero": { eyebrow, title, titleAccent, description, primaryCta, secondaryCta, yearLabel, locationLabel, images[] },
  "primaryCollections": [{ slug, title, theme, intro, skillsDemonstrated, coverImage, section, photos[] }],
  "archiveCollections": [{ slug, title, theme, intro, skillsDemonstrated, coverImage, section, photos[] }]
}
```

Photo structure:
```json
{
  "id": "unique-id",
  "title": "string",
  "src": "/photography/full/filename.webp",
  "thumbnailSrc": "/photography/thumbs/filename.webp",
  "alt": "accessibility text",
  "story": "detailed description",
  "tags": ["tag1", "tag2"],
  "isPlaceholder": false,
  "aspectRatio": "16/9",
  "orientation": "landscape",
  "focalPoint": { "x": 50, "y": 50 },
  "featuredRank": 1,
  "location": "optional location"
}
```

### Required Data Changes

**New Fields**
None currently required

**Modified Fields**
None currently required

**Removed Fields**
None currently required

---

## 12. API Requirements

### Existing Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/photography` | Full photography data |
| PUT | `/api/photography` | Overwrite photography data |
| PUT | `/api/photography/profile` | Update photography profile |
| GET | `/api/dev` | Full dev data |
| PUT | `/api/dev` | Overwrite dev data |
| POST | `/api/dev/projects` | Create dev project |
| PUT | `/api/dev/projects/:slug` | Update dev project |
| DELETE | `/api/dev/projects/:slug` | Delete dev project |
| GET | `/api/collections` | List all collections |
| GET | `/api/collections/:slug` | Get single collection |
| PUT | `/api/collections/:slug` | Update collection |
| PUT | `/api/collections/:slug/reorder` | Reorder photos in collection |
| POST | `/api/collections/:slug/photos` | Upload photo to collection |
| PUT | `/api/collections/:slug/photos/:id` | Update photo metadata |
| GET | `/api/ai/status` | AI service status |
| POST | `/api/ai/photo/:slug/:id` | AI photo suggestion |
| POST | `/api/ai/collection/:slug` | AI collection suggestion |
| POST | `/api/ai/profile` | AI profile analysis |
| GET | `/api/activity` | Get activity log |
| POST | `/api/activity` | Record activity |

### New / Modified Endpoints

None currently required

### Auth

For every endpoint specify:
- Optional `x-admin-password` header if `ADMIN_PASSWORD` environment variable is set
- Returns 401 if password is required and missing/incorrect

**Request**
Varies by endpoint (JSON body or multipart form)

**Response**
JSON response with data or error object

**Validation**
- Request schemas validated on server
- Required fields checked
- Data types validated
- Business rules enforced (e.g., unique slugs)

**Errors**
- `400` — Bad request (validation error, invalid input)
- `401` — Unauthorized (missing/invalid password)
- `404` — Not found (resource doesn't exist)
- `409` — Conflict (duplicate resource)
- `500` — Server error (unexpected failure)

---

## 13. AI Requirements

### AI Feature: Photo Metadata Suggestions

**Purpose**
Reduce manual content entry by using AI to analyze photos and suggest descriptive metadata.

**Input**
- Photo image data
- Existing metadata (for context)

**Expected Output**
```json
{
  "title": "Descriptive photo title",
  "alt": "Accessibility description",
  "story": "Detailed narrative about the photo",
  "tags": ["composition", "lighting", "technique"]
}
```

**AI Rules**
- Suggestions only - never auto-write
- Admin must explicitly approve before saving
- Output must conform to schema
- Handle invalid AI responses with JSON repair
- Tags are additive (existing preserved)
- Maximum 6 tags per photo
- Retry on rate limits with exponential backoff

**Approval Flow**
AI suggestion → Admin reviews → Admin edits if necessary → Admin approves → Data is written

**AI Failure Cases**
- API unavailable: Disable AI features, show error
- Invalid response: JSON repair, show error if repair fails
- Rate limit: Retry with exponential backoff, show error if retries exhausted
- Missing credentials: Show configuration error, disable AI features
- Unexpected content: Schema validation fails, show error

---

## 14. Image Pipeline Requirements

### Input
Source: `assets/originals/photography/` (organized by category)

### Processing
Input → Sharp → Full WebP → Thumbnail WebP → Metadata → JSON

**Requirements**
- Generate full-size WebP (max width 1920px, quality 85%)
- Generate thumbnail WebP (max width 400px, quality 85%)
- Extract aspect ratio
- Extract orientation (landscape/portrait)
- Preserve original filename or generate unique ID
- Save original to `assets/originals/`
- Save WebP variants to `public/photography/`

### Image Metadata
Required:
- `src` - Path to full-size WebP
- `thumbnailSrc` - Path to thumbnail WebP
- `aspectRatio` - String like "16/9", "9/16", "3/4"
- `orientation` - "landscape" or "portrait"

Additional:
- `focalPoint` - { x: 0-100, y: 0-100 } for smart cropping
- `location` - Optional geographic location

### Edge Cases
- Unsupported file: Reject with clear error message
- Corrupt image: Reject with error, log failure
- Duplicate image: Generate unique ID with timestamp
- Extremely large image: Resize to max dimensions
- Missing metadata: Use defaults, log warning

---

## 15. Validation Requirements

### Build Validation

**Photography**
Command: `npm run validate:photography`
Must verify:
- All non-placeholder photos have valid `src` and `thumbnailSrc` paths
- Referenced image files exist in `public/photography/`
- JSON structure matches TypeScript schema
- Required fields are present
- Aspect ratios are valid
- Slugs are unique within collections

**Development**
Command: `npm run validate:dev`
Must verify:
- JSON structure matches TypeScript schema
- Required fields are present
- Project slugs are unique
- External links are valid URLs
- Email format is valid

### API Validation
- Request schemas: Validated on server for all endpoints
- Response schemas: TypeScript types for all responses
- Required fields: Checked before processing
- Invalid input behavior: Return 400 with error details

---

## 16. Security Requirements

### Authentication
- Optional password protection via `ADMIN_PASSWORD` environment variable
- Password sent via `x-admin-password` header
- No user accounts or multi-user support
- No OAuth or third-party auth

### Authorization
- All admin endpoints require password if configured
- No role-based access control (single admin)
- No resource-level permissions

### Secrets
- Environment variables required:
  - `ADMIN_PASSWORD` (optional)
  - `AZURE_OPENAI_ENDPOINT` (optional, for AI)
  - `AZURE_OPENAI_API_KEY` (optional, for AI)
  - `AZURE_OPENAI_DEPLOYMENT` (optional, for AI)
- Server-only values:
  - All environment variables
  - AI API keys
  - File system paths

### File Upload Security
- Allowed formats: JPEG, PNG, TIFF, WebP
- Maximum file size: 50MB
- Validation: File extension and MIME type checking
- Processing restrictions: No code execution, path traversal prevention

### AI Security
- API keys must remain server-side
- AI output must be treated as untrusted input
- Schema validation before using AI suggestions
- No credentials in client-side code or logs

---

## 17. Performance Requirements

### Public Site
- Static generation: All pages pre-rendered at build time
- Image optimization: WebP format, responsive sizes
- JavaScript: Minimal client-side JS, no heavy frameworks
- CSS: Plain CSS, critical path optimization
- Loading behavior: Progressive image loading, lazy loading for below-fold images

### Admin
- Local server only, no performance SLA
- Image processing: synchronous for simplicity
- API calls: local network, no caching needed

### AI
- Avoid unnecessary API calls
- Do not regenerate unchanged metadata
- Implement retry logic for rate limits
- Log usage for cost tracking
- Set reasonable timeouts (90s read, 10s connect)

---

## 18. Responsive / UX Requirements

### Desktop
- Full-featured layouts with multi-column grids
- Hover states and tooltips
- Keyboard navigation support
- Screen reader compatibility

### Tablet
- Responsive grids adapting to screen width
- Touch-friendly controls
- Simplified layouts where appropriate

### Mobile
- Single-column layouts
- Optimized touch targets (44px minimum)
- Hamburger navigation
- Simplified image viewers

### Accessibility
- Semantic HTML (header, nav, main, article, footer)
- Keyboard navigation (tab, enter, escape, arrows)
- Alt text for all images
- Contrast ratios meeting WCAG AA
- Focus states visible
- ARIA labels where needed
- Skip navigation link

---

## 19. Error & Empty States

### No Data
- Dev portfolio: Show "No projects yet" message
- Photography portfolio: Show "No collections yet" message
- Admin: Show empty state with call-to-action to add content

### Missing Image
- Display fallback placeholder
- Log error during build validation
- Show broken image icon in admin

### Invalid Data
- Validation script catches before build
- Show specific field errors in admin
- Prevent save until valid

### API Failure
- Show user-friendly error message
- Log technical details server-side
- Provide retry option where appropriate

### AI Failure
- Graceful degradation (manual entry still works)
- Show error with specific reason
- Disable AI features if configuration missing
- Log failure for troubleshooting

### Upload Failure
- Clear error message (file type, size, processing)
- Remove partial files
- Allow retry with different file

### Unauthorized Admin
- Return 401 status
- Show password prompt in UI
- Log failed attempts

---

## 20. Deployment Requirements

### Production
Only this directory is deployed: `out/`

### Must NOT Be Deployed
- `api/` - Express admin server
- `admin/` - Admin UI
- `assets/` - Source photographs
- `scripts/` - Build tooling
- Source JSON files (`data/`)
- Secrets (`.env`, `.env.local`)
- `.git/`, `.github/` - Git metadata
- `node_modules/` - Dependencies

### Build Requirements
```bash
npm run build
```
Expected result: `out/` directory with static HTML, CSS, JS, and images

### Deployment Validation
- Build succeeds without errors
- Static routes work (index.html present)
- Images load correctly (paths valid)
- No server-only code leaks (no API calls in client JS)
- No secrets exposed (no env vars in build)
- No broken links (all references resolve)
- TypeScript compilation passes
- ESLint passes

---

## 21. Technical Constraints

The implementation must:
- Use existing Next.js App Router structure
- Use TypeScript strict mode
- Avoid `any` in production code
- Preserve static export (`output: 'export'`)
- Preserve the Express local admin boundary
- Preserve JSON as the canonical content source
- Use existing validation mechanisms
- Reuse existing architecture before introducing new abstractions
- Avoid unnecessary dependencies
- Keep admin functionality local-only
- Never expose AI credentials to client
- Maintain separation between public and admin code

### Additional constraints
- No database (JSON files only)
- No server-side rendering in production
- No dynamic routes (static export limitation)
- No API routes in production
- No external API calls in production
- No authentication system (optional password only)
- No multi-user support
- No version history/undo

---

## 22. Open Questions

Anything that cannot be determined from the supplied information should be listed here.

| ID | Question | Why It Matters | Decision |
|----|----------|----------------|----------|
| Q001 | Should the Photography Coach SaaS concept from ideas/photography-coach.md be implemented? | Would require major architectural changes (database, auth, cloud storage) | Pending |
| Q002 | What is the target deployment platform for the static site? | Affects build configuration and deployment workflow | Pending |
| Q003 | Are there specific performance targets (Lighthouse scores, load times)? | Guides optimization priorities | Pending |
| Q004 | Should analytics be added to track portfolio visitors? | Would require third-party integration | Pending |
| Q005 | Is multilingual support required? | Would require i18n architecture | Pending |

Do NOT invent answers.

---

## 23. Assumptions

Document assumptions separately from confirmed requirements.

| ID | Assumption | Confidence |
|----|------------|------------|
| A001 | Portfolio owner is the only user who needs admin access | High |
| A002 | Static hosting is preferred over dynamic hosting for cost and simplicity | High |
| A003 | Azure OpenAI is the preferred AI provider (already configured) | High |
| A004 | Single portfolio owner (no multi-tenant requirements) | High |
| A005 | Current image pipeline performance is acceptable | Medium |
| A006 | No immediate need for search/filtering on public site | Medium |
| A007 | Local admin workflow is acceptable (no remote admin needed) | High |

---

## 24. Out of Scope

Explicitly list functionality that should NOT be implemented.

- Multi-user support or collaboration features
- Remote/admin access over the internet
- Database integration (PostgreSQL, MongoDB, etc.)
- Cloud storage integration (AWS S3, Cloudflare R2, etc.)
- User authentication beyond optional admin password
- Version history or undo functionality
- Real-time updates or websockets
- Search functionality on public site
- Social sharing integrations
- Comments or user-generated content
- E-commerce or payment processing
- Email notifications
- Blog or CMS features
- Analytics integration (unless explicitly requested)
- Multilingual support
- Dark mode toggle (unless explicitly requested)
- Advanced image editing tools
- Video support
- Audio support
- PDF generation
- Print optimization

---

## 25. Acceptance Criteria

### Project-Level Acceptance
- [ ] Existing functionality continues working
- [ ] New functionality matches the requirements
- [ ] No unrelated functionality is changed
- [ ] TypeScript passes (`tsc --noEmit`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Relevant validation scripts pass (`npm run validate:dev`, `npm run validate:photography`)
- [ ] Production build succeeds (`npm run build`)
- [ ] Static export remains functional
- [ ] No secrets are exposed in build
- [ ] Admin functionality remains local-only
- [ ] AI credentials remain server-side only
- [ ] Activity logging records all data writes
- [ ] Image pipeline generates valid WebP files
- [ ] All required metadata is present

---

## 26. Implementation Plan

**Current Status: PROJECT COMPLETE**

The project is currently fully implemented and functional. No implementation tasks are required at this time. All documented features (F001-F015) are implemented and working.

### Future Implementation (If Needed)

If the following features are prioritized, they would require new implementation:

**Personal Coach Feature (Future Addition)**
- New AI prompt for coaching feedback
- New API endpoint for coaching analysis
- New admin UI section for coach workspace
- Integration with existing Azure OpenAI infrastructure

**Analytics Integration (Future Addition)**
- Add analytics script to `app/layout.tsx`
- Configure analytics service (Google Analytics, Plausible, etc.)
- No architecture changes required

### Verification Tasks (Maintenance)

These tasks can be run periodically to ensure system health:

- [ ] Run validation scripts: `npm run validate:dev` and `npm run validate:photography`
- [ ] Run TypeScript compiler: `tsc --noEmit`
- [ ] Run ESLint: `npm run lint`
- [ ] Test production build: `npm run build`
- [ ] Verify admin server: `npm run admin`
- [ ] Test AI integration (if configured)
- [ ] Review activity logs for anomalies
- [ ] Check AI usage logs for cost tracking

---

## 27. Final AI Summary

### What We Are Building
A static-exported dual-portfolio platform for software development and photography work, featuring local content management via an Express admin server, optional AI-assisted metadata generation using Azure OpenAI, and an automated image processing pipeline using Sharp. The public site deploys as static HTML/CSS/JS while all content management remains local-only.

### Confirmed Requirements
- Static export for public site (Next.js `output: 'export'`)
- Local Express admin server on port 4000
- JSON-based content storage (`dev.json`, `photography.json`)
- TypeScript strict mode with typed adapters
- Image processing pipeline (Sharp for WebP generation)
- Optional AI metadata suggestions (Azure OpenAI, server-side only)
- Activity logging for audit trail
- Validation scripts for data integrity
- Responsive, accessible public UI
- Separate admin workspaces for dev and photography

### New Features
None currently required - existing feature set is complete and functional.

### Files Likely Affected
No changes required - existing codebase is stable and meets all documented requirements.

### Architecture Changes
None - current architecture is appropriate for the stated goals and constraints.

### Open Questions
- Q001: Should the Photography Coach SaaS concept be implemented? (Major architectural change)
- Q002: Target deployment platform for static site?
- Q003: Performance targets (Lighthouse scores, load times)?
- Q004: Analytics integration for visitor tracking?
- Q005: Multilingual support requirements?

### Risks
- Static export limits future feature additions (no dynamic routes, no server-side rendering)
- Local admin workflow may not scale if multiple users need access
- AI costs could increase with heavy usage
- Image processing may be slow for large batches
- No backup/restore mechanism for JSON data files

### Recommended Implementation Order
No implementation required - project is complete and functional. Future work should focus on:
1. Deciding on Photography Coach SaaS direction (Q001)
2. Selecting deployment platform (Q002)
3. Adding analytics if desired (Q004)
4. Performance optimization if targets defined (Q003)

---

## Codex Implementation Prompt

Convert the finalized PRD into a small implementation prompt containing only the information Codex needs for the current task.

Do NOT copy the entire PRD.

Format:

## Task
[What to build]

## Context
[Only relevant architectural context]

## Requirements
- 
- 
- 

## Files
- 
- 

## Constraints
- 
- 

## Acceptance Criteria
- [ ]
- [ ]
- [ ]

## Do Not Change
- 
