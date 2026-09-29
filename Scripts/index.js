document.getElementById("year").textContent = new Date().getFullYear();

// Smooth scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
        const targetId = this.getAttribute("href");

        // Placeholder links (footer Privacy / Terms) have no page yet — swallow
        // the click so the browser doesn't jump to the top and dirty the URL.
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

// EmailJS
emailjs.init("l0EOwZb5bmNaQ2LIj");

document.getElementById("contact-form").addEventListener("submit", function (e) {
    e.preventDefault();

    const lang = localStorage.getItem("lang") || "en";
    const t = translations[lang];
    const btn = document.getElementById("submit-btn");
    const status = document.getElementById("form-status");

    btn.disabled = true;
    btn.textContent = t.contact_submit_sending;
    status.textContent = "";
    status.className = "small mt-2 mb-0";

    emailjs.sendForm("service_wy11xkq", "template_551gonp", this)
        .then(() => {
            status.textContent = t.contact_success;
            status.classList.add("text-success");
            btn.textContent = t.contact_submit;
            btn.disabled = false;
            this.reset();
        })
        .catch(() => {
            status.textContent = t.contact_error;
            status.classList.add("text-danger");
            btn.textContent = t.contact_submit;
            btn.disabled = false;
        });
});

// Language switching
function setLanguage(lang) {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;

    const t = translations[lang];

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

    // Swap accessible labels
    document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
        const key = el.getAttribute("data-i18n-aria-label");
        if (t[key] !== undefined) el.setAttribute("aria-label", t[key]);
    });

    // Update dropdown toggle label
    const toggle = document.getElementById("langDropdown");
    const code = lang === "en" ? "gb" : "gr";
    const label = lang === "en" ? "EN" : "ΕΛ";
    toggle.innerHTML = `<span class="fi fi-${code} me-1"></span> ${label}`;

    // Update active state on items
    document.getElementById("lang-en").classList.toggle("active", lang === "en");
    document.getElementById("lang-el").classList.toggle("active", lang === "el");
}

// Language button event listeners
document.getElementById("lang-en").addEventListener("click", function () {
    setLanguage("en");
});
document.getElementById("lang-el").addEventListener("click", function () {
    setLanguage("el");
});

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
        darkModeIcon.className = "bi bi-sun";
    } else {
        document.documentElement.removeAttribute("data-bs-theme");
        darkModeIcon.className = "bi bi-moon";
    }

    if (persist) localStorage.setItem("darkMode", enabled ? "on" : "off");
}

darkModeToggle.addEventListener("click", function () {
    const isDark = document.documentElement.getAttribute("data-bs-theme") === "dark";
    setDarkMode(!isDark, true);
});

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
