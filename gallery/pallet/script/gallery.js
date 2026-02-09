const ART_URL = "/pallet/data/art.json";
const STORE_URL = "/pallet/data/store.json";

const stage = document.getElementById("gallery-stage");
const scoreVal = document.getElementById("score-val");
const unlockCount = document.getElementById("unlock-count");
const totalCount = document.getElementById("total-count");

let allArtworks = [];
let loadedChunks = [];
let storeData = {};
let loadedCount = 0;
let userScore = 0;
let theaterIndex = -1;

const TIERS = [
  {
    id: "green",
    label: "8 ARTWORKS DETECTED",
    color: "#00ff9d",
    count: 8,
    weight: 50,
  },
  {
    id: "blue",
    label: "16 ARTWORKS DETECTED",
    color: "#00a8ff",
    count: 16,
    weight: 30,
  },
  {
    id: "purple",
    label: "24 ARTWORKS DETECTED",
    color: "#bd00ff",
    count: 24,
    weight: 15,
  },
  {
    id: "gold",
    label: "40 ARTWORKS DETECTED",
    color: "#ffd700",
    count: 40,
    weight: 5,
  },
];

async function init() {
  try {
    const [artRes, storeRes] = await Promise.all([
      fetch(ART_URL),
      fetch(STORE_URL).catch(() => ({ ok: false })),
    ]);

    if (!artRes.ok) throw new Error("404");
    const data = await artRes.json();
    allArtworks = Array.isArray(data) ? data : data.artworks || [];
    totalCount.textContent = allArtworks.length;

    for (let i = allArtworks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allArtworks[i], allArtworks[j]] = [allArtworks[j], allArtworks[i]];
    }

    if (storeRes.ok) {
      const store = await storeRes.json();
      (store.inventory || []).forEach((i) => (storeData[i.art_id] = i));
    }

    loadChunk(15, null);
  } catch (e) {
    console.error(e);
    stage.innerHTML = `<div style="text-align:center; color:#666; margin-top:100px;">ARCHIVE OFFLINE</div>`;
  }
}

function addScore(amt) {
  userScore += amt;
  scoreVal.textContent = userScore;
  const pill = document.querySelector(".resonance-pill");
  pill.classList.remove("score-bump");
  void pill.offsetWidth;
  pill.classList.add("score-bump");
}

function createColumns() {
  const row = document.createElement("div");
  row.className = "masonry-row";
  const w = window.innerWidth;
  const cols = w > 1400 ? 4 : w > 900 ? 3 : 2;

  const buckets = [];
  for (let i = 0; i < cols; i++) {
    const col = document.createElement("div");
    col.className = "masonry-col";
    row.appendChild(col);
    buckets.push(col);
  }
  stage.appendChild(row);
  return buckets;
}

function loadChunk(amount, tierData) {
  if (loadedCount >= allArtworks.length) {
    showEndCard();
    return;
  }

  if (tierData) {
    const div = document.createElement("div");
    div.className = "chunk-divider";
    div.style.color = tierData.color;
    div.innerHTML = `<div class="div-line"></div><div class="div-node"></div><div class="div-line"></div>`;
    stage.appendChild(div);
  }

  const buckets = createColumns();
  const chunk = allArtworks.slice(loadedCount, loadedCount + amount);

  chunk.forEach((item, i) => {
    loadedChunks.push(item);
    const globalIdx = loadedChunks.length - 1;
    const src = item.images.thumbnail || item.images.medium;

    let aspect = "1 / 1";
    if (item.orientation === "portrait") aspect = "3 / 4";
    if (item.orientation === "landscape") aspect = "4 / 3";

    const rand = Math.random();
    let border = "";
    if (rand > 0.95) border = "gold";
    else if (rand > 0.85) border = "purple";
    else if (rand > 0.7) border = "blue";
    else if (rand > 0.5) border = "green";

    const isPearl = Math.random() > 0.92;

    const card = document.createElement("div");
    card.className = `art-card ${isPearl ? "pearl" : ""}`;
    card.style.aspectRatio = aspect;
    card.style.animationDelay = `${i * 80}ms`;
    if (border) card.dataset.border = border;

    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = src;
    img.onload = () => {
      img.classList.add("loaded");
      card.classList.add("visible");
      addScore(10);
    };

    card.appendChild(img);
    card.onclick = () => openTheater(globalIdx);
    buckets[i % buckets.length].appendChild(card);
  });

  loadedCount += chunk.length;
  unlockCount.textContent = loadedCount;

  if (loadedCount < allArtworks.length) {
    spawnPrism();
  } else {
    showEndCard();
  }
}

function spawnPrism() {
  const gate = document.createElement("div");
  gate.className = "prism-gate";
  gate.id = "gacha-anchor";
  gate.innerHTML = `
                <div class="prism-orb" onclick="rollGacha(this)" id="main-orb">
                    <i class="fas fa-fingerprint"></i>
                </div>
                <div class="prism-text">ROLLING FOR ART...</div>
            `;
  stage.appendChild(gate);
}

window.rollGacha = function (orb) {
  if (orb.classList.contains("rolling")) return;
  orb.classList.add("rolling");

  const text = orb.nextElementSibling;
  text.innerText = "ALIGNING LAYERS...";

  const icons = ["fa-bolt", "fa-eye", "fa-gem", "fa-star", "fa-moon", "fa-sun"];
  let iconIdx = 0;
  const colors = ["#00ff9d", "#00a8ff", "#bd00ff", "#ffd700"];

  const cycle = setInterval(() => {
    orb.innerHTML = `<i class="fas ${icons[iconIdx]}"></i>`;
    orb.style.boxShadow = `0 0 60px ${colors[iconIdx % 4]}`;
    iconIdx = (iconIdx + 1) % icons.length;
  }, 400);

  setTimeout(() => {
    clearInterval(cycle);

    let rand = Math.floor(Math.random() * 100);
    let result = TIERS[0];
    let sum = 0;
    for (let t of TIERS) {
      sum += t.weight;
      if (rand < sum) {
        result = t;
        break;
      }
    }

    orb.classList.remove("rolling");
    orb.className = `prism-orb ${result.id}`;
    orb.innerHTML =
      result.id === "gold"
        ? '<i class="fas fa-crown"></i>'
        : '<i class="fas fa-check"></i>';

    text.innerText = `// ${result.label}`;
    text.style.color = result.color;

    addScore(500);

    setTimeout(() => {
      const gate = orb.parentElement;
      gate.classList.add("vanish");
      setTimeout(() => {
        gate.remove();
        loadChunk(result.count, { color: result.color });
      }, 500);
    }, 1200);
  }, 4000);
};

function showEndCard() {
  const card = document.createElement("div");
  card.className = "end-card";
  card.innerHTML = `
                <div style="font-size:3rem; color:#ffd700; margin-bottom:20px;"><i class="fas fa-crown"></i></div>
                <div class="end-score">${userScore}</div>
                <div style="color:#888; font-family:monospace; letter-spacing:2px;">TOTAL RESONANCE</div>
                <div class="end-rank">ARCHIVE COMPLETE</div>
            `;
  stage.appendChild(card);
}

const theater = document.getElementById("theater");
const tImg = document.getElementById("t-img");
const tSpinner = document.getElementById("t-spinner");
const tStage = document.getElementById("t-stage");
let state = { x: 0, y: 0, scale: 1, rotation: 0 };

function openTheater(index) {
  if (index < 0) return;

  if (index >= loadedChunks.length) {
    closeTheater();
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
      const orb = document.getElementById("main-orb");
      if (orb) {
        orb.classList.add("active");
        orb.classList.add("unlock-hint"); // New visual cue
        rollGacha(orb);
      }
    }, 300);
    return;
  }

  theaterIndex = index;
  const item = loadedChunks[index];

  tImg.src =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  tImg.classList.remove("show");
  tSpinner.style.display = "block";

  document.getElementById("t-title").textContent = item.title || item.id;
  document.getElementById("t-id").textContent = item.id;
  document.getElementById("t-desc").textContent = item.description || "";

  const medium = item.images.medium || item.images.thumbnail;
  const original = item.images.original;

  const loader = new Image();
  loader.src = medium;

  loader.onload = () => {
    if (theaterIndex === index) {
      tImg.src = medium;
      tImg.onload = () => {
        tSpinner.style.display = "none";
        tImg.classList.add("show");

        if (original) {
          const hd = new Image();
          hd.src = original;
          hd.onload = () => {
            if (tImg.src === medium) tImg.src = original;
          };
        }
      };
    }
  };

  const store = storeData[item.id];
  const btn = document.getElementById("inquire-btn");
  const statusDiv = document.getElementById("t-status");

  if (store && store.status === "available") {
    statusDiv.innerHTML = `<span style="color:#00ff9d; font-family:monospace; letter-spacing:1px; font-size:0.8rem;">● AVAILABLE FOR PURCHASE</span>`;
    btn.innerHTML = `<i class="fab fa-whatsapp"></i> PURCHASE REQUEST`;
  } else if (store && store.status === "sold") {
    statusDiv.innerHTML = `<span style="color:#ff3333; font-family:monospace; letter-spacing:1px; font-size:0.8rem;">● SOLD OUT</span>`;
    btn.innerHTML = `<i class="fab fa-whatsapp"></i> INQUIRE PRINT`;
  } else {
    statusDiv.innerHTML = "";
    btn.innerHTML = `<i class="fab fa-whatsapp"></i> GENERAL INQUIRY`;
  }

  state = { x: 0, y: 0, scale: 1, rotation: 0 };
  updateTransform();

  if (!theater.classList.contains("active")) {
    theater.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

function closeTheater() {
  theater.classList.remove("active");
  document.body.style.overflow = "";
  setTimeout(() => {
    tImg.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    tImg.classList.remove("show");
  }, 300);
}

function updateTransform() {
  tImg.style.transform = `translate(${state.x}px, ${state.y}px) rotate(${state.rotation}deg) scale(${state.scale})`;
}

let touchStartDist = 0;
let startScale = 1;
let isDrag = false;
let startX = 0,
  startY = 0,
  initX = 0,
  initY = 0;

tStage.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      touchStartDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      startScale = state.scale;
    } else if (e.touches.length === 1) {
      isDrag = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      initX = state.x;
      initY = state.y;
      tImg.style.transition = "none";
    }
  },
  { passive: false },
);

tStage.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      state.scale = Math.max(
        0.5,
        Math.min(4, startScale * (dist / touchStartDist)),
      );
      updateTransform();
    } else if (isDrag && e.touches.length === 1) {
      state.x = initX + (e.touches[0].clientX - startX);
      state.y = initY + (e.touches[0].clientY - startY);
      updateTransform();
    }
  },
  { passive: false },
);

tStage.addEventListener("touchend", (e) => {
  if (e.touches.length < 2) {
    isDrag = false;
    handleRelease();
  }
});

tStage.addEventListener("mousedown", (e) => {
  if (e.target.closest(".tc-btn")) return;
  isDrag = true;
  startX = e.clientX;
  startY = e.clientY;
  initX = state.x;
  initY = state.y;
  tImg.style.transition = "none";
});

window.addEventListener("mousemove", (e) => {
  if (!isDrag) return;
  e.preventDefault();
  state.x = initX + (e.clientX - startX);
  state.y = initY + (e.clientY - startY);
  updateTransform();
});

window.addEventListener("mouseup", () => {
  if (isDrag) {
    isDrag = false;
    handleRelease();
  }
});

tStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  state.scale = Math.max(0.5, Math.min(4, state.scale + delta));
  updateTransform();
});

function handleRelease() {
  tImg.style.transition =
    "opacity 0.2s ease, transform 0.3s cubic-bezier(0.2,1,0.3,1)";
  if (state.scale <= 1.1) {
    if (state.x < -80) {
      nextItem();
      return;
    }
    if (state.x > 80) {
      prevItem();
      return;
    }
    state.x = 0;
    state.y = 0;
    state.scale = 1;
    updateTransform();
  }
}

function nextItem() {
  openTheater(theaterIndex + 1);
}
function prevItem() {
  if (theaterIndex > 0) openTheater(theaterIndex - 1);
}

document.getElementById("btn-next").onclick = nextItem;
document.getElementById("btn-prev").onclick = prevItem;
document.getElementById("close-theater").onclick = closeTheater;

document.getElementById("btn-rotate").onclick = () => {
  state.rotation += 90;
  updateTransform();
};

document.getElementById("btn-download").onclick = () => {
  const item = loadedChunks[theaterIndex];
  if (!item) return;
  const a = document.createElement("a");
  a.href = item.images.original || item.images.medium;
  a.download = `Paintedd-${item.id}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

document.getElementById("inquire-btn").onclick = () => {
  const item = loadedChunks[theaterIndex];
  if (!item) return;
  const title = item.title || item.id;
  window.open(
    `https://wa.me/27641417574?text=Hi, inquiring about "${title}" (ID: ${item.id})`,
    "_blank",
  );
};

document.addEventListener("keydown", (e) => {
  if (!theater.classList.contains("active")) return;
  if (e.key === "Escape") closeTheater();
  if (e.key === "ArrowRight") nextItem();
  if (e.key === "ArrowLeft") prevItem();
});

init();
