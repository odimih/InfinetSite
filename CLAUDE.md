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
index.html              # entire page: navbar, hero, 5 sections, footer
style.css               # custom styles + all dark-mode overrides
Scripts/index.js        # all behaviour (i18n, dark mode, form, smooth scroll)
Scripts/translations.js # the en/el string table
Images/                 # logo (2 variants) + 2 content photos
```

Page structure, in order: fixed navbar → `#hero` (a `<header>`, not a `<section>`) → `#services` →
`#why` → `#projects` (labelled "Case Studies" in the nav) → `#about` → `#contact` → footer.

## The three systems in `Scripts/index.js`

Everything runs at parse time at the bottom of `<body>` — there is no `DOMContentLoaded` wrapper, so
the script tags must stay last, and `translations.js` must load **before** `index.js`.

### 1. Translations (EN / EL)

`translations.js` exports a single `const translations = { en: {...}, el: {...} }` with ~140 keys per
language. `setLanguage(lang)` walks the DOM and swaps:

- `[data-i18n="key"]` → sets `textContent` (this is how `<title>` is translated too)
- `[data-i18n-placeholder="key"]` → sets `placeholder`
- `[data-i18n-content="key"]` → sets the `content` attribute (used by `<meta name="description">`)
- `[data-i18n-aria-label="key"]` → sets `aria-label`

Open Graph and Twitter tags are deliberately **not** translated: crawlers read them before any JS
runs, so swapping them client-side changes nothing a crawler sees and only desyncs the DOM from what
was scraped. They stay English, with `og:locale:alternate` advertising the Greek version.

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

The public IDs are in `Scripts/index.js`: init key `l0EOwZb5bmNaQ2LIj`, service `service_wy11xkq`,
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

Static hosting served straight from the repo root — `index.html` sits at the site root, and
`Images/`, `Scripts/` and `style.css` are referenced by relative path. There is no CI, no build and
no deploy script: pushing `main` is the release.

Because of that, **`main` is production**. Verify a change by opening `index.html` locally, in both
themes and both languages, before pushing.

## Planned: own-products section (`#apps`)

INFINET is moving from services-only to also publishing its own mobile apps on Google Play and the
App Store. The first is **ItemAtlas3D** — a consumer app, launching around 6 October 2026, with a
business tier aimed at hospitality and short-term-rental platforms (Booking.com, Airbnb) to follow.

**ItemAtlas3D is a fully independent product with its own site, hosting and theme — nothing about it
is served from this repo.** Its store-mandated privacy and support URLs live on the ItemAtlas side,
so this site needs no new pages, no new routes and no new JavaScript. What belongs here is a promo
section that showcases it and houses every later app.

The section does double duty: it sells the app, and it is the site's strongest credibility exhibit
for services clients — a published product is the one thing a prospect can go touch themselves.

### Decisions already made

- **Placement:** immediately after `#services`, before `#why` — high on the page without selling a
  consumer app to a commissioning client cold. A slim clickable teaser in the hero anchors down to
  it. (Directly after the hero was considered and rejected: it puts a consumer app ahead of any
  explanation of what the company does.)
- **Layout:** a two-column featured block — framed screenshots one side, name, pitch, store badges
  and outbound link the other. Deliberately *not* a card grid: one app in a three-card row leaves two
  holes. Migrate to a card grid at three or more apps. The featured layout is an intentional n=1
  choice, not an accident.
- **Surface:** its own subtly brand-tinted background. It sits between plain `#services` and
  `bg-light` `#why`, so a distinct surface avoids flipping the alternation for every section below.
- **Theming:** do not import ItemAtlas's theme. Render the section in INFINET brand and let the app's
  own identity appear only inside its icon and screenshots. Two brand systems in one section read as
  broken, not as two products.
- **Mobile as a service:** fold it into `svc1`; do not add a fifth service card. The services row is
  `col-md-6 col-lg-3` (4-across at `lg`, 2×2 at `md`), so a fifth card orphans onto its own line.
- **Register:** this is the only B2C moment on an otherwise entirely B2B page. Keep the pitch to a
  short paragraph and let ItemAtlas's own site do the selling — don't reproduce its marketing here.

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

### Store badges

Official artwork from Apple and Google only, never recoloured, redrawn or resized outside their
brand rules. Both stores publish **Greek-localized variants**, worth using given the language
switcher. Pick variants that survive both themes.

ItemAtlas3D is not live at time of writing, so badges ship in a "launching soon" state and become
real links in a one-line commit on launch day. Both URLs are obtainable in advance — Play from the
package name, the App Store numeric ID from App Store Connect — so nothing needs hardcoding twice.

### Positioning copy this depends on

Mobile currently appears **nowhere** in the site's copy — `svc1_li1` offers "Desktop & web
applications" — so the section would otherwise arrive unannounced. This ships as its own commit,
ahead of the section:

1. `svc1` — add mobile/cross-platform apps and store publishing to the list.
2. `about_body` — one clause: client work since 1996, own products now. About is the narrative home
   for a business-model shift; it doesn't need a section of its own.
3. `meta_description` plus the OG and Twitter descriptions — add mobile apps.
4. `hero_badge` — work "Mobile Apps" into the pipe-separated line. Light touch only; services pay
   the bills and the hero is already dense.

Deferred until there is more than one app: an apps-published stat in the About "At a glance" block,
and any dedicated treatment of the ItemAtlas business tier (B2B SaaS, a genuinely different pitch,
and possibly a stronger bridge to the services business than the consumer app is).

## Known rough edges

- Footer "Privacy policy" and "Terms of service" link to `#` — the pages still don't exist. The
  smooth-scroll handler now swallows the click so they no longer jump to the top and leave a bare `#`
  in the URL, but they are inert placeholders.
- `nav_contact` exists in both language blocks and is referenced nowhere in the markup — dead key.
- No sitemap or `robots.txt`. Only worth adding if the site ever grows past one page.
- `og:image` is the logo, so social shares render a small `summary` card. A 1200×630 share image would
  justify upgrading to `summary_large_image`.
