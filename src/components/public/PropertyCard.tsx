import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BedDouble,
  Car,
  ChevronLeft,
  ChevronRight,
  Film,
  Images,
  Maximize2,
  TrendingUp,
} from 'lucide-react';
import type { Property } from '../../types';
import { formatBRL } from '../../utils/formatters';
import { isVideoUrl } from '../../utils/mediaProcessor';
import { PerspectiveLuxuryCard, ResilientImage } from '../motion/MotionPrimitives';

export function PropertyCard({
  property,
  empreendimentoName,
  onOpen,
}: {
  property: Property;
  empreendimentoName?: string;
  onOpen: (slug: string) => void;
}) {
  const photos = useMemo(
    () =>
      Array.from(
        new Set(
          [property.coverImage, ...(property.gallery || [])]
            .filter((x): x is string => Boolean(x))
            .filter((x) => !isVideoUrl(x))
        )
      ),
    [property.coverImage, property.gallery]
  );

  const videoCount = (property.videos || []).filter(Boolean).length;
  const [photoIdx, setPhotoIdx] = useState(0);

  const safeIdx = photos.length > 0 ? photoIdx % photos.length : 0;
  const currentPhoto = photos[safeIdx] || property.coverImage;
  const pricePerSqm =
    property.areaPrivate > 0 ? Math.round(property.price / property.areaPrivate) : 0;

  const handleCycle = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    e.preventDefault();
    if (photos.length <= 1) return;
    setPhotoIdx((prev) => (prev + delta + photos.length) % photos.length);
  };

  return (
    <PerspectiveLuxuryCard className="group rounded-2xl border border-[#E5E2DC] bg-white transition-all duration-300 hover:border-[#C8B08A]/70 hover:shadow-[0_28px_56px_-22px_rgba(12,17,23,0.18)]">
      <div
        role="link"
        tabIndex={0}
        onClick={() => onOpen(property.slug)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen(property.slug);
          }
        }}
        className="flex h-full w-full flex-col text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[#A37E4D]"
      >
        {/* Architectural Media Showcase */}
        <div className="relative aspect-[16/11] w-full overflow-hidden bg-[#111827]">
          <ResilientImage
            src={currentPhoto}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#0C1117]/60 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0C1117]/90 via-[#0C1117]/40 to-transparent" />

          {/* Top subtle unboxed metadata bar */}
          <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between gap-2 text-[11px] font-medium text-white/90">
            <span className="truncate tracking-wide">
              {property.type} · {property.status}
            </span>
            {(photos.length > 1 || videoCount > 0) && (
              <span className="inline-flex items-center gap-2 shrink-0 font-mono tabular-nums text-white/85">
                {photos.length > 1 && (
                  <span className="inline-flex items-center gap-1">
                    <Images className="h-3 w-3 text-[#DFC79F]" />
                    {safeIdx + 1}/{photos.length}
                  </span>
                )}
                {videoCount > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Film className="h-3 w-3 text-[#DFC79F]" />
                    {videoCount}
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Interactive quick photo navigation when gallery has multiple images */}
          {photos.length > 1 && (
            <div className="absolute inset-y-0 left-2 right-2 flex items-center justify-between opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <button
                type="button"
                aria-label="Foto anterior do imóvel"
                onClick={(e) => handleCycle(e, -1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-[#0C1117]/65 text-white backdrop-blur-sm hover:bg-[#0C1117]/90 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Próxima foto do imóvel"
                onClick={(e) => handleCycle(e, 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-[#0C1117]/65 text-white backdrop-blur-sm hover:bg-[#0C1117]/90 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Bottom Location & Financial Valuation Anchor */}
          <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider text-[#DFC79F] truncate">
                {property.city === 'Balneario Camboriu' ? 'Balneário Camboriú' : 'Praia Brava'} ·{' '}
                {property.neighborhood}
              </div>
              {empreendimentoName && (
                <div className="text-xs text-white/80 truncate">{empreendimentoName}</div>
              )}
            </div>
            {property.estimatedAnnualYield ? (
              <div className="inline-flex items-center gap-1 shrink-0 text-xs font-semibold text-[#DFC79F] tabular-nums">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>~{property.estimatedAnnualYield}% a.a.</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Body Content */}
        <div className="flex flex-1 flex-col justify-between p-6 space-y-5">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-[22px] font-semibold leading-snug text-[#0C1117] group-hover:text-[#8E6C40] transition-colors">
                {property.title}
              </h3>
              <ArrowUpRight className="h-4 w-4 shrink-0 mt-1.5 text-[#9CA3AF] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#8E6C40]" />
            </div>

            {property.shortDescription && (
              <p className="text-sm text-[#4B5563] line-clamp-2 leading-relaxed">
                {property.shortDescription}
              </p>
            )}

            {property.highlights && property.highlights.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#6B7280] pt-0.5">
                {property.highlights.slice(0, 3).map((hl, idx) => (
                  <React.Fragment key={`${hl}-${idx}`}>
                    {idx > 0 && (
                      <span aria-hidden="true" className="text-[#C8B08A]">
                        ·
                      </span>
                    )}
                    <span className="truncate max-w-[210px]">{hl}</span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Architectural Specification Matrix */}
            <div className="grid grid-cols-3 divide-x divide-[#EFECE6] rounded-xl border border-[#EFECE6] bg-[#FAF9F6] py-2.5 text-center">
              <div className="px-2">
                <div className="flex items-center justify-center gap-1 text-[11px] text-[#6B7280]">
                  <Maximize2 className="h-3 w-3 text-[#A37E4D]" />
                  <span>Área Priv.</span>
                </div>
                <div className="mt-0.5 font-mono text-xs font-semibold text-[#0C1117] tabular-nums">
                  {property.areaPrivate} m²
                </div>
              </div>
              <div className="px-2">
                <div className="flex items-center justify-center gap-1 text-[11px] text-[#6B7280]">
                  <BedDouble className="h-3 w-3 text-[#A37E4D]" />
                  <span>Suítes</span>
                </div>
                <div className="mt-0.5 font-mono text-xs font-semibold text-[#0C1117] tabular-nums">
                  {property.suites}
                </div>
              </div>
              <div className="px-2">
                <div className="flex items-center justify-center gap-1 text-[11px] text-[#6B7280]">
                  <Car className="h-3 w-3 text-[#A37E4D]" />
                  <span>Vagas</span>
                </div>
                <div className="mt-0.5 font-mono text-xs font-semibold text-[#0C1117] tabular-nums">
                  {property.parkingSpaces}
                </div>
              </div>
            </div>

            {/* Valuation Footer */}
            <div className="flex items-end justify-between gap-3 border-t border-[#F0EDE6] pt-3.5">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#6B7280]">
                  {property.purpose === 'investir'
                    ? 'Aporte para investimento'
                    : property.purpose === 'comprar'
                    ? 'Valor de venda'
                    : 'Valor · Morar ou Investir'}
                </div>
                <div className="font-mono text-lg font-semibold text-[#0C1117] tabular-nums">
                  {formatBRL(property.price)}
                </div>
              </div>
              <div className="text-right">
                {pricePerSqm > 0 && (
                  <div className="font-mono text-[11px] text-[#6B7280] tabular-nums">
                    {formatBRL(pricePerSqm)}/m²
                  </div>
                )}
                <div className="text-xs font-semibold text-[#8E6C40] group-hover:underline underline-offset-4">
                  Ver dossiê completo
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PerspectiveLuxuryCard>
  );
}
