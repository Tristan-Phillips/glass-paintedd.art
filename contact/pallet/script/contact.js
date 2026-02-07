// Abstract background
const canvas = document.getElementById("contact-bg");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw subtle color gradients
  const gradient = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    0,
    canvas.width / 2,
    canvas.height / 2,
    Math.max(canvas.width, canvas.height)
  );
  gradient.addColorStop(0, "rgba(10, 10, 10, 0.8)");
  gradient.addColorStop(1, "rgba(20, 5, 30, 0.6)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw abstract shapes
  const time = Date.now() * 0.0005;
  ctx.strokeStyle = `hsla(${Math.sin(time) * 60 + 200}, 70%, 50%, 0.03)`;
  ctx.lineWidth = 1;

  for (let i = 0; i < 30; i++) {
    const x =
      (Math.sin(time * 0.2 + i * 0.2) * canvas.width) / 3 + canvas.width / 2;
    const y =
      (Math.cos(time * 0.3 + i * 0.3) * canvas.height) / 3 + canvas.height / 2;
    const radius = Math.sin(time + i) * 50 + 150;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  requestAnimationFrame(drawBackground);
}

drawBackground();

// Color tracking functionality
let colorStats = {
  "#d90429": { clicks: 0 },
  "#00d9bf": { clicks: 0 },
  "#e725e7": { clicks: 0 },
  "#e8cf00": { clicks: 0 },
  "#8a2be2": { clicks: 0 },
};

// Current theme colors
let currentColor = "#00d9bf"; // Selected mood color
let currentRandomColor = null; // Random accent color

// Palette selection
const paletteOptions = document.querySelectorAll(".palette-option");
const formElements = document.querySelectorAll(".form-input, .submit-btn");
const submitIcon = document.querySelector(".submit-btn i");
const submitButton = document.querySelector(".submit-btn");
const socialLinks = document.querySelectorAll(".social-link");
const inputIcons = document.querySelectorAll(".input-icon");
const logo = document.querySelector(".contact-logo img");

// Generate a random accent color from the palette
function getRandomColor() {
  const colors = Object.keys(colorStats);
  return colors[Math.floor(Math.random() * colors.length)];
}

// Update UI with colors
function updateColorTheme(color) {
  currentColor = color;
  currentRandomColor = getRandomColor();

  // Track the click in our statistics (in background)
  colorStats[color].clicks++;

  // Apply color to form elements
  formElements.forEach((el) => {
    el.style.borderColor = color;
  });

  // Apply the random color to accent elements
  submitIcon.style.color = currentRandomColor;
  submitButton.style.color = currentRandomColor;

  // Apply color to social links
  socialLinks.forEach((link) => {
    link.style.borderColor = color;
    link.style.boxShadow = `0 0 10px ${color}`;
    link.style.color = currentRandomColor;
  });

  inputIcons.forEach((icon) => {
    icon.style.color = currentRandomColor;
  });

  // Logo glow effect
  logo.style.boxShadow = `0 0 50px ${color}`;

  // Animate color change
  logo.animate(
    [
      { boxShadow: logo.style.boxShadow },
      { boxShadow: `0 0 80px ${color}` },
      { boxShadow: `0 0 50px ${color}` },
    ],
    {
      duration: 800,
      easing: "ease-out",
    }
  );
}

// Initialize with default color
updateColorTheme("#00d9bf");

paletteOptions.forEach((option) => {
  option.addEventListener("click", function () {
    paletteOptions.forEach((opt) => opt.classList.remove("active"));
    this.classList.add("active");

    const color = this.getAttribute("data-color");
    updateColorTheme(color);
  });
});

// Form submission handling
document
  .getElementById("contact-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const submitBtn = this.querySelector(".submit-btn");
    const btnText = submitBtn.innerHTML;

    // Show sending state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    submitBtn.disabled = true;

    // Check if mood color matches random accent color
    const colorMatch = currentColor === currentRandomColor;

    console.log(`Sent with ${colorMatch ? "matched" : "unmatched"} colors!`);
    console.log("Color stats:", colorStats);

    // Create data for submission
    const formData = {
      name: this.querySelector('[aria-label="Your name"]').value,
      email: this.querySelector('[aria-label="Your email"]').value,
      message: this.querySelector('[aria-label="Your message"]').value,
      color: currentColor,
      color_match: colorMatch,
      color_stats: colorStats,
    };

    // Simulate submission
    setTimeout(() => {
      // Success effect
      logo.animate(
        [
          {
            transform: "scale(1)",
            boxShadow: `0 0 50px ${currentColor}`,
          },
          {
            transform: "scale(1.2)",
            boxShadow: `0 0 100px ${currentColor}`,
          },
          {
            transform: "scale(1)",
            boxShadow: `0 0 50px ${currentColor}`,
          },
        ],
        {
          duration: 800,
          easing: "ease-out",
        }
      );

      // Create particles
      createParticles(currentColor);

      // Reset form
      setTimeout(() => {
        this.reset();
        submitBtn.innerHTML = btnText;
        submitBtn.disabled = false;

        // Reset to default color
        document.querySelectorAll(".palette-option")[1].click();
      }, 1500);
    }, 1000);
  });

// Particle animation for form submission
function createParticles(color) {
  const particles = [];
  const container = document.querySelector(".contact-container");

  for (let i = 0; i < 50; i++) {
    const particle = document.createElement("div");
    particle.style.position = "absolute";
    particle.style.width = "6px";
    particle.style.height = "6px";
    particle.style.borderRadius = "50%";
    particle.style.backgroundColor = currentColor;
    particle.style.pointerEvents = "none";
    particle.style.zIndex = "5";
    particle.style.boxShadow = `0 0 10px ${color}`;

    // Random position around logo
    const angle = Math.random() * Math.PI * 2;
    const distance = 100 + Math.random() * 50;
    const logoRect = document
      .querySelector(".contact-logo")
      .getBoundingClientRect();
    const centerX = logoRect.left + logoRect.width / 2;
    const centerY = logoRect.top + logoRect.height / 2;

    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;

    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;

    document.body.appendChild(particle);

    particles.push({
      element: particle,
      x: Math.random() * 10 - 5,
      y: Math.random() * 10 - 5,
      life: 100,
    });
  }

  // Animate particles
  function animateParticles() {
    particles.forEach((p, index) => {
      if (p.life <= 0) {
        p.element.remove();
        particles.splice(index, 1);
        return;
      }

      p.element.style.opacity = p.life / 100;
      p.element.style.transform = `translate(${p.x}px, ${p.y}px)`;
      p.life--;
    });

    if (particles.length > 0) {
      requestAnimationFrame(animateParticles);
    }
  }

  animateParticles();
}

// Social link click feedback
document.querySelectorAll(".social-link").forEach((link) => {
  link.addEventListener("click", function (e) {
    const icon = this.querySelector("i");
    icon.style.transform = "scale(1.3)";
    setTimeout(() => {
      icon.style.transform = "scale(1)";
    }, 300);
  });
});
