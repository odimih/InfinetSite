# INFINET IT Solutions — infinet.gr

Single-page marketing site for INFINET IT Solutions (Greek IT company, in business since 1996).
Services: AI-powered applications, software development, internet/web solutions, IT infrastructure
and business hardware.

Live at **https://infinet.gr** (`www.infinet.gr` redirects to the apex domain).
Repo: **https://github.com/odimih/InfinetSite** (`main`).

## Stack

Plain static HTML/CSS/JS — **no build step, no package manager, no framework**. Open `index.html`
in a browser and it runs. Everything third-party comes from CDNs via `<script>`/`<link>` tags:

| Dependency | Version | Purpose |
|---|---|---|
| Bootstrap | 5.3.3 (CSS + `bootstrap.bundle.min.js`) | Layout, grid, components, dark theme |
| Bootstrap Icons | 1.11.3 | All `bi bi-*` icons |
| flag-icons | 7.2.3 | `fi fi-gb` / `fi fi-gr` flags in the language switcher |
| @emailjs/browser | 4 | Contact form delivery (no backend) |

Pinning matters — versions are hardcoded in `index.html`. Bumping Bootstrap can break the dark-mode
overrides in `style.css`, which target Bootstrap's own classes.

## Files

```
index.html              # the marketing page: navbar, hero, 6 sections, footer
privacy.html            # privacy policy (EN translation)
privacy-el.html         # privacy policy (EL — governing text)
terms.html              # terms of use (EN translation)
terms-el.html           # terms of use (EL — governing text)
style.css               # custom styles + all dark-mode overrides
Scripts/core.js         # shared: i18n, dark mode, footer year, smooth scroll
Scripts/contact.js      # homepage only: EmailJS contact form
Scripts/translations.js # the en/el string table
Images/                 # logos, 2 content photos, ItemAtlas3D icon + screenshots
Images/originals/       # source captures, gitignored — not served
```

Page structure, in order: fixed navbar → `#hero` (a `<header>`, not a `<section>`) → `#services` →
`#why` → `#projects` (labelled "Case Studies" in the nav) → `#about` → `#contact` → footer.

## The three systems in `Scripts/`

Everything runs at parse time at the bottom of `<body>` — there is no `DOMContentLoaded` wrapper, so
the script tags must stay last, and `translations.js` must load **before** `core.js`, which must
load before `contact.js`.

`core.js` runs on **every** page, including the legal pages, so every DOM lookup in it is guarded.
`contact.js` is wrapped entirely in an `#contact-form` guard. Keep it that way: these files run at
parse time, so one unguarded lookup returning null throws and silently kills everything after it —
which is exactly the bug the split fixed.

### 1. Translations (EN / EL)

`translations.js` exports a single `const translations = { en: {...}, el: {...} }` with ~140 keys per
language. `setLanguage(lang)` walks the DOM and swaps:

- `[data-i18n="key"]` → sets `textContent` (this is how `<title>` is translated too)
- `[data-i18n-placeholder="key"]` → sets `placeholder`
- `[data-i18n-content="key"]` → sets the `content` attribute (used by `<meta name="description">`)
- `[data-i18n-aria-label="key"]` → sets `aria-label`
- `[data-i18n-href="key"]` → sets `href`. Needed because the legal documents are a separate file
  per language, so the footer's link *target* changes with the language, not only its label.

Open Graph and Twitter tags are deliberately **not** translated: crawlers read them before any JS
runs, so swapping them client-side changes nothing a crawler sees and only desyncs the DOM from what
was scraped. They stay English, with `og:locale:alternate` advertising the Greek version.

Because `data-i18n` sets `textContent`, it cannot go on an element that wraps part of its text in a
child element — the swap would delete the child. The hero badge hits this: its tail sits in
`<span class="hero-badge-break">`, which goes `display: block` at narrow widths. It is therefore
split into `hero_badge_lead` and `hero_badge_tail`, one key per child span, with the outer element
carrying no attribute at all. **Don't collapse those two keys back into one**; doing so either kills
the responsive line break or silently unwires the badge.

That is how the badge and `hero_title` were both left untranslated for a long time — the keys existed
in both languages and nothing in the markup referenced them, so `setLanguage` never saw them and the
hardcoded English stayed on screen. A parity check between `en` and `el` does not catch this; the
check that does is the reverse one, for keys that exist in the table but appear in no `data-i18n*`
attribute. `nav_contact` is the only one left, and the three `contact_*` status strings are read
directly by `contact.js` rather than from markup, so they are expected to be absent.

Choice is persisted in `localStorage["lang"]`; **new visitors always get English**, regardless of
browser locale. This is deliberate — don't "improve" it to sniff `navigator.language`.

**When you add or change any user-facing text, you must touch three places:** the English string, the
Greek string, and the `data-i18n` attribute in the markup. A key present in one language but missing
in the other silently leaves the old text on screen (`setLanguage` skips `undefined`). Keep the two
blocks in the same order with the same `// Navbar`, `// Hero`, `// Services` … comment groupings —
they're meant to be diffed side by side.

Greek text uses proper Greek typography, and the English copy uses non-breaking hyphens (`‑`, U+2011)
in terms like "AI‑Powered". Preserve those characters rather than normalising them to ASCII.

### 2. Dark mode

Toggles `data-bs-theme="dark"` on `<html>`, which activates Bootstrap's built-in dark theme.
Preference is stored in `localStorage["darkMode"]` (`"on"`/`"off"`), and the resolution order is:

1. A saved manual preference wins.
2. Otherwise follow the OS (`prefers-color-scheme`), **and keep following it live** — a `matchMedia`
   change listener re-applies, but only while no manual preference is set.

Writing to `localStorage` is what *creates* a manual preference, and a manual preference permanently
stops the site from following the OS. So `setDarkMode(enabled, persist)` takes an explicit flag and
**only the click handler may pass `persist: true`.** The two load-time calls and the `matchMedia`
listener pass `false`. Passing `true` anywhere else silently breaks rule 2 for every visitor after
their first pageview — which is exactly the bug the flag was added to fix.

Bootstrap's dark theme does not cover everything, so `style.css` has a dedicated
`/* ─── Dark mode overrides ─── */` block at the bottom with `[data-bs-theme="dark"]` rules. These
exist because the light styles hardcode colours: `--text-dark` on `body`, the white hero gradient,
`bg-light` sections, the white `.service-card-ai` gradient, card shadows that vanish on dark
surfaces, and the navbar logo (inverted with a `brightness(0) invert(1)` filter).

**Any new component with a hardcoded colour needs a matching dark override in that block.** Check
both themes before calling a visual change done.

### 3. Contact form

EmailJS, client-side only — there is no server. `emailjs.sendForm` posts the form directly, so the
input `name` attributes are the template variables: `from_name`, `from_email`, `company`, `message`.
Renaming an input breaks the email template.

The public IDs are in `Scripts/contact.js`: init key `l0EOwZb5bmNaQ2LIj`, service `service_wy11xkq`,
template `template_551gonp`. These are publishable browser keys, not secrets, but they are live
production values — don't swap them for test values in a commit.

Submit handler disables the button, shows a localised sending/success/error message via
`#form-status`, and resets the form on success. Status strings come from the translation table
(`contact_submit_sending`, `contact_success`, `contact_error`), so they must stay in both languages.

## Conventions

- **Bootstrap utilities first.** Reach for `style.css` only when utilities can't express it. The
  custom CSS is organised by page section with comment headers — add to the matching section.
- Brand colours live as CSS variables in `:root`: `--primary: #1e88e5`, `--primary-dark: #0d47a1`.
  The AI-related accents are a separate purple (`#7c3aed`) used by `.hero-badge-ai`,
  `.service-card-ai`, `.icon-circle-ai`, `.ai-new-badge`, `.btn-outline-ai`.
- The navbar is `fixed-top`, so `body` carries `padding-top: 76px` (90px under 992px) and anchor
  targets carry `.scroll-offset` (`scroll-margin-top: 88px`). Changing navbar height means updating
  all three.
- Indentation is 4 spaces in HTML, CSS and JS.
- `#year` in the footer is filled from `new Date().getFullYear()` — never hardcode the year.
- `.gitignore` excludes macOS `.DS_Store` files; don't commit editor or OS cruft.

## Deploying

Static hosting — `index.html` sits at the site root, and `Images/`, `Scripts/` and `style.css` are
referenced by relative path. There is no CI, no build and no deploy script.

**The repo is not connected to the host. The site is uploaded manually, so pushing is not the
release — uploading is.** Pushing `main` is version control and nothing more; it publishes nothing
and is safe at any time, including for work that is not meant to be live yet.

Two things follow:

- **`main` and production can diverge.** What is live is whatever was last uploaded, which is not
  necessarily what `main` holds. Do not infer the live state from the repo.
- **The gate is the upload, not the commit.** Verify a change by opening `index.html` locally, in
  both themes and both languages, before *uploading* it.

Upload **additively**. `/itematlas3d/` lives on the host but not in this repo, so anything that
mirrors or syncs the repo onto the web root rather than copying over it would delete that page.

## Planned: own-products section (`#apps`)

INFINET is moving from services-only to also publishing its own **cross-platform** apps. The first is
**ItemAtlas3D** — a 3D home and property inventory app (model your space, record what is stored
where, then walk through it in 3D to find things). Consumer today, with a business tier aimed at
hospitality and short-term-rental platforms (Booking.com, Airbnb) to follow.

It ships on four platforms through three channels:

| Platform | Channel |
|---|---|
| iOS | App Store |
| macOS | App Store |
| Android | Google Play |
| Windows | Microsoft Store (planned), and direct from the ItemAtlas site paid through Stripe |

Windows was originally direct-sale only, which made any badge row structurally incomplete. A
Microsoft Store listing is now planned as well, and the section copy already says the apps are
findable in the "Apple, Google and Windows stores" — true once that listing exists, like the rest of
this copy (see the release workflow above).

### Release workflow — read before writing any app copy

The work is committed and pushed as normal, and simply **not uploaded** until the apps are actually
published. Copy is therefore written in the present tense, as though the apps are live, even while
they are not; the store URLs are filled in once the listings exist and before the site is uploaded.

Because deployment is a manual upload (see Deploying above), none of this reaches production early,
so **"it is not true yet" is not a reason to soften the wording** — and committing or pushing it is
not a reason for alarm either. The only step that must wait is the upload.

**ItemAtlas3D has its own site, built separately and with its own theme, but it is served from this
same domain at `https://infinet.gr/itematlas3d/`.** It is not in this repo and never has been — check
`git log` if in doubt. Its store-mandated privacy and support URLs live on the ItemAtlas side, so
this site needs no new pages, no new routes and no new JavaScript. What belongs here is a promo
section that showcases it and houses every later app.

Two consequences:

- The promo link is the absolute `https://infinet.gr/itematlas3d/`, with no `target="_blank"` and no
  `rel` — same origin, so a new tab is not warranted. It is absolute rather than root-relative
  because `/itematlas3d` resolves to the filesystem root when `index.html` is opened as a `file://`
  URL, which breaks the local check this project relies on to verify changes. `canonical` and the
  Open Graph tags already hardcode the domain, so this is consistent. Use the apex host and keep the
  trailing slash: `www` redirects to apex, and the page is a directory.
- **`/itematlas3d` lives on the host but not in version control.** Any deploy that mirrors or syncs
  this repo onto the web root rather than copying files over it would delete that page. Upload
  additively.

The section does double duty: it sells the app, and it is the site's strongest credibility exhibit
for services clients — a published product is the one thing a prospect can go touch themselves.

### Decisions already made

- **Placement:** immediately after `#services`, before `#why` — high on the page without selling a
  consumer app to a commissioning client cold. A slim clickable teaser in the hero anchors down to
  it. (Directly after the hero was considered and rejected: it puts a consumer app ahead of any
  explanation of what the company does.)
- **Layout:** a two-column featured block — screenshots in a `col-lg-7`, and name, pitch, bullets,
  call to action and platform line in a `col-lg-5`. Deliberately *not* a card grid: one app in a
  three-card row leaves two holes. Migrate to a card grid at three or more apps. The featured layout
  is an intentional n=1 choice, not an accident.
- **Three screenshots, unequal:** the walk-through large on top, then the floor plan and the 3D
  building side by side in a `1fr 1fr` grid beneath it. The three show different capabilities rather
  than different angles, so one shot would undersell the app; an equal three-across strip was
  rejected because nothing would lead and nothing would be legible.
- **Surface:** its own subtly brand-tinted background. It sits between plain `#services` and
  `bg-light` `#why`, so a distinct surface avoids flipping the alternation for every section below.
- **Theming:** do not import ItemAtlas's theme. Render the section in INFINET brand and let the app's
  own identity appear only inside its icon and screenshots. Two brand systems in one section read as
  broken, not as two products.
- **Mobile as a service:** fold it into `svc1`; do not add a fifth service card. The services row is
  `col-md-6 col-lg-3` (4-across at `lg`, 2×2 at `md`), so a fifth card orphans onto its own line.
- **Register:** this is the only B2C moment on an otherwise entirely B2B page. Keep the pitch to a
  short paragraph and let ItemAtlas's own site do the selling — don't reproduce its marketing here.

### Navbar

The new link is **"Products" / "Προϊόντα"**, placed second, right after Services — nav order has to
mirror DOM order on a single-page site, and `#apps` sits after `#services`. Final order: Services,
Products, Why us, Case Studies, About. "Our Apps" was rejected because Greek renders it
"Οι εφαρμογές μας", roughly twice the width; bare "Apps" collides with the app-development service.

**A fifth link fits — measured, not assumed.** The logo renders at 202×62 (400×123 source), leaving the
right-hand group about 734px inside the `lg` container. The current group costs roughly 543px in
English and 527px in Greek, and a fifth link costs about 76px, so English lands near 619px with
~115px spare. **English is the worst case, not Greek**, because EL `nav_projects` is "Έργα" (4 chars)
against EN "Case Studies" (12). Those are character-width estimates with perhaps 15% error, so
verify at exactly 992px rather than trusting the arithmetic. Below `lg` the menu collapses to the
stacked hamburger, where extra items are free.

**Do not free space by changing navbar height or logo size.** That ripples through
`body { padding-top }` (76px / 90px), `.scroll-offset` (88px) and the navbar's own 0.6rem padding,
per the convention above — a three-place change for a problem that measurement says doesn't exist.

If verification does show it's tighter than calculated, the fallback ladder in cost order is:
rename EN nav "Case Studies" → "Projects" (−45px); shorten the EN CTA "Get in touch" → "Contact"
(−40px, and Greek already says "Επικοινωνία", so it would align the two languages and revive the dead
`nav_contact` key); drop "Why us" from the nav while keeping the section; switch to
`navbar-expand-xl`; make the language toggle icon-only (−20px).

### Screenshot theme swap

ItemAtlas supports dark mode, so ship light *and* dark screenshots and swap them with the theme
rather than framing one set to survive both.

**The swap must key off `[data-bs-theme="dark"]`, never `prefers-color-scheme`.** A
`<picture media="(prefers-color-scheme: dark)">` follows the OS and would desync from the manual
toggle — a visitor who has switched the site to dark while their OS is light would get light
screenshots on a dark page. Use two `<img>` elements shown and hidden by CSS from the dark-overrides
block, consistent with how the rest of the site's theming works.

Trade-off: both files get fetched. Keep them compressed and `loading="lazy"` — they will be the
heaviest assets on a site that otherwise ships four images.

### Screenshot lightbox

Each screenshot is a `<button>` that opens a Bootstrap modal (`modal-xl`, which caps at 1140px — the
images are 1200px wide, so they show at essentially native size; `modal-fullscreen` would upscale
them and look soft).

**This needs no new dependency and no new JavaScript.** Bootstrap's bundle is already loaded, and
each modal holds the *same* light/dark image pair with the same `.app-shot-light` / `.app-shot-dark`
classes, so the existing CSS swap themes the enlarged view too. Nothing to keep in sync, and the
browser reuses the already-fetched files.

The trigger must stay a `<button>`, not a clickable `<div>` or `<figure>` — that is what gives
keyboard operation, focus, and Bootstrap's escape handling and focus trap. `.app-shot` therefore
carries a button reset. Note a `<figure>` cannot live inside a `<button>`, which is why the markup
uses the button directly.

### Store badges

Official artwork from Apple and Google only, never recoloured, redrawn or resized outside their
brand rules. Both stores publish **Greek-localized variants**, worth using given the language
switcher. Pick variants that survive both themes.

Nothing is launched at time of writing, on any platform. Because the site stays local until the
apps are live (see the release workflow above), the section is built with real copy and the URLs are
filled in last, rather than shipping a "coming soon" state to production.

**Settled for now: no store badges.** The section carries one primary call to action — "Visit
ItemAtlas3D", pointing at `https://infinet.gr/itematlas3d/` — with a quiet
`iOS · Android · macOS · Windows` line beneath it. That page carries every purchase path, Stripe
included, so it is the right place for them.

**Note the original reason for this has weakened.** It was settled partly because Windows had no
store, so any badge row had one odd item out. With a Microsoft Store listing planned, three official
badge families would cover every channel and a complete row becomes possible. What still argues
against it is maintenance: three badge families, each with Greek variants and both themes to
survive, inside a promo block whose job is to hand off. Worth revisiting once the Microsoft listing
is real, rather than treating "no badges" as closed.

### Positioning copy this depends on

Mobile currently appears **nowhere** in the site's copy — `svc1_li1` offers "Desktop & web
applications" — so the section would otherwise arrive unannounced. This ships as its own commit,
ahead of the section:

1. `svc1` — mobile added to `li1`, store publishing merged into `li4`. All four service cards carry
   exactly four bullets, and the row is `col-md-6 col-lg-3` with `h-100` cards, so a fifth bullet
   would have made this card taller than its three neighbours. Publishing joined maintenance instead
   of becoming a fifth item.
2. `about_body` — one clause: client work since 1996, own products now. About is the narrative home
   for a business-model shift; it doesn't need a section of its own.
3. `meta_description` plus the OG and Twitter descriptions — mobile, web and desktop.
4. `hero_badge` — "Web Systems" became "Mobile & Web" in both languages, keeping the line the same
   length. Light touch only; services pay the bills and the hero is already dense.

Product copy says **"for desktop and mobile"** rather than naming stores: the App Store covers both
iOS and macOS, Google Play covers Android, and Windows is a direct sale, so no list of store names
is both short and complete.

Deferred until there is more than one app: an apps-published stat in the About "At a glance" block,
and any dedicated treatment of the ItemAtlas business tier (B2B SaaS, a genuinely different pitch,
and possibly a stronger bridge to the services business than the consumer app is).

## Legal pages

Four files at the repo root: `privacy.html` / `privacy-el.html` and `terms.html` / `terms-el.html`.
Linked from the footer only, not the navbar.

**The Greek is the governing text and the English is a translation.** Both say so, in their Language
section. If you change one, change the other in the same commit — a policy that contradicts itself
across languages is worse than one that is merely out of date.

### Controller and company identification

A **sole proprietorship**, so the controller is a natural person trading under a business name —
not a company. PD 131/2003 (transposing the e-Commerce Directive) requires these to be easily,
directly and permanently accessible, and the VAT number is required because IT services are
VAT-liable:

| | |
|---|---|
| Name | Οδυσσέας Μηχανετζής - INFINET / Odysseas Michanetzis - INFINET |
| ΓΕΜΗ | 2118001000 |
| ΑΦΜ | 032966102 |
| Registered address | Θέση Πλαγιά, 19014, Καπανδρίτι, Αττική |

The contact section previously said Afidnes; it now carries the registered address, so the site and
the register agree.

### What the site actually processes

Short, and worth keeping short — **no cookies, no analytics, no trackers, no social embeds.** The
only third-party origin the page loads is `cdn.jsdelivr.net`. A policy that can say this plainly is
more credible than boilerplate, and **no cookie banner is required.**

| Data | Processor | Notes |
|---|---|---|
| Name, email, company, message | **EmailJS Pte. Ltd.** (Singapore) | Servers in the USA on AWS |
| Mailbox holding those enquiries | **Microsoft 365** | |
| Website hosting | **top.host** | Greek, so no third-country transfer |
| Visitor IP on every page load | **jsDelivr** CDN | |
| `lang`, `darkMode` | — | `localStorage`, functional only, exempt from consent |

### EmailJS — checked, and in order

- Its **DPA is incorporated into the Terms and Conditions**, so accepting those at registration
  formed the Article 28 contract. Nothing further to sign.
- Transfers to the USA rely on the **EU Standard Contractual Clauses**, named in the DPA.
- EmailJS retains request and metadata history for **30 days**. That is their schedule, not ours,
  and the policy should say so separately from our own retention.
- On free and standard tiers, sub-processor changes are published to a web page and continued use
  counts as acceptance — **no email notice**. Only Business plans get 14 days' warning.

### Open item: server log retention

The policy discloses the host's access logs — IP, timestamp, request, status, user agent, referrer
— but says only that they are kept "for a limited period under our host's own retention schedule".
**Ask top.host for the actual number and put it in**, in both languages. Their privacy pages sit
behind a Cloudflare challenge, so it could not be looked up; a support ticket is the way.

Server logs are the single most common omission in a brochure-site privacy policy, because the site
owner never sees them and forgets the host is keeping them on their behalf.

### Retention — deliberately general

The policy uses general wording ("as long as necessary to respond and for a reasonable follow-up
period") rather than a fixed number. A stated period is a promise, and an unenforced promise is a
misstatement.

**If a concrete period is ever wanted**, do not just edit the text — make it true first. Microsoft
365 supports a retention policy that auto-deletes a folder's contents after a set age: route form
emails into a "Website enquiries" folder, set the policy to 24 months, and only then state 24 months
in the document. Enquiries that become business move out of that folder and fall under the longer
business-records period Greek tax law requires, generally five years.

### Scope — load-bearing, not housekeeping

`infinet.gr/itematlas3d/` is the **same origin** as the rest of the site, and it has its own privacy
policy already submitted to the stores. So the site policy must scope itself **by path**, near the
top, not in a footnote.

Without that, "we set no cookies" is a claim about the whole domain — and if Stripe ever runs on the
product path for Windows sales, it sets cookies and the strongest sentence in the policy becomes
false. The same applies to `localStorage`, which is shared across one origin.

Reuse the controller identity block **verbatim** from the already-submitted store policy. If the two
disagree on the entity's details, that is the kind of discrepancy a reviewer notices.

### How the pages are built

- **Flat files at the repo root**, not `/privacy/index.html`. `file://` does not serve `index.html`
  from a directory, so directory URLs would break in exactly the local check this project uses.
- **Separate document per language**, rather than running legal prose through `data-i18n`. A policy
  is roughly 70 blocks; keys would double `translations.js` and fragment text a lawyer needs to read
  end to end.
- **The shared navbar and footer still use `data-i18n`.** Each legal page asserts its own language
  with a one-line inline script (`localStorage.setItem("lang", "el")`) placed **before** `core.js`,
  so the chrome translates itself to match the document. Without that, you get a Greek policy
  wearing an English navbar.
- **The language dropdown on these pages carries no `lang-en` / `lang-el` ids.** Those ids are what
  `core.js` binds its swap handlers to; here the items are plain links to the sibling document.
  Keeping `id="langDropdown"` on the toggle is deliberate — `core.js` relabels it from the stored
  language, which the inline script has already set correctly.
- **All in-page anchors are `index.html#services`**, since `#services` resolves to nothing here.
- **"Terms of use", not "Terms of service"** — no accounts, payments or user content. If Stripe
  sales ever run from the product path, consumer commercial terms (refunds, the EU 14-day
  withdrawal right for digital content and its waiver) belong there, not on the company site.
- Company identification (ΓΕΜΗ, ΑΦΜ) sits in the footer of **every** page, because the
  disclosure must be permanently accessible, not buried one click away.

## Known rough edges

- `nav_contact` exists in both language blocks and is referenced nowhere in the markup — dead key.
  It holds exactly "Contact" / "Επικοινωνία", so it is worth reviving rather than deleting if the CTA
  label is ever shortened.
- The Case Studies section is labelled per-language rather than identically across languages: English
  says "Case Studies" in nav, heading and footer; Greek says "Έργα" (Projects) in all three. Each
  language is internally consistent, which is what matters — the literal Greek, "Μελέτες
  περίπτωσης", is 18 characters and would break the navbar.
- No sitemap or `robots.txt`. Only worth adding if the site ever grows past one page.
- `og:image` is the logo, so social shares render a small `summary` card. A 1200×630 share image would
  justify upgrading to `summary_large_image`.
