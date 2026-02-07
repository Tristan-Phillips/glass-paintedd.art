// DOM Elements
const artGrid = document.getElementById("art-grid");
const artOverlay = document.getElementById("art-overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayImage = document.getElementById("overlay-image");
const overlayPalette = document.getElementById("overlay-palette");
const commentList = document.getElementById("comment-list");
const closeOverlay = document.getElementById("close-overlay");
const paginationContainer = document.getElementById("pagination");
const loadingIndicator = document.getElementById("loading-indicator");
const shareBtn = document.getElementById("share-btn");
const viewDetailBtn = document.getElementById("view-detail-btn");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const closeLightbox = document.getElementById("close-lightbox");
const overlayImageContainer = document.querySelector(
  ".overlay-image-container"
);

// Create shared artworks container
const sharedArtworksContainer = document.createElement("div");
sharedArtworksContainer.className = "shared-artworks-container";
sharedArtworksContainer.innerHTML = `
    <div class="shared-header">
        <h2><i class="fas fa-link"></i> Shared Artworks</h2>
        <div class="shared-count">0 artworks</div>
    </div>
    <div class="shared-art-grid" id="shared-art-grid"></div>
`;
artGrid.parentNode.insertBefore(sharedArtworksContainer, artGrid);

// Get reference to the shared art grid
const sharedArtGrid = document.getElementById("shared-art-grid");

// Removal Utility Elements
const removalUtility = document.createElement("div");
removalUtility.className = "removal-utility";
removalUtility.id = "removal-utility";
removalUtility.style.display = "none";
removalUtility.innerHTML = `
    <div class="utility-header" id="utility-handle">
        <div class="utility-title">
            <i class="fas fa-trash"></i>
            <span>Selected Artwork</span>
        </div>
        <div class="utility-count" id="removal-count">0 items</div>
    </div>
    <div class="utility-body">
        <div class="removal-log" id="removal-log">
            <div class="no-entries">No artworks selected</div>
        </div>
        <div class="utility-controls">
            <button class="utility-btn copy-btn" id="copy-ids">
                <i class="fas fa-copy"></i> Copy
            </button>
            <button class="utility-btn share-list-btn" id="share-list-btn">
                <i class="fas fa-share-alt"></i> Share
            </button>
            <button class="utility-btn clear-btn" id="clear-log">
                <i class="fas fa-trash"></i> Clear
            </button>
        </div>
    </div>
`;
document.body.appendChild(removalUtility);

// Toggle Tab Element
const utilityToggleTab = document.createElement("div");
utilityToggleTab.className = "utility-toggle-tab";
utilityToggleTab.innerHTML = '<i class="fas fa-chevron-right"></i>';
utilityToggleTab.style.display = "none";
document.body.appendChild(utilityToggleTab);

// Utility Variables
let removalIds = [];
let isDragging = false;
let dragOffsetX, dragOffsetY;
let ctrlKeyPressed = false;
const removalLog = document.getElementById("removal-log");
const removalCount = document.getElementById("removal-count");
const copyIdsBtn = document.getElementById("copy-ids");
const clearLogBtn = document.getElementById("clear-log");
const utilityHandle = document.getElementById("utility-handle");

// Gallery State
let currentPage = 1;
const artworksPerPage = 12;
let currentArtworkId = null;
let galleryData = [];
let currentArtworkImage = "";
const transparentPixel =
  "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
let selectedArtworks = new Set();
let currentRotation = 0;
let filteredArtworks = [];
let sharedArtworkIds = [];

// Control Key Detection - Enhanced handling
function handleKeyDown(e) {
  if (e.key === "Control" || e.key === "Meta") {
    ctrlKeyPressed = true;
    document.body.classList.add("ctrl-active");
  }
}

function handleKeyUp(e) {
  if (e.key === "Control" || e.key === "Meta") {
    ctrlKeyPressed = false;
    document.body.classList.remove("ctrl-active");
  }
}

// Improved control key handling
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    ctrlKeyPressed = false;
    document.body.classList.remove("ctrl-active");
  }
});

window.addEventListener("blur", () => {
  ctrlKeyPressed = false;
  document.body.classList.remove("ctrl-active");
});

document.addEventListener("mouseleave", () => {
  ctrlKeyPressed = false;
  document.body.classList.remove("ctrl-active");
});

// Utility Visibility Management
function toggleUtilityVisibility() {
  if (removalUtility.style.display === "none") {
    removalUtility.style.display = "block";
    utilityToggleTab.innerHTML = '<i class="fas fa-chevron-left"></i>';
  } else {
    removalUtility.style.display = "none";
    utilityToggleTab.innerHTML = '<i class="fas fa-chevron-right"></i>';
  }
}

function updateUtilityVisibility() {
  if (removalIds.length > 0) {
    removalUtility.style.display = "block";
    utilityToggleTab.style.display = "block";
  } else {
    removalUtility.style.display = "none";
    utilityToggleTab.style.display = "none";
  }
}

// Draggable Utility Functions
function startDrag(e) {
  if (
    e.target.closest(".remove-entry") ||
    e.target.matches(".utility-btn, .utility-btn *")
  )
    return;
  isDragging = true;
  const rect = removalUtility.getBoundingClientRect();
  dragOffsetX = e.clientX - rect.left;
  dragOffsetY = e.clientY - rect.top;
  removalUtility.style.transition = "none";
}

function drag(e) {
  if (!isDragging) return;
  const x = e.clientX - dragOffsetX;
  const y = e.clientY - dragOffsetY;
  const maxX = window.innerWidth - removalUtility.offsetWidth;
  const maxY = window.innerHeight - removalUtility.offsetHeight;
  removalUtility.style.left = `${Math.max(10, Math.min(x, maxX - 10))}px`;
  removalUtility.style.top = `${Math.max(10, Math.min(y, maxY - 10))}px`;
  removalUtility.style.right = "auto";
}

function stopDrag() {
  isDragging = false;
  removalUtility.style.transition = "";
}

// Removal Log Functions
function addToRemovalLog(artworkId) {
  if (removalIds.includes(artworkId)) return;
  removalIds.push(artworkId);

  const logEntry = document.createElement("div");
  logEntry.className = "log-entry";
  logEntry.innerHTML = `
        <span class="log-entry-text">${artworkId}</span>
        <button class="remove-entry" data-id="${artworkId}">
            <i class="fas fa-times"></i>
        </button>
    `;

  if (removalLog.querySelector(".no-entries")) {
    removalLog.innerHTML = "";
  }
  removalLog.appendChild(logEntry);

  updateRemovalCount();
  updateUtilityVisibility();

  // Add click event to the log entry text
  logEntry
    .querySelector(".log-entry-text")
    .addEventListener("click", function () {
      openArtworkOverlay(artworkId);
    });

  logEntry
    .querySelector(".remove-entry")
    .addEventListener("click", function (e) {
      e.stopPropagation();
      const idToRemove = this.getAttribute("data-id");
      removeFromRemovalLog(idToRemove);
      document
        .querySelector(`.art-card[data-id="${idToRemove}"]`)
        ?.classList.remove("selected-artwork");
    });
}

function removeFromRemovalLog(artworkId) {
  removalIds = removalIds.filter((id) => id !== artworkId);
  const entryToRemove = document.querySelector(
    `.log-entry button[data-id="${artworkId}"]`
  )?.parentElement;
  if (entryToRemove) entryToRemove.remove();

  if (removalIds.length === 0) {
    removalLog.innerHTML =
      '<div class="no-entries">No artworks selected for removal</div>';
  }

  updateRemovalCount();
  updateUtilityVisibility();
}

function updateRemovalCount() {
  removalCount.textContent = `${removalIds.length} ${
    removalIds.length === 1 ? "item" : "items"
  }`;
}

// Art Card Control+Click Handler
function handleArtCardCtrlClick(e) {
  if (!ctrlKeyPressed) return;

  const card = e.target.closest(".art-card");
  if (card) {
    e.preventDefault();
    e.stopPropagation();

    const artworkId = card.dataset.id;
    const isSelected = !card.classList.contains("selected-artwork");

    card.classList.toggle("selected-artwork", isSelected);

    if (isSelected) {
      addToRemovalLog(artworkId);
      selectedArtworks.add(artworkId);
    } else {
      removeFromRemovalLog(artworkId);
      selectedArtworks.delete(artworkId);
    }

    URLManager.update({
      page: currentPage,
      selected: selectedArtworks,
      view: currentArtworkId,
    });
  }
}

// URL Manager
class URLManager {
  static parse() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const selected = new Set(
      (params.get("selected") || "").split(",").filter(Boolean)
    );
    const page = parseInt(params.get("page")) || 1;

    return {
      page: selected.size > 0 ? 1 : page,
      selected: selected,
      view: params.get("view") || null,
    };
  }

  static update({ page, selected, view }) {
    const params = new URLSearchParams();

    if (page > 1) params.set("page", page);
    if (selected.size > 0) params.set("selected", [...selected].join(","));
    if (view) params.set("view", view);

    history.replaceState(null, null, `#${params.toString()}`);
  }

  static createShareString({ page, selected, view }) {
    const params = new URLSearchParams();
    if (selected.size > 0) {
      params.set("selected", [...selected].join(","));
    }
    if (page > 1) {
      params.set("page", page);
    }
    if (view) params.set("view", view);
    return params.toString();
  }
}

// Gallery Initialization
async function initGallery() {
  try {
    loadingIndicator.style.display = "flex";
    const response = await fetch("/pallet/data/art.json");
    const data = await response.json();

    const urlState = URLManager.parse();
    currentPage = urlState.page;
    selectedArtworks = new Set(urlState.selected);

    // Store shared artwork IDs for special handling
    sharedArtworkIds = [...urlState.selected];

    // Convert new JSON structure to gallery-compatible format
    galleryData = data.artworks.map((artwork) => {
      // Helper function to find image URL by type
      function getImageUrl(type) {
        const imgObj = artwork.images.find((img) => img.type === type);
        return imgObj ? imgObj.url : "";
      }

      return {
        id: artwork.id,
        title: artwork.title || artwork.id,
        // year: "",//artwork.year.toString(),
        // medium: "",//artwork.medium.charAt(0).toUpperCase() + artwork.medium.slice(1),
        palette: artwork.palette || [],
        tags: artwork.tags || [],
        thumb: getImageUrl("thumbnail"),
        pixel_small: getImageUrl("thumbnail"),
        overlayImg: getImageUrl("medium"),
        originalImg: getImageUrl("original"),
        commerce: {
          original_available: artwork.trade?.original?.available || false,
          prints_available: Object.keys(artwork.trade?.prints?.buy_links || {}).length > 0,
          base_price: artwork.trade?.original?.price_usd || 0
        },
        comments: []
      };
    });

    // Handle shared selections
    if (selectedArtworks.size > 0) {
      // Add selected artworks to removal log
      galleryData.forEach((artwork) => {
        if (
          selectedArtworks.has(artwork.id) &&
          !removalIds.includes(artwork.id)
        ) {
          removalIds.push(artwork.id);

          const logEntry = document.createElement("div");
          logEntry.className = "log-entry";
          logEntry.innerHTML = `
                        <span class="log-entry-text">${artwork.id}</span>
                        <span class="shared-tag">(shared)</span>
                        <button class="remove-entry" data-id="${artwork.id}">
                            <i class="fas fa-times"></i>
                        </button>
                    `;

          if (removalLog.querySelector(".no-entries")) {
            removalLog.innerHTML = "";
          }
          removalLog.appendChild(logEntry);

          // Add click event to the log entry text
          logEntry
            .querySelector(".log-entry-text")
            .addEventListener("click", function () {
              openArtworkOverlay(artwork.id);
            });
        }
      });

      removalLog.querySelectorAll(".remove-entry").forEach((btn) => {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          const idToRemove = this.getAttribute("data-id");
          removeFromRemovalLog(idToRemove);
          document
            .querySelector(`.art-card[data-id="${idToRemove}"]`)
            ?.classList.remove("selected-artwork", "shared-selection");
          selectedArtworks.delete(idToRemove);
          URLManager.update({
            page: currentPage,
            selected: selectedArtworks,
            view: currentArtworkId,
          });
        });
      });
    }

    if (removalIds.length > 0) {
      updateUtilityVisibility();
      updateRemovalCount();
    }

    if (urlState.view && galleryData.some((a) => a.id === urlState.view)) {
      openArtworkOverlay(urlState.view);
    } else {
      updateGallery();
    }
  } catch (error) {
    console.error("Failed to initialize gallery:", error);
    artGrid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Couldn't load the gallery. Please try again later.</p>
            </div>
        `;
  } finally {
    loadingIndicator.style.display = "none";
  }
}

// Render shared artworks in the separate compartment
function renderSharedArtCards(artworks) {
  sharedArtGrid.innerHTML = "";

  if (artworks.length === 0) {
    sharedArtworksContainer.style.display = "none";
    return;
  }

  sharedArtworksContainer.style.display = "block";

  // Update shared count
  const sharedCount = sharedArtworksContainer.querySelector(".shared-count");
  sharedCount.textContent = `${artworks.length} artwork${
    artworks.length !== 1 ? "s" : ""
  }`;

  artworks.forEach((artwork) => {
    const artCard = document.createElement("div");
    artCard.className = "art-card shared-artwork";
    artCard.dataset.id = artwork.id;

    // Use thumbnail for all artworks
    const imageUrl = artwork.thumb;

    const paletteHTML = artwork.palette
      .slice(0, 5)
      .map(
        (color) =>
          `<div class="color-chip" style="background-color: ${color};"></div>`
      )
      .join("");

    artCard.innerHTML = `
            <div class="art-image-container">
                <img src="${imageUrl}" alt="${artwork.title}" class="art-image" loading="lazy">
            </div>
            <div class="art-info">
                <div class="art-title">${artwork.id}</div>

                <div class="color-palette">${paletteHTML}</div>
            </div>
        `;

    // Add click event to open artwork
    artCard.addEventListener("click", (e) => {
      if (!ctrlKeyPressed) {
        openArtworkOverlay(artwork.id);
      }
    });

    sharedArtGrid.appendChild(artCard);
  });
}

// Gallery Rendering Functions
function renderArtCards(artworks) {
  artGrid.innerHTML = "";

  artworks.forEach((artwork) => {
    const artCard = document.createElement("div");
    artCard.className = "art-card";
    artCard.dataset.id = artwork.id;

    // Use thumbnail for all artworks
    const imageUrl = artwork.thumb;

    const paletteHTML = artwork.palette
      .slice(0, 5)
      .map(
        (color) =>
          `<div class="color-chip" style="background-color: ${color};"></div>`
      )
      .join("");

    artCard.innerHTML = `
            <div class="art-image-container">
                <img src="${imageUrl}" alt="${artwork.title}" class="art-image" loading="lazy">
            </div>
            <div class="art-info">
                <div class="art-title">${artwork.id}</div>

                <div class="color-palette">${paletteHTML}</div>
            </div>
        `;

    artGrid.appendChild(artCard);
  });
}

function getPaginatedArtworks(artworks) {
  const startIndex = (currentPage - 1) * artworksPerPage;
  return artworks.slice(startIndex, startIndex + artworksPerPage);
}

function renderPagination(totalArtworks) {
  const totalPages = Math.ceil(totalArtworks / artworksPerPage);
  paginationContainer.innerHTML = "";

  // Always show pagination, but show a message when artworks are selected
  if (selectedArtworks.size > 0) {
    const message = document.createElement("div");
    message.className = "pagination-message";
    message.innerHTML = ``;
    message.style.fontSize = "0.8rem";
    message.style.opacity = "0.7";
    message.style.marginTop = "10px";
    message.style.textAlign = "center";
    paginationContainer.appendChild(message);
  }

  if (currentPage > totalPages) {
    currentPage = totalPages;
    URLManager.update({
      page: currentPage,
      selected: selectedArtworks,
      view: currentArtworkId,
    });
  }

  const prevBtn = document.createElement("div");
  prevBtn.className = `pagination-btn prev ${
    currentPage === 1 ? "disabled" : ""
  }`;
  prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      URLManager.update({
        page: currentPage,
        selected: selectedArtworks,
        view: null,
      });
      updateGallery();
    }
  });
  paginationContainer.appendChild(prevBtn);

  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement("div");
    pageBtn.className = `pagination-btn ${i === currentPage ? "active" : ""}`;
    pageBtn.textContent = i;
    pageBtn.addEventListener("click", () => {
      if (i !== currentPage) {
        currentPage = i;
        URLManager.update({
          page: currentPage,
          selected: selectedArtworks,
          view: null,
        });
        updateGallery();
      }
    });
    paginationContainer.appendChild(pageBtn);
  }

  const nextBtn = document.createElement("div");
  nextBtn.className = `pagination-btn next ${
    currentPage === totalPages ? "disabled" : ""
  }`;
  nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      URLManager.update({
        page: currentPage,
        selected: selectedArtworks,
        view: null,
      });
      updateGallery();
    }
  });
  paginationContainer.appendChild(nextBtn);
}

function updateGallery() {
  loadingIndicator.style.display = "flex";

  // Skip filtering since search/filters are disabled
  filteredArtworks = galleryData;

  // Separate shared and non-shared artworks
  const sharedArtworks = filteredArtworks.filter((artwork) =>
    sharedArtworkIds.includes(artwork.id)
  );
  const nonSharedArtworks = filteredArtworks.filter(
    (artwork) => !sharedArtworkIds.includes(artwork.id)
  );

  // Render shared artworks in the separate compartment
  renderSharedArtCards(sharedArtworks);

  // Get the correct set of non-shared artworks to display
  let nonSharedToRender = getPaginatedArtworks(nonSharedArtworks);

  setTimeout(() => {
    renderArtCards(nonSharedToRender);
    renderPagination(nonSharedArtworks.length);
    loadingIndicator.style.display = "none";
  }, 300);
}

// Image Rotation Functions
function updateImageRotation(degrees) {
  const img = overlayImage;
  const naturalWidth = img.naturalWidth;
  const naturalHeight = img.naturalHeight;

  // Remove previous orientation classes
  img.classList.remove("portrait", "landscape");

  // Determine orientation after rotation
  const isPortrait =
    degrees % 180 !== 0
      ? naturalWidth > naturalHeight
      : naturalHeight > naturalWidth;

  // Set appropriate class
  if (isPortrait) {
    img.classList.add("portrait");
  } else {
    img.classList.add("landscape");
  }

  // Apply rotation
  img.style.transform = `rotate(${degrees}deg)`;
}

// Artwork Overlay Functions
function openArtworkOverlay(artworkId) {
  const artwork = galleryData.find((a) => a.id === artworkId);
  if (!artwork) return;

  artOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
  currentRotation = 0;

  let loader = overlayImageContainer.querySelector(".overlay-loading");
  if (!loader) {
    loader = document.createElement("div");
    loader.className = "overlay-loading";
    loader.innerHTML = '<div class="spinner"></div>';
    overlayImageContainer.appendChild(loader);
  }
  loader.classList.add("active");

  overlayImage.src = transparentPixel;
  overlayTitle.textContent = artwork.id;
//   artYear.textContent = artwork.year;
//   artMedium.textContent = artwork.medium;

  // Add rotation controls
  const controlsContainer = document.createElement("div");
  controlsContainer.className = "rotation-controls-container";
  controlsContainer.innerHTML = `
        <button class="rotate-btn" id="rotate-left">
            <i class="fas fa-undo"></i>
        </button>
        <button class="rotate-btn" id="rotate-right">
            <i class="fas fa-redo"></i>
        </button>
    `;
  overlayImageContainer.appendChild(controlsContainer);

  // Rotation event listeners
  document.getElementById("rotate-left").addEventListener("click", () => {
    currentRotation -= 90;
    updateImageRotation(currentRotation);
  });

  document.getElementById("rotate-right").addEventListener("click", () => {
    currentRotation += 90;
    updateImageRotation(currentRotation);
  });

  // Load image
  const tempImg = new Image();
  tempImg.onload = () => {
    overlayImage.src = artwork.overlayImg;
    loader.classList.remove("active");
    currentArtworkImage = artwork.originalImg;
    currentArtworkId = artworkId;
    updateImageRotation(currentRotation);
    URLManager.update({
      page: currentPage,
      selected: selectedArtworks,
      view: artworkId,
    });
  };
  tempImg.onerror = () => {
    loader.classList.remove("active");
    console.error("Failed to load artwork:", artworkId);
  };
  tempImg.src = artwork.overlayImg;

  renderPalette(artwork.palette);
  renderComments(artwork);
}

function renderPalette(palette) {
  overlayPalette.innerHTML = "";

  if (!palette || palette.length === 0) {
    overlayPalette.innerHTML =
      '<div class="no-palette">No color palette available</div>';
    return;
  }

  palette.forEach((color) => {
    const chip = document.createElement("div");
    chip.className = "overlay-chip";
    chip.style.backgroundColor = color;
    chip.innerHTML = `<div class="chip-tooltip">${color}</div>`;

    chip.addEventListener("click", () => {
      navigator.clipboard.writeText(color).then(() => {
        const tooltip = chip.querySelector(".chip-tooltip");
        tooltip.textContent = "Copied!";
        setTimeout(() => {
          tooltip.textContent = color;
        }, 2000);
      });
    });

    overlayPalette.appendChild(chip);
  });
}

function openLightbox() {
  lightboxImage.src = transparentPixel;
  lightboxImage.src = currentArtworkImage;
  lightbox.classList.add("active");
  document.body.style.overflow = "hidden";
  lightboxImage.onload = () => {
    lightboxImage.classList.add("loaded");
  };
  lightboxImage.classList.remove("loaded");
}

function closeLightboxFunc() {
  lightbox.classList.remove("active");
  document.body.style.overflow = "auto";
}

function renderComments(artwork) {
  commentList.innerHTML = "";

  if (artwork.comments && artwork.comments.length > 0) {
    artwork.comments.forEach((comment) => {
      const commentItem = document.createElement("div");
      commentItem.className = "comment-item";
      commentItem.innerHTML = `
                <div class="comment-author">${comment.author}</div>
                <div class="comment-content">${comment.content}</div>
                <div class="comment-meta">
                    <span>${comment.date}</span>
                </div>
            `;
      commentList.appendChild(commentItem);
    });
  } else {
    commentList.innerHTML = `
            <div class="no-comments">
                <i class="fas fa-comment-slash"></i>
                <p>None</p>
            </div>
        `;
  }
}

function closeArtworkOverlay() {
  const loader = overlayImageContainer.querySelector(".overlay-loading");
  if (loader) loader.classList.remove("active");

  overlayImage.src = transparentPixel;
  overlayImage.style.transform = "rotate(0deg)";
  overlayImage.classList.remove("portrait", "landscape");

  const controls = overlayImageContainer.querySelector(
    ".rotation-controls-container"
  );
  if (controls) controls.remove();

  artOverlay.classList.remove("active");
  document.body.style.overflow = "auto";
  currentArtworkId = null;

  URLManager.update({
    page: currentPage,
    selected: selectedArtworks,
    view: null,
  });
}

// Event Listeners
function setupEventListeners() {
  closeOverlay.addEventListener("click", closeArtworkOverlay);

  shareBtn.addEventListener("click", () => {
    const state = URLManager.parse();
    const shareUrl = `${
      window.location.origin
    }/gallery#${URLManager.createShareString(state)}`;

    navigator.clipboard.writeText(shareUrl).then(() => {
      const tooltip = shareBtn.querySelector(".share-tooltip");
      const originalText = tooltip.textContent;
      tooltip.textContent = "Link copied!";
      setTimeout(() => {
        tooltip.textContent = originalText;
      }, 2000);
    });
  });

  viewDetailBtn.addEventListener("click", openLightbox);
  closeLightbox.addEventListener("click", closeLightboxFunc);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightboxFunc();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox.classList.contains("active")) {
      closeLightboxFunc();
    }
  });

  window.addEventListener("popstate", (event) => {
    const urlState = URLManager.parse();
    currentPage = urlState.page;
    selectedArtworks = new Set(urlState.selected);
    sharedArtworkIds = [...urlState.selected];

    // Update the gallery with new state
    updateGallery();
  });

  utilityHandle.addEventListener("mousedown", startDrag);
  document.addEventListener("mousemove", drag);
  document.addEventListener("mouseup", stopDrag);
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
  utilityToggleTab.addEventListener("click", toggleUtilityVisibility);

  copyIdsBtn.addEventListener("click", () => {
    if (removalIds.length === 0) return;
    const formattedIds = removalIds
      .map((id, index) => `${index + 1}. ${id}`)
      .join("\n");

    navigator.clipboard.writeText(formattedIds).then(() => {
      copyIdsBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      setTimeout(() => {
        copyIdsBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
      }, 2000);
    });
  });

  clearLogBtn.addEventListener("click", () => {
    removalIds = [];
    selectedArtworks.clear();
    sharedArtworkIds = [];
    removalLog.innerHTML =
      '<div class="no-entries">No artworks selected for removal</div>';
    updateRemovalCount();
    updateUtilityVisibility();
    document
      .querySelectorAll(
        ".art-card.selected-artwork, .art-card.shared-selection"
      )
      .forEach((card) => {
        card.classList.remove("selected-artwork", "shared-selection");
      });
    URLManager.update({
      page: currentPage,
      selected: selectedArtworks,
      view: currentArtworkId,
    });

    // Hide shared artworks container
    sharedArtworksContainer.style.display = "none";

    // Return to normal pagination
    updateGallery();
  });

  artGrid.addEventListener("click", (e) => {
    if (ctrlKeyPressed) {
      handleArtCardCtrlClick(e);
    } else {
      const card = e.target.closest(".art-card");
      if (card) {
        const artworkId = card.dataset.id;
        openArtworkOverlay(artworkId);
      }
    }
  });

  removalUtility.addEventListener("mouseenter", () => {
    if (ctrlKeyPressed) {
      removalUtility.style.opacity = "0.3";
    }
  });

  removalUtility.addEventListener("mouseleave", () => {
    removalUtility.style.opacity = "";
  });

  document.getElementById("share-list-btn").addEventListener("click", () => {
    if (removalIds.length === 0) return;

    const state = URLManager.parse();
    const shareUrl = `${
      window.location.origin
    }/gallery#${URLManager.createShareString(state)}`;

    // Try to use native share API if available
    if (navigator.share) {
      navigator
        .share({
          title: "Selected Artworks",
          text: `Check out these ${removalIds.length} artworks I selected`,
          url: shareUrl,
        })
        .catch(console.error);
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        const tooltip = document.createElement("div");
        tooltip.className = "share-tooltip";
        tooltip.textContent = "Link copied!";
        document.getElementById("share-list-btn").appendChild(tooltip);

        setTimeout(() => {
          if (document.getElementById("share-list-btn").contains(tooltip)) {
            document.getElementById("share-list-btn").removeChild(tooltip);
          }
        }, 2000);
      });
    }
  });
}

// Initialize Gallery
document.addEventListener("DOMContentLoaded", () => {
  initGallery();
  setupEventListeners();
});