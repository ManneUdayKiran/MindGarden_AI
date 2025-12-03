import { useEffect, useRef } from 'react';
import animations from '../utils/animations';

/**
 * Custom React hooks for anime.js animations
 */

/**
 * Hook to animate element on mount
 */
export const useAnimateOnMount = (animationType, options = {}) => {
  const elementRef = useRef(null);

  useEffect(() => {
    if (elementRef.current) {
      const animationFn = animations[animationType];
      if (animationFn) {
        animationFn(elementRef.current, options);
      }
    }
  }, [animationType, options]);

  return elementRef;
};

/**
 * Hook for fade in animation
 */
export const useFadeIn = (options = {}) => {
  return useAnimateOnMount('fadeIn', options);
};

/**
 * Hook for scale animation
 */
export const useScale = (options = {}) => {
  return useAnimateOnMount('scale', options);
};

/**
 * Hook for slide in animation
 */
export const useSlideIn = (direction = 'left', options = {}) => {
  const elementRef = useRef(null);

  useEffect(() => {
    if (elementRef.current) {
      animations.slideIn(elementRef.current, direction, options);
    }
  }, [direction, options]);

  return elementRef;
};

/**
 * Hook for stagger animation (multiple children)
 */
export const useStaggerAnimation = (selector, options = {}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      const elements = containerRef.current.querySelectorAll(selector);
      if (elements.length > 0) {
        animations.staggerFadeIn(elements, options);
      }
    }
  }, [selector, options]);

  return containerRef;
};

/**
 * Hook for hover scale effect
 */
export const useHoverScale = (options = {}) => {
  const elementRef = useRef(null);

  useEffect(() => {
    if (elementRef.current) {
      const cleanup = animations.hoverScale(elementRef.current, options);
      return cleanup;
    }
  }, [options]);

  return elementRef;
};

/**
 * Hook for counter animation
 */
export const useCountUp = (from, to, options = {}) => {
  const elementRef = useRef(null);

  useEffect(() => {
    if (elementRef.current) {
      animations.countUp(elementRef.current, from, to, options);
    }
  }, [from, to, options]);

  return elementRef;
};

/**
 * Hook for progress bar animation
 */
export const useProgressBar = (percentage, options = {}) => {
  const elementRef = useRef(null);

  useEffect(() => {
    if (elementRef.current) {
      animations.progressBar(elementRef.current, percentage, options);
    }
  }, [percentage, options]);

  return elementRef;
};

/**
 * Hook for ripple effect on click
 */
export const useRipple = (options = {}) => {
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleClick = (e) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      animations.ripple(element, x, y, options);
    };

    element.addEventListener('click', handleClick);
    return () => element.removeEventListener('click', handleClick);
  }, [options]);

  return elementRef;
};

/**
 * Hook for triggering animation on demand
 */
export const useAnimation = () => {
  const animate = (element, animationType, options = {}) => {
    const animationFn = animations[animationType];
    if (animationFn && element) {
      return animationFn(element, options);
    }
  };

  return { animate, animations };
};

/**
 * Hook for page transition animations
 */
export const usePageTransition = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      animations.pageTransition.enter(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        animations.pageTransition.exit(containerRef.current);
      }
    };
  }, []);

  return containerRef;
};

/**
 * Hook for success animation (e.g., after form submission)
 */
export const useSuccessAnimation = (trigger) => {
  const elementRef = useRef(null);

  useEffect(() => {
    if (trigger && elementRef.current) {
      animations.successCheckmark(elementRef.current);
    }
  }, [trigger]);

  return elementRef;
};

/**
 * Hook for bounce animation on mount or trigger
 */
export const useBounce = (trigger = true, options = {}) => {
  const elementRef = useRef(null);

  useEffect(() => {
    if (trigger && elementRef.current) {
      animations.bounce(elementRef.current, options);
    }
  }, [trigger, options]);

  return elementRef;
};

/**
 * Hook for shake animation (e.g., error states)
 */
export const useShake = (trigger = false, options = {}) => {
  const elementRef = useRef(null);

  useEffect(() => {
    if (trigger && elementRef.current) {
      animations.shake(elementRef.current, options);
    }
  }, [trigger, options]);

  return elementRef;
};

/**
 * Hook for pulse animation (continuous or triggered)
 */
export const usePulse = (continuous = false, options = {}) => {
  const elementRef = useRef(null);

  useEffect(() => {
    if (elementRef.current) {
      animations.pulse(elementRef.current, {
        ...options,
        loop: continuous,
      });
    }
  }, [continuous, options]);

  return elementRef;
};

export default {
  useAnimateOnMount,
  useFadeIn,
  useScale,
  useSlideIn,
  useStaggerAnimation,
  useHoverScale,
  useCountUp,
  useProgressBar,
  useRipple,
  useAnimation,
  usePageTransition,
  useSuccessAnimation,
  useBounce,
  useShake,
  usePulse,
};
