// Behaviour shared by every page: footer year, smooth scroll, language, dark mode.
//
// Every lookup here is guarded. This file runs on the legal pages too, and those
// carry the navbar and footer but none of the homepage's sections or its contact
// form. An unguarded getElementById that returns null throws, and because this
// script runs at parse time, a throw anywhere kills everything below it — which
// is exactly how a missing contact form used to take the language switcher and
// the theme toggle down with it.

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Smooth scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
        const targetId = this.getAttribute("href");

        // A bare "#" is a placeholder. Swallow the click so the browser doesn't
        // jump to the top and leave a stray # in the URL.
        if (targetId === "#") {
            e.preventDefault();
            return;
        }

        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
    });
});

// Language switching
function setLanguage(lang) {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;

    const t = translations[lang];
    if (!t) return;

    // Swap text content
    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        if (t[key] !== undefined) el.textContent = t[key];
    });

    // Swap placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (t[key] !== undefined) el.placeholder = t[key];
    });

    // Swap meta content (description)
    document.querySelectorAll("[data-i18n-content]").forEach((el) => {
        const key = el.getAttribute("data-i18n-content");
        if (t[key] !== undefined) el.setAttribute("content", t[key]);
    });

    // Swap link targets (the legal pages are a separate file per language)
    document.querySelectorAll("[data-i18n-href]").forEach((el) => {
        const key = el.getAttribute("data-i18n-href");
        if (t[key] !== undefined) el.setAttribute("href", t[key]);
    });

    // Swap accessible labels
    document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
        const key = el.getAttribute("data-i18n-aria-label");
        if (t[key] !== undefined) el.setAttribute("aria-label", t[key]);
    });

    // Update dropdown toggle label
    const toggle = document.getElementById("langDropdown");
    if (toggle) {
        const code = lang === "en" ? "gb" : "gr";
        const label = lang === "en" ? "EN" : "ΕΛ";
        toggle.innerHTML = `<span class="fi fi-${code} me-1"></span> ${label}`;
    }

    // Update active state on items
    const enItem = document.getElementById("lang-en");
    const elItem = document.getElementById("lang-el");
    if (enItem) enItem.classList.toggle("active", lang === "en");
    if (elItem) elItem.classList.toggle("active", lang === "el");
}

// Language button event listeners
const langEnBtn = document.getElementById("lang-en");
const langElBtn = document.getElementById("lang-el");
if (langEnBtn) {
    langEnBtn.addEventListener("click", function () {
        setLanguage("en");
    });
}
if (langElBtn) {
    langElBtn.addEventListener("click", function () {
        setLanguage("el");
    });
}

// Apply saved language on load — always default to English for new visitors
const savedLang = localStorage.getItem("lang") || "en";
setLanguage(savedLang);

// Dark mode
const darkModeToggle = document.getElementById("darkModeToggle");
const darkModeIcon = document.getElementById("darkModeIcon");

// `persist` must stay false for anything that isn't an explicit user toggle —
// writing to localStorage is what marks a manual preference, and a manual
// preference permanently stops the site from following the OS theme.
function setDarkMode(enabled, persist) {
    if (enabled) {
        document.documentElement.setAttribute("data-bs-theme", "dark");
        if (darkModeIcon) darkModeIcon.className = "bi bi-sun";
    } else {
        document.documentElement.removeAttribute("data-bs-theme");
        if (darkModeIcon) darkModeIcon.className = "bi bi-moon";
    }

    if (persist) localStorage.setItem("darkMode", enabled ? "on" : "off");
}

if (darkModeToggle) {
    darkModeToggle.addEventListener("click", function () {
        const isDark = document.documentElement.getAttribute("data-bs-theme") === "dark";
        setDarkMode(!isDark, true);
    });
}

// Apply dark mode on load:
// - use saved preference if the user has manually toggled before
// - otherwise follow the system setting
const savedDarkMode = localStorage.getItem("darkMode");
if (savedDarkMode !== null) {
    setDarkMode(savedDarkMode === "on", false);
} else {
    setDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches, false);
}

// React to OS theme changes in real time, but only if the user hasn't set a manual preference
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
    if (localStorage.getItem("darkMode") === null) {
        setDarkMode(e.matches, false);
    }
});
