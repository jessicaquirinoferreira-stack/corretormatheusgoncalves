import React, { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import type { Empreendimento, Property } from '../../types';
import { formatBRL } from '../../utils/formatters';
import { ArchitecturalReveal } from '../../components/motion/MotionPrimitives';
import { EmpreendimentoCard } from '../../components/public/EmpreendimentoCard';
import { PropertyCard } from '../../components/public/PropertyCard';
import type { HomePageSearchFilter } from './HomePage';

export function PropertiesCatalogPage({
  mode,
  properties,
  initialFilter,
  navigate,
}: {
  mode: 'comprar' | 'investir';
  properties: Property[];
  initialFilter?: HomePageSearchFilter | null;
  navigate: (path: string) => void;
}) {
  const [city, setCity] = useState(initialFilter?.city || 'Todas');
  const [type, setType] = useState(initialFilter?.type || 'Todos');
  const [maxPrice, setMaxPrice] = useState(initialFilter?.maxPrice || '');
  const [searchTerm, setSearchTerm] = useState('');

  // Investment simulator state (for /investir)
  const [simCapital, setSimCapital] = useState(3500000);
  const [simYears, setSimYears] = useState(3);
  const [simRate, setSimRate] = useState(18);

  const projectedFinal = useMemo(() => {
    return Math.round(simCapital * Math.pow(1 + simRate / 100, simYears));
  }, [simCapital, simRate, simYears]);

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      if (mode === 'investir' && p.purpose === 'comprar') return false;
      if (city !== 'Todas' && p.city !== city) return false;
      if (type !== 'Todos' && p.type !== type) return false;
      if (maxPrice && p.price > Number(maxPrice)) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const hay = `${p.title} ${p.neighborhood} ${p.city} ${p.type}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [properties, mode, city, type, maxPrice, searchTerm]);

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-14">
      <div className="mx-auto max-w-7xl px-6 space-y-10">
        <div className="space-y-3 border-b border-[#E5E2DC] pb-8">
          <p className="text-xs font-semibold tracking-wider text-[#8E6C40]">
            {mode === 'investir' ? 'Alocação & Lucratividade' : 'Portfólio Imobiliário'}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-[#0C1117]">
            {mode === 'investir'
              ? 'Imóveis estratégicos para investir em Balneário Camboriú e Praia Brava'
              : 'Imóveis selecionados para morar com a sua família'}
          </h1>
          <p className="max-w-2xl text-sm md:text-base text-[#4B5563]">
            {mode === 'investir'
              ? 'Unidades avaliadas por liquidez de revenda, fluxo direto durante obra e demanda de locação de alto padrão.'
              : 'Apartamentos, coberturas e diferenciados selecionados por localização, padrão construtivo e segurança patrimonial.'}
          </p>
        </div>

        {mode === 'investir' && (
          <div className="rounded-xl border border-[#E5E2DC] bg-[#0C1117] p-6 md:p-8 text-white">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-5 space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#C8B08A]">
                  <Calculator className="h-4 w-4" />
                  <span>Simulador de Valorização Patrimonial</span>
                </div>
                <h2 className="font-display text-2xl font-semibold">
                  Projete o retorno estimado no ciclo imobiliário
                </h2>
                <p className="text-xs leading-relaxed text-[#9CA3AF]">
                  Simulação ilustrativa baseada em cenários históricos da orla de Balneário Camboriú e Praia Brava.
                </p>
              </div>

              <div className="lg:col-span-4 space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/75">Valor do imóvel</span>
                    <span className="font-mono tabular-nums text-[#C8B08A]">{formatBRL(simCapital)}</span>
                  </div>
                  <input
                    type="range"
                    min={1500000}
                    max={12000000}
                    step={250000}
                    value={simCapital}
                    onChange={(e) => setSimCapital(Number(e.target.value))}
                    className="w-full accent-[#A37E4D]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/75">Horizonte</span>
                      <span className="font-mono tabular-nums">{simYears} anos</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={6}
                      value={simYears}
                      onChange={(e) => setSimYears(Number(e.target.value))}
                      className="w-full accent-[#A37E4D]"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/75">Taxa a.a.</span>
                      <span className="font-mono tabular-nums">{simRate}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={28}
                      value={simRate}
                      onChange={(e) => setSimRate(Number(e.target.value))}
                      className="w-full accent-[#A37E4D]"
                    />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 rounded-xl border border-white/10 bg-white/5 p-5 space-y-1">
                <div className="text-xs text-white/70">Patrimônio projetado</div>
                <div className="font-mono text-2xl font-semibold text-[#C8B08A] tabular-nums">
                  {formatBRL(projectedFinal)}
                </div>
                <div className="text-xs text-emerald-400 tabular-nums">
                  +{formatBRL(projectedFinal - simCapital)} ganho bruto est.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-[#E5E2DC] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou bairro..."
            className="rounded-lg border border-[#D8D3CA] px-3.5 py-2 text-sm text-[#111827] focus:border-[#A37E4D] focus:outline-none"
          />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-lg border border-[#D8D3CA] px-3.5 py-2 text-sm text-[#111827] focus:border-[#A37E4D] focus:outline-none"
          >
            <option value="Todas">Todas as regiões</option>
            <option value="Balneario Camboriu">Balneário Camboriú</option>
            <option value="Praia Brava">Praia Brava</option>
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-[#D8D3CA] px-3.5 py-2 text-sm text-[#111827] focus:border-[#A37E4D] focus:outline-none"
          >
            <option value="Todos">Todas as tipologias</option>
            <option value="Apartamento">Apartamento</option>
            <option value="Cobertura">Cobertura</option>
            <option value="Diferenciado">Diferenciado</option>
            <option value="Casa">Casa</option>
            <option value="Terreno">Terreno</option>
          </select>
          <select
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="rounded-lg border border-[#D8D3CA] px-3.5 py-2 text-sm text-[#111827] focus:border-[#A37E4D] focus:outline-none"
          >
            <option value="">Qualquer valor</option>
            <option value="4000000">Até R$ 4.000.000</option>
            <option value="6000000">Até R$ 6.000.000</option>
            <option value="10000000">Até R$ 10.000.000</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-[#E5E2DC] bg-white p-12 text-center space-y-3">
            <h3 className="font-display text-xl font-semibold text-[#0C1117]">
              Nenhum imóvel encontrado para esses filtros
            </h3>
            <p className="text-sm text-[#6B7280]">
              Temos opções off-market que podem atender exatamente o seu perfil.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCity('Todas');
                  setType('Todos');
                  setMaxPrice('');
                  setSearchTerm('');
                }}
                className="rounded-lg border border-[#D8D3CA] px-4 py-2 text-sm font-medium text-[#111827] cursor-pointer"
              >
                Limpar filtros
              </button>
              <button
                type="button"
                onClick={() => navigate('/contato')}
                className="rounded-lg bg-[#0C1117] px-4 py-2 text-sm font-medium text-white cursor-pointer"
              >
                Solicitar atendimento privado
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((prop, idx) => (
              <ArchitecturalReveal key={prop.id} delay={idx * 0.05}>
                <PropertyCard property={prop} onOpen={(slug) => navigate(`/imovel/${slug}`)} />
              </ArchitecturalReveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function EmpreendimentosPage({
  empreendimentos,
  properties,
  navigate,
}: {
  empreendimentos: Empreendimento[];
  properties: Property[];
  navigate: (path: string) => void;
}) {
  return (
    <div className="bg-[#FAF9F6] min-h-screen py-14">
      <div className="mx-auto max-w-7xl px-6 space-y-10">
        <div className="space-y-3 border-b border-[#E5E2DC] pb-8">
          <p className="text-xs font-semibold tracking-wider text-[#8E6C40]">
            Empreendimentos Selecionados
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-[#0C1117]">
            Projetos arquitetônicos de referência no litoral norte
          </h1>
          <p className="max-w-2xl text-sm md:text-base text-[#4B5563]">
            Explore os empreendimentos acompanhados por Matheus Gonçalves e veja as unidades vinculadas disponíveis.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {empreendimentos.map((emp, idx) => {
            const linkedCount = properties.filter((p) => p.empreendimentoId === emp.id).length;
            return (
              <ArchitecturalReveal key={emp.id} delay={idx * 0.06}>
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
    </div>
  );
}
