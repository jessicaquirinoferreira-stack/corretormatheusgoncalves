import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

const EASE_LUXURY = [0.16, 1, 0.3, 1] as const;

const FLOOR_LEVELS = Array.from({ length: 18 }, (_, i) => 116 + i * 14.5);

export function SiteIntro({
  brandName,
  onComplete,
}: {
  brandName: string;
  onComplete: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitDelay = reduceMotion ? 1600 : 6150;
    const doneDelay = reduceMotion ? 2200 : 7000;

    const exitTimer = window.setTimeout(() => {
      setExiting(true);
    }, exitDelay);

    const doneTimer = window.setTimeout(() => {
      onComplete();
    }, doneDelay);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onComplete, reduceMotion]);

  const handleSkip = () => {
    setExiting(true);
    window.setTimeout(onComplete, 420);
  };

  return (
    <motion.div
      role="region"
      aria-label={`Apresentação ${brandName}`}
      initial={{ opacity: 1 }}
      animate={exiting ? { opacity: 0, scale: 1.02 } : { opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.85, ease: EASE_LUXURY }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#070A0E] text-white select-none"
    >
      {/* Atmospheric subtle coastal horizon depth glow (completely frameless) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 75% 55% at 50% 46%, rgba(163, 126, 77, 0.12) 0%, rgba(14, 24, 38, 0.28) 45%, rgba(7, 10, 14, 0) 78%)',
        }}
      />

      {/* Monumental Free-Standing Architectural Drawing + Realistic Shading (No box, no circle) */}
      <div className="relative z-10 flex w-full max-w-[1160px] flex-col items-center px-4 sm:px-8">
        <svg
          viewBox="0 0 1200 520"
          className="w-full max-h-[58vh] overflow-visible"
          aria-hidden="true"
        >
          <defs>
            {/* Fade horizon line smoothly at edges so there is zero frame */}
            <linearGradient id="horizonFade" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A37E4D" stopOpacity="0" />
              <stop offset="18%" stopColor="#C8B08A" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#DFC79F" stopOpacity="0.85" />
              <stop offset="82%" stopColor="#C8B08A" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#A37E4D" stopOpacity="0" />
            </linearGradient>

            {/* Glass Curtain Wall Realistic Gradient */}
            <linearGradient id="glassRightFace" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1D2B3E" stopOpacity="0.92" />
              <stop offset="45%" stopColor="#121C29" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#0A1018" stopOpacity="0.95" />
            </linearGradient>

            {/* Illuminated Architectural Concrete / Bronze Left Face */}
            <linearGradient id="concreteLeftFace" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2A2622" stopOpacity="0.92" />
              <stop offset="60%" stopColor="#18181B" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0C0E12" stopOpacity="0.95" />
            </linearGradient>

            {/* Diagonal Sky Reflection Sweep on Facade */}
            <linearGradient id="glassSheen" x1="0%" y1="0%" x2="100%" y2="85%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
              <stop offset="45%" stopColor="#DFC79F" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>

            {/* Penthouse & Club Interior Warm Light */}
            <linearGradient id="warmInterior" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F5DEB3" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#A37E4D" stopOpacity="0.12" />
            </linearGradient>

            {/* Infinity Pool Water Sheen */}
            <linearGradient id="poolWater" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.32" />
              <stop offset="55%" stopColor="#7DD3FC" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.15" />
            </linearGradient>

            {/* Water Reflection Under Podium */}
            <linearGradient id="oceanReflection" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#C8B08A" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#070A0E" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* 1. REALISTIC ARCHITECTURAL SHADING VOLUMES (Materialize at 2.3s–4.3s) */}
          <motion.g
            initial={{ opacity: reduceMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.9, delay: reduceMotion ? 0 : 2.35, ease: EASE_LUXURY }}
          >
            {/* Left Podium Pavilion Volume */}
            <polygon points="215,432 215,372 395,358 395,432" fill="url(#concreteLeftFace)" />
            <polygon points="235,382 385,372 385,428 235,428" fill="url(#warmInterior)" opacity="0.32" />

            {/* Main Tower 3D Left Structural Plane (Sunlit Stone/Bronze Edge) */}
            <polygon points="395,432 395,94 522,52 522,432" fill="url(#concreteLeftFace)" />

            {/* Main Tower 3D Right Glass Curtain Wall */}
            <polygon points="522,432 522,52 652,98 652,432" fill="url(#glassRightFace)" />

            {/* Glass Diagonal Sky Reflection */}
            <polygon points="522,52 652,98 652,290 522,200" fill="url(#glassSheen)" />

            {/* Penthouse Double-Height Warm Interior Glow */}
            <polygon points="408,104 522,68 522,102 408,128" fill="url(#warmInterior)" opacity="0.65" />
            <polygon points="522,68 640,108 640,136 522,102" fill="url(#warmInterior)" opacity="0.52" />

            {/* Asymmetric Lit Residence Suites */}
            <polygon points="410,188 508,169 508,180 410,198" fill="url(#warmInterior)" opacity="0.48" />
            <polygon points="534,218 638,236 638,247 534,230" fill="url(#warmInterior)" opacity="0.42" />
            <polygon points="410,276 508,266 508,277 410,286" fill="url(#warmInterior)" opacity="0.52" />
            <polygon points="534,306 638,314 638,324 534,317" fill="url(#warmInterior)" opacity="0.38" />

            {/* Right Cantilevered Club Lounge & Infinity Pool Terrace */}
            <polygon points="652,432 652,344 892,366 892,432" fill="url(#glassRightFace)" />
            <polygon points="665,362 874,378 874,426 665,426" fill="url(#warmInterior)" opacity="0.42" />
            <polygon points="846,386 1018,396 1004,408 846,400" fill="url(#poolWater)" />

            {/* Soft Mirror Reflection Below Horizon */}
            <polygon points="395,436 652,436 670,492 380,492" fill="url(#oceanReflection)" opacity="0.45" />
            <polygon points="652,436 1005,436 980,478 652,478" fill="url(#oceanReflection)" opacity="0.3" />
          </motion.g>

          {/* 2. PRECISION ARCHITECTURAL LINE DRAWING (Draws smoothly 0.0s–3.6s) */}
          {/* Open Coastal Horizon Line */}
          <motion.line
            x1="40"
            y1="432"
            x2="1160"
            y2="432"
            stroke="url(#horizonFade)"
            strokeWidth="1.25"
            initial={{ pathLength: reduceMotion ? 1 : 0, opacity: 0.4 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.6, delay: 0.1, ease: EASE_LUXURY }}
          />

          {/* Main Tower Primary Silhouette & Perspective Ridge */}
          <motion.path
            d="M 395 432 L 395 94 L 522 52 L 652 98 L 652 432"
            fill="none"
            stroke="#DFC79F"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: reduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.1, delay: 0.25, ease: EASE_LUXURY }}
          />

          {/* Center Perspective Spine */}
          <motion.line
            x1="522"
            y1="52"
            x2="522"
            y2="432"
            stroke="#DFC79F"
            strokeWidth="1.6"
            initial={{ pathLength: reduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.5, ease: EASE_LUXURY }}
          />

          {/* Sculpted Cantilevered Penthouse Crown Roof Pergola & Architectural Spire */}
          <motion.path
            d="M 372 94 L 522 38 L 674 96 M 425 76 L 522 24 L 620 78 M 522 24 L 522 6"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity="0.9"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: reduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, delay: 0.75, ease: EASE_LUXURY }}
          />

          {/* Left Beachfront Residence Wing */}
          <motion.path
            d="M 196 372 L 395 356 M 215 432 L 215 372 M 234 384 L 384 374 L 384 432 M 234 384 L 234 432"
            fill="none"
            stroke="#C8B08A"
            strokeWidth="1.3"
            strokeLinecap="round"
            initial={{ pathLength: reduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.9, ease: EASE_LUXURY }}
          />

          {/* Right Club Lounge & Cantilevered Infinity Edge Pool Terrace */}
          <motion.path
            d="M 652 344 L 916 364 L 916 376 L 652 358 M 892 375 L 892 432 M 846 386 L 1024 396 L 1004 409 L 846 400 M 955 407 L 955 432"
            fill="none"
            stroke="#DFC79F"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: reduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.7, delay: 1.0, ease: EASE_LUXURY }}
          />

          {/* Horizontal Perspective Floor Slabs & Terraced Balconies */}
          {FLOOR_LEVELS.map((yCenter, idx) => {
            const leftEdgeY = yCenter + (522 - 395) * (0.33 - idx * 0.014);
            const rightEdgeY = yCenter + (652 - 522) * (0.35 - idx * 0.015);
            return (
              <motion.path
                key={yCenter}
                d={`M 395 ${leftEdgeY.toFixed(1)} L 522 ${yCenter.toFixed(1)} L 652 ${rightEdgeY.toFixed(1)}`}
                fill="none"
                stroke="#FFFFFF"
                strokeOpacity={idx % 3 === 0 ? 0.62 : 0.34}
                strokeWidth={idx % 3 === 0 ? 1.15 : 0.75}
                initial={{ pathLength: reduceMotion ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 0.9,
                  delay: reduceMotion ? 0 : 1.05 + idx * 0.075,
                  ease: EASE_LUXURY,
                }}
              />
            );
          })}

          {/* Vertical Structural Mullions Across Curtain Wall */}
          {[428, 460, 492, 554, 588, 620].map((xPos, idx) => {
            const isLeft = xPos < 522;
            const topY = isLeft
              ? 52 + ((522 - xPos) / (522 - 395)) * (94 - 52)
              : 52 + ((xPos - 522) / (652 - 522)) * (98 - 52);
            return (
              <motion.line
                key={xPos}
                x1={xPos}
                y1={topY.toFixed(1)}
                x2={xPos}
                y2="432"
                stroke="#C8B08A"
                strokeOpacity="0.32"
                strokeWidth="0.85"
                initial={{ pathLength: reduceMotion ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 1.2,
                  delay: reduceMotion ? 0 : 1.55 + idx * 0.1,
                  ease: EASE_LUXURY,
                }}
              />
            );
          })}

          {/* Organic Coastal Palm Silhouettes (Free-standing on open horizon) */}
          <motion.path
            d="M 164 432 Q 158 394 148 362 M 148 362 Q 128 352 114 364 M 148 362 Q 134 342 122 340 M 148 362 Q 162 344 178 350 M 148 362 Q 170 362 180 374"
            fill="none"
            stroke="#C8B08A"
            strokeOpacity="0.65"
            strokeWidth="1.1"
            strokeLinecap="round"
            initial={{ pathLength: reduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.3, delay: 1.9, ease: EASE_LUXURY }}
          />
          <motion.path
            d="M 1048 432 Q 1054 398 1062 370 M 1062 370 Q 1042 360 1030 370 M 1062 370 Q 1052 350 1042 346 M 1062 370 Q 1080 354 1094 362 M 1062 370 Q 1082 372 1092 384"
            fill="none"
            stroke="#C8B08A"
            strokeOpacity="0.65"
            strokeWidth="1.1"
            strokeLinecap="round"
            initial={{ pathLength: reduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.3, delay: 2.05, ease: EASE_LUXURY }}
          />

          {/* Ocean Shimmer Reflection Strokes Below Horizon */}
          {[
            { x1: 420, x2: 630, y: 448 },
            { x1: 455, x2: 605, y: 462 },
            { x1: 690, x2: 960, y: 446 },
            { x1: 740, x2: 910, y: 460 },
          ].map((line, i) => (
            <motion.line
              key={i}
              x1={line.x1}
              y1={line.y}
              x2={line.x2}
              y2={line.y}
              stroke="#C8B08A"
              strokeOpacity="0.28"
              strokeWidth="1"
              strokeLinecap="round"
              initial={{ pathLength: reduceMotion ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.1, delay: 2.6 + i * 0.14, ease: EASE_LUXURY }}
            />
          ))}
        </svg>

        {/* Monumental Site Name — Completely Free, No Box, No Circle */}
        <div className="mt-4 flex flex-col items-center text-center">
          <motion.h1
            initial={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 0, y: 18, filter: 'blur(8px)', letterSpacing: '0.14em' }
            }
            animate={{
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              letterSpacing: '0.04em',
            }}
            transition={{ duration: 1.35, delay: reduceMotion ? 0 : 3.35, ease: EASE_LUXURY }}
            className="font-display text-[clamp(2.25rem,5.4vw,4.75rem)] font-semibold leading-none text-white"
          >
            {brandName}
          </motion.h1>

          <motion.div
            initial={reduceMotion ? { scaleX: 1, opacity: 0.7 } : { scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 0.8 }}
            transition={{ duration: 1.1, delay: reduceMotion ? 0 : 3.95, ease: EASE_LUXURY }}
            className="mt-4 h-px w-48 sm:w-72 origin-center bg-gradient-to-r from-transparent via-[#DFC79F] to-transparent"
          />

          <motion.p
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 0.82, y: 0 }}
            transition={{ duration: 1.0, delay: reduceMotion ? 0 : 4.2, ease: EASE_LUXURY }}
            className="mt-3 text-xs sm:text-sm tracking-[0.22em] uppercase text-[#DFC79F]"
          >
            Imóveis &amp; Lucratividade · Balneário Camboriú e Praia Brava
          </motion.p>
        </div>
      </div>

      {/* Subtle 7-second timeline progress rule at bottom edge */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-white/10"
      >
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: reduceMotion ? 1.6 : 6.2, ease: 'linear' }}
          className="h-full w-full origin-left bg-gradient-to-r from-[#A37E4D] via-[#DFC79F] to-[#A37E4D]"
        />
      </div>

      <button
        type="button"
        onClick={handleSkip}
        className="absolute bottom-5 right-6 text-xs font-medium tracking-wider uppercase text-white/55 hover:text-white transition-colors cursor-pointer"
      >
        Pular intro →
      </button>
    </motion.div>
  );
}
