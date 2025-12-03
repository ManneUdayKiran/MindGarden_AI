import anime from 'animejs/lib/anime.es.js';

/**
 * Anime.js Animation Utilities for MindGarden AI
 * Provides consistent, performant animations across the app
 */

// Easing presets
export const EASINGS = {
  elastic: 'easeOutElastic(1, .5)',
  bounce: 'easeOutBounce',
  smooth: 'easeOutCubic',
  spring: 'spring(1, 80, 10, 0)',
  sharp: 'easeInOutQuart',
};

// Duration presets
export const DURATIONS = {
  fast: 300,
  normal: 500,
  slow: 800,
  verySlow: 1200,
};

/**
 * Fade in animation
 */
export const fadeIn = (element, options = {}) => {
  return anime({
    targets: element,
    opacity: [0, 1],
    translateY: [options.fromY || 20, 0],
    duration: options.duration || DURATIONS.normal,
    easing: options.easing || EASINGS.smooth,
    delay: options.delay || 0,
  });
};

/**
 * Fade out animation
 */
export const fadeOut = (element, options = {}) => {
  return anime({
    targets: element,
    opacity: [1, 0],
    translateY: [0, options.toY || -20],
    duration: options.duration || DURATIONS.fast,
    easing: options.easing || EASINGS.smooth,
    delay: options.delay || 0,
  });
};

/**
 * Scale animation
 */
export const scale = (element, options = {}) => {
  return anime({
    targets: element,
    scale: options.scale || [0.8, 1],
    opacity: [0, 1],
    duration: options.duration || DURATIONS.normal,
    easing: options.easing || EASINGS.elastic,
    delay: options.delay || 0,
  });
};

/**
 * Slide in from direction
 */
export const slideIn = (element, direction = 'left', options = {}) => {
  const distance = options.distance || 100;
  const transforms = {
    left: { translateX: [-distance, 0] },
    right: { translateX: [distance, 0] },
    up: { translateY: [-distance, 0] },
    down: { translateY: [distance, 0] },
  };

  return anime({
    targets: element,
    ...transforms[direction],
    opacity: [0, 1],
    duration: options.duration || DURATIONS.normal,
    easing: options.easing || EASINGS.smooth,
    delay: options.delay || 0,
  });
};

/**
 * Stagger animation for multiple elements
 */
export const staggerFadeIn = (elements, options = {}) => {
  return anime({
    targets: elements,
    opacity: [0, 1],
    translateY: [30, 0],
    duration: options.duration || DURATIONS.normal,
    easing: options.easing || EASINGS.smooth,
    delay: anime.stagger(options.stagger || 100, { start: options.startDelay || 0 }),
  });
};

/**
 * Bounce animation
 */
export const bounce = (element, options = {}) => {
  return anime({
    targets: element,
    translateY: [
      { value: -15, duration: 300 },
      { value: 0, duration: 300 },
      { value: -7, duration: 200 },
      { value: 0, duration: 200 },
    ],
    easing: EASINGS.bounce,
    delay: options.delay || 0,
  });
};

/**
 * Shake animation
 */
export const shake = (element, options = {}) => {
  return anime({
    targets: element,
    translateX: [
      { value: -10, duration: 100 },
      { value: 10, duration: 100 },
      { value: -10, duration: 100 },
      { value: 10, duration: 100 },
      { value: 0, duration: 100 },
    ],
    easing: 'easeInOutSine',
    delay: options.delay || 0,
  });
};

/**
 * Pulse animation
 */
export const pulse = (element, options = {}) => {
  return anime({
    targets: element,
    scale: [1, 1.05, 1],
    duration: options.duration || 600,
    easing: 'easeInOutSine',
    delay: options.delay || 0,
    loop: options.loop || false,
  });
};

/**
 * Rotate animation
 */
export const rotate = (element, options = {}) => {
  return anime({
    targets: element,
    rotate: options.degrees || 360,
    duration: options.duration || DURATIONS.normal,
    easing: options.easing || EASINGS.smooth,
    delay: options.delay || 0,
  });
};

/**
 * Flip animation
 */
export const flip = (element, options = {}) => {
  return anime({
    targets: element,
    rotateY: [0, 180],
    duration: options.duration || DURATIONS.normal,
    easing: options.easing || EASINGS.smooth,
    delay: options.delay || 0,
  });
};

/**
 * Morph path animation (for SVG)
 */
export const morphPath = (element, toPath, options = {}) => {
  return anime({
    targets: element,
    d: [{ value: toPath }],
    duration: options.duration || DURATIONS.slow,
    easing: options.easing || EASINGS.smooth,
    delay: options.delay || 0,
  });
};

/**
 * Number counter animation
 */
export const countUp = (element, from, to, options = {}) => {
  const obj = { value: from };
  return anime({
    targets: obj,
    value: to,
    duration: options.duration || DURATIONS.slow,
    easing: options.easing || EASINGS.smooth,
    delay: options.delay || 0,
    round: options.round !== false ? 1 : 0,
    update: () => {
      if (element) {
        element.textContent = Math.round(obj.value);
      }
    },
  });
};

/**
 * Garden growth animation (custom for MindGarden)
 */
export const gardenGrow = (element, options = {}) => {
  return anime({
    targets: element,
    scale: [0, 1],
    opacity: [0, 1],
    rotate: [0, 360],
    duration: options.duration || DURATIONS.slow,
    easing: EASINGS.elastic,
    delay: options.delay || 0,
  });
};

/**
 * Card flip animation
 */
export const cardFlip = (element, options = {}) => {
  return anime.timeline({
    easing: EASINGS.smooth,
    duration: options.duration || 400,
  })
  .add({
    targets: element,
    rotateY: 90,
  })
  .add({
    targets: element,
    rotateY: 0,
  });
};

/**
 * Ripple effect animation
 */
export const ripple = (element, x, y, options = {}) => {
  const rippleElement = document.createElement('div');
  rippleElement.style.position = 'absolute';
  rippleElement.style.borderRadius = '50%';
  rippleElement.style.background = options.color || 'rgba(255, 255, 255, 0.6)';
  rippleElement.style.width = '10px';
  rippleElement.style.height = '10px';
  rippleElement.style.left = `${x}px`;
  rippleElement.style.top = `${y}px`;
  rippleElement.style.pointerEvents = 'none';
  
  element.appendChild(rippleElement);

  anime({
    targets: rippleElement,
    scale: [1, 30],
    opacity: [1, 0],
    duration: options.duration || 800,
    easing: 'easeOutExpo',
    complete: () => {
      rippleElement.remove();
    },
  });
};

/**
 * Page transition
 */
export const pageTransition = {
  enter: (element, options = {}) => {
    return anime({
      targets: element,
      opacity: [0, 1],
      translateY: [50, 0],
      duration: options.duration || DURATIONS.normal,
      easing: EASINGS.smooth,
    });
  },
  exit: (element, options = {}) => {
    return anime({
      targets: element,
      opacity: [1, 0],
      translateY: [0, -50],
      duration: options.duration || DURATIONS.fast,
      easing: EASINGS.smooth,
    });
  },
};

/**
 * Hover scale effect
 */
export const hoverScale = (element, options = {}) => {
  const handleMouseEnter = () => {
    anime({
      targets: element,
      scale: options.scaleUp || 1.05,
      duration: 200,
      easing: 'easeOutQuad',
    });
  };

  const handleMouseLeave = () => {
    anime({
      targets: element,
      scale: 1,
      duration: 200,
      easing: 'easeOutQuad',
    });
  };

  element.addEventListener('mouseenter', handleMouseEnter);
  element.addEventListener('mouseleave', handleMouseLeave);

  // Return cleanup function
  return () => {
    element.removeEventListener('mouseenter', handleMouseEnter);
    element.removeEventListener('mouseleave', handleMouseLeave);
  };
};

/**
 * Loading spinner animation
 */
export const spinnerAnimation = (element, options = {}) => {
  return anime({
    targets: element,
    rotate: 360,
    duration: options.duration || 1000,
    easing: 'linear',
    loop: true,
  });
};

/**
 * Success checkmark animation
 */
export const successCheckmark = (element, options = {}) => {
  return anime.timeline({
    easing: EASINGS.smooth,
  })
  .add({
    targets: element,
    scale: [0, 1.2],
    opacity: [0, 1],
    duration: 300,
  })
  .add({
    targets: element,
    scale: [1.2, 1],
    duration: 200,
  });
};

/**
 * Progress bar animation
 */
export const progressBar = (element, percentage, options = {}) => {
  return anime({
    targets: element,
    width: `${percentage}%`,
    duration: options.duration || DURATIONS.slow,
    easing: EASINGS.smooth,
    delay: options.delay || 0,
  });
};

export default {
  fadeIn,
  fadeOut,
  scale,
  slideIn,
  staggerFadeIn,
  bounce,
  shake,
  pulse,
  rotate,
  flip,
  morphPath,
  countUp,
  gardenGrow,
  cardFlip,
  ripple,
  pageTransition,
  hoverScale,
  spinnerAnimation,
  successCheckmark,
  progressBar,
  EASINGS,
  DURATIONS,
};
