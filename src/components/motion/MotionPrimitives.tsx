import React, { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import { Building2 } from 'lucide-react';

const ARCHITECTURAL_EASE = [0.16, 1, 0.3, 1] as const;

export function ScrollProgressRule() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 32,
    restDelta: 0.001,
  });
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 z-50 h-[2px] origin-left bg-gradient-to-r from-[#A37E4D] via-[#DFC79F] to-[#A37E4D]"
    />
  );
}

export function ArchitecturalReveal({
  children,
  delay = 0,
  className = '',
  yOffset = 22,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  yOffset?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: yOffset }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: yOffset }}
      transition={{ duration: 0.7, delay, ease: ARCHITECTURAL_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function BlurHeadlineReveal({
  text,
  className = '',
  as = 'h1',
}: {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
}) {
  const reduceMotion = useReducedMotion();
  const Tag = as;
  const words = text.split(' ');

  if (reduceMotion) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag className={className}>
      {words.map((word, idx) => (
        <span key={`${word}-${idx}`} className="inline-block overflow-hidden align-bottom mr-[0.26em]">
          <motion.span
            className="inline-block"
            initial={{ opacity: 0, y: '105%', filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: '0%', filter: 'blur(0px)' }}
            transition={{
              duration: 0.68,
              delay: Math.min(idx * 0.045, 0.45),
              ease: ARCHITECTURAL_EASE,
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

export function SpotlightSurface({
  children,
  className = '',
  spotlightColor = 'rgba(163, 126, 77, 0.14)',
}: {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0, active: false });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMove}
      onMouseLeave={() => setPos((p) => ({ ...p, active: false }))}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: pos.active ? 1 : 0,
          background: `radial-gradient(540px circle at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 60%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function PerspectiveLuxuryCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, x: 0, y: 0, active: false });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - py) * 4.5,
      ry: (px - 0.5) * 4.5,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    });
  };

  const onLeave = () => {
    setTilt((prev) => ({ ...prev, rx: 0, ry: 0, active: false }));
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ perspective: 1000 }}
      className="h-full"
    >
      <motion.div
        animate={
          reduceMotion
            ? undefined
            : {
                rotateX: tilt.rx,
                rotateY: tilt.ry,
              }
        }
        transition={{ duration: 0.22, ease: ARCHITECTURAL_EASE }}
        className={`relative h-full overflow-hidden will-change-transform ${className}`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: tilt.active ? 1 : 0,
            background: `radial-gradient(460px circle at ${tilt.x}px ${tilt.y}px, rgba(163, 126, 77, 0.14), transparent 62%)`,
          }}
        />
        <div className="relative z-10 h-full">{children}</div>
      </motion.div>
    </div>
  );
}

export function ArchitecturalMarquee({ items }: { items: string[] }) {
  const reduceMotion = useReducedMotion();
  const repeated = [...items, ...items, ...items];

  return (
    <div className="relative overflow-hidden border-y border-[#E5E2DC] bg-white py-3.5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />

      <motion.div
        animate={reduceMotion ? undefined : { x: ['0%', '-33.333%'] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        className="flex w-max items-center gap-8 whitespace-nowrap text-xs font-medium tracking-wider text-[#4B5563]"
      >
        {repeated.map((label, idx) => (
          <React.Fragment key={`${label}-${idx}`}>
            <span className="uppercase">{label}</span>
            <span aria-hidden="true" className="text-[#A37E4D]">
              ·
            </span>
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}

export function BeamDivider({ dark = false }: { dark?: boolean }) {
  return (
    <div className="relative h-px w-full overflow-hidden bg-transparent">
      <div
        className={`absolute inset-0 ${
          dark ? 'bg-white/10' : 'bg-[#E5E2DC]'
        }`}
      />
      <div className="animate-shimmer-line absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-[#A37E4D] to-transparent" />
    </div>
  );
}

export function ParallaxHeroBackdrop({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const scale = useTransform(scrollYProgress, [0, 1], [1.02, 1.12]);

  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden ${className}`}>
      <motion.div
        style={reduceMotion ? undefined : { y, scale }}
        className="h-full w-full will-change-transform"
      >
        <ResilientImage src={src} alt={alt} className="h-full w-full object-cover" />
      </motion.div>
    </div>
  );
}

export interface HeroSlideItem {
  id: string;
  src: string;
  alt: string;
  label: string;
  category: string;
  route?: string;
}

export function HeroSlideshowBackdrop({
  slides,
  activeIndex,
  className = '',
}: {
  slides: HeroSlideItem[];
  activeIndex: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '16%']);

  const safeIndex = slides.length > 0 ? activeIndex % slides.length : 0;
  const current = slides[safeIndex];
  const panDirection = safeIndex % 2 === 0 ? -1.4 : 1.4;

  useEffect(() => {
    if (slides.length <= 1) return;
    const nextIdx = (safeIndex + 1) % slides.length;
    const preload = new Image();
    preload.referrerPolicy = 'no-referrer';
    preload.src = slides[nextIdx].src;
  }, [safeIndex, slides]);

  if (!current) return null;

  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden bg-[#090D12] ${className}`}>
      <motion.div
        style={reduceMotion ? undefined : { y }}
        className="relative h-full w-full will-change-transform"
      >
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={`${current.id}-${safeIndex}`}
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 1.09, x: `${panDirection}%` }
            }
            animate={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 1, scale: 1.01, x: '0%' }
            }
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 1.04 }
            }
            transition={{
              opacity: { duration: 1.35, ease: ARCHITECTURAL_EASE },
              scale: { duration: 7.2, ease: 'easeOut' },
              x: { duration: 7.2, ease: 'easeOut' },
            }}
            className="absolute inset-0 h-full w-full will-change-transform"
          >
            <ResilientImage
              src={current.src}
              alt={current.alt}
              className="h-full w-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export function ResilientImage({
  src,
  alt,
  className = '',
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#161D26] via-[#0C1117] to-[#1E2733] text-[#C8B08A]/70 p-6 text-center ${className}`}
      >
        <Building2 className="h-8 w-8 mb-2 stroke-[1.25]" />
        <span className="text-xs tracking-wide text-white/60 max-w-[200px] truncate">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
