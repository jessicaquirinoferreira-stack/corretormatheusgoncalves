import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { logAdminAction } from '../../services/firestoreService';
import type {
  AnalyticsEvent,
  Lead,
  PipelineStage,
  Property,
  Visit,
} from '../../types';
import { exportToCsv, formatCompactBRL, getTimestampMs } from '../../utils/formatters';

export function AdminDashboardTab({
  leads,
  stages,
  properties,
  visits,
  analytics,
}: {
  leads: Lead[];
  stages: PipelineStage[];
  properties: Property[];
  visits: Visit[];
  analytics: AnalyticsEvent[];
}) {
  const [periodDays, setPeriodDays] = useState<'all' | '7' | '30' | '90'>('all');
  const [originFilter, setOriginFilter] = useState<string>('Todas');

  const filteredLeads = useMemo(() => {
    const now = Date.now();
    return leads.filter((l) => {
      if (originFilter !== 'Todas' && l.origin !== originFilter) return false;
      if (periodDays !== 'all') {
        const ms = getTimestampMs(l.createdAt);
        const cutoff = now - Number(periodDays) * 24 * 60 * 60 * 1000;
        if (ms && ms < cutoff) return false;
      }
      return true;
    });
  }, [leads, originFilter, periodDays]);

  const metrics = useMemo(() => {
    const active = filteredLeads.filter(
      (l) => l.stageId !== 'fechado_ganho' && l.stageId !== 'perdido'
    );
    const won = filteredLeads.filter((l) => l.stageId === 'fechado_ganho');
    const weightedForecast = active.reduce((acc, l) => {
      const val = l.potentialValue || l.budget || 0;
      const stageProb = stages.find((s) => s.id === l.stageId)?.probability ?? l.probability ?? 10;
      return acc + val * (stageProb / 100);
    }, 0);
    const wonVolume = won.reduce((acc, l) => acc + (l.potentialValue || l.budget || 0), 0);
    const conversionRate =
      filteredLeads.length > 0 ? Math.round((won.length / filteredLeads.length) * 100) : 0;

    // Average closing time in days
    const closingDurations = won
      .map((l) => {
        const start = getTimestampMs(l.createdAt);
        const end = getTimestampMs(l.updatedAt);
        if (!start || !end || end < start) return null;
        return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
      })
      .filter((v): v is number => v !== null);
    const avgClosingDays =
      closingDurations.length > 0
        ? Math.round(closingDurations.reduce((a, b) => a + b, 0) / closingDurations.length)
        : 0;

    return {
      totalLeads: filteredLeads.length,
      activeCount: active.length,
      wonCount: won.length,
      weightedForecast,
      wonVolume,
      conversionRate,
      avgClosingDays,
      scheduledVisits: visits.filter((v) => v.status === 'Confirmada').length,
      totalPageViews: analytics.length,
    };
  }, [filteredLeads, stages, visits, analytics]);

  const leadsByOrigin = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of filteredLeads) {
      map[l.origin] = (map[l.origin] || 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredLeads]);

  const funnelBreakdown = useMemo(() => {
    const total = Math.max(1, filteredLeads.length);
    return stages
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((stage) => {
        const count = filteredLeads.filter((l) => l.stageId === stage.id).length;
        const pct = Math.round((count / total) * 100);
        return { ...stage, count, pct };
      });
  }, [stages, filteredLeads]);

  const topProperties = useMemo(() => {
    return properties
      .map((p) => {
        const propLeads = filteredLeads.filter((l) => l.propertyId === p.id).length;
        const propVisits = visits.filter((v) => v.propertyId === p.id).length;
        const propViews = analytics.filter((a) => a.entityId === p.id).length;
        return { ...p, propLeads, propVisits, propViews };
      })
      .sort((a, b) => b.propLeads + b.propViews - (a.propLeads + a.propViews))
      .slice(0, 6);
  }, [properties, filteredLeads, visits, analytics]);

  const handleExportCsv = async () => {
    const rows = filteredLeads.map((l) => ({
      Nome: l.name,
      Telefone: l.phone,
      Email: l.email || '',
      Origem: l.origin,
      Perfil: l.profile,
      Score: l.score,
      Etapa: stages.find((s) => s.id === l.stageId)?.name || l.stageId,
      ValorPotencial: l.potentialValue || l.budget || 0,
      ImovelInteresse: l.propertyTitle || '',
      UTM_Source: l.utmSource || '',
      ConsentimentoLGPD: l.lgpdConsent ? 'Sim' : 'Não',
    }));
    exportToCsv(`crm-leads-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    await logAdminAction('Exportou relatório CSV', 'lead', '', `${rows.length} leads exportados`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#0C1117]">
            Inteligência Comercial &amp; Visão Geral
          </h1>
          <p className="text-xs text-[#6B7280]">
            Acompanhamento de pipeline, origem de leads, visitas e previsão de fechamento
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={periodDays}
            onChange={(e) => setPeriodDays(e.target.value as 'all' | '7' | '30' | '90')}
            className="rounded-lg border border-[#D8D3CA] bg-white px-3 py-2 text-xs font-medium text-[#111827]"
          >
            <option value="all">Todo o período</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>

          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="rounded-lg border border-[#D8D3CA] bg-white px-3 py-2 text-xs font-medium text-[#111827]"
          >
            <option value="Todas">Todas as origens</option>
            <option value="Site">Site</option>
            <option value="Landing Page">Landing Page</option>
            <option value="Instagram">Instagram</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Anuncio">Anúncio</option>
            <option value="Indicacao">Indicação</option>
            <option value="Manual">Manual</option>
          </select>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredLeads.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-[#D8D3CA] bg-white px-3.5 py-2 text-xs font-semibold text-[#0C1117] hover:bg-[#F5F3EE] disabled:opacity-50 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#E5E2DC] bg-white p-5 space-y-1">
          <div className="text-xs text-[#6B7280]">Previsão Ponderada</div>
          <div className="font-mono text-2xl font-semibold text-[#0C1117] tabular-nums">
            {formatCompactBRL(metrics.weightedForecast)}
          </div>
          <div className="text-xs text-[#8E6C40] tabular-nums">
            {metrics.activeCount} negociações ativas
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E2DC] bg-white p-5 space-y-1">
          <div className="text-xs text-[#6B7280]">Taxa de Conversão</div>
          <div className="font-mono text-2xl font-semibold text-[#0C1117] tabular-nums">
            {metrics.conversionRate}%
          </div>
          <div className="text-xs text-[#6B7280] tabular-nums">
            {metrics.wonCount} ganhos · {metrics.totalLeads} leads totais
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E2DC] bg-white p-5 space-y-1">
          <div className="text-xs text-[#6B7280]">Visitas Confirmadas</div>
          <div className="font-mono text-2xl font-semibold text-[#0C1117] tabular-nums">
            {metrics.scheduledVisits}
          </div>
          <div className="text-xs text-[#6B7280] tabular-nums">
            Tempo médio fechamento: {metrics.avgClosingDays || '—'} dias
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E2DC] bg-white p-5 space-y-1">
          <div className="text-xs text-[#6B7280]">Acessos &amp; Interações</div>
          <div className="font-mono text-2xl font-semibold text-[#0C1117] tabular-nums">
            {metrics.totalPageViews}
          </div>
          <div className="text-xs text-[#6B7280] tabular-nums">
            {properties.length} imóveis no portfólio
          </div>
        </div>
      </div>

      {/* Funnel + Origins */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-xl border border-[#E5E2DC] bg-white p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-[#0C1117]">
            Conversão por Etapa do Funil
          </h2>
          <div className="space-y-3">
            {funnelBreakdown.map((st) => (
              <div key={st.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#111827]">{st.name}</span>
                  <span className="font-mono text-[#6B7280] tabular-nums">
                    {st.count} ({st.pct}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#F0EDE6]">
                  <div
                    className={`h-full rounded-full ${
                      st.isWon ? 'bg-emerald-600' : st.isLost ? 'bg-rose-500' : 'bg-[#A37E4D]'
                    }`}
                    style={{ width: `${Math.max(st.count > 0 ? 4 : 0, st.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-xl border border-[#E5E2DC] bg-white p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-[#0C1117]">
            Leads por Origem
          </h2>
          {leadsByOrigin.length === 0 ? (
            <p className="text-sm text-[#6B7280]">
              Nenhum lead registrado no período selecionado.
            </p>
          ) : (
            <div className="space-y-3">
              {leadsByOrigin.map(([origin, count]) => (
                <div
                  key={origin}
                  className="flex items-center justify-between border-b border-[#F0EDE6] pb-2.5 text-sm"
                >
                  <span className="text-[#111827]">{origin}</span>
                  <span className="font-mono font-semibold text-[#0C1117] tabular-nums">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Properties Table */}
      <div className="rounded-xl border border-[#E5E2DC] bg-white p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-[#0C1117]">
          Imóveis com Maior Tração
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E5E2DC] text-xs text-[#6B7280]">
                <th className="py-2.5 pr-4 font-medium">Imóvel</th>
                <th className="py-2.5 px-4 font-medium">Região</th>
                <th className="py-2.5 px-4 font-medium text-right">Visualizações</th>
                <th className="py-2.5 px-4 font-medium text-right">Leads</th>
                <th className="py-2.5 pl-4 font-medium text-right">Visitas</th>
              </tr>
            </thead>
            <tbody>
              {topProperties.map((p) => (
                <tr key={p.id} className="border-b border-[#F5F3EE] last:border-0">
                  <td className="py-3 pr-4 font-medium text-[#111827]">{p.title}</td>
                  <td className="py-3 px-4 text-[#6B7280]">
                    {p.city === 'Balneario Camboriu' ? 'BC' : 'Praia Brava'} · {p.neighborhood}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">{p.propViews}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">{p.propLeads}</td>
                  <td className="py-3 pl-4 text-right font-mono tabular-nums">{p.propVisits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
