document.addEventListener("DOMContentLoaded", () => {

    const userMenuButton = document.getElementById("userMenuButton");
    const userDropdown = document.getElementById("userDropdown");
    const themeToggle = document.getElementById("themeToggle");
    const navbarToggle = document.getElementById("navbarToggle");
    const navbar = document.querySelector(".navbar");

    /* =========================
       USER DROPDOWN
    ========================= */
    if (userMenuButton && userDropdown) {
        userMenuButton.addEventListener("click", () => {
            const wrapper = userMenuButton.closest(".user-menu");
            wrapper.classList.toggle("open");

            const expanded = wrapper.classList.contains("open");
            userMenuButton.setAttribute("aria-expanded", expanded);
        });

        document.addEventListener("click", (event) => {
            if (!userMenuButton.contains(event.target) && !userDropdown.contains(event.target)) {
                const wrapper = userMenuButton.closest(".user-menu");
                wrapper.classList.remove("open");
                userMenuButton.setAttribute("aria-expanded", "false");
            }
        });
    }

    /* =========================
       MOBILE NAVBAR TOGGLE
    ========================= */
    if (navbarToggle && navbar) {
        navbarToggle.addEventListener("click", () => {
            navbar.classList.toggle("open");
        });
    }

    /* =========================
       DARK MODE (IMPROVED)
    ========================= */
    if (themeToggle) {

        // 1. LOAD SAVED THEME
        const savedTheme = localStorage.getItem("theme");

        if (savedTheme === "dark") {
            document.documentElement.classList.add("dark-theme");
            themeToggle.textContent = "☀️";
        } else {
            themeToggle.textContent = "🌙";
        }

        // 2. TOGGLE THEME
        themeToggle.addEventListener("click", () => {

            const isDark = document.documentElement.classList.toggle("dark-theme");

            if (isDark) {
                localStorage.setItem("theme", "dark");
                themeToggle.textContent = "☀️";
            } else {
                localStorage.setItem("theme", "light");
                themeToggle.textContent = "🌙";
            }
        });
    }

});