document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. CONFIGURATION ---
    // Relative path to your main 'pallet/data' folder from this script's location
    // Current depth: event/cctown26/pallet/script/ -> ../../../pallet/data/
    const ROOT_PATH = '../../../pallet/data/'; 
    
    // --- STATE MANAGEMENT ---
    let artLibrary = [];
    let blueprints = {}; // Holds merged Global + Event pricing rules
    let currentArt = null;
    let currentProduct = null;
    let currentChoices = {}; 
    let cart = [];
    let metaData = { 
        currency: 'R', 
        whatsapp_default: '27641417574' 
    };

    // --- DOM ELEMENTS ---
    const els = {
        loading: document.getElementById('loading-layer'),
        error: document.getElementById('error-layer'),
        main: document.getElementById('main-interface'),
        imgLoader: document.getElementById('img-loader'),
        stageImg: document.getElementById('stage-image'),
        libraryCount: document.getElementById('library-count'),
        grid: document.getElementById('art-grid'),
        addBtn: document.getElementById('add-to-cart'),
        // Controls
        stageTitle: document.getElementById('stage-title'),
        stagePrice: document.getElementById('stage-price'),
        stageTag: document.getElementById('stage-tag'),
        stageIndicators: document.getElementById('stage-indicators'),
        stageReflection: document.getElementById('stage-reflection'),
        typeSelector: document.getElementById('type-selector'),
        variantArea: document.getElementById('variant-area'),
        artSocials: document.getElementById('art-socials'),
        btnPriceSub: document.getElementById('btn-price-sub'),
        btnText: document.getElementById('add-btn-text'),
        // Cart
        cartModal: document.getElementById('cart-modal'),
        cartList: document.getElementById('cart-list'),
        cartTotal: document.getElementById('cart-total'),
        cartCount: document.getElementById('cart-badge')
    };

    // --- 2. INITIALIZATION ---
    async function init() {
        try {
            // Artificial delay for premium feel
            const minLoadTime = new Promise(r => setTimeout(r, 600));

            // FETCH TRIFECTA: Global Rules + Master Art + Local Event Config
            const [globalRes, artRes, eventRes] = await Promise.all([
                fetchWithRetry(`${ROOT_PATH}global.json`, 3),      // Business Defaults
                fetchWithRetry(`${ROOT_PATH}art.json`, 3),         // Visuals (The Soul)
                fetchWithRetry('pallet/data/eventdetails.json', 3) // Local Prices (The Context)
            ]);

            const globalData = await globalRes.json();
            const artData = await artRes.json();
            const eventData = await eventRes.json();

            // A. MERGE METADATA
            metaData = { ...metaData, ...globalData.business, ...eventData.meta };

            // B. APPLY THEME (Inject CSS vars)
            if(eventData.theme) {
                const root = document.documentElement;
                if(eventData.theme.primary) root.style.setProperty('--primary', eventData.theme.primary);
                if(eventData.theme.accent) root.style.setProperty('--accent', eventData.theme.accent);
                // You can add more theme vars here if needed
            }

            // C. PREPARE BLUEPRINTS (Global + Event Overrides)
            blueprints = JSON.parse(JSON.stringify(globalData.defaults.blueprints)); // Deep Copy
            
            // Apply Event Overrides (e.g. Sticker is R50 instead of R40)
            if(eventData.pricing_overrides) {
                if(eventData.pricing_overrides.sticker) 
                    blueprints.loot.sticker.price = eventData.pricing_overrides.sticker;
                if(eventData.pricing_overrides.button) 
                    blueprints.loot.button.price = eventData.pricing_overrides.button;
                // Extend for other overrides as needed
            }

            // D. HYDRATE INVENTORY
            // Index the Master Art DB for O(1) lookup
            const artMap = new Map();
            const rawArt = Array.isArray(artData.artworks) ? artData.artworks : (artData.artworks || []);
            rawArt.forEach(item => artMap.set(item.id, item));

            // Map Event Inventory to Master Records
            artLibrary = eventData.inventory.map(listing => {
                const master = artMap.get(listing.id);
                
                if (!master) {
                    console.warn(`Missing Master Record for ${listing.id}`);
                    return null;
                }

                // Merge Visuals (Master) with Config (Event)
                return hydrateArtwork({
                    ...master, 
                    config: listing.config
                });
            }).filter(item => item !== null);
            
            // E. LAUNCH UI
            const [_, __] = await Promise.all([minLoadTime]); // Ensure delay finished
            els.loading.classList.add('hidden');
            
            if (artLibrary.length > 0) {
                els.main.classList.remove('hidden');
                setTimeout(() => els.main.classList.add('visible'), 50);
                els.libraryCount.textContent = artLibrary.length;
                renderGallery();
                loadArt(artLibrary[0]); 
            } else {
                showError("This event has no active listings.");
            }

        } catch (error) {
            console.error("Critical Init Error:", error);
            els.loading.classList.add('hidden');
            els.error.classList.remove('hidden');
        }
    }

    // --- 3. THE BRAIN: DATA HYDRATION ---
    // Converts simple config (["A4"]) into full Product Objects
    function hydrateArtwork(item) {
        const products = [];
        const cfg = item.config;
        if(!cfg) return item;

        // 3.1 ORIGINAL
        if (cfg.original && cfg.original.available !== false) {
            products.push({
                type: 'Original',
                label: 'Original Artwork',
                price_base: cfg.original.price,
                available: true,
                tag: '1 of 1',
                sku_base: `ORG-${item.id}`,
                variants: []
            });
        }

        // 3.2 PRINTS
        if (cfg.prints && cfg.prints.length > 0) {
            // Map Config Strings "A4" to Blueprint Objects
            const sizeOptions = cfg.prints.map(sizeKey => {
                // Handle object override { size: "A3", price: 999 }
                if(typeof sizeKey === 'object') {
                    return { 
                        label: sizeKey.label || sizeKey.size, 
                        mod: sizeKey.price_override, 
                        code: sizeKey.size 
                    };
                }
                // Handle standard string "A4"
                const bp = blueprints.print_sizes[sizeKey];
                return bp ? { label: bp.label, mod: bp.base, code: bp.code } : null;
            }).filter(Boolean);

            // Default Papers from Global
            const paperOptions = Object.values(blueprints.print_papers || {}).map(p => ({
                label: p.label, mod: p.tier, code: p.code
            }));

            if(sizeOptions.length > 0) {
                products.push({
                    type: 'Print',
                    label: 'Fine Art Print',
                    price_base: 0, // Base is 0, Size determines start price
                    available: true,
                    tag: 'Archival',
                    sku_base: `PRT-${item.id}`,
                    variants: [
                        { name: 'Size', options: sizeOptions },
                        { name: 'Paper', options: paperOptions }
                    ]
                });
            }
        }

        // 3.3 STICKER & BUTTON (LOOT)
        ['sticker', 'button'].forEach(type => {
            if (cfg[type]) {
                const bp = blueprints.loot[type];
                const override = (typeof cfg[type] === 'object') ? cfg[type] : {};
                
                products.push({
                    type: bp.label,
                    label: bp.label,
                    price_base: override.price_override || bp.price,
                    available: override.available !== false,
                    tag: override.tag || type.toUpperCase(),
                    sku_base: `${type.substring(0,3).toUpperCase()}-${item.id}`,
                    variants: [] // Loot usually flat items
                });
            }
        });

        return { ...item, products };
    }

    // --- 4. CORE UI LOGIC ---
    
    // Fetch Helper
    async function fetchWithRetry(url, retries = 3, delay = 1000) {
        for (let i = 0; i < retries; i++) {
            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res;
            } catch (err) {
                if (i === retries - 1) throw err;
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }

    function getImageUrl(item, type) {
        if (!item.images) return 'pallet/img/logo-circular.png';
        // Handle New Object Structure
        if (item.images[type]) return item.images[type];
        // Fallbacks
        return item.images.medium || item.images.original || item.images.thumbnail;
    }

    function showError(msg) {
        els.error.querySelector('p').textContent = msg;
        els.error.classList.remove('hidden');
    }

    // --- 5. RENDERERS ---
    function renderGallery() {
        els.grid.innerHTML = '';
        artLibrary.forEach(art => {
            const el = document.createElement('div');
            el.className = 'thumb-card';
            if (currentArt && art.id === currentArt.id) el.classList.add('active');
            
            const thumbUrl = getImageUrl(art, 'thumbnail');
            el.innerHTML = `<img src="${thumbUrl}" loading="lazy" alt="art" onerror="this.style.opacity='0.2'">`;
            
            el.addEventListener('click', () => {
                document.querySelectorAll('.thumb-card').forEach(c => c.classList.remove('active'));
                el.classList.add('active');
                loadArt(art);
            });
            els.grid.appendChild(el);
        });
    }

    function loadArt(art) {
        if(!art) return;
        currentArt = art;
        currentProduct = (art.products && art.products.length > 0) ? art.products[0] : null; 
        currentChoices = {};

        // Image Load with Spinner
        els.imgLoader.classList.add('active');
        els.stageImg.style.opacity = '0.5';
        
        const mainImgUrl = getImageUrl(art, 'medium');
        const tempImg = new Image();
        tempImg.onload = () => {
            els.stageImg.src = mainImgUrl;
            els.stageImg.style.opacity = '1';
            els.imgLoader.classList.remove('active');
        };
        tempImg.onerror = () => {
            els.stageImg.src = 'pallet/img/logo-circular.png';
            els.imgLoader.classList.remove('active');
        };
        tempImg.src = mainImgUrl;

        els.stageTitle.textContent = art.title || art.id;

        // Tags/Indicators
        els.stageIndicators.innerHTML = '';
        if (art.status === 'NSFW') {
            const badge = document.createElement('div');
            badge.className = 'indicator-dot';
            badge.style.color = 'red'; badge.style.borderColor = 'white';
            badge.title = 'NSFW Content';
            els.stageIndicators.appendChild(badge);
        }

        // Description
        if (art.description) {
            els.stageReflection.classList.remove('hidden');
            document.getElementById('reflection-text').textContent = art.description;
            document.getElementById('reflection-meta').textContent = (art.tags || []).join(' // ');
        } else {
            els.stageReflection.classList.add('hidden');
        }

        // Controls
        if(currentProduct) {
            renderTypeSelector();
            renderVariants();
            updatePrice();
        } else {
            els.typeSelector.innerHTML = '<span style="color:#666; font-size:12px;">Display Only</span>';
            els.variantArea.innerHTML = '';
            els.stagePrice.textContent = '--';
            els.addBtn.style.display = 'none';
        }
    }

    function renderTypeSelector() {
        els.typeSelector.innerHTML = '';
        els.addBtn.style.display = 'flex';

        if(!currentArt.products) return;

        currentArt.products.forEach(prod => {
            const btn = document.createElement('button');
            btn.className = 'pill-btn';
            if (prod === currentProduct) btn.classList.add('active');
            btn.textContent = prod.label || prod.type;
            
            btn.addEventListener('click', () => {
                currentProduct = prod;
                currentChoices = {}; 
                els.typeSelector.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderVariants();
                updatePrice();
            });
            els.typeSelector.appendChild(btn);
        });
    }

    function renderVariants() {
        els.variantArea.innerHTML = '';
        els.stageTag.textContent = currentProduct.tag || currentProduct.type;
        els.stageTag.style.display = currentProduct.available ? 'block' : 'none';

        if(!currentProduct.available) {
            els.addBtn.classList.add('disabled');
            els.btnText.textContent = "Sold Out";
            els.btnPriceSub.textContent = "";
        } else {
            els.addBtn.classList.remove('disabled');
            els.btnText.textContent = "Add to Loadout";
        }

        if (!currentProduct.variants || currentProduct.variants.length === 0) return;

        currentProduct.variants.forEach(v => {
            currentChoices[v.name] = v.options[0]; // Default First

            const group = document.createElement('div');
            group.className = 'selector-group';
            group.innerHTML = `<label>${v.name}</label>`;
            const track = document.createElement('div');
            track.className = 'pill-track';

            v.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'pill-btn';
                if (opt === v.options[0]) btn.classList.add('active');
                
                // Smart Price Hint
                let hint = '';
                if(opt.mod > 0) {
                     // If > 10, it's flat add. If < 10, it's a multiplier (don't show "+1.5")
                    if(opt.mod > 10) hint = ` +${metaData.currency}${opt.mod}`;
                }
                btn.textContent = `${opt.label}${hint}`;

                btn.addEventListener('click', () => {
                    track.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentChoices[v.name] = opt;
                    updatePrice();
                });
                track.appendChild(btn);
            });
            group.appendChild(track);
            els.variantArea.appendChild(group);
        });
    }

    // --- 6. PRICE LOGIC (Tier Multipliers) ---
    function updatePrice() {
        let base = currentProduct.price_base || 0;
        let multiplier = 1.0;

        Object.values(currentChoices).forEach(choice => {
            const mod = choice.mod || 0;
            // HEURISTIC: Multiplier vs Flat
            // If mod is small (e.g. 1.5, 4.0), it's a Paper Tier Multiplier
            // If mod is large (e.g. 50, 100), it's a Size Base or Flat add
            if (mod > 0 && mod <= 10) {
                multiplier = mod;
            } else {
                base += mod;
            }
        });

        const total = Math.round(base * multiplier);
        const priceStr = `${metaData.currency} ${total}`;
        els.stagePrice.textContent = priceStr;
        if(currentProduct.available) els.btnPriceSub.textContent = priceStr;
    }

    // --- 7. CART & WHATSAPP ---
    els.addBtn.addEventListener('click', () => {
        if (!currentProduct || !currentProduct.available) return;

        // Recalc for snapshot
        let base = currentProduct.price_base || 0;
        let multiplier = 1.0;
        let variantParts = [];
        let skuParts = [currentProduct.sku_base || 'ITEM'];

        Object.keys(currentChoices).forEach(key => {
            const choice = currentChoices[key];
            const mod = choice.mod || 0;
            if (mod > 0 && mod <= 10) multiplier = mod;
            else base += mod;

            variantParts.push(choice.label);
            if(choice.code) skuParts.push(choice.code);
        });

        const finalPrice = Math.round(base * multiplier);

        const item = {
            id: Date.now(),
            title: currentArt.title || currentArt.id,
            image: getImageUrl(currentArt, 'thumbnail'),
            details: variantParts.length ? variantParts.join(' · ') : currentProduct.type,
            price: finalPrice,
            sku: skuParts.join('-')
        };

        cart.push(item);
        updateCartUI();
        
        // Feedback
        if(navigator.vibrate) navigator.vibrate(50);
        const originalText = els.btnText.textContent;
        els.btnText.textContent = 'Added';
        els.addBtn.style.background = 'white'; els.addBtn.style.color = 'black';
        setTimeout(() => {
            els.btnText.textContent = originalText;
            els.addBtn.style.background = ''; els.addBtn.style.color = '';
        }, 800);
    });

    function updateCartUI() {
        els.cartCount.textContent = cart.length;
        if(cart.length > 0) els.cartCount.classList.remove('hidden');
        else els.cartCount.classList.add('hidden');
    }

    // Modal
    document.getElementById('cart-toggle').addEventListener('click', () => {
        renderCartList();
        els.cartModal.classList.add('active');
    });
    document.getElementById('close-cart').addEventListener('click', () => {
        els.cartModal.classList.remove('active');
    });

    function renderCartList() {
        els.cartList.innerHTML = '';
        let total = 0;

        if(cart.length === 0) {
            els.cartList.innerHTML = `<div style="text-align:center; padding:40px; color:#666;">Empty Loadout</div>`;
        }

        cart.forEach((item, index) => {
            total += item.price;
            const el = document.createElement('div');
            el.className = 'c-item';
            el.innerHTML = `
                <img src="${item.image}">
                <div class="c-info">
                    <h4>${item.title}</h4>
                    <p>${item.details}</p>
                    <p style="color:var(--primary)">${metaData.currency} ${item.price}</p>
                </div>
                <button class="c-rem"><i class="fas fa-trash"></i></button>
            `;
            el.querySelector('.c-rem').addEventListener('click', () => {
                cart.splice(index, 1);
                updateCartUI();
                renderCartList();
            });
            els.cartList.appendChild(el);
        });
        els.cartTotal.textContent = `${metaData.currency} ${total}`;
    }

    // Transmit
    document.getElementById('transmit-btn').addEventListener('click', () => {
        if(cart.length === 0) return;
        
        let msg = `Hello Paintedd, I'm interested in the following items from ${metaData.event_name || 'Event'}:\n\n`;
        let total = 0;
        
        cart.forEach(item => {
            total += item.price;
            msg += `• ${item.title}\n  Specs: ${item.details}\n  Code: [${item.sku}]\n  Price: ${metaData.currency} ${item.price}\n\n`;
        });
        
        msg += `Total Estimate: ${metaData.currency} ${total}`;
        
        const num = metaData.whatsapp_default || '27641417574';
        const url = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    });

    init();
});