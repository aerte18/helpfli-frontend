import { useEffect, useRef, useState } from 'react';

/**
 * Komponent do progressive disclosure - animuje elementy przy scrollowaniu
 */
export default function ScrollReveal({ children, className = '', delay = 0, direction = 'up' }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setIsVisible(true);
            }, delay);
            // Opcjonalnie: przestań obserwować po pierwszym pokazaniu
            // observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1, // Element musi być widoczny w 10%
        rootMargin: '0px 0px -50px 0px' // Zaczyna animować 50px przed wejściem w viewport
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [delay]);

  const directionClasses = {
    up: 'translate-y-8',
    down: '-translate-y-8',
    left: 'translate-x-8',
    right: '-translate-x-8',
    fade: ''
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0 translate-x-0'
          : `opacity-0 ${directionClasses[direction]}`
      } ${className}`}
    >
      {children}
    </div>
  );
}
