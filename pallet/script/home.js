// pallet/script/default.js

document.addEventListener("DOMContentLoaded", () => {
    // Elements
    const logoTrigger = document.querySelector(".logo-circle.tap-target");
    const radialMenu = document.getElementById("radial-menu");
    const navOverlay = document.getElementById("nav-overlay");
    const closeNavBtn = document.querySelector(".close-nav-btn");
    const tapHint = document.querySelector(".tap-hint");

    // Navigation items
    const navItems = document.querySelectorAll(".nav-item");

    // State management
    let isMenuOpen = false;

    // Open menu with logo
    logoTrigger.addEventListener("click", e => {
        e.stopPropagation();
        if (isMenuOpen) {
            closeMenu();
        } else {
            openMenu();
        }
        updateTapHint();
    });

    // Close menu events
    navOverlay.addEventListener("click", closeMenu);
    if (closeNavBtn) {
        closeNavBtn.addEventListener("click", e => {
            e.stopPropagation();
            closeMenu();
        });
    }

    // Navigation item clicks
    navItems.forEach(item => {
        item.addEventListener("click", e => {
            e.preventDefault();
            const href = item.getAttribute("href");
            if (href) {
                // Close menu then navigate
                closeMenu();
                setTimeout(() => {
                    window.location.href = href;
                }, 300);
            }
        });
    });

    // Toggle menu visibility
    function openMenu() {
        // Position menu at logo center
        const logoRect = logoTrigger.getBoundingClientRect();
        const logoCenterX = logoRect.left + logoRect.width / 2;
        const logoCenterY = logoRect.top + logoRect.height / 2;

        radialMenu.style.left = `${logoCenterX}px`;
        radialMenu.style.top = `${logoCenterY}px`;

        // Activate menu
        radialMenu.classList.add("active");
        navOverlay.classList.add("active");
        document.body.style.overflow = "hidden";
        isMenuOpen = true;

        // Add wobble effect
        radialMenu.style.animation = "wobble 0.7s ease";
        setTimeout(() => {
            radialMenu.style.animation = "";
        }, 700);
    }

    function closeMenu() {
        radialMenu.classList.remove("active");
        navOverlay.classList.remove("active");
        document.body.style.overflow = "";
        isMenuOpen = false;
    }

    function updateTapHint() {
        if (
            !document.body.classList.contains("nav-used") &&
            isFirstInteraction
        ) {
            document.body.classList.add("nav-used");
            isFirstInteraction = false;
            // Fade out tap hint after first interaction
            tapHint.style.opacity = "0";
            setTimeout(() => {
                tapHint.style.display = "none";
            }, 500);
        }
    }

    // Touch gesture support
    let touchStartX = 0;
    radialMenu.addEventListener(
        "touchstart",
        e => {
            touchStartX = e.touches[0].clientX;
        },
        { passive: true }
    );

    // Keyboard navigation
    document.addEventListener("keydown", e => {
        if (isMenuOpen && e.key === "Escape") {
            closeMenu();
        }
    });

    // Track first interaction
    let isFirstInteraction = true;

    // Add resize handler
    window.addEventListener("resize", () => {
        if (isMenuOpen) {
            const logoRect = logoTrigger.getBoundingClientRect();
            const logoCenterX = logoRect.left + logoRect.width / 2;
            const logoCenterY = logoRect.top + logoRect.height / 2;

            radialMenu.style.left = `${logoCenterX}px`;
            radialMenu.style.top = `${logoCenterY}px`;
        }
    });

    // Add secret access indicator to logo
    const secretAccess = document.createElement("div");
    secretAccess.className = "secret-access";
    document.querySelector(".nav-logo").appendChild(secretAccess);
});

// Modern KO-FI widget loading
function loadKoFiWidget() {
    const script = document.createElement("script");
    script.src = "https://storage.ko-fi.com/cdn/scripts/overlay-widget.js";
    script.onload = () => {
        kofiWidgetOverlay.draw("paintedd", {
            type: "floating-chat",
            "floating-chat.donateButton.text": "",
            "floating-chat.donateButton.background-color": "rgba(0, 0, 0, 0)",
            "floating-chat.donateButton.text-color": "#fff"
        });
    };
    document.body.appendChild(script);
}

// Initialize when DOM is ready
if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
) {
    loadKoFiWidget();
} else {
    document.addEventListener("DOMContentLoaded", loadKoFiWidget);
}
