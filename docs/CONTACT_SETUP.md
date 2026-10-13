# Contact setup: Web3Forms

The form uses Web3Forms directly. You need **one public access key** in your
existing Vercel project. Your receiving email is configured in Web3Forms and
does not appear in the portfolio code. No separate backend or Gmail password.

## 1. Create your form

Open [Web3Forms](https://app.web3forms.com/), sign in with your receiving Gmail,
and verify it. On **Create Your First Form**, enter:

| Field | Value |
| --- | --- |
| Form Name | `Portfolio inquiries` |
| Website URL | `https://abdlr7man-portfolio.vercel.app/` |

Click **Create Form** and copy the **Access Key** shown next. One form handles
both the developer and photography pages. This form access key is intentionally
public; do not use an account-management API key or a Gmail password.

In the form's settings, find **Block Spam / CAPTCHA** and enable **hCaptcha**.
This makes Web3Forms reject missing or invalid captcha tokens server-side.
The site already includes Web3Forms' shared free-plan hCaptcha site key and a
hidden honeypot. You do not need to register separately with hCaptcha.

## 2. Make it work locally

Add this line to the existing root `.env.local`. Keep any existing settings:

```dotenv
NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY=PASTE_YOUR_FORM_ACCESS_KEY
```

Restart `npm run dev` after saving. Open `http://localhost:3000/#contact` to preview
the form. The Send button stays disabled until the challenge is complete.
**hCaptcha prohibits `localhost` and `127.0.0.1`, so test real delivery on the
deployed Vercel URL after step 3.** The local warning is a provider restriction,
not an invalid Web3Forms key. A developer who needs local live testing can use
a hosts-file domain as described in [hCaptcha's local development guide](https://docs.hcaptcha.com/#local-development).
No test-key bypass is included; dummy captcha tokens cannot send real inquiries.

## 3. Make it work on Vercel

Open your **existing portfolio project** → **Settings → Environment Variables**.
Add:

| Name | Value | Environment |
| --- | --- | --- |
| `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY` | Your form's Access Key | Production |

Redeploy after the changed source code has been published, then complete the
security check and submit one inquiry from your production contact form. Confirm
the email arrives and Reply addresses the visitor. This public variable
is embedded at build time; adding it alone does not update an existing deployment.
Pushing intended source changes to `origin/main` triggers Vercel. Keep `out/` out
of Git; push only when you intend to publish.

For GitHub Pages, optionally add the same name/value as an **Actions repository
variable**. The existing build workflows already read it. Vercel Preview builds
disable submissions so ordinary previews cannot send production notifications.

## 4. Label inquiries in Gmail

After receiving the first test email, open it → **More → Filter messages like these**.
Keep the notification sender and add `[Portfolio]` in the **Subject** criterion.
Create the filter with:

- **Apply the label → Portfolio**
- **Always mark it as important**
- **Star it**
- **Never send it to Spam**

Notifications use `Portfolio inquiries` as the From name, subjects such as
`[Portfolio] [Photography] Commission inquiry — Collection title`, and the
visitor's email as Reply-To. Importance is applied by your Gmail filter; the
managed service does not expose custom high-priority SMTP headers here.

## Quick troubleshooting

| What you see | What to check |
| --- | --- |
| Contact is temporarily unavailable | Add the access key; restart locally or redeploy on Vercel. Preview builds intentionally disable sending. |
| Security check cannot load | Retry; check whether a browser extension or network blocks hCaptcha. |
| Message could not be sent | Verify the receiving email and access key, enable hCaptcha in the form settings, and check your submission allowance. |
| Message sent but no inbox email | Check Spam and the Web3Forms dashboard's submissions; confirm the configured receiving address. |

The current free plan allows **250 submissions/month**. Form notifications may
include Web3Forms branding. No automatic POST retries occur; after a network
timeout, delivery may be uncertain, and entered fields are retained.

The original CV remains private under ignored `assets/archive/private/`; public
email/phone fields and CV publication stay disabled. If you already created the
old backend project, remove it yourself and revoke its unused Gmail App Password.
Remove obsolete Gmail/Turnstile variables from that project. The portfolio now
uses only `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY` for contact delivery.

Checks:

```powershell
node scripts/contact-web3forms.test.mjs
node scripts/public-profile-privacy.test.mjs
npm run build
```

Sources: [Web3Forms hCaptcha setup](https://docs.web3forms.com/getting-started/customizations/spam-protection/hcaptcha),
[public access keys](https://docs.web3forms.com/getting-started/faq),
[current pricing](https://web3forms.com/pricing),
[Gmail filters](https://support.google.com/mail/answer/6579).
