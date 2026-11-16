import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Film,
  Images,
  TrendingUp,
} from 'lucide-react';
import type { Empreendimento } from '../../types';
import { formatBRL } from '../../utils/formatters';
import { isVideoUrl } from '../../utils/mediaProcessor';
import { PerspectiveLuxuryCard, ResilientImage } from '../motion/MotionPrimitives';

export function EmpreendimentoCard({
  empreendimento,
  linkedUnitsCount = 0,
  onOpen,
}: {
  empreendimento: Empreendimento;
  linkedUnitsCount?: number;
  onOpen: (slug: string) => void;
}) {
  const photos = useMemo(
    () =>
      Array.from(
        new Set(
          [empreendimento.coverImage, ...(empreendimento.gallery || [])]
            .filter((x): x is string => Boolean(x))
            .filter((x) => !isVideoUrl(x))
        )
      ),
    [empreendimento.coverImage, empreendimento.gallery]
  );

  const videoCount = (empreendimento.videos || []).filter(Boolean).length;
  const [photoIdx, setPhotoIdx] = useState(0);
  const safeIdx = photos.length > 0 ? photoIdx % photos.length : 0;
  const currentPhoto = photos[safeIdx] || empreendimento.coverImage;

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
        onClick={() => onOpen(empreendimento.slug)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen(empreendimento.slug);
          }
        }}
        className="flex h-full w-full flex-col text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[#A37E4D]"
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#111827]">
          <ResilientImage
            src={currentPhoto}
            alt={empreendimento.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#0C1117]/60 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0C1117]/90 via-[#0C1117]/35 to-transparent" />

          <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between gap-2 text-[11px] font-medium text-white/90">
            <span className="truncate">
              {empreendimento.developer} · {empreendimento.stage}
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

          {photos.length > 1 && (
            <div className="absolute inset-y-0 left-3 right-3 flex items-center justify-between opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <button
                type="button"
                aria-label="Foto anterior do empreendimento"
                onClick={(e) => handleCycle(e, -1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-[#0C1117]/65 text-white backdrop-blur-sm hover:bg-[#0C1117]/90 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Próxima foto do empreendimento"
                onClick={(e) => handleCycle(e, 1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-[#0C1117]/65 text-white backdrop-blur-sm hover:bg-[#0C1117]/90 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between gap-3">
            <div className="text-[11px] uppercase tracking-wider text-[#DFC79F] truncate">
              {empreendimento.city === 'Balneario Camboriu' ? 'Balneário Camboriú' : 'Praia Brava'}
              {empreendimento.neighborhood ? ` · ${empreendimento.neighborhood}` : ''}
            </div>
            {empreendimento.estimatedAppreciation ? (
              <div className="inline-flex items-center gap-1 shrink-0 text-xs font-semibold text-[#DFC79F] tabular-nums">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>+{empreendimento.estimatedAppreciation}% est./ano</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-6 space-y-5">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-2xl font-semibold text-[#0C1117] group-hover:text-[#8E6C40] transition-colors">
                {empreendimento.name}
              </h3>
              <ArrowUpRight className="h-4 w-4 shrink-0 mt-1.5 text-[#9CA3AF] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#8E6C40]" />
            </div>

            {empreendimento.summary && (
              <p className="text-sm text-[#4B5563] line-clamp-2 leading-relaxed">
                {empreendimento.summary}
              </p>
            )}

            {empreendimento.amenities && empreendimento.amenities.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#6B7280]">
                {empreendimento.amenities.slice(0, 3).map((item, idx) => (
                  <React.Fragment key={`${item}-${idx}`}>
                    {idx > 0 && (
                      <span aria-hidden="true" className="text-[#C8B08A]">
                        ·
                      </span>
                    )}
                    <span className="truncate max-w-[220px]">{item}</span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 divide-x divide-[#EFECE6] rounded-xl border border-[#EFECE6] bg-[#FAF9F6] py-2.5 text-center">
              <div className="px-2">
                <div className="flex items-center justify-center gap-1 text-[11px] text-[#6B7280]">
                  <Calendar className="h-3 w-3 text-[#A37E4D]" />
                  <span>Entrega</span>
                </div>
                <div className="mt-0.5 font-mono text-xs font-semibold text-[#0C1117] tabular-nums truncate">
                  {empreendimento.deliveryForecast}
                </div>
              </div>
              <div className="px-2">
                <div className="flex items-center justify-center gap-1 text-[11px] text-[#6B7280]">
                  <Building2 className="h-3 w-3 text-[#A37E4D]" />
                  <span>Estágio</span>
                </div>
                <div className="mt-0.5 text-xs font-semibold text-[#0C1117] truncate">
                  {empreendimento.stage}
                </div>
              </div>
              <div className="px-2">
                <div className="text-[11px] text-[#6B7280]">Unidades</div>
                <div className="mt-0.5 font-mono text-xs font-semibold text-[#0C1117] tabular-nums">
                  {linkedUnitsCount} disponív.
                </div>
              </div>
            </div>

            <div className="flex items-end justify-between gap-3 border-t border-[#F0EDE6] pt-3.5">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#6B7280]">
                  Unidades a partir de
                </div>
                <div className="font-mono text-lg font-semibold text-[#0C1117] tabular-nums">
                  {formatBRL(empreendimento.startingPrice)}
                </div>
              </div>
              <div className="text-xs font-semibold text-[#8E6C40] group-hover:underline underline-offset-4">
                Explorar empreendimento
              </div>
            </div>
          </div>
        </div>
      </div>
    </PerspectiveLuxuryCard>
  );
}
