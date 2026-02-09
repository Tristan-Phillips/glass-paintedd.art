const EVENTS_URL = "../pallet/data/events.json";
const DECK = document.getElementById("deck");
const STATUS_TEXT = document.getElementById("status-text");
const LIVE_DOT = document.getElementById("live-dot");

async function init() {
  try {
    const res = await fetch(EVENTS_URL);
    if (!res.ok) throw new Error("Signal Lost");
    let events = await res.json();

    // Sanitize Data
    events = events.map((ev) => {
      if (ev.status === "upcomming") ev.status = "upcoming";
      return ev;
    });

    // Rank: Active -> Upcoming -> Planned -> Archived
    const rank = { active: 1, upcoming: 2, planned: 3, archived: 4 };
    events.sort((a, b) => (rank[a.status] || 99) - (rank[b.status] || 99));

    DECK.innerHTML = '<div class="spacer"></div>';
    let activeCount = 0;

    events.forEach((ev) => {
      if (ev.status === "active" || ev.status === "upcoming") activeCount++;

      const href = `${ev.folder}/index.html`;
      let btnText = "INITIALIZE";

      // Logic Gates
      if (ev.status === "upcoming") {
        btnText = "INCOMING";
      } // Clickable
      else if (ev.status === "planned") {
        btnText = "LOCKED";
      } // Not Clickable
      else if (ev.status === "archived") {
        btnText = "ACCESS LOGS";
      }

      // Satellite Links
      let socialHTML = "";
      if (ev.links) {
        socialHTML = '<div class="satellite-row">';
        const iconMap = {
          website: "fa-globe",
          instagram: "fa-instagram",
          facebook: "fa-facebook",
          twitter: "fa-x-twitter",
          tiktok: "fa-tiktok",
          youtube: "fa-youtube",
        };
        for (const [key, url] of Object.entries(ev.links)) {
          const iconClass = iconMap[key.toLowerCase()] || "fa-link";
          socialHTML += `<a href="${url}" target="_blank" rel="noopener" class="social-link" title="${key}"><i class="fab ${iconClass}"></i></a>`;
        }
        socialHTML += "</div>";
      }

      const card = document.createElement("div");
      card.className = "portal";
      card.dataset.status = ev.status;

      const tint = ev.color || "#fff";
      const bgUrl = ev.img || ev.image;
      const bgStyle = bgUrl
        ? `background: url('${bgUrl}') no-repeat center center / cover;`
        : "";

      card.innerHTML = `
                        <div class="glass" style="--tint: ${tint}; ${bgStyle}">
                            
                            <div class="top-content">
                                <div class="info-slab">
                                    <h2 style="color:${tint}">${ev.name}</h2>
                                    <div class="details">
                                        <div><i class="fas fa-map-marker-alt"></i> ${ev.location}</div>
                                        <div><i class="far fa-calendar"></i> ${ev.dates}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bottom-content">
                                <div class="info-slab" style="margin-bottom:0; padding:15px;">
                                    <div style="font-size:0.65rem; text-transform:uppercase; letter-spacing:1px; opacity:0.6; text-align:center; margin-bottom:10px;">${ev.status} PROTOCOL</div>
                                    ${socialHTML}
                                    <a href="${href}" class="enter-btn">${btnText}</a>
                                </div>
                            </div>

                            <div class="swipe-reactor"></div>
                            <div class="swipe-hint"><i class="fas fa-chevron-up"></i> SWIPE UP</div>
                        </div>
                    `;

      // --- SWIPE GESTURE LOGIC ---
      if (ev.status === "active" || ev.status === "upcoming") {
        let touchStartY = 0;
        card.addEventListener(
          "touchstart",
          (e) => {
            touchStartY = e.touches[0].clientY;
          },
          { passive: true },
        );

        card.addEventListener("touchend", (e) => {
          const touchEndY = e.changedTouches[0].clientY;
          const diff = touchStartY - touchEndY;

          // Threshold: 50px swipe up
          if (diff > 50) {
            // Trigger vibration if supported
            if (navigator.vibrate) navigator.vibrate(50);
            window.location.href = href;
          }
        });
      }

      DECK.appendChild(card);
    });

    DECK.innerHTML += '<div class="spacer"></div>';

    if (activeCount > 0) {
      STATUS_TEXT.textContent = `${activeCount} ACTIVE`;
      LIVE_DOT.style.background = "#00ff00";
      LIVE_DOT.style.boxShadow = "0 0 8px #00ff00";
    } else {
      STATUS_TEXT.textContent = "ARCHIVE";
      LIVE_DOT.style.background = "#666";
      LIVE_DOT.style.boxShadow = "none";
    }
  } catch (err) {
    console.error(err);
    DECK.innerHTML = `<div class="loader" style="color:#ff4444">LINK FAILURE</div>`;
  }
}

// --- PHYSICS ENGINE ---
let isDown = false;
let startX;
let scrollLeft;
let isDragging = false;

DECK.addEventListener("wheel", (e) => {
  if (e.deltaY !== 0) DECK.scrollLeft += e.deltaY;
});

DECK.addEventListener("mousedown", (e) => {
  isDown = true;
  isDragging = false;
  startX = e.pageX - DECK.offsetLeft;
  scrollLeft = DECK.scrollLeft;
});

DECK.addEventListener("mouseleave", () => {
  isDown = false;
  DECK.classList.remove("is-dragging");
});

DECK.addEventListener("mouseup", () => {
  isDown = false;
  DECK.classList.remove("is-dragging");
});

DECK.addEventListener("mousemove", (e) => {
  if (!isDown) return;
  e.preventDefault();

  const x = e.pageX - DECK.offsetLeft;
  const walk = (x - startX) * 1.0;

  if (Math.abs(walk) > 5) {
    if (!isDragging) {
      isDragging = true;
      DECK.classList.add("is-dragging");
    }
  }
  DECK.scrollLeft = scrollLeft - walk;
});

// --- PRISM ENGINE ---
document.addEventListener("mousemove", (e) => {
  const x = e.clientX / window.innerWidth;
  const y = e.clientY / window.innerHeight;
  const red = document.querySelector(".orb.red");
  const cyan = document.querySelector(".orb.cyan");
  const purple = document.querySelector(".orb.purple");

  if (red) red.style.transform = `translate(${x * 30}px, ${y * 30}px)`;
  if (cyan) cyan.style.transform = `translate(${x * -40}px, ${y * -40}px)`;
  if (purple) purple.style.transform = `translate(${x * 20}px, ${y * -50}px)`;
});

init();
