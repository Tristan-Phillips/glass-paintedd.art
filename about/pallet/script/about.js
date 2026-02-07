document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTS ---
    const card = document.getElementById('art-card');
    const trigger = document.getElementById('sig-trigger');
    const progressCircle = trigger.querySelector('.ring-progress');
    const foil = document.getElementById('user-foil');
    const balloonSigil = document.getElementById('balloon-sigil');
    const bigSeal = document.getElementById('big-seal');
    const backdrop = document.getElementById('scene-backdrop');
    
    // Keypad Elements
    const stateLocked = document.getElementById('state-locked');
    const stateUnlocked = document.getElementById('state-unlocked');
    const cipherText = document.getElementById('cipher-text');
    const uidDisplay = document.getElementById('uid-display');

    // --- 1. SEED & IDENTITY LOGIC ---
    const MASTER_SEED = "2026"; // Simple for demo, change to whatever
    let currentInput = "";
    
    // Check if user is already an Initiate
    const storedUID = localStorage.getItem('pdd_uid');
    
    if(storedUID) {
        unlockInnerCircle(storedUID);
    } else {
        // Generate a Temporary Balloon just for visuals (non-unique yet)
        drawRedBalloon(balloonSigil, "TEMP");
    }

    // --- 2. KEYPAD LOGIC ---
    document.querySelectorAll('.key').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const val = btn.getAttribute('data-val');
            
            // Haptic
            if(navigator.vibrate) navigator.vibrate(20);

            if(btn.id === 'key-clear') {
                currentInput = "";
                cipherText.textContent = "ENTER SEED KEY";
                cipherText.style.color = "var(--red)";
                return;
            }

            if(btn.id === 'key-enter') {
                if(currentInput === MASTER_SEED) {
                    // SUCCESS!
                    cipherText.textContent = "ACCESS GRANTED";
                    cipherText.style.color = "var(--cyan)";
                    setTimeout(createIdentity, 500);
                } else {
                    // FAIL
                    cipherText.textContent = "INVALID KEY";
                    currentInput = "";
                    if(navigator.vibrate) navigator.vibrate([50, 50, 50]);
                    setTimeout(() => cipherText.textContent = "ENTER SEED KEY", 1000);
                }
                return;
            }

            // Number Input
            if(currentInput.length < 6) {
                if(currentInput === "") cipherText.textContent = "";
                currentInput += val;
                cipherText.textContent += "*"; // Mask input
            }
        });
    });

    function createIdentity() {
        // Generate UUID
        const newUID = 'ID-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        localStorage.setItem('pdd_uid', newUID);
        unlockInnerCircle(newUID);
    }

    function unlockInnerCircle(uid) {
        stateLocked.classList.add('hidden');
        stateUnlocked.classList.remove('hidden');
        uidDisplay.textContent = uid;
        
        // Draw the UNIQUE balloon based on UID
        drawRedBalloon(balloonSigil, uid);
        drawRedBalloon(bigSeal, uid); // Draw on back too
    }

    // --- 3. RED BALLOON GENERATOR (Deterministic) ---
    function drawRedBalloon(container, seed) {
        // Turn seed string into numbers
        let hash = 0;
        for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        
        // Deterministic variables
        const wind = (hash % 40) - 20; // Rotation -20 to 20
        const stringLen = 40 + (Math.abs(hash) % 20); // 40 to 60
        const balloonSize = 12 + (Math.abs(hash) % 5); // 12 to 17

        const svg = `
        <svg viewBox="0 0 100 100" style="overflow:visible">
            <g transform="rotate(${wind} 50 100)">
                <path d="M50,100 Q${50 + (wind/2)},${100 - (stringLen/2)} 50,${100 - stringLen}" 
                      stroke="currentColor" stroke-width="1.5" fill="none" opacity="0.6"/>
                <circle cx="50" cy="${100 - stringLen}" r="${balloonSize}" fill="currentColor" />
                <circle cx="${45}" cy="${100 - stringLen - 5}" r="${balloonSize/4}" fill="rgba(255,255,255,0.3)" />
            </g>
        </svg>
        `;
        container.innerHTML = svg;
    }

    // --- 4. BIOMETRIC SCANNER (Logic from Mark III) ---
    let timer = null;
    let isFlipped = false;
    const scanTime = 800;

    const startScan = (e) => {
        if(isFlipped) return;
        if(e.type === 'mousedown') e.preventDefault(); 

        trigger.classList.add('scanning');
        progressCircle.style.transition = `stroke-dashoffset ${scanTime}ms linear`;
        progressCircle.style.strokeDashoffset = '0';

        timer = setTimeout(unlockFlip, scanTime);
    };

    const cancelScan = () => {
        clearTimeout(timer);
        trigger.classList.remove('scanning');
        progressCircle.style.transition = 'stroke-dashoffset 0.2s';
        progressCircle.style.strokeDashoffset = '283';
    };

    const unlockFlip = () => {
        trigger.classList.remove('scanning');
        trigger.classList.add('success');
        if(navigator.vibrate) navigator.vibrate(50);

        setTimeout(() => {
            card.classList.add('flipped');
            isFlipped = true;
            setTimeout(() => {
                trigger.classList.remove('success');
                progressCircle.style.strokeDashoffset = '283';
            }, 600);
        }, 150);
    };

    trigger.addEventListener('mousedown', startScan);
    trigger.addEventListener('touchstart', (e) => {
        e.preventDefault(); 
        startScan(e);
    }, { passive: false });

    ['mouseup', 'mouseleave', 'touchend'].forEach(evt => {
        trigger.addEventListener(evt, cancelScan);
    });

    // --- 5. FLIP BACK LOGIC ---
    const flipBack = () => {
        if(isFlipped) {
            card.classList.remove('flipped');
            isFlipped = false;
        }
    };

    document.getElementById('close-back-btn').addEventListener('click', flipBack);
    backdrop.addEventListener('click', flipBack);

    // --- 6. GYRO/MOUSE ---
    document.addEventListener('mousemove', (e) => {
        if(window.innerWidth > 768 && !isFlipped) {
            const x = (window.innerWidth / 2 - e.clientX) / 25;
            const y = (window.innerHeight / 2 - e.clientY) / 25;
            card.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
            foil.style.backgroundPosition = `${50 + (x * 4)}% ${50 + (y * 4)}%`;
        }
    });

    // --- 7. TOGGLE LOGIC ---
    const toggle = document.getElementById('currency-toggle');
    const updateToggleUI = () => {
        const isIntl = localStorage.getItem('pdd_region') === 'INTL';
        if(isIntl) {
            toggle.classList.add('active');
            toggle.innerHTML = '<div class="toggle-icon"><i class="fas fa-check"></i></div><span>GLOBAL ACTIVE</span>';
        } else {
            toggle.classList.remove('active');
            toggle.innerHTML = '<div class="toggle-icon"><i class="fas fa-globe-africa"></i></div><span>GLOBAL MODE</span>';
        }
    };
    
    toggle.addEventListener('click', () => {
        const current = localStorage.getItem('pdd_region');
        localStorage.setItem('pdd_region', current === 'INTL' ? 'ZAR' : 'INTL');
        updateToggleUI();
    });
    updateToggleUI();
});