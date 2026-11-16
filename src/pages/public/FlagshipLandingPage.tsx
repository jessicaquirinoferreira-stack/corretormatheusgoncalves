import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, CheckCircle2, ShieldCheck, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { trackAnalyticsEvent } from '../../services/firestoreService';
import type { Empreendimento, LandingPage, Property, SiteSettings } from '../../types';
import { captureUtmParams, formatBRL } from '../../utils/formatters';
import {
  ArchitecturalReveal,
  BlurHeadlineReveal,
  ParallaxHeroBackdrop,
  SpotlightSurface,
} from '../../components/motion/MotionPrimitives';
import { LeadCaptureForm } from '../../components/public/LeadCaptureForm';

const TYPOLOGIES = [
  {
    id: 'type-a',
    label: 'Vista Mar · 198 m²',
    suites: '3 suítes plenas',
    parking: '3 vagas privativas',
    basePrice: 3850000,
    summary:
      'Planta com living integrado à varanda gourmet em vidro piso-teto, orientação solar privilegiada e alta demanda para locação anual ou temporada.',
  },
  {
    id: 'type-b',
    label: 'Reserva Norte · 245 m²',
    suites: '4 suítes · dependência',
    parking: '3 vagas + hobby box',
    basePrice: 4890000,
    summary:
      'Equilíbrio ideal entre amplitude familiar e liquidez patrimonial, com vista definitiva para a mata atlântica e a enseada da Praia Brava.',
  },
  {
    id: 'type-c',
    label: 'Sky Penthouse · 310 m²',
    suites: '4 suítes master',
    parking: '4 vagas exclusivas',
    basePrice: 6950000,
    summary:
      'Terraço descoberto com piscina aquecida privativa, pé-direito ampliado e privacidade absoluta de uma unidade única no pavimento.',
  },
];

export function FlagshipLandingPage({
  landingPage,
  linkedProperty,
  linkedEmpreendimento,
  settings,
  navigate,
}: {
  landingPage?: LandingPage;
  linkedProperty?: Property;
  linkedEmpreendimento?: Empreendimento;
  settings: SiteSettings;
  navigate: (path: string) => void;
}) {
  const [selectedTypology, setSelectedTypology] = useState(TYPOLOGIES[0].id);
  const [entryPercent, setEntryPercent] = useState(20);
  const [annualAppreciation, setAnnualAppreciation] = useState(20);

  useEffect(() => {
    if (landingPage?.id) {
      const utm = captureUtmParams();
      trackAnalyticsEvent({
        eventType: 'landing_view',
        path: `/lp/${landingPage.slug}`,
        entityId: landingPage.id,
        utmSource: utm.utmSource,
      });
    }
  }, [landingPage?.id, landingPage?.slug]);

  const activeTypology = useMemo(
    () => TYPOLOGIES.find((t) => t.id === selectedTypology) || TYPOLOGIES[0],
    [selectedTypology]
  );

  const simMetrics = useMemo(() => {
    const base = activeTypology.basePrice;
    const entryCash = Math.round(base * (entryPercent / 100));
    const projected3Years = Math.round(base * Math.pow(1 + annualAppreciation / 100, 3));
    const grossGain = projected3Years - base;
    const roiOnEntry = entryCash > 0 ? Math.round((grossGain / entryCash) * 100) : 0;
    return { base, entryCash, projected3Years, grossGain, roiOnEntry };
  }, [activeTypology, entryPercent, annualAppreciation]);

  if (!landingPage) {
    return (
      <div className="min-h-screen bg-[#090D12] text-white flex flex-col items-center justify-center px-6 text-center space-y-4">
        <h1 className="font-display text-3xl font-semibold">Landing page não encontrada</h1>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="rounded-lg bg-[#A37E4D] px-5 py-2.5 text-sm font-semibold text-white cursor-pointer"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090D12] text-[#F3F4F6]">
      {/* Floating minimal top nav */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#090D12]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-xs font-medium text-white/75 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{settings.brandName}</span>
          </button>

          <a
            href="#dossier-form"
            className="relative overflow-hidden rounded-lg bg-[#A37E4D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#8E6C40] transition-colors whitespace-nowrap shrink-0"
          >
            <span className="relative z-10">{landingPage.ctaLabel}</span>
            <span
              aria-hidden="true"
              className="animate-shimmer-line pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          </a>
        </div>
      </div>

      {/* Flagship Hero with Parallax + Spotlight */}
      <section className="relative min-h-[82vh] flex items-end overflow-hidden">
        <ParallaxHeroBackdrop src={landingPage.heroImage} alt={landingPage.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090D12] via-[#090D12]/65 to-[#090D12]/25" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-16 md:py-24">
          <div className="max-w-3xl space-y-6">
            <div className="text-xs font-semibold tracking-widest text-[#C8B08A]">
              {landingPage.kicker || 'Edição Privada · Litoral Norte SC'}
            </div>

            <BlurHeadlineReveal
              text={landingPage.title}
              className="font-display text-[clamp(2.35rem,4.5vw,4rem)] font-semibold leading-[1.06] text-white [text-wrap:balance]"
            />

            <p className="max-w-2xl text-base md:text-lg leading-relaxed text-white/80">
              {landingPage.subtitle}
            </p>

            {landingPage.metrics && landingPage.metrics.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-xs md:text-sm text-[#E5E7EB]">
                {landingPage.metrics.map((m, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span aria-hidden="true" className="text-[#A37E4D]">·</span>}
                    <span className="tabular-nums">{m}</span>
                  </React.Fragment>
                ))}
              </div>
            )}

            <div className="pt-3 flex flex-wrap items-center gap-4">
              <a
                href="#dossier-form"
                className="inline-flex items-center gap-2 rounded-lg bg-[#A37E4D] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#8E6C40] transition-colors"
              >
                <span>{landingPage.ctaLabel}</span>
                <ArrowUpRight className="h-4 w-4" />
              </a>

              {linkedEmpreendimento && (
                <button
                  type="button"
                  onClick={() => navigate(`/empreendimento/${linkedEmpreendimento.slug}`)}
                  className="text-sm font-medium text-white/80 underline underline-offset-8 hover:text-white cursor-pointer"
                >
                  Ver ficha técnica completa
                </button>
              )}
              {!linkedEmpreendimento && linkedProperty && (
                <button
                  type="button"
                  onClick={() => navigate(`/imovel/${linkedProperty.slug}`)}
                  className="text-sm font-medium text-white/80 underline underline-offset-8 hover:text-white cursor-pointer"
                >
                  Ver ficha do imóvel
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Architectural Highlights */}
      {landingPage.highlights && landingPage.highlights.length > 0 && (
        <section className="border-y border-white/10 bg-[#0D131B] py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {landingPage.highlights.map((item, idx) => (
                <ArchitecturalReveal key={idx} delay={idx * 0.07}>
                  <SpotlightSurface className="h-full rounded-xl border border-white/10 bg-white/[0.03] p-6">
                    <div className="font-mono text-xs text-[#C8B08A] mb-3 tabular-nums">
                      0{idx + 1}.
                    </div>
                    <p className="text-sm leading-relaxed text-white/90">{item}</p>
                  </SpotlightSurface>
                </ArchitecturalReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Interactive Typology & Profitability Simulator (Flagship Motion Section) */}
      {landingPage.isFlagshipPremium && (
        <section className="mx-auto max-w-7xl px-6 py-20 space-y-12">
          <ArchitecturalReveal>
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold tracking-wider text-[#C8B08A]">
                Estudo de Tipologia &amp; Alavancagem
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-semibold text-white [text-wrap:balance]">
                Simule seu posicionamento e retorno patrimonial
              </h2>
            </div>
          </ArchitecturalReveal>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left: Interactive Typology Tabs */}
            <div className="lg:col-span-6 space-y-6">
              <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1.5">
                {TYPOLOGIES.map((t) => {
                  const isActive = t.id === selectedTypology;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTypology(t.id)}
                      className={`relative flex-1 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                        isActive ? 'text-[#090D12]' : 'text-white/75 hover:text-white'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="lp-typology-pill"
                          transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                          className="absolute inset-0 rounded-lg bg-[#C8B08A]"
                        />
                      )}
                      <span className="relative z-10">{t.label}</span>
                    </button>
                  );
                })}
              </div>

              <SpotlightSurface className="rounded-xl border border-white/10 bg-white/[0.03] p-7 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <div className="text-xs text-white/60">Tipologia selecionada</div>
                    <h3 className="font-display text-2xl font-semibold text-white">
                      {activeTypology.label}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/60">Valor referencial</div>
                    <div className="font-mono text-xl font-semibold text-[#C8B08A] tabular-nums">
                      {formatBRL(activeTypology.basePrice)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-white/80">
                  <span>{activeTypology.suites}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeTypology.parking}</span>
                </div>

                <p className="text-sm leading-relaxed text-white/75">{activeTypology.summary}</p>
              </SpotlightSurface>
            </div>

            {/* Right: Live Financial Simulation */}
            <div className="lg:col-span-6 rounded-xl border border-white/10 bg-[#0D131B] p-7 space-y-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#C8B08A]">
                <TrendingUp className="h-4 w-4" />
                <span>Simulação de Alavancagem na Planta (36 meses)</span>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/75">Entrada planejada</span>
                    <span className="font-mono text-[#C8B08A] tabular-nums">{entryPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={40}
                    step={5}
                    value={entryPercent}
                    onChange={(e) => setEntryPercent(Number(e.target.value))}
                    className="w-full accent-[#A37E4D]"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/75">Valorização est./ano</span>
                    <span className="font-mono text-[#C8B08A] tabular-nums">{annualAppreciation}%</span>
                  </div>
                  <input
                    type="range"
                    min={12}
                    max={28}
                    step={1}
                    value={annualAppreciation}
                    onChange={(e) => setAnnualAppreciation(Number(e.target.value))}
                    className="w-full accent-[#A37E4D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 border-t border-white/10 pt-5 sm:grid-cols-3">
                <div>
                  <div className="text-xs text-white/60">Aporte de entrada</div>
                  <div className="font-mono text-lg font-semibold text-white tabular-nums mt-1">
                    {formatBRL(simMetrics.entryCash)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/60">Valor projetado (3 anos)</div>
                  <div className="font-mono text-lg font-semibold text-[#C8B08A] tabular-nums mt-1">
                    {formatBRL(simMetrics.projected3Years)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/60">Potencial s/ entrada</div>
                  <div className="font-mono text-lg font-semibold text-emerald-400 tabular-nums mt-1">
                    +{simMetrics.roiOnEntry}%
                  </div>
                </div>
              </div>

              <p className="text-xs text-white/50">
                *Projeção estimada para análise inicial. Receba a tabela oficial da construtora e fluxo detalhado abaixo.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Conversion Form Section */}
      <section id="dossier-form" className="border-t border-white/10 bg-[#0D131B] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5 space-y-5">
              <p className="text-xs font-semibold tracking-wider text-[#C8B08A]">
                Acesso Exclusivo
              </p>
              <h2 className="font-display text-3xl font-semibold text-white [text-wrap:balance]">
                Receba plantas, memorial e condições de investimento
              </h2>
              <p className="text-sm leading-relaxed text-white/75">
                Atendimento direto com Matheus Gonçalves, especialista em imóveis e lucratividade em
                Balneário Camboriú e Praia Brava.
              </p>
              <div className="space-y-3 pt-2 text-xs text-white/75">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#C8B08A]" />
                  <span>Tabela atualizada com unidades disponíveis</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-[#C8B08A]" />
                  <span>Seus dados protegidos em conformidade com a LGPD</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/[0.03] p-7">
              <LeadCaptureForm
                origin="Landing Page"
                propertyId={landingPage.targetEntityId || landingPage.id}
                propertyTitle={landingPage.title}
                defaultProfile="Investir"
                ctaLabel={landingPage.ctaLabel}
                dark={true}
                settings={settings}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
