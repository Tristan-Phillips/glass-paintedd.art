# ⏎ Return Module (v3.0)

A self-contained, conflict-free navigation button with "Apple Glass" aesthetics.
It automatically hides itself on the Home page (`/` or `index.html`).

## 🚀 Quick Start
Add this line to the bottom of `<body>` on any sub-page (Gallery, About, Event):

```html
<script src="/pallet/script/return.js"></script>

```

---

## ⚙️ Configuration (Optional)

To override defaults (e.g., make it a "Back" button or move it), define `window.PNTD_RETURN_CONFIG` **before** loading the script.

### Example: "Go Back" Button (Top Right)

```html
<script>
    window.PNTD_RETURN_CONFIG = {
        target: 'back',            // Uses history.back()
        position: 'top-right',     // Moves button to top right corner
        icon: 'fas fa-arrow-left'  // Changes icon to arrow
    };
</script>
<script src="/pallet/script/return.js"></script>

```

### Example: Custom Link (Bottom Center)

```html
<script>
    window.PNTD_RETURN_CONFIG = {
        target: '/gallery',        // specific URL
        position: 'bottom-center', // customized position class
        icon: 'fas fa-palette',
        hoverColor: '#ff00ff'      // Custom pink glow
    };
</script>
<script src="/pallet/script/return.js"></script>

```

---

## 🎨 Default Settings

If no config is provided, it defaults to:

* **Action:** Go to Home (`/`)
* **Icon:** House (`fas fa-home`)
* **Position:** Top Left
* **Color:** Paintedd Turquoise (`#00d9bf`)