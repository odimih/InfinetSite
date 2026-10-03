// Contact form, homepage only. Loaded after core.js and translations.js.
//
// The whole file is behind a guard because the legal pages share the navbar and
// footer but have no form, and this script's EmailJS call would otherwise throw
// on them.

const contactForm = document.getElementById("contact-form");

if (contactForm) {
    // Publishable browser key, not a secret — but a live production value.
    emailjs.init("l0EOwZb5bmNaQ2LIj");

    contactForm.addEventListener("submit", function (e) {
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
}
