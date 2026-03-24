import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const slides = [
  {
    id: 1,
    title: "Teleporady online",
    description: "Konsultacje z lekarzem, prawnikiem, psychologiem i innymi specjalistami telefonicznie lub przez wideo",
    ctaText: "Zobacz oferty",
    imageSrc: "/img/teleporady.png",
    link: "/home?service=teleporada"
  },
  {
    id: 2,
    title: "Szybka naprawa AGD",
    description: "Znajdź specjalistę od naprawy AGD w swojej okolicy",
    ctaText: "Sprawdź ofertę",
    imageSrc: "/img/hero-agd.png",
    link: "/home?service=agd_rtv"
  },
  {
    id: 3,
    title: "Zarządzaj zespołem wykonawców",
    description: "14 dni za darmo",
    ctaText: "Sprawdź ofertę",
    imageSrc: "/img/team management.png",
    link: "/register?role=provider"
  },
  {
    id: 4,
    title: "Pakiet Pro dla firm",
    description: "Zarządzaj zespołem i zwiększ efektywność",
    ctaText: "Sprawdź ofertę",
    imageSrc: "/img/Business pro package.png",
    link: "/account/subscriptions?audience=business"
  }
];

export default function HelpfliPromoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  // Auto-rotate tylko jeśli jest więcej niż 1 slide
  useEffect(() => {
    if (slides.length <= 1) return;
    
    const interval = setInterval(() => {
      if (!isHovered) {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isHovered]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const currentSlide = slides[currentIndex];

  return (
    <section 
      className="py-6 md:py-8 relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div 
          className="relative rounded-xl overflow-hidden min-h-[300px] md:min-h-0 md:h-[220px]"
          style={{
            backgroundColor: 'var(--card)',
            borderColor: 'var(--border)',
            borderWidth: '1px',
          }}
        >
          {/* Strzałki — desktop (na mobile nawigacja pod slajdem) */}
          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={goToPrevious}
                className={`hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full items-center justify-center transition-all ${
                  isHovered ? 'opacity-100' : 'opacity-30'
                }`}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                <ChevronLeft className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
              </button>

              <button
                type="button"
                onClick={goToNext}
                className={`hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full items-center justify-center transition-all ${
                  isHovered ? 'opacity-100' : 'opacity-30'
                }`}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                <ChevronRight className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
              </button>
            </>
          )}

          {/* Slide Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="relative h-full flex items-center py-4 md:py-0"
              style={{ paddingLeft: 'clamp(1rem, 4vw, 2.5rem)', paddingRight: 'clamp(1rem, 4vw, 2.5rem)' }}
            >
              {/* Background Image */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.img
                  src={currentSlide.imageSrc}
                  alt={currentSlide.title}
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-[55%] md:h-full max-h-[140px] md:max-h-none object-contain opacity-90 md:opacity-100"
                  style={{
                    maxWidth: '55%',
                    objectPosition: 'right center'
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/20 to-transparent z-0" />
              </div>

              {/* Text Content */}
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6 px-8 md:px-12 py-0 max-w-[min(100%,28rem)] md:max-w-none">
                <div className="flex-1 min-w-0 pr-[30%] md:pr-0">
                  <h3 className="text-lg md:text-2xl font-bold mb-2 leading-tight" style={{ color: 'var(--foreground)' }}>
                    {currentSlide.title}
                  </h3>
                  <p className="text-sm md:text-base mb-3 md:mb-4 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                    {currentSlide.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(currentSlide.link)}
                    className="btn-helpfli-primary mt-1 md:mt-3 inline-flex items-center justify-center px-5 py-3 text-sm md:text-base font-semibold transition-all min-h-[44px] w-full sm:w-auto"
                  >
                    {currentSlide.ctaText}
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Nawigacja mobilna: strzałki + kropki */}
          {slides.length > 1 && (
            <div className="md:hidden absolute bottom-3 left-0 right-0 z-20 flex items-center justify-center gap-6 px-4">
              <button
                type="button"
                onClick={goToPrevious}
                className="w-11 h-11 rounded-full flex items-center justify-center border shadow-sm"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', touchAction: 'manipulation' }}
                aria-label="Poprzedni slajd"
              >
                <ChevronLeft className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
              </button>
              <div className="flex gap-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => goToSlide(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex ? 'w-6' : 'w-2'
                    }`}
                    style={{
                      backgroundColor: index === currentIndex ? 'var(--primary)' : 'rgba(0, 0, 0, 0.2)'
                    }}
                    aria-label={`Slajd ${index + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={goToNext}
                className="w-11 h-11 rounded-full flex items-center justify-center border shadow-sm"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', touchAction: 'manipulation' }}
                aria-label="Następny slajd"
              >
                <ChevronRight className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
              </button>
            </div>
          )}
          {slides.length > 1 && (
            <div className="hidden md:flex absolute bottom-4 left-1/2 -translate-x-1/2 z-20 gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex ? 'w-6' : ''
                  }`}
                  style={{
                    backgroundColor: index === currentIndex ? 'var(--primary)' : 'rgba(0, 0, 0, 0.2)'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

