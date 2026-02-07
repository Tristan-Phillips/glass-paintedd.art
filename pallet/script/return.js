// return.js - Configurable "Back to Home" icon button with per-page configuration
(function() {
  // Default configuration
  const defaultConfig = {
    position: 'topLeft',
    iconClass: 'fas fa-home',
    size: 24,
    padding: 15,
    color: '#ffffff',
    bgColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '50%',
    zIndex: 1000,
    hideOnHome: true,
    customHomePage: '/',
    enableSlideAnimation: false,
    animationDuration: 300,
    visible: true
  };

  // Create the button element
  function createButton(config) {
    const button = document.createElement('button');
    button.id = 'return-home-button';
    button.className = 'return-home';
    button.ariaLabel = 'Return to home page';

    const icon = document.createElement('i');
    icon.className = config.iconClass;
    button.appendChild(icon);

    return button;
  }

  // Apply styles to button
  function applyStyles(button, config) {
    const styles = {
      position: 'fixed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: `${config.size + config.padding}px`,
      height: `${config.size + config.padding}px`,
      borderRadius: config.borderRadius,
      backgroundColor: config.bgColor,
      color: config.color,
      border: 'none',
      cursor: 'pointer',
      zIndex: config.zIndex,
      opacity: config.visible ? '1' : '0',
      pointerEvents: config.visible ? 'all' : 'none',
      transition: config.enableSlideAnimation 
        ? `opacity ${config.animationDuration}ms, transform ${config.animationDuration}ms` 
        : 'none'
    };

    // Position handling
    switch(config.position) {
      case 'topRight':
        styles.top = '20px';
        styles.right = '20px';
        break;
      case 'bottomLeft':
        styles.bottom = '20px';
        styles.left = '20px';
        break;
      case 'bottomRight':
        styles.bottom = '20px';
        styles.right = '20px';
        break;
      default: // topLeft
        styles.top = '20px';
        styles.left = '20px';
    }

    // Apply styles
    Object.assign(button.style, styles);

    // Icon sizing
    const icon = button.querySelector('i');
    if (icon) {
      icon.style.fontSize = `${config.size}px`;
    }
  }

  // Slide out animation
  function slideOutAnimation(button, callback, config) {
    button.style.transform = 'translateY(-100px)';
    button.style.opacity = '0';

    setTimeout(callback, config.animationDuration);
  }

  // Initialize component
  function init() {
    // Get merged configuration (global + defaults)
    const config = Object.assign({}, defaultConfig, window.returnHomeConfig || {});

    // Skip if we're on home page
    if (config.hideOnHome && window.location.pathname === config.customHomePage) {
      return;
    }

    const button = createButton(config);
    applyStyles(button, config);

    button.addEventListener('click', () => {
      if (config.enableSlideAnimation) {
        slideOutAnimation(button, () => {
          window.location.href = config.customHomePage;
        }, config);
      } else {
        window.location.href = config.customHomePage;
      }
    });

    document.body.appendChild(button);

    // Optional: fade in animation
    if (config.enableFadeIn) {
      setTimeout(() => {
        button.style.transition = `opacity ${config.fadeDuration || 500}ms`;
        button.style.opacity = '1';
      }, 100);
    }
  }

  // Initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();