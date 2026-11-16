import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Award,
  BedDouble,
  Building2,
  Calculator,
  Calendar,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Expand,
  Film,
  Images,
  MapPin,
  Maximize2,
  MessageSquare,
  Share2,
  TrendingUp,
  X,
} from 'lucide-react';
import { MATHEUS_PORTRAIT_IMAGE } from '../../data/seedData';
import { trackAnalyticsEvent } from '../../services/firestoreService';
import type { Empreendimento, Property, SiteSettings } from '../../types';
import { buildWhatsAppUrl, captureUtmParams, formatBRL } from '../../utils/formatters';
import { isVideoUrl } from '../../utils/mediaProcessor';
import { ResilientImage, SpotlightSurface } from '../../components/motion/MotionPrimitives';
import { LeadCaptureForm } from '../../components/public/LeadCaptureForm';
import { PropertyCard } from '../../components/public/PropertyCard';

function FullscreenGalleryModal({
  photos,
  title,
  initialIndex,
  onClose,
}: {
  photos: string[];
  title: string;
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((prev) => (prev + 1) % photos.length);
      if (e.key === 'ArrowLeft') setIndex((prev) => (prev - 1 + photos.length) % photos.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [photos.length, onClose]);

  const current = photos[index] || photos[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Galeria de fotos — ${title}`}
      className="fixed inset-0 z-50 flex flex-col bg-[#090D12]/96 text-white backdrop-blur-md"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="min-w-0">
          <div className="truncate font-display text-lg font-medium">{title}</div>
          <div className="font-mono text-xs text-[#C8B08A] tabular-nums">
            Foto {String(index + 1).padStart(2, '0')} de {String(photos.length).padStart(2, '0')}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white hover:bg-white/15 cursor-pointer"
          aria-label="Fechar galeria ampliada"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center p-4 md:p-10 overflow-hidden">
        {photos.length > 1 && (
          <button
            type="button"
            onClick={() => setIndex((prev) => (prev - 1 + photos.length) % photos.length)}
            className="absolute left-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 bg-[#0C1117]/75 text-white hover:bg-[#0C1117] cursor-pointer"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <img
          src={current}
          alt={`${title} — imagem ${index + 1}`}
          referrerPolicy="no-referrer"
          className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
        />

        {photos.length > 1 && (
          <button
            type="button"
            onClick={() => setIndex((prev) => (prev + 1) % photos.length)}
            className="absolute right-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 bg-[#0C1117]/75 text-white hover:bg-[#0C1117] cursor-pointer"
            aria-label="Próxima foto"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {photos.length > 1 && (
        <div className="flex items-center justify-center gap-2 overflow-x-auto border-t border-white/10 px-6 py-3">
          {photos.map((img, i) => (
            <button
              key={`${img}-modal-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded-md border transition-all cursor-pointer ${
                i === index
                  ? 'border-[#C8B08A] ring-2 ring-[#C8B08A]'
                  : 'border-white/15 opacity-55 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`Miniatura ${i + 1}`}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PropertyDetailPage({
  property,
  empreendimento,
  relatedProperties = [],
  settings,
  navigate,
}: {
  property?: Property;
  empreendimento?: Empreendimento;
  relatedProperties?: Property[];
  settings: SiteSettings;
  navigate: (path: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [entryPercent, setEntryPercent] = useState(30);
  const [horizonYears, setHorizonYears] = useState(3);

  useEffect(() => {
    setActivePhotoIdx(0);
    setLightboxOpen(false);
  }, [property?.id]);

  useEffect(() => {
    if (property?.id) {
      const utm = captureUtmParams();
      trackAnalyticsEvent({
        eventType: 'property_view',
        path: `/imovel/${property.slug}`,
        entityId: property.id,
        utmSource: utm.utmSource,
      });
    }
  }, [property?.id, property?.slug]);

  const gallery = useMemo(
    () =>
      Array.from(
        new Set(
          [property?.coverImage, ...(property?.gallery || [])]
            .filter((x): x is string => Boolean(x))
            .filter((x) => !isVideoUrl(x))
        )
      ),
    [property?.coverImage, property?.gallery]
  );

  if (!property) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center space-y-4">
        <h1 className="font-display text-3xl font-semibold text-[#0C1117]">Imóvel não encontrado</h1>
        <button
          type="button"
          onClick={() => navigate('/comprar')}
          className="rounded-lg bg-[#0C1117] px-5 py-2.5 text-sm font-medium text-white cursor-pointer"
        >
          Voltar ao portfólio
        </button>
      </div>
    );
  }

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: property.title, url: shareUrl });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  const videos = (property.videos || []).filter(Boolean);
  const safePhotoIdx = gallery.length > 0 ? activePhotoIdx % gallery.length : 0;
  const activePhoto = gallery[safePhotoIdx] || '';

  const pricePerSqm =
    property.areaPrivate > 0 ? Math.round(property.price / property.areaPrivate) : 0;
  const annualYieldRate = property.estimatedAnnualYield || 14;
  const entryValue = Math.round((property.price * entryPercent) / 100);
  const remainingBalance = Math.max(0, property.price - entryValue);
  const projectedFutureValue = Math.round(
    property.price * Math.pow(1 + annualYieldRate / 100, horizonYears)
  );
  const projectedGain = projectedFutureValue - property.price;

  const whatsappHref = buildWhatsAppUrl(
    settings.whatsapp || settings.phone,
    `Olá Matheus, tenho interesse no imóvel "${property.title}" (${formatBRL(property.price)}). Gostaria de receber a tabela e agendar uma apresentação.`
  );

  const cityLabel =
    property.city === 'Balneario Camboriu' ? 'Balneário Camboriú' : 'Praia Brava';
  const purposeLabel =
    property.purpose === 'investir'
      ? 'Foco em Investimento & Liquidez'
      : property.purpose === 'comprar'
      ? 'Moradia de Alto Padrão'
      : 'Moradia ou Investimento Patrimonial';

  return (
    <div className="bg-[#FAF9F6]">
      {lightboxOpen && gallery.length > 0 && (
        <FullscreenGalleryModal
          photos={gallery}
          title={property.title}
          initialIndex={safePhotoIdx}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Architectural Dark Hero Header Band */}
      <section className="border-b border-white/10 bg-[#090D12] text-white">
        <div className="mx-auto max-w-7xl px-6 py-8 md:py-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate('/comprar')}
              className="inline-flex items-center gap-2 text-xs font-medium text-white/75 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 text-[#C8B08A]" />
              <span>Voltar ao portfólio de imóveis</span>
            </button>

            <div className="flex flex-wrap items-center gap-2.5">
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#A37E4D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#8E6C40] transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>WhatsApp Direto</span>
                </a>
              )}
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Share2 className="h-3.5 w-3.5 text-[#C8B08A]" />
                )}
                <span>{copied ? 'Link copiado' : 'Compartilhar dossiê'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8 space-y-3">
              <div className="flex flex-wrap items-center gap-2.5 text-xs uppercase tracking-wider text-[#C8B08A]">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {cityLabel} · {property.neighborhood}
                </span>
                <span aria-hidden="true">·</span>
                <span>{property.type}</span>
                <span aria-hidden="true">·</span>
                <span>{property.status}</span>
                {empreendimento && (
                  <>
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={() => navigate(`/empreendimento/${empreendimento.slug}`)}
                      className="underline decoration-[#C8B08A]/50 underline-offset-4 hover:text-white cursor-pointer"
                    >
                      {empreendimento.name}
                    </button>
                  </>
                )}
              </div>

              <h1 className="font-display text-3xl md:text-5xl font-semibold leading-tight text-white [text-wrap:balance]">
                {property.title}
              </h1>

              {property.shortDescription && (
                <p className="max-w-3xl text-sm md:text-base leading-relaxed text-white/75">
                  {property.shortDescription}
                </p>
              )}
            </div>

            <div className="lg:col-span-4 rounded-xl border border-white/12 bg-white/[0.04] p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>Valor de investimento</span>
                {property.estimatedAnnualYield ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-[#C8B08A] tabular-nums">
                    <TrendingUp className="h-3.5 w-3.5" />
                    ~{property.estimatedAnnualYield}% a.a. est.
                  </span>
                ) : null}
              </div>
              <div className="font-mono text-2xl md:text-3xl font-semibold text-white tabular-nums">
                {formatBRL(property.price)}
              </div>
              {pricePerSqm > 0 && (
                <div className="text-xs text-white/65 tabular-nums">
                  Equivalente a <span className="text-[#DFC79F]">{formatBRL(pricePerSqm)}/m²</span> privativos
                </div>
              )}
            </div>
          </div>

          {/* 5-Cell Architectural KPI Strip */}
          <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6 sm:grid-cols-3 lg:grid-cols-5">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <Maximize2 className="h-3.5 w-3.5 text-[#C8B08A]" />
                <span>Área Privativa</span>
              </div>
              <div className="mt-1 font-mono text-lg font-semibold tabular-nums">
                {property.areaPrivate} m²
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <BedDouble className="h-3.5 w-3.5 text-[#C8B08A]" />
                <span>Suítes</span>
              </div>
              <div className="mt-1 font-mono text-lg font-semibold tabular-nums">
                {property.suites} {property.suites === 1 ? 'suíte' : 'suítes'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <Car className="h-3.5 w-3.5 text-[#C8B08A]" />
                <span>Vagas</span>
              </div>
              <div className="mt-1 font-mono text-lg font-semibold tabular-nums">
                {property.parkingSpaces} {property.parkingSpaces === 1 ? 'vaga' : 'vagas'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <Images className="h-3.5 w-3.5 text-[#C8B08A]" />
                <span>Acervo Visual</span>
              </div>
              <div className="mt-1 font-mono text-lg font-semibold tabular-nums">
                {gallery.length} foto(s)
                {videos.length > 0 ? ` · ${videos.length} vídeo(s)` : ''}
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="text-xs text-white/60">Vocação Patrimonial</div>
              <div className="mt-1 text-sm font-medium text-[#DFC79F]">{purposeLabel}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content + Sticky Consultation Sidebar */}
      <div className="mx-auto max-w-7xl px-6 py-12 space-y-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-8">
            {/* Interactive Photo Showcase */}
            <div className="space-y-3">
              <div className="group relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[#E5E2DC] bg-[#111827]">
                <ResilientImage
                  src={activePhoto}
                  alt={property.title}
                  className="h-full w-full object-cover"
                />

                {gallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Foto anterior"
                      onClick={() =>
                        setActivePhotoIdx((prev) => (prev - 1 + gallery.length) % gallery.length)
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-[#0C1117]/70 text-white backdrop-blur-sm hover:bg-[#0C1117] cursor-pointer"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Próxima foto"
                      onClick={() => setActivePhotoIdx((prev) => (prev + 1) % gallery.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-[#0C1117]/70 text-white backdrop-blur-sm hover:bg-[#0C1117] cursor-pointer"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {gallery.length > 0 && (
                  <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between">
                    <span className="rounded-md bg-[#0C1117]/75 px-2.5 py-1 font-mono text-xs text-white backdrop-blur-sm tabular-nums">
                      {String(safePhotoIdx + 1).padStart(2, '0')} /{' '}
                      {String(gallery.length).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setLightboxOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-[#0C1117]/75 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-[#0C1117] cursor-pointer"
                    >
                      <Expand className="h-3.5 w-3.5 text-[#DFC79F]" />
                      <span>Ampliar galeria</span>
                    </button>
                  </div>
                )}
              </div>

              {gallery.length > 1 && (
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
                  {gallery.map((img, i) => (
                    <button
                      key={`${img}-${i}`}
                      type="button"
                      onClick={() => setActivePhotoIdx(i)}
                      className={`aspect-[16/10] overflow-hidden rounded-lg border transition-all cursor-pointer ${
                        i === safePhotoIdx
                          ? 'border-[#A37E4D] ring-2 ring-[#A37E4D]'
                          : 'border-[#E5E2DC] opacity-75 hover:opacity-100'
                      }`}
                    >
                      <ResilientImage
                        src={img}
                        alt={`${property.title} — foto ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dedicated Video Presentation Theater */}
            {videos.length > 0 && (
              <div className="space-y-4 rounded-2xl border border-[#1E2733] bg-[#090D12] p-6 text-white">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4 text-[#C8B08A]" />
                    <h2 className="font-display text-xl font-semibold">
                      Vídeos &amp; Apresentação do Imóvel
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-white/60 tabular-nums">
                    {videos.length} vídeo(s)
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {videos.map((vUrl, idx) => (
                    <video
                      key={`${vUrl}-${idx}`}
                      src={vUrl}
                      controls
                      playsInline
                      preload="metadata"
                      className="aspect-video w-full rounded-xl border border-white/10 bg-black object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Memorial & Highlights */}
            <div className="rounded-2xl border border-[#E5E2DC] bg-white p-7 md:p-8 space-y-7">
              <div className="space-y-3">
                <p className="text-xs font-semibold tracking-wider text-[#8E6C40]">
                  Memorial Descritivo &amp; Leitura Arquitetônica
                </p>
                <h2 className="font-display text-2xl md:text-3xl font-semibold text-[#0C1117]">
                  Visão completa desta unidade
                </h2>
                <div className="space-y-4 text-sm md:text-base leading-relaxed text-[#374151] max-w-[68ch]">
                  {(property.description || property.shortDescription || '')
                    .split('\n')
                    .filter(Boolean)
                    .map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                </div>
              </div>

              {/* Structured Technical Datasheet */}
              <div className="border-t border-[#F0EDE6] pt-6 space-y-4">
                <h3 className="font-display text-xl font-semibold text-[#0C1117]">
                  Ficha Técnica Detalhada
                </h3>
                <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 text-sm">
                  {[
                    { label: 'Cidade', value: cityLabel },
                    { label: 'Bairro / Localização', value: property.neighborhood },
                    { label: 'Tipologia', value: property.type },
                    { label: 'Disponibilidade', value: property.status },
                    { label: 'Área Privativa', value: `${property.areaPrivate} m²` },
                    { label: 'Valor por m²', value: pricePerSqm > 0 ? `${formatBRL(pricePerSqm)}/m²` : '—' },
                    { label: 'Configuração', value: `${property.suites} suítes · ${property.parkingSpaces} vagas` },
                    {
                      label: 'Potencial de Retorno Est.',
                      value: property.estimatedAnnualYield ? `~${property.estimatedAnnualYield}% ao ano` : 'Sob consulta',
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between border-b border-[#F3F0EA] py-2.5 gap-4"
                    >
                      <span className="text-[#6B7280]">{row.label}</span>
                      <span className="font-medium text-[#0C1117] text-right tabular-nums">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {property.highlights && property.highlights.length > 0 && (
                <div className="border-t border-[#F0EDE6] pt-6 space-y-4">
                  <h3 className="font-display text-xl font-semibold text-[#0C1117]">
                    Diferenciais e pontos de valorização
                  </h3>
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm text-[#374151]">
                    {property.highlights.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 rounded-xl border border-[#EFECE6] bg-[#FAF9F6] p-3.5"
                      >
                        <span className="font-mono text-xs font-semibold text-[#A37E4D] mt-0.5 tabular-nums">
                          {String(idx + 1).padStart(2, '0')}.
                        </span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Interactive Entry & Equity Projection Simulator */}
            <SpotlightSurface className="rounded-2xl border border-[#E5E2DC] bg-white p-7 md:p-8">
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#8E6C40]">
                    <Calculator className="h-4 w-4" />
                    <span>Simulador Financeiro &amp; Valorização Patrimonial</span>
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-[#0C1117]">
                    Planeje sua composição de entrada e projeção neste imóvel
                  </h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed">
                    Simulação indicativa considerando valor atual de {formatBRL(property.price)} e taxa estimada de {annualYieldRate}% a.a. Condições exatas e fluxo direto são apresentados no dossiê comercial.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#374151]">Percentual de entrada</span>
                      <span className="font-mono font-semibold text-[#0C1117] tabular-nums">
                        {entryPercent}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={70}
                      step={5}
                      value={entryPercent}
                      onChange={(e) => setEntryPercent(Number(e.target.value))}
                      className="w-full accent-[#A37E4D]"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#374151]">Horizonte de valorização</span>
                      <span className="font-mono font-semibold text-[#0C1117] tabular-nums">
                        {horizonYears} {horizonYears === 1 ? 'ano' : 'anos'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={6}
                      step={1}
                      value={horizonYears}
                      onChange={(e) => setHorizonYears(Number(e.target.value))}
                      className="w-full accent-[#A37E4D]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-[#F0EDE6] pt-5">
                  <div className="rounded-xl border border-[#EFECE6] bg-[#FAF9F6] p-4">
                    <div className="text-[11px] text-[#6B7280]">Entrada sugerida ({entryPercent}%)</div>
                    <div className="mt-1 font-mono text-lg font-semibold text-[#0C1117] tabular-nums">
                      {formatBRL(entryValue)}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-[#6B7280] tabular-nums">
                      Saldo: {formatBRL(remainingBalance)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#EFECE6] bg-[#FAF9F6] p-4">
                    <div className="text-[11px] text-[#6B7280]">
                      Patrimônio est. em {horizonYears} {horizonYears === 1 ? 'ano' : 'anos'}
                    </div>
                    <div className="mt-1 font-mono text-lg font-semibold text-[#0C1117] tabular-nums">
                      {formatBRL(projectedFutureValue)}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#6B7280] tabular-nums">
                      Base ~{annualYieldRate}% a.a.
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#A37E4D]/30 bg-[#090D12] p-4 text-white">
                    <div className="text-[11px] text-[#C8B08A]">Ganho patrimonial est.</div>
                    <div className="mt-1 font-mono text-lg font-semibold text-[#DFC79F] tabular-nums">
                      +{formatBRL(projectedGain)}
                    </div>
                    <div className="mt-0.5 text-[11px] text-white/60">Projeção ilustrativa</div>
                  </div>
                </div>
              </div>
            </SpotlightSurface>

            {/* Linked Empreendimento Deep Card */}
            {empreendimento && (
              <div className="rounded-2xl border border-[#E5E2DC] bg-white p-6 md:p-7 space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold tracking-wider text-[#8E6C40]">
                      Empreendimento Vinculado
                    </div>
                    <h3 className="font-display text-2xl font-semibold text-[#0C1117]">
                      {empreendimento.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B7280]">
                      <span>{empreendimento.developer}</span>
                      <span aria-hidden="true">·</span>
                      <span>{empreendimento.stage}</span>
                      <span aria-hidden="true">·</span>
                      <span>Entrega {empreendimento.deliveryForecast}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/empreendimento/${empreendimento.slug}`)}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#0C1117] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1E293B] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Explorar empreendimento</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                {empreendimento.summary && (
                  <p className="text-sm leading-relaxed text-[#4B5563]">
                    {empreendimento.summary}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sticky Right Consultation Sidebar */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-2xl border border-[#E5E2DC] bg-white p-6 md:p-7 space-y-5 shadow-[0_20px_40px_-24px_rgba(12,17,23,0.12)]">
                <div className="flex items-center gap-3.5 border-b border-[#F0EDE6] pb-4">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#E5E2DC] bg-[#111827]">
                    <ResilientImage
                      src={settings.aboutImage || MATHEUS_PORTRAIT_IMAGE}
                      alt={settings.brandName}
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-display text-base font-semibold text-[#0C1117] truncate">
                      {settings.brandName}
                    </div>
                    <div className="text-xs text-[#6B7280] truncate">
                      Atendimento Consultivo · BC &amp; Praia Brava
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-semibold tracking-wider text-[#8E6C40]">
                    Solicitar Dossiê Completo
                  </p>
                  <h2 className="font-display text-2xl font-semibold text-[#0C1117]">
                    Receba tabela, planta baixa e agende sua visita
                  </h2>
                  <p className="text-xs leading-relaxed text-[#6B7280]">
                    Atendimento direto e sigiloso para avaliar fluxo de pagamento, permutas e potencial de liquidez desta unidade.
                  </p>
                </div>

                <LeadCaptureForm
                  origin="Site"
                  propertyId={property.id}
                  propertyTitle={property.title}
                  defaultProfile={property.purpose === 'investir' ? 'Investir' : 'Morar'}
                  ctaLabel="Receber Tabela e Agendar Visita"
                  settings={settings}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Similar / Related Properties Section */}
        {relatedProperties.length > 0 && (
          <div className="space-y-6 border-t border-[#E5E2DC] pt-12">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold tracking-wider text-[#8E6C40]">
                  Outras Oportunidades no Portfólio
                </p>
                <h2 className="font-display text-2xl md:text-3xl font-semibold text-[#0C1117]">
                  Imóveis que também podem fazer sentido para você
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/comprar')}
                className="text-sm font-semibold text-[#0C1117] hover:text-[#8E6C40] cursor-pointer"
              >
                Ver catálogo completo →
              </button>
            </div>
            <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
              {relatedProperties.map((rel) => (
                <PropertyCard
                  key={rel.id}
                  property={rel}
                  onOpen={(slug) => navigate(`/imovel/${slug}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function EmpreendimentoDetailPage({
  empreendimento,
  linkedProperties,
  settings,
  navigate,
}: {
  empreendimento?: Empreendimento;
  linkedProperties: Property[];
  settings: SiteSettings;
  navigate: (path: string) => void;
}) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [simHorizon, setSimHorizon] = useState(3);

  useEffect(() => {
    setActivePhotoIdx(0);
    setLightboxOpen(false);
  }, [empreendimento?.id]);

  useEffect(() => {
    if (empreendimento?.id) {
      const utm = captureUtmParams();
      trackAnalyticsEvent({
        eventType: 'empreendimento_view',
        path: `/empreendimento/${empreendimento.slug}`,
        entityId: empreendimento.id,
        utmSource: utm.utmSource,
      });
    }
  }, [empreendimento?.id, empreendimento?.slug]);

  const empGallery = useMemo(
    () =>
      Array.from(
        new Set(
          [empreendimento?.coverImage, ...(empreendimento?.gallery || [])]
            .filter((x): x is string => Boolean(x))
            .filter((x) => !isVideoUrl(x))
        )
      ),
    [empreendimento?.coverImage, empreendimento?.gallery]
  );

  if (!empreendimento) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center space-y-4">
        <h1 className="font-display text-3xl font-semibold text-[#0C1117]">
          Empreendimento não encontrado
        </h1>
        <button
          type="button"
          onClick={() => navigate('/empreendimentos')}
          className="rounded-lg bg-[#0C1117] px-5 py-2.5 text-sm font-medium text-white cursor-pointer"
        >
          Voltar aos empreendimentos
        </button>
      </div>
    );
  }

  const empVideos = (empreendimento.videos || []).filter(Boolean);
  const safePhotoIdx = empGallery.length > 0 ? activePhotoIdx % empGallery.length : 0;
  const activeEmpPhoto = empGallery[safePhotoIdx] || '';

  const cityLabel =
    empreendimento.city === 'Balneario Camboriu' ? 'Balneário Camboriú' : 'Praia Brava';
  const estRate = empreendimento.estimatedAppreciation || 15;
  const projectedUnitValue = Math.round(
    empreendimento.startingPrice * Math.pow(1 + estRate / 100, simHorizon)
  );
  const projectedGain = projectedUnitValue - empreendimento.startingPrice;

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: empreendimento.name, url: shareUrl });
        return;
      } catch {
        // Fallback
      }
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  const whatsappHref = buildWhatsAppUrl(
    settings.whatsapp || settings.phone,
    `Olá Matheus, gostaria de receber o book, plantas e tabela de unidades do empreendimento "${empreendimento.name}".`
  );

  return (
    <div className="bg-[#FAF9F6]">
      {lightboxOpen && empGallery.length > 0 && (
        <FullscreenGalleryModal
          photos={empGallery}
          title={empreendimento.name}
          initialIndex={safePhotoIdx}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Dark Architectural Hero Header Band */}
      <section className="border-b border-white/10 bg-[#090D12] text-white">
        <div className="mx-auto max-w-7xl px-6 py-8 md:py-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate('/empreendimentos')}
              className="inline-flex items-center gap-2 text-xs font-medium text-white/75 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 text-[#C8B08A]" />
              <span>Voltar aos empreendimentos</span>
            </button>

            <div className="flex flex-wrap items-center gap-2.5">
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#A37E4D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#8E6C40] transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Solicitar Book no WhatsApp</span>
                </a>
              )}
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Share2 className="h-3.5 w-3.5 text-[#C8B08A]" />
                )}
                <span>{copied ? 'Link copiado' : 'Compartilhar'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8 space-y-3">
              <div className="flex flex-wrap items-center gap-2.5 text-xs uppercase tracking-wider text-[#C8B08A]">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {empreendimento.developer}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {cityLabel}
                  {empreendimento.neighborhood ? ` · ${empreendimento.neighborhood}` : ''}
                </span>
                <span aria-hidden="true">·</span>
                <span>{empreendimento.stage}</span>
              </div>

              <h1 className="font-display text-3xl md:text-5xl font-semibold leading-tight text-white [text-wrap:balance]">
                {empreendimento.name}
              </h1>

              {empreendimento.summary && (
                <p className="max-w-3xl text-sm md:text-base leading-relaxed text-white/75">
                  {empreendimento.summary}
                </p>
              )}
            </div>

            <div className="lg:col-span-4 rounded-xl border border-white/12 bg-white/[0.04] p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>Unidades a partir de</span>
                {empreendimento.estimatedAppreciation ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-[#C8B08A] tabular-nums">
                    <TrendingUp className="h-3.5 w-3.5" />
                    +{empreendimento.estimatedAppreciation}% est./ano
                  </span>
                ) : null}
              </div>
              <div className="font-mono text-2xl md:text-3xl font-semibold text-white tabular-nums">
                {formatBRL(empreendimento.startingPrice)}
              </div>
              <div className="text-xs text-white/65 tabular-nums">
                Previsão de entrega: <span className="text-[#DFC79F]">{empreendimento.deliveryForecast}</span>
              </div>
            </div>
          </div>

          {/* 4-Cell Development KPI Strip */}
          <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <Building2 className="h-3.5 w-3.5 text-[#C8B08A]" />
                <span>Estágio da Obra</span>
              </div>
              <div className="mt-1 text-base font-semibold">{empreendimento.stage}</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <Calendar className="h-3.5 w-3.5 text-[#C8B08A]" />
                <span>Previsão de Entrega</span>
              </div>
              <div className="mt-1 font-mono text-base font-semibold tabular-nums">
                {empreendimento.deliveryForecast}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <Images className="h-3.5 w-3.5 text-[#C8B08A]" />
                <span>Acervo Visual</span>
              </div>
              <div className="mt-1 font-mono text-base font-semibold tabular-nums">
                {empGallery.length} foto(s)
                {empVideos.length > 0 ? ` · ${empVideos.length} vídeo(s)` : ''}
              </div>
            </div>
            <div>
              <div className="text-xs text-white/60">Unidades no Catálogo</div>
              <div className="mt-1 font-mono text-base font-semibold text-[#DFC79F] tabular-nums">
                {linkedProperties.length} unidade(s) vinculadas
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-12 space-y-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-8">
            {/* Main Interactive Photo Showcase */}
            <div className="space-y-3">
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-[#E5E2DC] bg-[#111827]">
                <ResilientImage
                  src={activeEmpPhoto}
                  alt={empreendimento.name}
                  className="h-full w-full object-cover"
                />

                {empGallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Foto anterior do empreendimento"
                      onClick={() =>
                        setActivePhotoIdx(
                          (prev) => (prev - 1 + empGallery.length) % empGallery.length
                        )
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-[#0C1117]/70 text-white backdrop-blur-sm hover:bg-[#0C1117] cursor-pointer"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Próxima foto do empreendimento"
                      onClick={() => setActivePhotoIdx((prev) => (prev + 1) % empGallery.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-[#0C1117]/70 text-white backdrop-blur-sm hover:bg-[#0C1117] cursor-pointer"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {empGallery.length > 0 && (
                  <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between">
                    <span className="rounded-md bg-[#0C1117]/75 px-2.5 py-1 font-mono text-xs text-white backdrop-blur-sm tabular-nums">
                      {String(safePhotoIdx + 1).padStart(2, '0')} /{' '}
                      {String(empGallery.length).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setLightboxOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-[#0C1117]/75 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-[#0C1117] cursor-pointer"
                    >
                      <Expand className="h-3.5 w-3.5 text-[#DFC79F]" />
                      <span>Ampliar galeria</span>
                    </button>
                  </div>
                )}
              </div>

              {empGallery.length > 1 && (
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
                  {empGallery.map((img, i) => (
                    <button
                      key={`${img}-${i}`}
                      type="button"
                      onClick={() => setActivePhotoIdx(i)}
                      className={`aspect-[16/10] overflow-hidden rounded-lg border transition-all cursor-pointer ${
                        i === safePhotoIdx
                          ? 'border-[#A37E4D] ring-2 ring-[#A37E4D]'
                          : 'border-[#E5E2DC] opacity-75 hover:opacity-100'
                      }`}
                    >
                      <ResilientImage
                        src={img}
                        alt={`${empreendimento.name} — foto ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {empVideos.length > 0 && (
              <div className="space-y-4 rounded-2xl border border-[#1E2733] bg-[#090D12] p-6 text-white">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4 text-[#C8B08A]" />
                    <h2 className="font-display text-xl font-semibold">
                      Filmes &amp; Tour do Empreendimento
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-white/60 tabular-nums">
                    {empVideos.length} vídeo(s)
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {empVideos.map((vUrl, idx) => (
                    <video
                      key={`${vUrl}-${idx}`}
                      src={vUrl}
                      controls
                      playsInline
                      preload="metadata"
                      className="aspect-video w-full rounded-xl border border-white/10 bg-black object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Conception & Infrastructure */}
            <div className="rounded-2xl border border-[#E5E2DC] bg-white p-7 md:p-8 space-y-7">
              <div className="space-y-3">
                <p className="text-xs font-semibold tracking-wider text-[#8E6C40]">
                  Conceito Arquitetônico &amp; Localização
                </p>
                <h2 className="font-display text-2xl md:text-3xl font-semibold text-[#0C1117]">
                  Sobre o {empreendimento.name}
                </h2>
                <div className="space-y-4 text-sm md:text-base leading-relaxed text-[#374151] max-w-[68ch]">
                  {(empreendimento.description || empreendimento.summary || '')
                    .split('\n')
                    .filter(Boolean)
                    .map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                </div>
              </div>

              <div className="border-t border-[#F0EDE6] pt-6 space-y-4">
                <h3 className="font-display text-xl font-semibold text-[#0C1117]">
                  Especificações do Projeto
                </h3>
                <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 text-sm">
                  {[
                    { label: 'Incorporadora', value: empreendimento.developer },
                    { label: 'Cidade', value: cityLabel },
                    { label: 'Localização', value: empreendimento.neighborhood || cityLabel },
                    { label: 'Estágio atual', value: empreendimento.stage },
                    { label: 'Previsão de entrega', value: empreendimento.deliveryForecast },
                    { label: 'Ticket inicial', value: formatBRL(empreendimento.startingPrice) },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between border-b border-[#F3F0EA] py-2.5 gap-4"
                    >
                      <span className="text-[#6B7280]">{row.label}</span>
                      <span className="font-medium text-[#0C1117] text-right tabular-nums">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {empreendimento.amenities && empreendimento.amenities.length > 0 && (
                <div className="border-t border-[#F0EDE6] pt-6 space-y-4">
                  <h3 className="font-display text-xl font-semibold text-[#0C1117]">
                    Infraestrutura, Lazer &amp; Áreas Comuns
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm text-[#374151]">
                    {empreendimento.amenities.map((a, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 rounded-xl border border-[#EFECE6] bg-[#FAF9F6] p-3.5"
                      >
                        <span className="font-mono text-xs font-semibold text-[#A37E4D] mt-0.5 tabular-nums">
                          {String(idx + 1).padStart(2, '0')}.
                        </span>
                        <span className="leading-relaxed">{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Development Appreciation Simulator */}
            <SpotlightSurface className="rounded-2xl border border-[#E5E2DC] bg-white p-7 md:p-8">
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#8E6C40]">
                    <Calculator className="h-4 w-4" />
                    <span>Projeção de Valorização do Empreendimento</span>
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-[#0C1117]">
                    Estimativa de evolução patrimonial até e após a entrega
                  </h3>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#374151]">Horizonte considerado</span>
                    <span className="font-mono font-semibold text-[#0C1117] tabular-nums">
                      {simHorizon} {simHorizon === 1 ? 'ano' : 'anos'} (taxa est. {estRate}% a.a.)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={6}
                    step={1}
                    value={simHorizon}
                    onChange={(e) => setSimHorizon(Number(e.target.value))}
                    className="w-full accent-[#A37E4D]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-[#F0EDE6] pt-4">
                  <div className="rounded-xl border border-[#EFECE6] bg-[#FAF9F6] p-4">
                    <div className="text-[11px] text-[#6B7280]">Referência inicial</div>
                    <div className="mt-1 font-mono text-lg font-semibold text-[#0C1117] tabular-nums">
                      {formatBRL(empreendimento.startingPrice)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#EFECE6] bg-[#FAF9F6] p-4">
                    <div className="text-[11px] text-[#6B7280]">Valor est. em {simHorizon} anos</div>
                    <div className="mt-1 font-mono text-lg font-semibold text-[#0C1117] tabular-nums">
                      {formatBRL(projectedUnitValue)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#A37E4D]/30 bg-[#090D12] p-4 text-white">
                    <div className="text-[11px] text-[#C8B08A]">Valorização estimada</div>
                    <div className="mt-1 font-mono text-lg font-semibold text-[#DFC79F] tabular-nums">
                      +{formatBRL(projectedGain)}
                    </div>
                  </div>
                </div>
              </div>
            </SpotlightSurface>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-24 rounded-2xl border border-[#E5E2DC] bg-white p-6 md:p-7 space-y-5 shadow-[0_20px_40px_-24px_rgba(12,17,23,0.12)]">
              <div className="flex items-center gap-3.5 border-b border-[#F0EDE6] pb-4">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#E5E2DC] bg-[#111827]">
                  <ResilientImage
                    src={settings.aboutImage || MATHEUS_PORTRAIT_IMAGE}
                    alt={settings.brandName}
                    className="h-full w-full object-cover object-top"
                  />
                </div>
                <div className="min-w-0">
                  <div className="font-display text-base font-semibold text-[#0C1117] truncate">
                    {settings.brandName}
                  </div>
                  <div className="text-xs text-[#6B7280] truncate">
                    Material Privado · {empreendimento.developer}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold tracking-wider text-[#8E6C40]">
                  A partir de {formatBRL(empreendimento.startingPrice)}
                </p>
                <h2 className="font-display text-2xl font-semibold text-[#0C1117]">
                  Solicitar Book, Plantas e Fluxo Direto
                </h2>
                <p className="text-xs leading-relaxed text-[#6B7280]">
                  Receba o espelho de unidades disponíveis, opções de parcelamento com a incorporadora e projeção de retorno.
                </p>
              </div>
              <LeadCaptureForm
                origin="Site"
                propertyId={empreendimento.id}
                propertyTitle={empreendimento.name}
                defaultProfile="Investir"
                ctaLabel="Receber Book e Tabela Completa"
                settings={settings}
              />
            </div>
          </div>
        </div>

        {/* Linked Units Section */}
        <div className="space-y-6 border-t border-[#E5E2DC] pt-12">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#8E6C40]">
                Espelho de Unidades
              </p>
              <h2 className="font-display text-2xl md:text-3xl font-semibold text-[#0C1117]">
                Unidades disponíveis neste empreendimento
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/comprar')}
              className="text-sm font-semibold text-[#0C1117] hover:text-[#8E6C40] cursor-pointer"
            >
              Ver todo o catálogo →
            </button>
          </div>

          {linkedProperties.length > 0 ? (
            <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
              {linkedProperties.map((prop) => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  empreendimentoName={empreendimento.name}
                  onOpen={(slug) => navigate(`/imovel/${slug}`)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#E5E2DC] bg-white p-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h3 className="font-display text-xl font-semibold text-[#0C1117]">
                  Tabela completa disponível sob atendimento privado
                </h3>
                <p className="text-sm text-[#4B5563]">
                  Consulte andares altos, unidades frente mar e condições diretas diretamente com {settings.brandName}.
                </p>
              </div>
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0C1117] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#1E293B] whitespace-nowrap shrink-0"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Consultar disponibilidade</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AboutPage({
  settings,
  navigate,
}: {
  settings: SiteSettings;
  navigate: (path: string) => void;
}) {
  return (
    <div className="bg-[#FAF9F6] py-16">
      <div className="mx-auto max-w-6xl px-6 space-y-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-stretch">
          <div className="lg:col-span-5">
            <div className="aspect-[654/800] w-full overflow-hidden rounded-xl border border-[#E5E2DC] bg-[#111827]">
              <ResilientImage
                src={settings.aboutImage || MATHEUS_PORTRAIT_IMAGE}
                alt={settings.aboutTitle || 'Matheus Gonçalves'}
                className="h-full w-full object-contain object-top"
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6 flex flex-col justify-center">
            <p className="text-xs font-semibold tracking-wider text-[#8E6C40]">
              {settings.aboutKicker || 'Sobre Matheus Gonçalves'}
            </p>
            <h1 className="font-display text-4xl font-semibold text-[#0C1117] [text-wrap:balance]">
              {settings.aboutTitle || 'Propósito, ética e lucratividade na construção do patrimônio familiar'}
            </h1>
            <p className="text-sm font-medium text-[#6B7280]">
              {settings.aboutSubtitle || 'Pai do Mathias e do Martin · Sócio · Balneário Camboriú e Praia Brava'} · {settings.instagramHandle}
            </p>
            <div className="space-y-4 text-base leading-relaxed text-[#374151]">
              <p>{settings.aboutBio1}</p>
              <p>{settings.aboutBio2}</p>
            </div>

            <div className="rounded-xl border border-[#E5E2DC] bg-white p-5 flex items-start gap-4">
              <Award className="h-6 w-6 shrink-0 text-[#A37E4D] mt-0.5" />
              <div className="space-y-1">
                <div className="text-sm font-semibold text-[#0C1117]">
                  {settings.awardTitle || 'Real Estate Awards — Top 9 Região Sul'}
                </div>
                <p className="text-sm text-[#4B5563]">
                  {settings.awardDescription}
                </p>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => navigate('/contato')}
                className="rounded-lg bg-[#0C1117] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1E293B] cursor-pointer"
              >
                Agendar conversa com {settings.brandName}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContactPage({ settings }: { settings: SiteSettings }) {
  return (
    <div className="bg-[#FAF9F6] py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-6">
            <p className="text-xs font-semibold tracking-wider text-[#8E6C40]">
              Atendimento Consultivo
            </p>
            <h1 className="font-display text-4xl font-semibold text-[#0C1117] [text-wrap:balance]">
              Vamos planejar seu próximo passo em BC ou Praia Brava
            </h1>
            <p className="text-base leading-relaxed text-[#4B5563]">
              Preencha seus critérios para agendar uma visita presencial, videochamada ou receber um
              estudo comparativo de rentabilidade.
            </p>

            <div className="rounded-xl border border-[#E5E2DC] bg-white p-6 space-y-3 text-sm text-[#374151]">
              <div>
                <span className="text-xs text-[#6B7280] block">Instagram Oficial</span>
                <span className="font-medium text-[#0C1117]">{settings.instagramHandle}</span>
              </div>
              {settings.creci && (
                <div>
                  <span className="text-xs text-[#6B7280] block">Registro Profissional</span>
                  <span className="font-medium text-[#0C1117]">CRECI {settings.creci}</span>
                </div>
              )}
              {settings.phone && (
                <div>
                  <span className="text-xs text-[#6B7280] block">Telefone / WhatsApp</span>
                  <span className="font-medium text-[#0C1117]">{settings.phone}</span>
                </div>
              )}
              {settings.email && (
                <div>
                  <span className="text-xs text-[#6B7280] block">E-mail</span>
                  <span className="font-medium text-[#0C1117]">{settings.email}</span>
                </div>
              )}
              {settings.address && (
                <div>
                  <span className="text-xs text-[#6B7280] block">Escritório</span>
                  <span className="font-medium text-[#0C1117]">{settings.address}</span>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl border border-[#E5E2DC] bg-white p-8">
            <LeadCaptureForm origin="Site" settings={settings} />
          </div>
        </div>
      </div>
    </div>
  );
}
