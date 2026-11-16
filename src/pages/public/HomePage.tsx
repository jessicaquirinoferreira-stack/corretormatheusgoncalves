import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, Award, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import {
  DEFAULT_SITE_SETTINGS,
  HERO_IMAGE,
  MATHEUS_PORTRAIT_IMAGE,
} from '../../data/seedData';
import type { Empreendimento, Property, SiteSettings } from '../../types';
import { isVideoUrl } from '../../utils/mediaProcessor';
import {
  ArchitecturalMarquee,
  ArchitecturalReveal,
  BeamDivider,
  BlurHeadlineReveal,
  HeroSlideshowBackdrop,
  type HeroSlideItem,
  ResilientImage,
  SpotlightSurface,
} from '../../components/motion/MotionPrimitives';
import { AiDreamMatcher } from '../../components/public/AiDreamMatcher';
import { EmpreendimentoCard } from '../../components/public/EmpreendimentoCard';
import { LeadCaptureForm } from '../../components/public/LeadCaptureForm';
import { PropertyCard } from '../../components/public/PropertyCard';

export interface HomePageSearchFilter {
  purpose: 'comprar' | 'investir';
  city: string;
  type: string;
  maxPrice: string;
}

export function HomePage({
  settings,
  properties,
  empreendimentos,
  navigate,
  onQuickSearch,
}: {
  settings: SiteSettings;
  properties: Property[];
  empreendimentos: Empreendimento[];
  navigate: (path: string) => void;
  onQuickSearch: (filter: HomePageSearchFilter) => void;
}) {
  const [purpose, setPurpose] = useState<'comprar' | 'investir'>('comprar');
  const [city, setCity] = useState('Todas');
  const [type, setType] = useState('Todos');
  const [maxPrice, setMaxPrice] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [aiProfileNotes, setAiProfileNotes] = useState('');

  const heroSlides = useMemo<HeroSlideItem[]>(() => {
    const items: HeroSlideItem[] = [];
    const seenUrls = new Set<string>();

    const pushSlide = (slide: HeroSlideItem) => {
      const clean = (slide.src || '').trim();
      if (!clean || isVideoUrl(clean) || seenUrls.has(clean)) return;
      seenUrls.add(clean);
      items.push({ ...slide, src: clean });
    };

    const publicEmps = empreendimentos.filter((e) => e.isPublic !== false);
    const publicProps = properties.filter((p) => p.isPublic !== false);

    // Interleave Empreendimento covers and Property covers first for immediate visual variety
    const maxCovers = Math.max(publicEmps.length, publicProps.length);
    for (let i = 0; i < maxCovers; i++) {
      const emp = publicEmps[i];
      if (emp?.coverImage) {
        pushSlide({
          id: `emp-cover-${emp.id}`,
          src: emp.coverImage,
          alt: `${emp.name} — ${emp.neighborhood}`,
          label: emp.name,
          category: emp.city === 'Balneario Camboriu' ? 'Empreendimento · Balneário Camboriú' : 'Empreendimento · Praia Brava',
          route: `/empreendimento/${emp.slug}`,
        });
      }
      const prop = publicProps[i];
      if (prop?.coverImage) {
        pushSlide({
          id: `prop-cover-${prop.id}`,
          src: prop.coverImage,
          alt: `${prop.title} — ${prop.neighborhood}`,
          label: prop.title,
          category: prop.city === 'Balneario Camboriu' ? 'Imóvel · Balneário Camboriú' : 'Imóvel · Praia Brava',
          route: `/imovel/${prop.slug}`,
        });
      }
    }

    // Append secondary gallery photos from Empreendimentos & Imóveis
    publicEmps.forEach((emp) => {
      (emp.gallery || []).forEach((imgUrl, idx) => {
        pushSlide({
          id: `emp-gal-${emp.id}-${idx}`,
          src: imgUrl,
          alt: `${emp.name} — Galeria`,
          label: emp.name,
          category: emp.city === 'Balneario Camboriu' ? 'Empreendimento · Balneário Camboriú' : 'Empreendimento · Praia Brava',
          route: `/empreendimento/${emp.slug}`,
        });
      });
    });

    publicProps.forEach((prop) => {
      (prop.gallery || []).forEach((imgUrl, idx) => {
        pushSlide({
          id: `prop-gal-${prop.id}-${idx}`,
          src: imgUrl,
          alt: `${prop.title} — Galeria`,
          label: prop.title,
          category: prop.city === 'Balneario Camboriu' ? 'Imóvel · Balneário Camboriú' : 'Imóvel · Praia Brava',
          route: `/imovel/${prop.slug}`,
        });
      });
    });

    if (items.length === 0) {
      pushSlide({
        id: 'hero-default',
        src: settings.heroImage || HERO_IMAGE,
        alt: 'Skyline de Balneário Camboriú e litoral de Santa Catarina',
        label: 'Balneário Camboriú & Praia Brava',
        category: 'Portfólio Patrimonial',
        route: '/comprar',
      });
    }

    return items;
  }, [empreendimentos, properties, settings.heroImage]);

  useEffect(() => {
    if (heroSlides.length <= 1 || heroPaused) return;
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6200);
    return () => window.clearInterval(timer);
  }, [heroSlides.length, heroPaused]);

  const currentSlide = heroSlides[activeSlide % Math.max(1, heroSlides.length)];

  const featuredProperties = properties.filter((p) => p.featured).slice(0, 3);
  const displayProperties = featuredProperties.length > 0 ? featuredProperties : properties.slice(0, 3);
  const featuredEmps = empreendimentos.filter((e) => e.featured).slice(0, 2);

  const differentials =
    settings.differentials && settings.differentials.length > 0
      ? settings.differentials
      : DEFAULT_SITE_SETTINGS.differentials!;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onQuickSearch({ purpose, city, type, maxPrice });
  };

  const handleSendAiProfile = (summaryText: string) => {
    setAiProfileNotes(summaryText);
    document.getElementById('lead-capture-home')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-[#FAF9F6]">
      {/* 1. HERO PREMIUM ARCHITECTURAL WITH LIVE PROPERTY & EMPREENDIMENTO SLIDESHOW */}
      <section
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
        className="relative min-h-[84vh] flex items-end bg-[#090D12] text-white overflow-hidden"
      >
        <HeroSlideshowBackdrop slides={heroSlides} activeIndex={activeSlide} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090D12] via-[#090D12]/65 to-[#090D12]/30" />

        {/* Subtle ambient champagne light glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 right-1/4 h-96 w-96 rounded-full bg-[#A37E4D]/15 blur-3xl"
        />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-16 md:py-24">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8 space-y-6">
              <div className="flex flex-wrap items-center gap-3 text-xs tracking-widest uppercase text-[#C8B08A]">
                <span>Balneário Camboriú</span>
                <span aria-hidden="true">·</span>
                <span>Praia Brava</span>
                <span aria-hidden="true">·</span>
                <span>{settings.instagramHandle || '@matheus_goncalves_mg'}</span>
              </div>

              <BlurHeadlineReveal
                text={settings.headline}
                className="font-display text-[clamp(2.35rem,4.5vw,4rem)] font-semibold leading-[1.06] tracking-tight text-white [text-wrap:balance]"
              />

              <p className="max-w-2xl text-base md:text-lg leading-relaxed text-white/80">
                {settings.subheadline}
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/comprar')}
                  className="relative overflow-hidden inline-flex items-center gap-2.5 rounded-lg bg-[#A37E4D] px-6 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#8E6C40] cursor-pointer"
                >
                  <span className="relative z-10">
                    {settings.heroCtaPrimary || 'Explorar Portfólio'}
                  </span>
                  <ArrowRight className="relative z-10 h-4 w-4" />
                  <span
                    aria-hidden="true"
                    className="animate-shimmer-line pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/lp/brava-ocean-reserve')}
                  className="inline-flex items-center gap-2 text-sm font-medium text-white/90 underline decoration-[#A37E4D]/70 underline-offset-8 hover:text-white transition-colors cursor-pointer"
                >
                  <span>{settings.heroCtaSecondary || 'Coleção Privada Praia Brava'}</span>
                </button>
              </div>
            </div>

            {/* Glassmorphic Architectural Credential Anchor & Active Portfolio Slide Controls */}
            <div className="lg:col-span-4 space-y-4">
              {heroSlides.length > 0 && currentSlide && (
                <div className="rounded-xl border border-white/15 bg-[#090D12]/55 backdrop-blur-md p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-widest text-[#C8B08A]">
                    <span className="truncate">{currentSlide.category}</span>
                    {heroSlides.length > 1 && (
                      <span className="font-mono tabular-nums shrink-0 text-white/75">
                        {String((activeSlide % heroSlides.length) + 1).padStart(2, '0')} /{' '}
                        {String(heroSlides.length).padStart(2, '0')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    {currentSlide.route ? (
                      <button
                        type="button"
                        onClick={() => navigate(currentSlide.route!)}
                        className="group inline-flex min-w-0 items-center gap-1.5 text-left text-sm font-medium text-white hover:text-[#DFC79F] transition-colors cursor-pointer"
                      >
                        <span className="truncate">{currentSlide.label}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[#C8B08A] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </button>
                    ) : (
                      <span className="truncate text-sm font-medium text-white">
                        {currentSlide.label}
                      </span>
                    )}

                    {heroSlides.length > 1 && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          aria-label="Foto anterior do portfólio"
                          onClick={() =>
                            setActiveSlide(
                              (prev) => (prev - 1 + heroSlides.length) % heroSlides.length
                            )
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] text-white/85 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Próxima foto do portfólio"
                          onClick={() =>
                            setActiveSlide((prev) => (prev + 1) % heroSlides.length)
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] text-white/85 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {heroSlides.length > 1 && (
                    <div className="flex items-center gap-1 pt-0.5">
                      {heroSlides.slice(0, 12).map((slide, idx) => {
                        const isActive = idx === activeSlide % heroSlides.length;
                        return (
                          <button
                            key={slide.id}
                            type="button"
                            aria-label={`Ver ${slide.label}`}
                            onClick={() => setActiveSlide(idx)}
                            className={`h-[2px] flex-1 rounded-full transition-all duration-300 cursor-pointer ${
                              isActive
                                ? 'bg-[#C8B08A]'
                                : 'bg-white/20 hover:bg-white/45'
                            }`}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-white/15 bg-white/[0.06] backdrop-blur-md p-5 space-y-3">
                <div className="text-[11px] uppercase tracking-widest text-[#C8B08A]">
                  Reconhecimento Regional
                </div>
                <div className="font-display text-lg font-medium text-white leading-snug">
                  Real Estate Awards — Top 9 Corretores Destaque da Região Sul
                </div>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-white/70">
                  <span>Indicação @atrinca.realestate</span>
                  <span className="font-mono tabular-nums text-[#C8B08A]">~18 meses</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BUSCA RÁPIDA */}
      <section className="relative z-20 -mt-8 px-6">
        <div className="mx-auto max-w-6xl rounded-xl border border-[#E5E2DC] bg-white p-5 shadow-[0_18px_40px_-20px_rgba(12,17,23,0.12)]">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                Objetivo
              </label>
              <div className="grid grid-cols-2 rounded-lg bg-[#F5F3EE] p-1">
                <button
                  type="button"
                  onClick={() => setPurpose('comprar')}
                  className={`rounded-md py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    purpose === 'comprar' ? 'bg-white text-[#0C1117] shadow-xs' : 'text-[#6B7280]'
                  }`}
                >
                  Morar / Comprar
                </button>
                <button
                  type="button"
                  onClick={() => setPurpose('investir')}
                  className={`rounded-md py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    purpose === 'investir' ? 'bg-white text-[#0C1117] shadow-xs' : 'text-[#6B7280]'
                  }`}
                >
                  Investir
                </button>
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                Localização
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-[#D8D3CA] bg-white px-3 py-2.5 text-sm text-[#111827] focus:border-[#A37E4D] focus:outline-none"
              >
                <option value="Todas">BC &amp; Praia Brava</option>
                <option value="Balneario Camboriu">Balneário Camboriú</option>
                <option value="Praia Brava">Praia Brava</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                Tipologia
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border border-[#D8D3CA] bg-white px-3 py-2.5 text-sm text-[#111827] focus:border-[#A37E4D] focus:outline-none"
              >
                <option value="Todos">Todas</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Cobertura">Cobertura</option>
                <option value="Diferenciado">Diferenciado</option>
                <option value="Casa">Casa</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                Até (valor)
              </label>
              <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full rounded-lg border border-[#D8D3CA] bg-white px-3 py-2.5 text-sm text-[#111827] focus:border-[#A37E4D] focus:outline-none"
              >
                <option value="">Sem teto</option>
                <option value="4000000">Até R$ 4M</option>
                <option value="6000000">Até R$ 6M</option>
                <option value="10000000">Até R$ 10M</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0C1117] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E293B] cursor-pointer"
              >
                <Search className="h-4 w-4" />
                <span>Buscar</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 2B. BUSCA INTELIGENTE POR IA — DESCREVA O IMÓVEL QUE VOCÊ DESEJA */}
      <AiDreamMatcher
        properties={properties}
        empreendimentos={empreendimentos}
        navigate={navigate}
        onSendProfileToConsultant={handleSendAiProfile}
      />

      <div className="mt-12">
        <ArchitecturalMarquee
          items={[
            'Balneário Camboriú',
            'Praia Brava',
            'Assessoria Patrimonial',
            'Análise de Lucratividade',
            'Real Estate Awards Top 9 Sul',
            'Ética & Propósito Familiar',
          ]}
        />
      </div>

      {/* 3. IMÓVEIS EM DESTAQUE */}
      <section id="destaques" className="mx-auto max-w-7xl px-6 py-20">
        <ArchitecturalReveal>
          <div className="flex flex-col justify-between gap-4 border-b border-[#E5E2DC] pb-6 sm:flex-row sm:items-end">
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wider text-[#8E6C40]">
                Portfólio Selecionado
              </p>
              <h2 className="font-display text-3xl font-semibold text-[#0C1117] [text-wrap:balance]">
                Imóveis selecionados para morar e multiplicar patrimônio
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/comprar')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0C1117] hover:text-[#8E6C40] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Ver catálogo completo</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </ArchitecturalReveal>

        <div className="mt-10 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
          {displayProperties.map((prop, idx) => {
            const empName = prop.empreendimentoId
              ? empreendimentos.find((e) => e.id === prop.empreendimentoId)?.name
              : undefined;
            return (
              <ArchitecturalReveal key={prop.id} delay={idx * 0.08}>
                <PropertyCard
                  property={prop}
                  empreendimentoName={empName}
                  onOpen={(slug) => navigate(`/imovel/${slug}`)}
                />
              </ArchitecturalReveal>
            );
          })}
        </div>
      </section>

      <BeamDivider />

      {/* 4. EMPREENDIMENTOS EM DESTAQUE */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <ArchitecturalReveal>
            <div className="flex flex-col justify-between gap-4 pb-10 sm:flex-row sm:items-end">
              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-wider text-[#8E6C40]">
                  Empreendimentos Estratégicos
                </p>
                <h2 className="font-display text-3xl font-semibold text-[#0C1117]">
                  Lançamentos e prontos com alto potencial de liquidez
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/empreendimentos')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0C1117] hover:text-[#8E6C40] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Todos os empreendimentos</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </ArchitecturalReveal>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {featuredEmps.map((emp, idx) => {
              const linkedCount = properties.filter((p) => p.empreendimentoId === emp.id).length;
              return (
                <ArchitecturalReveal key={emp.id} delay={idx * 0.1}>
                  <EmpreendimentoCard
                    empreendimento={emp}
                    linkedUnitsCount={linkedCount}
                    onOpen={(slug) => navigate(`/empreendimento/${slug}`)}
                  />
                </ArchitecturalReveal>
              );
            })}
          </div>
        </div>
      </section>

      <BeamDivider />

      {/* 5. SOBRE MATHEUS GONÇALVES */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <div className="aspect-[654/800] w-full overflow-hidden rounded-xl border border-[#E5E2DC] bg-[#3E3E3E]">
              <ResilientImage
                src={
                  settings.aboutImage &&
                  !settings.aboutImage.includes('matheus_broker_portrait_')
                    ? settings.aboutImage
                    : MATHEUS_PORTRAIT_IMAGE
                }
                alt="Matheus Gonçalves — Especialista em imóveis e lucratividade"
                className="h-full w-full object-contain object-top"
              />
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <ArchitecturalReveal>
              <div className="space-y-3">
                <p className="text-xs font-semibold tracking-wider text-[#8E6C40]">
                  {settings.aboutKicker || 'Propósito, Ética e Patrimônio'}
                </p>
                <h2 className="font-display text-3xl md:text-4xl font-semibold text-[#0C1117] [text-wrap:balance]">
                  {settings.aboutTitle || 'Matheus Gonçalves'}
                </h2>
                <p className="text-sm text-[#6B7280]">
                  {settings.aboutSubtitle || 'Pai do Mathias e do Martin · Sócio · Balneário Camboriú e Praia Brava'}
                </p>
              </div>
            </ArchitecturalReveal>

            <ArchitecturalReveal delay={0.1}>
              <div className="space-y-4 text-base leading-relaxed text-[#374151]">
                <p>{settings.aboutBio1}</p>
                <p>{settings.aboutBio2}</p>
              </div>
            </ArchitecturalReveal>

            <ArchitecturalReveal delay={0.18}>
              <SpotlightSurface className="rounded-xl border border-[#E5E2DC] bg-white p-5">
                <div className="flex items-start gap-4">
                  <Award className="h-6 w-6 shrink-0 text-[#A37E4D] mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-[#0C1117]">
                      {settings.awardTitle || 'Indicado ao Real Estate Awards — Região Sul'}
                    </div>
                    <p className="text-sm text-[#4B5563]">
                      {settings.awardDescription}
                    </p>
                  </div>
                </div>
              </SpotlightSurface>
            </ArchitecturalReveal>

            <div>
              <button
                type="button"
                onClick={() => navigate('/sobre')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0C1117] underline decoration-[#A37E4D] underline-offset-8 hover:text-[#8E6C40] cursor-pointer"
              >
                <span>Conhecer trajetória completa</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DIFERENCIAIS */}
      <section className="relative overflow-hidden border-t border-white/10 bg-[#090D12] py-20 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-64 w-2/3 bg-gradient-to-b from-[#A37E4D]/12 to-transparent blur-3xl"
        />
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="max-w-2xl space-y-3 pb-12">
            <p className="text-xs font-semibold tracking-wider text-[#C8B08A]">
              Método de Assessoria
            </p>
            <h2 className="font-display text-3xl font-semibold text-white [text-wrap:balance]">
              {settings.differentialsTitle || 'Atendimento próximo e decisão guiada por fundamentos'}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 border-t border-white/10 pt-10">
            {differentials.map((item, i) => (
              <ArchitecturalReveal key={`${item.num}-${i}`} delay={i * 0.07}>
                <SpotlightSurface
                  className="h-full rounded-xl border border-white/10 bg-white/[0.02] p-6"
                  spotlightColor="rgba(200, 176, 138, 0.14)"
                >
                  <div className="space-y-3">
                    <div className="font-mono text-sm text-[#C8B08A] tabular-nums">{item.num}</div>
                    <h3 className="font-display text-xl font-semibold text-white">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-[#9CA3AF]">{item.desc}</p>
                  </div>
                </SpotlightSurface>
              </ArchitecturalReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CTA FINAL + CAPTURA DE LEAD */}
      <section id="lead-capture-home" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid grid-cols-1 gap-12 rounded-2xl border border-[#E5E2DC] bg-white p-8 md:p-12 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-4">
            <p className="text-xs font-semibold tracking-wider text-[#8E6C40]">
              Atendimento Direto
            </p>
            <h2 className="font-display text-3xl font-semibold text-[#0C1117] [text-wrap:balance]">
              {settings.ctaTitle || 'Receba uma seleção personalizada para o seu momento'}
            </h2>
            <p className="text-sm leading-relaxed text-[#4B5563]">
              {settings.ctaSubtitle}
            </p>
            <div className="pt-4 border-t border-[#F0EDE6] space-y-2 text-xs text-[#6B7280]">
              <p>Retorno consultivo direto com {settings.brandName}</p>
              <p>Oportunidades off-market e pré-lançamentos selecionados</p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <LeadCaptureForm
              origin="Site"
              settings={settings}
              prefilledNotes={aiProfileNotes}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
