/**
 * PAINTEDD | RETURN MODULE (v3.0 - Pro Glass Edition)
 * * Self-contained logic for navigation management.
 * * Features: "Apple Glass" aesthetic, conflict-free namespacing, smart routing.
 * * Usage: Just include <script src="/pallet/script/return.js"></script>
 * Override: window.PNTD_RETURN_CONFIG = { ... }
 */

(function() {
    'use strict';

    // --- NAMESPACED CONSTANTS ---
    const ID_PREFIX = 'pntd-nav-';
    const CLASS_PREFIX = 'pntd-glass-';

    // --- CONFIGURATION ---
    const DEFAULT_CONFIG = {
        target: '/',            
        icon: 'fas fa-home',   
        position: 'top-left',  
        baseColor: '#ffffff',  
        hoverColor: '#b932ee', 
        glassBlur: '16px',      
        hideOnPaths: ['/', '/index.html'] 
    };

    // Merge Config safely
    const config = { ...DEFAULT_CONFIG, ...(window.PNTD_RETURN_CONFIG || {}) };

    // --- INJECTED STYLES (Scoped & Conflict-Free) ---
    // We use specific class names to avoid bleeding into other CSS
    const STYLES = `
        /* CORE BUTTON SHELL */
        .${CLASS_PREFIX}btn {
            position: fixed; 
            z-index: 99999; /* Orbit functionality: Always on top */
            width: 55px; height: 55px;
            display: flex; align-items: center; justify-content: center;
            border-radius: 50%;
            text-decoration: none;
            cursor: pointer;
            
            /* APPLE GLASS AESTHETIC */
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(${config.glassBlur}) saturate(180%);
            -webkit-backdrop-filter: blur(${config.glassBlur}) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 
                0 4px 30px rgba(0, 0, 0, 0.1), 
                inset 0 0 0 1px rgba(255, 255, 255, 0.05); /* Inner Rim */
            
            /* TYPE & ANIMATION */
            color: rgba(255, 255, 255, 0.7);
            font-size: 1.2rem;
            transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); /* Spring Physics */
            
            /* INITIAL STATE (Hidden) */
            opacity: 0; 
            transform: scale(0.5) translateY(20px);
            pointer-events: none;
        }

        /* POSITIONING PRESETS */
        .${CLASS_PREFIX}top-left     { top: 30px; left: 30px; }
        .${CLASS_PREFIX}top-right    { top: 30px; right: 30px; }
        .${CLASS_PREFIX}bottom-left  { bottom: 30px; left: 30px; }
        .${CLASS_PREFIX}bottom-right { bottom: 30px; right: 30px; }

        /* HOVER STATE (The "Active" Feel) */
        .${CLASS_PREFIX}btn:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.3);
            transform: scale(1.1) translateY(0);
            box-shadow: 
                0 10px 40px -10px ${config.hoverColor}66, /* Glow */
                inset 0 0 0 1px rgba(255, 255, 255, 0.2);
            color: ${config.hoverColor};
        }

        /* CLICK STATE */
        .${CLASS_PREFIX}btn:active {
            transform: scale(0.9);
            background: rgba(255, 255, 255, 0.05);
        }

        /* VISIBILITY TOGGLE */
        .${CLASS_PREFIX}visible {
            opacity: 1; 
            transform: scale(1) translateY(0);
            pointer-events: auto;
        }

        /* MOBILE ADJUSTMENT */
        @media (max-width: 600px) {
            .${CLASS_PREFIX}btn { width: 45px; height: 45px; font-size: 1rem; }
            .${CLASS_PREFIX}top-left { top: 20px; left: 20px; }
            .${CLASS_PREFIX}top-right { top: 20px; right: 20px; }
        }
    `;

    // --- MAIN LOGIC ---
    function init() {
        try {
            // 1. Prevent Duplicates
            if (document.getElementById(`${ID_PREFIX}root`)) return;

            // 2. Route Check (Don't show on Home)
            const currentPath = window.location.pathname;
            // Handle simple root check and explicit index.html check
            const isHome = config.hideOnPaths.some(path => currentPath.endsWith(path));
            if (isHome && currentPath.length < 2) return; // Strict root check
            if (config.hideOnPaths.includes(currentPath)) return;

            // 3. Inject CSS
            const styleEl = document.createElement('style');
            styleEl.id = `${ID_PREFIX}styles`;
            styleEl.textContent = STYLES;
            document.head.appendChild(styleEl);

            // 4. Build Element
            const elementTag = config.target === 'back' ? 'button' : 'a';
            const btn = document.createElement(elementTag);
            btn.id = `${ID_PREFIX}root`;
            btn.className = `${CLASS_PREFIX}btn ${CLASS_PREFIX}${config.position}`;
            btn.setAttribute('aria-label', config.target === 'back' ? 'Go Back' : 'Return Home');

            // 5. Logic Wiring
            if (config.target === 'back') {
                btn.onclick = (e) => {
                    e.preventDefault();
                    window.history.back();
                };
            } else {
                btn.href = config.target;
            }

            // 6. Icon Injection
            btn.innerHTML = `<i class="${config.icon}"></i>`;

            // 7. Mount & Animate
            document.body.appendChild(btn);
            
            // Double-requestAnimationFrame ensures CSS transition catches the state change
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    btn.classList.add(`${CLASS_PREFIX}visible`);
                });
            });

        } catch (err) {
            console.warn("Paintedd Return Module: Initialization bypassed.", err);
        }
    }

    // --- SAFE BOOT ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();