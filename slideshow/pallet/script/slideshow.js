document.addEventListener("DOMContentLoaded", async () => {
  let artworkData = [];
  const loadingIndicator = document.createElement("div");
  loadingIndicator.className = "loading-indicator";
  loadingIndicator.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i><p>Loading artworks...</p>';
  document.body.appendChild(loadingIndicator);

  try {
    const response = await fetch("/pallet/data/art.json");
    if (!response.ok) throw new Error("Failed to fetch artwork data");
    const data = await response.json();

    artworkData = data.artworks
      .filter((artwork) => !artwork.hidden && !artwork.secret)
      .map((artwork) => {
        const originalImage =
          artwork.images.find((img) => img.type === "medium")?.url || "";
        return {
          title: artwork.title || artwork.id,
          image: originalImage,
          palette: artwork.palette || ["#00D9BF", "#E725E7", "#0a0a0a"],
          tags: artwork.tags || [],
        };
      })
      .filter(
        (artwork) =>
          artwork.image &&
          artwork.image.trim() !== "" &&
          !artwork.image.includes("undefined")
      );

    if (artworkData.length === 0) {
      throw new Error("No valid artworks found");
    }

    shuffleArray(artworkData);
    document.body.removeChild(loadingIndicator);
  } catch (error) {
    console.error("Error loading artwork data:", error);
    document.body.removeChild(loadingIndicator);
    const errorMessage = document.createElement("div");
    errorMessage.className = "error-message";
    errorMessage.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      <p>Couldn't load the artworks. Please try again later.</p>
      <p style="font-size: 1rem; margin-top: 1rem;">${error.message}</p>
    `;
    document.body.appendChild(errorMessage);
    return;
  }

  const galleryContainer = document.getElementById("gallery-container");
  const progressBar = document.getElementById("progress-bar");
  const artCount = document.getElementById("art-count");
  const prevArea = document.getElementById("prev-area");
  const nextArea = document.getElementById("next-area");
  const fullscreenBtn = document.getElementById("fullscreen-btn"); // Get existing button
  let currentIndex = 0;
  let artStages = [];
  let intervalId;
  const slideDuration = 10000;
  let preloadedImages = [];
  let isManualInteraction = false;

  // Setup fullscreen toggle
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .catch((err) => console.error("Error entering fullscreen:", err));
    } else {
      document
        .exitFullscreen()
        .catch((err) => console.error("Error exiting fullscreen:", err));
    }
  }

  fullscreenBtn.addEventListener("click", toggleFullscreen);

  // Update fullscreen icon based on state
  function updateFullscreenIcon() {
    if (document.fullscreenElement) {
      fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
    } else {
      fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
    }
  }

  // Add fullscreen event listeners
  document.addEventListener("fullscreenchange", updateFullscreenIcon);
  document.addEventListener("webkitfullscreenchange", updateFullscreenIcon);
  document.addEventListener("mozfullscreenchange", updateFullscreenIcon);
  document.addEventListener("MSFullscreenChange", updateFullscreenIcon);

  initGallery();

  function initGallery() {
    artCount.textContent = `1/${artworkData.length}`;

    artworkData.forEach((art, index) => {
      const stage = document.createElement("div");
      stage.className = "art-stage";
      stage.dataset.index = index;

      const container = document.createElement("div");
      container.className = "artwork-container";

      const frame = document.createElement("div");
      frame.className = "artwork-frame";

      const image = document.createElement("img");
      image.className = "artwork-image";
      image.alt = art.title;
      image.onerror = function () {
        this.src =
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM4ODgiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+";
        frame.classList.add("image-error");
      };

      if (index === 0) {
        image.src = art.image;
      } else {
        image.dataset.src = art.image;
      }

      frame.appendChild(image);
      container.appendChild(frame);
      stage.appendChild(container);

      const info = document.createElement("div");
      info.className = "art-info";
      info.innerHTML = `<div class="art-title">${art.title}</div>`;
      stage.appendChild(info);

      galleryContainer.appendChild(stage);
      artStages.push(stage);
    });

    artStages[0].classList.add("active");
    positionArtInfo(0);
    applyBorderGlow(0);
    preloadNextImages(1);
    startSlideshow();
  }

  function applyBorderGlow(index) {
    const frame = artStages[index].querySelector(".artwork-frame");
    const palette = artworkData[index].palette;
    if (!palette || palette.length === 0) {
      frame.style.boxShadow = `0 0 30px 1px var(--default-glow)`;
      return;
    }
    const nonBlackPalette = palette.filter((color) => {
      const colorStr = color.toLowerCase().trim();
      return ![
        "#000",
        "#000000",
        "black",
        "rgb(0,0,0)",
        "rgba(0,0,0,1)",
      ].includes(colorStr);
    });
    if (nonBlackPalette.length === 0) {
      frame.style.boxShadow = `0 0 30px 1px var(--default-glow)`;
      return;
    }
    const colorIndex = index % nonBlackPalette.length;
    const selectedColor = nonBlackPalette[colorIndex];
    const rgbaColor = hexToRgba(selectedColor, 0.25);
    frame.style.boxShadow = `0 0 30px 1px ${rgbaColor}`;
  }

  function hexToRgba(hex, opacity = 1) {
    if (!hex) return "rgba(231, 37, 231, 0.2)";
    hex = hex.replace("#", "");
    let r, g, b;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else {
      return "rgba(231, 37, 231, 0.2)";
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  function preloadNextImages(startIndex) {
    preloadedImages = [];
    const preloadCount = Math.min(2, artworkData.length - startIndex);
    for (let i = 0; i < preloadCount; i++) {
      const img = new Image();
      img.onerror = function () {
        console.warn(
          "Failed to preload image:",
          artworkData[startIndex + i].image
        );
      };
      img.src = artworkData[startIndex + i].image;
      preloadedImages.push(img);
    }
  }

  function positionArtInfo(index) {
    const info = artStages[index].querySelector(".art-info");
    if (!info) return;
    info.classList.remove("show");
    const positions = [
      { top: "8%", left: "8%" },
      { top: "8%", right: "8%" },
      { bottom: "14%", left: "8%" },
      { bottom: "14%", right: "8%" },
    ];
    const position = positions[index % positions.length];
    Object.assign(info.style, position);
    setTimeout(() => info.classList.add("show"), 1000);
  }

  function animateArtwork(index) {
    const image = artStages[index].querySelector(".artwork-image");
    if (!image) return;
    if (!image.src && image.dataset.src) {
      image.src = image.dataset.src;
    }
    image.style.animation = "";
    setTimeout(() => {
      image.style.animation = "subtleZoom 20s infinite ease-in-out";
    }, 100);
  }

  function startSlideshow() {
    clearInterval(intervalId);
    intervalId = setInterval(nextArtwork, slideDuration);
    animateProgressBar();
    setTimeout(() => {
      isManualInteraction = false;
    }, slideDuration);
  }

  function nextArtwork() {
    if (artStages.length === 0) return;
    artStages[currentIndex].classList.remove("active");
    currentIndex = (currentIndex + 1) % artworkData.length;
    artStages[currentIndex].classList.add("active");
    positionArtInfo(currentIndex);
    animateArtwork(currentIndex);
    applyBorderGlow(currentIndex);
    artCount.textContent = `${currentIndex + 1}/${artworkData.length}`;
    animateProgressBar();
    preloadNextImages((currentIndex + 1) % artworkData.length);
  }

  function prevArtwork() {
    if (artStages.length === 0) return;
    artStages[currentIndex].classList.remove("active");
    currentIndex = (currentIndex - 1 + artworkData.length) % artworkData.length;
    artStages[currentIndex].classList.add("active");
    positionArtInfo(currentIndex);
    animateArtwork(currentIndex);
    applyBorderGlow(currentIndex);
    artCount.textContent = `${currentIndex + 1}/${artworkData.length}`;
    animateProgressBar();
    preloadNextImages((currentIndex + 1) % artworkData.length);
  }

  function animateProgressBar() {
    if (!progressBar) return;
    progressBar.style.width = "0%";
    progressBar.style.transition = "none";
    setTimeout(() => {
      progressBar.style.transition = `width ${slideDuration}ms linear`;
      progressBar.style.width = "100%";
    }, 50);
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  if (prevArea) {
    prevArea.addEventListener("click", () => {
      isManualInteraction = true;
      prevArtwork();
      startSlideshow();
    });
  }

  if (nextArea) {
    nextArea.addEventListener("click", () => {
      isManualInteraction = true;
      nextArtwork();
      startSlideshow();
    });
  }
});
