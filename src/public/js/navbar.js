document.addEventListener("DOMContentLoaded", () => {
    const userMenuButton = document.getElementById("userMenuButton");
    const userDropdown = document.getElementById("userDropdown");
    const themeToggle = document.getElementById("themeToggle");
    const navbarToggle = document.getElementById("navbarToggle");
    const navbar = document.querySelector(".navbar");

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

    if (navbarToggle && navbar) {
        navbarToggle.addEventListener("click", () => {
            navbar.classList.toggle("open");
        });
    }

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            document.documentElement.classList.toggle("dark-theme");
            themeToggle.textContent = document.documentElement.classList.contains("dark-theme") ? "☀️" : "🌙";
        });
    }
});
