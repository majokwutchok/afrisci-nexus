# Email Center

Branded email to and from authors, reviewers and partners, in **Admin Dashboard → ✉️ Email Center**, plus an **Email author** button on each row of Admin → Bulk Actions.

Sending goes through **our own Resend account**, not Base44's `Core.SendEmail`, so it uses **no Base44 integration credits**.

## Pieces
| Path | Purpose |
|---|---|
| `base44/entities/Email{Template,Thread,Message,Settings}.jsonc` | Templates, conversations, messages, sender/branding settings (admin-only RLS) |
| `base44/functions/emailSend` | Renders the branded email and sends it via Resend (admins only) |
| `base44/functions/emailInbound` | Resend webhook: stores replies in the right conversation and records delivery status (Svix-signed) |
| `base44/functions/emailAdmin` | Installs/resets templates, read/archive/star, attachment links, status |
| `base44/shared/email*.ts` | Shared renderer, templates and server helpers |
| `src/components/email/*`, `src/lib/email/*` | Admin UI (Inbox, Compose, Templates, Settings) |

## Configuration
- **Secrets** (Base44 → Settings → Secrets): `RESEND_API_KEY` (full access), `RESEND_WEBHOOK_SECRET`. Optional: `EMAIL_THREAD_SECRET`.
- **Sending domain**: `afriscinexus.com` (verified in Resend). The default From is `editorial@afriscinexus.com`; change it in Email Center → Settings.
- **Receiving**: Resend-managed domain `ulkudelook.resend.app`. Replies go to `reply+<thread>.<sig>@ulkudelook.resend.app`, so no DNS change is needed. To use a branded reply domain later, add e.g. `inbox.afriscinexus.com` in Resend Receiving, create its MX record, and update *Receiving domain* in Settings.
- **Webhook** (Resend → Webhooks): `https://afriscinexus.com/functions/emailInbound` with `email.received`, `email.sent`, `email.delivered`, `email.delivery_delayed`, `email.bounced`, `email.complained`, `email.opened`, `email.clicked`.

## Templates
18 built-in templates are installed the first time the Email Center opens. Edit them in the Templates tab (or per email in Compose). Syntax: `{{variable}}`, `{{#if variable}}…{{else}}…{{/if}}`, `[button: Label | url]`, `[box]…[/box]`. *Reset to default* restores the original wording.

Manuscript references in subjects use `AFS-` + the last 8 characters of the manuscript ID (the same suffix the DOIs use).
