# Photography Coach & SaaS Analysis

This document provides a technical analysis and roadmap for introducing an AI-powered **Photography Coach** to your portfolio and transitioning it into a monetizable Software as a Service (SaaS).

## Executive Summary

Your current project is well-architected for a personal portfolio (Next.js static export + local Express admin with Azure OpenAI). However, selling a service requires transitioning from local, static infrastructure to a dynamic, cloud-based platform. This document outlines a low-risk, two-phase approach to achieving this goal.

---

## Phase 1: Prototype (Low Investment, High Learning)

Before building a complex SaaS, we recommend leveraging your **existing Azure OpenAI integration** in the local admin portal to build a functional prototype of the AI Coach. This allows you to test the AI's capabilities and refine your prompts without infrastructure costs.

### How it works
1. **The Prompt:** We would instruct the vision model (`gpt-5-mini` or similar) to act as an expert photography coach, evaluating:
   - **Composition:** Rule of thirds, leading lines, framing, and balance.
   - **Lighting & Exposure:** Dynamic range, use of light, shadows, and clipping.
   - **Color & Editing:** Color grading, white balance, and contrast.
   - **Actionable Advice:** 1-2 specific, encouraging tips for improvement.
2. **The Interface:** A new "Get Coach Feedback" button in your existing admin photo editor.
3. **The Goal:** Validate that the AI can actually provide useful, accurate feedback that a beginner would find valuable enough to pay for.

---

## Phase 2: SaaS Architecture (Monetization)

Once the AI Coach prototype proves valuable, the project must be re-architected to support multiple users paying for access. Your current project is a static site powered by a local `photography.json` file, which only works for a single user (you).

To support multiple users, you will need to transition to a dynamic web application. Here is the recommended technology stack:

### 1. Unified Framework (Next.js App Router)
- **Current State:** Separate Next.js static site and local Express server.
- **Future State:** A single Next.js application using Server Actions and API routes. The admin portal becomes a protected `/dashboard` route on the live internet. This simplifies deployment to platforms like Vercel.

### 2. Database (PostgreSQL + Prisma/Drizzle)
- **Current State:** Data is stored in `data/photography.json`.
- **Future State:** A managed PostgreSQL database (e.g., Supabase, Neon) to store User accounts, their uploaded photos, and their AI feedback history. An ORM like Prisma makes database queries simple.

### 3. Authentication (NextAuth.js or Clerk)
- **Current State:** Local server running on `localhost` (optionally password-protected).
- **Future State:** Users must be able to sign up (OAuth with Google, or Email/Password). Clerk provides drop-in UI components for this, while NextAuth is a great open-source alternative.

### 4. Monetization (Stripe Billing)
- **Integration:** Stripe will handle subscriptions and credit cards.
- **Potential Pricing Models:**
  - **Credit-based:** Users buy $5 for 50 photo analyses. (Better for unpredictable usage).
  - **Subscription:** $10/month for unlimited AI feedback and a hosted portfolio. (Better for recurring revenue).
- Stripe Webhooks will update the user's database record when they pay, granting them access to the Coach.

### 5. Storage (AWS S3 or Cloudflare R2)
- **Current State:** Photos are saved locally to `public/photography/`.
- **Future State:** User uploads must be stored in the cloud. Cloudflare R2 is highly recommended as it has zero egress fees, which is crucial for a photo-heavy application.

---

## Next Steps for Decision Making
- Evaluate if you want to start by building the Phase 1 Prototype in your local admin panel to test the AI's feedback quality.
- Consider the technical investment required for Phase 2 and whether you want to learn these SaaS technologies (Databases, Auth, Stripe) yourself, or focus primarily on the photography logic.
