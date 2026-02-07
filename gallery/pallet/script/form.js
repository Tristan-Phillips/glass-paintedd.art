// ===================================
// FORM MODULE - CONFLICT FREE
// ===================================
const ArtworkForm = (() => {
    // State management
    const state = {
        selectedEmoji: { emoji: "😊", label: "Delighted" },
        selectedInterest: "Original"
    };

    // DOM Element references (scoped to form only)
    const elements = {
        moodInput: null,
        artInterestInput: null,
        whatsappLink: null,
        artworkIdInput: null,
        artworkLinkInput: null,
        emojiTrigger: null,
        emojiPanel: null,
        interestTrigger: null,
        interestPanel: null,
        moodLabel: null,
        overlayTitle: null
    };

    // ===================================
    // UTILITY FUNCTIONS
    // ===================================
    function getArtworkLink(id) {
        return id ? `${window.location.origin}/gallery/#view=${id}` : "";
    }

    function updateArtworkFromTitle() {
        if (!elements.overlayTitle) return;

        const artworkId = elements.overlayTitle.textContent;
        if (!artworkId) return;

        updateArtwork(artworkId);
    }

    // ===================================
    // WHATSAPP HANDLER
    // ===================================
    function handleWhatsAppClick(e) {
        e.preventDefault();

        // Get captcha response
        const hcaptchaResponse = hcaptcha.getResponse();

        // Validate captcha
        if (!hcaptchaResponse) {
            alert("Please complete the captcha first!");
            return;
        }

        // Always update from title before sending (double-check)
        updateArtworkFromTitle();

        // Get current artwork info
        const artworkId =
            (elements.artworkIdInput && elements.artworkIdInput.value) ||
            "Unknown Artwork";
        const artworkLink =
            (elements.artworkLinkInput && elements.artworkLinkInput.value) ||
            getArtworkLink(artworkId);
        const mood = state.selectedEmoji.label;

        // Generate formatted WhatsApp message
        const message = `
🎨 *Artwork Inquiry*  
Artwork: ${artworkId}  
View: ${artworkLink}  

💫 *Feeling:* ${mood} ${state.selectedEmoji.emoji}  
💡 *Interested in:* ${state.selectedInterest}  

👉 Get in touch via WhatsApp for purchase/commission inquiries!
        `.trim();

        // Open WhatsApp
        window.open(
            `https://wa.me/27641417574?text=${encodeURIComponent(message)}`,
            "_blank"
        );
    }

    // ===================================
    // PICKER HANDLERS
    // ===================================
    function setupEmojiPicker() {
        if (!elements.emojiPanel) return;

        elements.emojiPanel
            .querySelectorAll(".pdd-emoji-option")
            .forEach(option => {
                option.addEventListener("click", function () {
                    const emoji = this.dataset.emoji;
                    const label = this.dataset.label;

                    state.selectedEmoji = { emoji, label };
                    if (elements.moodInput) elements.moodInput.value = label;

                    if (elements.emojiTrigger) {
                        elements.emojiTrigger.querySelector(
                            ".pdd-emoji-display"
                        ).innerHTML = emoji;
                        if (elements.moodLabel)
                            elements.moodLabel.innerHTML = label;
                    }

                    elements.emojiPanel.classList.add("pdd-hidden");
                });
            });

        // Toggle panel
        if (elements.emojiTrigger) {
            elements.emojiTrigger.addEventListener("click", e => {
                e.stopPropagation();
                elements.emojiPanel.classList.toggle("pdd-hidden");
                if (elements.interestPanel) {
                    elements.interestPanel.classList.add("pdd-hidden");
                }
            });
        }

        // Close when clicking outside
        document.addEventListener("click", e => {
            if (
                elements.emojiPanel &&
                !e.target.closest(".pdd-emoji-picker") &&
                !elements.emojiPanel.classList.contains("pdd-hidden")
            ) {
                elements.emojiPanel.classList.add("pdd-hidden");
            }
        });
    }

    function setupArtInterestPicker() {
        if (!elements.interestPanel) return;

        elements.interestPanel
            .querySelectorAll(".pdd-art-option")
            .forEach(option => {
                option.addEventListener("click", function () {
                    const value = this.dataset.value;
                    const label = this.dataset.label;

                    state.selectedInterest = value;
                    if (elements.artInterestInput)
                        elements.artInterestInput.value = value;

                    if (elements.interestTrigger) {
                        const labelElement =
                            elements.interestTrigger.querySelector(
                                ".art-interest-picker__label"
                            );
                        if (labelElement) labelElement.textContent = label;
                    }

                    elements.interestPanel.classList.add("pdd-hidden");
                });
            });

        // Toggle panel
        if (elements.interestTrigger) {
            elements.interestTrigger.addEventListener("click", e => {
                e.stopPropagation();
                elements.interestPanel.classList.toggle("pdd-hidden");
                if (elements.emojiPanel) {
                    elements.emojiPanel.classList.add("pdd-hidden");
                }
            });
        }

        // Close when clicking outside
        document.addEventListener("click", e => {
            if (
                elements.interestPanel &&
                !e.target.closest(".pdd-art-picker") &&
                !elements.interestPanel.classList.contains("pdd-hidden")
            ) {
                elements.interestPanel.classList.add("pdd-hidden");
            }
        });
    }

    // ===================================
    // INITIALIZATION
    // ===================================
    function init() {
        // Cache elements
        elements.moodInput = document.getElementById("mood-input");
        elements.artInterestInput =
            document.getElementById("art-interest-input");
        elements.whatsappLink = document.getElementById("whatsapp-link");
        elements.artworkIdInput = document.getElementById("form-artwork-id");
        elements.artworkLinkInput =
            document.getElementById("form-artwork-link");
        elements.emojiTrigger = document.getElementById("emoji-field");
        elements.emojiPanel = document.getElementById("emoji-panel");
        elements.interestTrigger = document.getElementById("relation-field");
        elements.interestPanel = document.getElementById("art-interest-panel");
        elements.moodLabel = document.getElementById("mood-label");
        elements.overlayTitle = document.getElementById("overlay-title");

        // Setup pickers
        setupEmojiPicker();
        setupArtInterestPicker();

        // Setup WhatsApp handler
        if (elements.whatsappLink) {
            elements.whatsappLink.addEventListener(
                "click",
                handleWhatsAppClick
            );
        }

        // Initialize current artwork if overlay is open
        if (elements.overlayTitle && elements.overlayTitle.textContent) {
            updateArtwork(elements.overlayTitle.textContent);
        }

        // Observer to track artwork title changes in overlay
        observeArtworkChanges();
    }

    function updateArtwork(artworkId) {
        if (!artworkId) return;

        if (elements.artworkIdInput) {
            elements.artworkIdInput.value = artworkId;
        }
        if (elements.artworkLinkInput) {
            elements.artworkLinkInput.value = getArtworkLink(artworkId);
        }
    }

    function observeArtworkChanges() {
        // Watch for changes in the artwork title
        if (!elements.overlayTitle) return;

        // MutationObserver for artwork title changes
        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (
                    mutation.type === "characterData" ||
                    mutation.type === "childList"
                ) {
                    const artworkId = elements.overlayTitle.textContent;
                    if (artworkId) {
                        updateArtwork(artworkId);
                    }
                }
            }
        });

        observer.observe(elements.overlayTitle, {
            characterData: true,
            childList: true,
            subtree: true
        });
    }

    // Public API
    return {
        init,
        updateArtwork
    };
})();

// ===================================
// INITIALIZE FORM WHEN READY
// ===================================
document.addEventListener("DOMContentLoaded", () => {
    // Initialize form
    ArtworkForm.init();

    // Set artwork if coming directly to view
    const params = new URLSearchParams(window.location.hash.substring(1));
    const artworkId = params.get("view");
    if (artworkId) {
        ArtworkForm.updateArtwork(artworkId);
    }
});
