# Anime.js Integration Guide for MindGarden AI

## Installation ✅

Anime.js has been installed and configured for the frontend.

```bash
npm install animejs
```

## Quick Start

### Using Animation Utilities

```javascript
import animations from '@/utils/animations';

// Fade in an element
animations.fadeIn(element, { duration: 500, delay: 100 });

// Scale animation
animations.scale(element, { scale: [0, 1] });

// Slide in from left
animations.slideIn(element, 'left', { distance: 100 });
```

### Using React Hooks

```javascript
import { useFadeIn, useSlideIn, useStaggerAnimation } from '@/hooks/useAnimations';

function MyComponent() {
  const fadeInRef = useFadeIn({ duration: 600 });
  const slideInRef = useSlideIn('left', { delay: 200 });
  
  return (
    <div>
      <h1 ref={fadeInRef}>Fade In Title</h1>
      <p ref={slideInRef}>Slide In Content</p>
    </div>
  );
}
```

## Available Animations

### 1. **Fade Animations**
```javascript
// Fade in
const fadeInRef = useFadeIn({ duration: 500, fromY: 30 });

// Fade out
animations.fadeOut(element, { toY: -30 });
```

### 2. **Scale Animations**
```javascript
// Scale up
const scaleRef = useScale({ scale: [0.8, 1], duration: 600 });

// Garden grow (custom scale + rotate)
animations.gardenGrow(element, { duration: 1000 });
```

### 3. **Slide Animations**
```javascript
// Slide from any direction
const slideRef = useSlideIn('left', { distance: 100 });
// Options: 'left', 'right', 'up', 'down'
```

### 4. **Stagger Animations** (Multiple Elements)
```javascript
const containerRef = useStaggerAnimation('.card', {
  stagger: 100,
  duration: 500,
  startDelay: 200
});

return (
  <div ref={containerRef}>
    <div className="card">Card 1</div>
    <div className="card">Card 2</div>
    <div className="card">Card 3</div>
  </div>
);
```

### 5. **Interactive Animations**

**Hover Scale:**
```javascript
const hoverRef = useHoverScale({ scaleUp: 1.1 });

return <button ref={hoverRef}>Hover Me</button>;
```

**Ripple Effect:**
```javascript
const rippleRef = useRipple({ color: 'rgba(102, 126, 234, 0.5)' });

return <button ref={rippleRef}>Click Me</button>;
```

### 6. **Number Counter**
```javascript
const counterRef = useCountUp(0, 100, { duration: 2000 });

return <div ref={counterRef}>0</div>;
```

### 7. **Progress Bar**
```javascript
const progressRef = useProgressBar(75, { duration: 1500 });

return (
  <div style={{ width: '100%', height: '8px', background: '#eee' }}>
    <div ref={progressRef} style={{ height: '100%', background: '#667eea' }} />
  </div>
);
```

### 8. **Feedback Animations**

**Bounce:**
```javascript
const bounceRef = useBounce(true, { delay: 300 });
```

**Shake (for errors):**
```javascript
const [hasError, setHasError] = useState(false);
const shakeRef = useShake(hasError);

// Trigger shake on error
if (error) setHasError(true);
```

**Pulse:**
```javascript
const pulseRef = usePulse(true); // Continuous pulse
```

**Success Checkmark:**
```javascript
const [success, setSuccess] = useState(false);
const successRef = useSuccessAnimation(success);
```

### 9. **Advanced Animations**

**Card Flip:**
```javascript
animations.cardFlip(element);
```

**Rotate:**
```javascript
animations.rotate(element, { degrees: 360, duration: 800 });
```

**Flip:**
```javascript
animations.flip(element, { duration: 600 });
```

### 10. **Page Transitions**
```javascript
const pageRef = usePageTransition();

return <div ref={pageRef}>Page Content</div>;
```

## Example Component

```jsx
import React, { useState } from 'react';
import {
  useFadeIn,
  useSlideIn,
  useStaggerAnimation,
  useHoverScale,
  useRipple,
  useCountUp,
  useShake,
} from '@/hooks/useAnimations';

function AnimatedCard() {
  const [error, setError] = useState(false);
  
  const titleRef = useFadeIn({ duration: 600 });
  const contentRef = useSlideIn('left', { delay: 200 });
  const listRef = useStaggerAnimation('.list-item', { stagger: 100 });
  const buttonRef = useHoverScale({ scaleUp: 1.05 });
  const rippleButtonRef = useRipple();
  const counterRef = useCountUp(0, 100, { duration: 2000 });
  const errorRef = useShake(error);

  return (
    <div style={{ padding: '20px' }}>
      {/* Fade in title */}
      <h1 ref={titleRef}>Welcome to MindGarden AI</h1>
      
      {/* Slide in content */}
      <p ref={contentRef}>
        Track your habits and grow your productivity garden.
      </p>
      
      {/* Stagger list items */}
      <ul ref={listRef}>
        <li className="list-item">Habit Tracking</li>
        <li className="list-item">Task Management</li>
        <li className="list-item">AI Insights</li>
      </ul>
      
      {/* Counter */}
      <div>
        Score: <span ref={counterRef}>0</span>
      </div>
      
      {/* Hover scale button */}
      <button ref={buttonRef}>
        Hover Me
      </button>
      
      {/* Ripple effect button */}
      <button ref={rippleButtonRef}>
        Click Me
      </button>
      
      {/* Error shake */}
      <div ref={errorRef}>
        {error && 'Error occurred!'}
      </div>
    </div>
  );
}

export default AnimatedCard;
```

## Integration with Existing Components

### Dashboard Page Example

```javascript
import { useFadeIn, useStaggerAnimation } from '@/hooks/useAnimations';

function Dashboard() {
  const headerRef = useFadeIn({ duration: 600 });
  const cardsRef = useStaggerAnimation('.stat-card', { 
    stagger: 150,
    startDelay: 300 
  });

  return (
    <div>
      <h1 ref={headerRef}>Dashboard</h1>
      <div ref={cardsRef}>
        <div className="stat-card">Garden Health</div>
        <div className="stat-card">Today's Tasks</div>
        <div className="stat-card">Weekly Progress</div>
      </div>
    </div>
  );
}
```

### Habits Page Example

```javascript
import { useAnimation } from '@/hooks/useAnimations';

function HabitCard({ habit }) {
  const { animate } = useAnimation();
  const cardRef = useRef(null);

  const handleComplete = () => {
    // Trigger success animation
    animate(cardRef.current, 'successCheckmark');
    
    // Then update habit
    completeHabit(habit.id);
  };

  return (
    <div ref={cardRef} onClick={handleComplete}>
      {habit.name}
    </div>
  );
}
```

## Animation Presets

```javascript
import { EASINGS, DURATIONS } from '@/utils/animations';

// Use preset easing
animations.fadeIn(element, { easing: EASINGS.elastic });

// Use preset duration
animations.slideIn(element, 'left', { duration: DURATIONS.slow });
```

**Available Easings:**
- `EASINGS.elastic` - Bouncy, elastic effect
- `EASINGS.bounce` - Bounce at the end
- `EASINGS.smooth` - Smooth cubic easing
- `EASINGS.spring` - Spring physics
- `EASINGS.sharp` - Sharp, quick easing

**Available Durations:**
- `DURATIONS.fast` - 300ms
- `DURATIONS.normal` - 500ms
- `DURATIONS.slow` - 800ms
- `DURATIONS.verySlow` - 1200ms

## Best Practices

1. **Use Refs:** Always use refs for direct DOM manipulation
2. **Cleanup:** Hooks handle cleanup automatically
3. **Performance:** Use `will-change` CSS property for heavy animations
4. **Stagger Delays:** Start with 100ms, adjust based on number of items
5. **Duration:** 300-600ms for most UI animations
6. **Easing:** Use `smooth` for most cases, `elastic` for playful effects

## Performance Tips

```css
/* Add to animated elements for better performance */
.animated-element {
  will-change: transform, opacity;
}

/* Remove after animation completes */
.animated-element.completed {
  will-change: auto;
}
```

## Combining Animations

```javascript
import anime from 'animejs';

// Create timeline for complex sequences
const timeline = anime.timeline({
  easing: 'easeOutExpo',
  duration: 750
});

timeline
  .add({
    targets: '.card',
    translateY: [-50, 0],
    opacity: [0, 1],
  })
  .add({
    targets: '.button',
    scale: [0, 1],
  }, '-=500'); // Overlap by 500ms
```

## Migration from Framer Motion

**Before (Framer Motion):**
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

**After (Anime.js):**
```jsx
const ref = useFadeIn({ duration: 500, fromY: 20 });

<div ref={ref}>
  Content
</div>
```

## Documentation

- Full API: https://animejs.com/documentation/
- Examples: https://animejs.com/
- GitHub: https://github.com/juliangarnier/anime

---

**Happy Animating! 🎨✨**
