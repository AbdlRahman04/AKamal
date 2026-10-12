# Enable private portfolio inquiries

The portfolio remains a static Next.js export. A separate Vercel project deploys
only `services/contact-api`; it does not deploy the local admin server. Notifications
use Gmail SMTP, with your Gmail account as both sender and recipient. Clicking
Reply addresses the visitor. There is no database or visitor confirmation email.

## 1. Prepare Gmail

Enable [2-Step Verification and create an App Password](https://support.google.com/accounts/answer/185833).
Name it **Portfolio contact**. Keep this password in Vercel, not GitHub, public
environment settings, or chat. Some managed/Advanced Protection accounts do not
support App Passwords. Confirm availability before deploying.

Gmail is the no-domain, low-volume starting option. It can impose sending limits
or block automated connections. Gmail password changes revoke App Passwords;
update Vercel and redeploy if that happens. See [Nodemailer Gmail guidance](https://nodemailer.com/guides/using-gmail).

## 2. Create a Turnstile widget

Create a free Cloudflare Turnstile **Managed** widget. Allow the production
portfolio hostname and, if used, `abdlrahman04.github.io`. Use hostnames without
paths. The widget is rendered with action `contact`; the backend validates that
action and requires the returned hostname to match the submitting origin.

Keep the secret key in the backend. The site key is public. The portfolio does
not need to use Cloudflare DNS or own a domain. See [server verification](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

## 3. Deploy the backend first

Import the same GitHub repository into a **second Vercel project**:

- Root Directory: `services/contact-api`
- Framework Preset: **Other**
- Node.js: **22.x**
- Install Command: `npm ci`
- Build Command: leave unset; no framework build is needed
- Output Directory: leave unset
- Function duration: 30 seconds, configured in the included `vercel.json`

Add these variables to the backend project's **Production** environment only:

| Variable | Value |
| --- | --- |
| `GMAIL_USER` | Your private Gmail address; used for both From and To |
| `GMAIL_APP_PASSWORD` | The Gmail App Password |
| `TURNSTILE_SECRET_KEY` | The widget secret key |
| `ALLOWED_ORIGINS` | Comma-separated exact frontend origins |

Example origins: `https://your-portfolio.vercel.app,https://abdlrahman04.github.io`.
Origins must not contain a path or trailing slash; GitHub Pages uses its hostname
origin even when the portfolio path is `/AKamal/`. Do not use wildcards or `null`.

The resulting endpoint is `https://YOUR-BACKEND.vercel.app/api/contact`.
Ensure **production deployment protection** allows this endpoint to be called
without a Vercel login. Keep preview deployments protected and without Gmail
credentials. Production Gmail settings are not copied to previews.

The backend accepts JSON POST requests and OPTIONS preflights. It rejects other
origins/methods, invalid data, bodies over 32 KiB, nonempty honeypots, and failed
Turnstile tokens. Recipient/sender values in requests cannot change delivery.
Logs contain request identifiers and outcomes only. There are no in-memory
rate-limit promises: spam protection is Turnstile plus a honeypot.

## 4. Configure and rebuild the frontend

In the existing portfolio Vercel project, add **Production** build variables:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_CONTACT_ENDPOINT` | The backend endpoint from step 3 |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | The production widget site key |

These values are intentionally public. Never add Gmail settings or the Turnstile
secret to this project. Environment changes require a new build/deployment.
Vercel preview builds automatically disable submissions through `VERCEL_ENV`.
Missing configuration, blocked challenge scripts, and verification errors disable
the submit button and expose accessible feedback.

For GitHub Pages, add the same two **repository Actions variables** under
Settings → Secrets and variables → Actions → Variables. Both build workflows
read these variables. Existing base-path/static-export behavior is preserved.

Pushing the intended source changes to `origin/main` triggers Vercel. Never commit
`out/`, environment files, or backend `node_modules`. This implementation does
not push or create Vercel projects automatically.

## 5. Label every inquiry in Gmail

Create a [Gmail filter](https://support.google.com/mail/answer/6579) with:

- From: your `GMAIL_USER` address
- Subject: `[Portfolio]`
- Actions: **Apply the label → Portfolio**, **Always mark it as important**,
  **Star it**, and **Never send it to Spam**

Notifications use the sender name **Portfolio inquiries**, subjects such as
`[Portfolio] [Photography] Commission inquiry — Collection title`, and high-priority
email headers. Gmail's own importance marker is controlled by the filter, not
guaranteed by those headers. You may see the sender as “me” when sending to yourself.

## 6. Verify production delivery

Submit one controlled inquiry from each public route after deployment. Confirm
delivery, the subject/source, Portfolio label, importance/star, and visitor Reply-To.
Confirm a disallowed origin and invalid challenge cannot send mail. Check the old
CV URL returns 404 and contact details are absent from rendered pages and bundles.

Success means Gmail accepted the message, not guaranteed inbox delivery. SMTP
has a 20-second deadline after the 5-second verification deadline; the browser
waits up to 35 seconds. A timeout may leave delivery uncertain. Fields are retained,
the challenge is reset, and submissions are never automatically retried.

## Local development and checks

Run `npm ci` in `services/contact-api`. Copy its `.env.example` to the ignored
`.env.local`, allow `http://localhost:3000` (or your actual dev origin), and run
`npm run dev` in that directory. The frontend's ignored `.env.local` needs the
public endpoint `http://localhost:4001/api/contact` and a matching widget site key.

For real local end-to-end verification, create a separate development widget that
allows `localhost`. Cloudflare test keys are useful for client challenge states;
their dummy verification metadata may not match the strict production hostname
and action checks. Backend unit tests mock Siteverify to exercise those checks
without weakening production verification or sending email.

From the repository root:

```powershell
node --test services/contact-api/test/*.test.mjs scripts/public-profile-privacy.test.mjs
npm run lint
npm run validate:dev
npm run validate:photography
npm run build
```

The original public CV is now preserved locally under ignored
`assets/archive/private/`; public download and admin CV publication are disabled.
Public profile writers/validators reject email/phone fields and mailto/tel links,
including bulk imports. Previously published contact details can remain in Git
history or old deployments; this change does not rewrite history.
