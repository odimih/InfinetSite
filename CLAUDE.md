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

- `[data-i18n="key"]` → sets `textContent`
- `[data-i18n-placeholder="key"]` → sets `placeholder`

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

## Known rough edges

- Footer "Privacy policy" and "Terms of service" link to `#` — the pages don't exist yet.
- No `<meta name="description">`, Open Graph tags or favicon.
- `<title>` is not translated; it stays "INFINET IT Solutions" in both languages.
