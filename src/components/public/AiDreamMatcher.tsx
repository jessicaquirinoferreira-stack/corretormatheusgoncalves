import React, { useState } from 'react';
import { ArrowRight, ArrowUpRight, Compass, Loader2, RotateCcw, Search } from 'lucide-react';
import type { Empreendimento, Property } from '../../types';
import { formatBRL } from '../../utils/formatters';
import { ArchitecturalReveal, ResilientImage, SpotlightSurface } from '../motion/MotionPrimitives';
import { PropertyCard } from './PropertyCard';

interface AiPropertyMatch {
  propertyId: string;
  matchPercent: number;
  reason: string;
  highlights: string[];
}

interface AiEmpMatch {
  empreendimentoId: string;
  reason: string;
}

interface AiMatchResponse {
  summary: string;
  criteriaSummary: string[];
  matches: AiPropertyMatch[];
  empreendimentoMatches: AiEmpMatch[];
  engine?: string;
}

const EXAMPLE_DREAMS = [
  'Apartamento frente mar na Praia Brava com 3 ou 4 suítes até R$ 8 milhões',
  'Imóvel na planta em Balneário Camboriú com alta valorização anual para investir',
  'Cobertura ou diferenciado espaçoso para família com lazer completo e vista livre',
];

export function AiDreamMatcher({
  properties,
  empreendimentos,
  navigate,
  onSendProfileToConsultant,
}: {
  properties: Property[];
  empreendimentos: Empreendimento[];
  navigate: (path: string) => void;
  onSendProfileToConsultant: (summaryText: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiMatchResponse | null>(null);
  const [lastSearchedQuery, setLastSearchedQuery] = useState('');

  const runSearch = async (textToSearch: string) => {
    const trimmed = textToSearch.trim();
    if (trimmed.length < 3) {
      setError('Descreva com algumas palavras o estilo de imóvel, região ou objetivo que você busca.');
      return;
    }

    setError(null);
    setLoading(true);
    setLastSearchedQuery(trimmed);

    try {
      const res = await fetch('/api/ai/match-properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmed,
          properties,
          empreendimentos,
        }),
      });

      const data = (await res.json()) as AiMatchResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível consultar a busca inteligente.');
      }
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao analisar seu perfil. Tente novamente em instantes.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      runSearch(query);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    runSearch(example);
  };

  const handleReset = () => {
    setQuery('');
    setResult(null);
    setError(null);
    setLastSearchedQuery('');
  };

  const matchedProperties = (result?.matches || [])
    .map((m) => {
      const prop = properties.find((p) => p.id === m.propertyId);
      return prop ? { ...m, property: prop } : null;
    })
    .filter((item): item is AiPropertyMatch & { property: Property } => item !== null);

  const matchedEmps = (result?.empreendimentoMatches || [])
    .map((e) => {
      const emp = empreendimentos.find((item) => item.id === e.empreendimentoId);
      return emp ? { ...e, empreendimento: emp } : null;
    })
    .filter((item): item is AiEmpMatch & { empreendimento: Empreendimento } => item !== null);

  const handleTransferToConsultant = () => {
    const topTitles = matchedProperties
      .slice(0, 3)
      .map((item) => `${item.property.title} (${item.matchPercent}% compatível)`)
      .join(', ');
    const summaryText = `Busca Inteligente no site: "${lastSearchedQuery}"${
      topTitles ? `\nOpções mais próximas sugeridas: ${topTitles}` : ''
    }`;
    onSendProfileToConsultant(summaryText);
  };

  return (
    <section className="mx-auto mt-8 max-w-6xl px-6">
      <SpotlightSurface
        className="rounded-2xl border border-[#E5E2DC] bg-white p-6 md:p-8 shadow-[0_14px_34px_-24px_rgba(12,17,23,0.12)]"
        spotlightColor="rgba(163, 126, 77, 0.10)"
      >
        <div className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between border-b border-[#F0EDE6] pb-5">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#8E6C40]">
                <Compass className="h-3.5 w-3.5" />
                <span>Consultor Inteligente com IA</span>
              </div>
              <h2 className="font-display text-2xl md:text-[28px] font-semibold leading-tight text-[#0C1117] [text-wrap:balance]">
                Descreva o imóvel dos seus sonhos em suas próprias palavras
              </h2>
              <p className="text-sm text-[#4B5563] leading-relaxed">
                Conte como você imagina seu próximo patrimônio — vista, localização, metragem, estilo de vida ou potencial de rentabilidade — e nossa inteligência filtra os imóveis disponíveis mais próximos do seu pedido.
              </p>
            </div>

            {result && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 self-start md:self-auto rounded-lg border border-[#D8D3CA] px-3.5 py-2 text-xs font-medium text-[#374151] hover:border-[#0C1117] hover:text-[#0C1117] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Nova busca</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label htmlFor="ai-dream-input" className="sr-only">
                Descreva o imóvel que você deseja
              </label>
              <textarea
                id="ai-dream-input"
                rows={3}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ex.: Sonho com um apartamento frente mar ou vista definida na Praia Brava, com pelo menos 3 suítes, varanda gourmet para receber a família e bom potencial de valorização até R$ 7 milhões..."
                className="w-full resize-none rounded-xl border border-[#D8D3CA] bg-[#FAF9F6] px-4 py-3.5 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#A37E4D] focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-[#6B7280] mr-1">Sugestões rápidas:</span>
                {EXAMPLE_DREAMS.map((example) => (
                  <button
                    key={example}
                    type="button"
                    disabled={loading}
                    onClick={() => handleExampleClick(example)}
                    className="rounded-lg border border-[#E5E2DC] bg-[#FAF9F6] px-3 py-1.5 text-left text-xs text-[#374151] hover:border-[#A37E4D] hover:text-[#0C1117] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {example}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0C1117] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1E293B] disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analisando portfólio...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Encontrar imóveis compatíveis</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              {error}
            </div>
          )}

          {loading && !result && (
            <div className="grid grid-cols-1 gap-5 pt-2 md:grid-cols-3">
              {[0, 1, 2].map((idx) => (
                <div
                  key={idx}
                  className="h-64 animate-pulse rounded-xl border border-[#E5E2DC] bg-[#F5F3EE]"
                />
              ))}
            </div>
          )}

          {result && !loading && (
            <ArchitecturalReveal yOffset={12}>
              <div className="space-y-6 border-t border-[#E5E2DC] pt-6">
                <div className="flex flex-col gap-4 rounded-xl border border-[#E5E2DC] bg-[#FAF9F6] p-5 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#8E6C40]">
                      <span>Seleção mais próxima para o seu perfil</span>
                      {result.criteriaSummary && result.criteriaSummary.length > 0 && (
                        <>
                          <span aria-hidden="true" className="text-[#D8D3CA]">·</span>
                          <span className="font-normal text-[#4B5563]">
                            {result.criteriaSummary.join(' · ')}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-[#111827]">{result.summary}</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleTransferToConsultant}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A37E4D] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#8E6C40] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Falar com Matheus sobre esta seleção</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {matchedProperties.length > 0 ? (
                  <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
                    {matchedProperties.map((item) => (
                      <div key={item.property.id} className="flex flex-col space-y-3">
                        <PropertyCard
                          property={item.property}
                          onOpen={(slug) => navigate(`/imovel/${slug}`)}
                        />
                        <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F6] px-4 py-3 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#8E6C40] tabular-nums">
                              {item.matchPercent}% de compatibilidade
                            </span>
                            {item.highlights && item.highlights.length > 0 && (
                              <span className="text-[#6B7280] truncate max-w-[60%]">
                                {item.highlights.join(' · ')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs leading-relaxed text-[#374151]">{item.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#4B5563]">
                    Nenhum imóvel disponível encontrado com os critérios atuais. Envie seu pedido diretamente para que Matheus Gonçalves busque opções off-market.
                  </p>
                )}

                {matchedEmps.length > 0 && (
                  <div className="space-y-3 border-t border-[#F0EDE6] pt-5">
                    <div className="text-xs font-semibold tracking-wider text-[#8E6C40]">
                      Empreendimentos relacionados ao seu pedido
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {matchedEmps.map(({ empreendimento: emp, reason }) => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => navigate(`/empreendimento/${emp.slug}`)}
                          className="group flex items-center gap-4 rounded-xl border border-[#E5E2DC] bg-[#FAF9F6] p-3 text-left hover:border-[#A37E4D] transition-colors cursor-pointer"
                        >
                          <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-[#111827]">
                            <ResilientImage
                              src={emp.coverImage}
                              alt={emp.name}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-display text-base font-semibold text-[#0C1117] truncate group-hover:text-[#8E6C40] transition-colors">
                                {emp.name}
                              </h3>
                              <ArrowUpRight className="h-4 w-4 shrink-0 text-[#9CA3AF] group-hover:text-[#0C1117]" />
                            </div>
                            <div className="text-xs text-[#6B7280] tabular-nums">
                              {emp.neighborhood} · {emp.stage} · A partir de {formatBRL(emp.startingPrice)}
                            </div>
                            <p className="text-xs text-[#4B5563] line-clamp-2">{reason}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ArchitecturalReveal>
          )}
        </div>
      </SpotlightSurface>
    </section>
  );
}
