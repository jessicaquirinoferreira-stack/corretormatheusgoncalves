import React, { useMemo, useState } from 'react';
import {
  Kanban,
  List,
  MessageSquare,
  Plus,
  Settings2,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import {
  addActivity,
  convertLeadToClient,
  createManualLead,
  deleteLead,
  savePipelineStage,
  updateLeadDetails,
  updateLeadStage,
} from '../../services/firestoreService';
import type {
  Activity,
  Lead,
  LeadOrigin,
  LeadProfile,
  PipelineStage,
  Property,
} from '../../types';
import {
  buildWhatsAppUrl,
  formatCompactBRL,
  formatTimestampDate,
} from '../../utils/formatters';

export function PipelineKanbanTab({
  leads,
  stages,
  activities,
  properties,
  onOpenScheduleVisit,
}: {
  leads: Lead[];
  stages: PipelineStage[];
  activities: Activity[];
  properties: Property[];
  onOpenScheduleVisit: (lead: Lead) => void;
}) {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [scoreFilter, setScoreFilter] = useState<'Todos' | 'Quente' | 'Morno' | 'Frio'>('Todos');
  const [search, setSearch] = useState('');
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [showStageConfig, setShowStageConfig] = useState(false);

  // Lost reason modal
  const [pendingLostMove, setPendingLostMove] = useState<{
    lead: Lead;
    stage: PipelineStage;
  } | null>(null);
  const [lostReasonInput, setLostReasonInput] = useState('');

  // Drawer interaction state
  const [activityType, setActivityType] = useState<Activity['type']>('WhatsApp');
  const [activityText, setActivityText] = useState('');
  const [newTagInput, setNewTagInput] = useState('');

  // New Manual Lead state
  const [mName, setMName] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mEmail, setMEmail] = useState('');
  const [mOrigin, setMOrigin] = useState<LeadOrigin>('WhatsApp');
  const [mProfile, setMProfile] = useState<LeadProfile>('Investir');
  const [mBudget, setMBudget] = useState('');
  const [mTimeframe, setMTimeframe] = useState('Até 3 meses');
  const [mPropertyId, setMPropertyId] = useState('');
  const [mNotes, setMNotes] = useState('');

  const sortedStages = useMemo(
    () => stages.slice().sort((a, b) => a.order - b.order),
    [stages]
  );

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (scoreFilter !== 'Todos' && l.score !== scoreFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${l.name} ${l.phone} ${l.email || ''} ${l.propertyTitle || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, scoreFilter, search]);

  const activeLeadData = useMemo(() => {
    if (!selectedLead) return null;
    return leads.find((l) => l.id === selectedLead.id) || selectedLead;
  }, [leads, selectedLead]);

  const leadActivities = useMemo(() => {
    if (!activeLeadData) return [];
    return activities.filter((a) => a.leadId === activeLeadData.id);
  }, [activities, activeLeadData]);

  const handleStageChange = async (lead: Lead, targetStage: PipelineStage) => {
    if (lead.stageId === targetStage.id) return;
    if (targetStage.isLost) {
      setPendingLostMove({ lead, stage: targetStage });
      setLostReasonInput('');
      return;
    }
    await updateLeadStage(lead, targetStage);
  };

  const confirmLostMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingLostMove) return;
    await updateLeadStage(
      pendingLostMove.lead,
      pendingLostMove.stage,
      lostReasonInput || 'Não informado'
    );
    setPendingLostMove(null);
  };

  const handleCreateManualLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const prop = properties.find((p) => p.id === mPropertyId);
    await createManualLead({
      name: mName,
      phone: mPhone,
      email: mEmail,
      origin: mOrigin,
      profile: mProfile,
      budget: Number(mBudget.replace(/[^\d]/g, '')) || 0,
      timeframe: mTimeframe,
      propertyId: prop?.id || '',
      propertyTitle: prop?.title || '',
      notes: mNotes,
      stageId: sortedStages[0]?.id || 'novo_lead',
      probability: sortedStages[0]?.probability ?? 10,
      lgpdConsent: true,
    });
    setShowNewLeadModal(false);
    setMName('');
    setMPhone('');
    setMEmail('');
    setMBudget('');
    setMNotes('');
    setMPropertyId('');
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLeadData || !activityText.trim()) return;
    await addActivity({
      leadId: activeLeadData.id,
      clientId: activeLeadData.clientId || '',
      type: activityType,
      summary: activityText.trim(),
    });
    setActivityText('');
  };

  const handleAddTag = async () => {
    if (!activeLeadData || !newTagInput.trim()) return;
    const nextTags = Array.from(
      new Set([...(activeLeadData.tags || []), newTagInput.trim()])
    ).slice(0, 10);
    await updateLeadDetails(activeLeadData.id, { tags: nextTags });
    setNewTagInput('');
  };

  const scoreColor = (score: Lead['score']) => {
    if (score === 'Quente') return 'text-emerald-700';
    if (score === 'Morno') return 'text-amber-700';
    return 'text-slate-500';
  };

  return (
    <div className="space-y-5">
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#0C1117]">
            Pipeline &amp; Funil de Vendas
          </h1>
          <p className="text-xs text-[#6B7280]">
            Arraste os cards entre etapas, acompanhe probabilidades e registre interações
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex rounded-lg border border-[#D8D3CA] bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer ${
                viewMode === 'kanban' ? 'bg-[#0C1117] text-white' : 'text-[#4B5563]'
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer ${
                viewMode === 'list' ? 'bg-[#0C1117] text-white' : 'text-[#4B5563]'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Lista</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowStageConfig((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#D8D3CA] bg-white px-3 py-2 text-xs font-medium text-[#111827] hover:bg-[#F5F3EE] cursor-pointer"
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span>Etapas</span>
          </button>

          <button
            type="button"
            onClick={() => setShowNewLeadModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0C1117] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1E293B] cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Novo Lead</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E5E2DC] bg-white p-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar lead por nome, telefone ou imóvel..."
          className="flex-1 min-w-[220px] rounded-lg border border-[#D8D3CA] px-3 py-1.5 text-xs text-[#111827] focus:border-[#A37E4D] focus:outline-none"
        />
        <div className="flex items-center gap-1 rounded-lg bg-[#F5F3EE] p-1">
          {(['Todos', 'Quente', 'Morno', 'Frio'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScoreFilter(s)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer ${
                scoreFilter === s ? 'bg-white text-[#0C1117] shadow-xs' : 'text-[#6B7280]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Stage Customizer Drawer */}
      {showStageConfig && (
        <div className="rounded-xl border border-[#E5E2DC] bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#0C1117]">
              Personalizar Etapas e Probabilidade de Fechamento
            </h3>
            <button
              type="button"
              onClick={() => setShowStageConfig(false)}
              className="text-xs text-[#6B7280] hover:text-[#0C1117] cursor-pointer"
            >
              Fechar
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {sortedStages.map((st) => (
              <div key={st.id} className="rounded-lg border border-[#E5E2DC] p-3 space-y-2">
                <input
                  type="text"
                  defaultValue={st.name}
                  onBlur={(e) => {
                    if (e.target.value.trim() && e.target.value !== st.name) {
                      savePipelineStage({ ...st, name: e.target.value.trim() });
                    }
                  }}
                  className="w-full text-xs font-semibold text-[#0C1117] border-b border-transparent focus:border-[#A37E4D] focus:outline-none"
                />
                <div className="flex items-center justify-between text-xs text-[#6B7280]">
                  <span>Probabilidade (%)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={st.probability}
                    onBlur={(e) => {
                      const val = Number(e.target.value);
                      if (!Number.isNaN(val) && val !== st.probability) {
                        savePipelineStage({ ...st, probability: val });
                      }
                    }}
                    className="w-14 rounded border border-[#D8D3CA] px-1.5 py-0.5 text-right font-mono tabular-nums"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {sortedStages.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.stageId === stage.id);
            const stageValue = stageLeads.reduce(
              (acc, l) => acc + (l.potentialValue || l.budget || 0),
              0
            );
            return (
              <div
                key={stage.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (!draggingLeadId) return;
                  const found = leads.find((l) => l.id === draggingLeadId);
                  setDraggingLeadId(null);
                  if (found) handleStageChange(found, stage);
                }}
                className="w-72 shrink-0 rounded-xl border border-[#E5E2DC] bg-[#F5F3EE]/70 flex flex-col max-h-[72vh]"
              >
                <div className="border-b border-[#E5E2DC] bg-white rounded-t-xl p-3.5 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#0C1117] truncate">
                      {stage.name}
                    </span>
                    <span className="font-mono text-xs text-[#6B7280] tabular-nums">
                      {stageLeads.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#6B7280] tabular-nums">
                    <span>Prob: {stage.probability}%</span>
                    <span className="font-mono">{formatCompactBRL(stageValue)}</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                  {stageLeads.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#9CA3AF]">
                      Solte um lead aqui
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={() => setDraggingLeadId(lead.id)}
                        onClick={() => setSelectedLead(lead)}
                        className="cursor-pointer rounded-lg border border-[#E5E2DC] bg-white p-3.5 space-y-2 hover:border-[#A37E4D] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-sm text-[#0C1117] leading-snug">
                            {lead.name}
                          </div>
                          <span className={`text-[11px] font-semibold shrink-0 ${scoreColor(lead.score)}`}>
                            {lead.score}
                          </span>
                        </div>

                        <div className="text-xs text-[#6B7280] flex items-center gap-1.5">
                          <span>{lead.origin}</span>
                          <span aria-hidden="true">·</span>
                          <span>{lead.profile}</span>
                        </div>

                        {lead.propertyTitle && (
                          <div className="text-xs font-medium text-[#374151] truncate">
                            {lead.propertyTitle}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-[#F5F3EE] text-xs">
                          <span className="font-mono font-semibold text-[#0C1117] tabular-nums">
                            {formatCompactBRL(lead.potentialValue || lead.budget)}
                          </span>
                          <span className="text-[11px] text-[#9CA3AF]">
                            {formatTimestampDate(lead.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="rounded-xl border border-[#E5E2DC] bg-white overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E5E2DC] text-xs text-[#6B7280]">
                <th className="py-3 px-4 font-medium">Lead</th>
                <th className="py-3 px-4 font-medium">Origem</th>
                <th className="py-3 px-4 font-medium">Score</th>
                <th className="py-3 px-4 font-medium">Etapa</th>
                <th className="py-3 px-4 font-medium text-right">Potencial</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => {
                const st = stages.find((s) => s.id === lead.stageId);
                return (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="border-b border-[#F5F3EE] hover:bg-[#FAF9F6] cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#0C1117]">{lead.name}</div>
                      <div className="text-xs text-[#6B7280]">{lead.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#4B5563]">{lead.origin}</td>
                    <td className={`py-3 px-4 text-xs font-semibold ${scoreColor(lead.score)}`}>
                      {lead.score} ({lead.scorePoints ?? 0})
                    </td>
                    <td className="py-3 px-4 text-xs text-[#111827]">{st?.name || lead.stageId}</td>
                    <td className="py-3 px-4 text-right font-mono text-xs tabular-nums">
                      {formatCompactBRL(lead.potentialValue || lead.budget)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* LEAD DOSSIER DRAWER */}
      {activeLeadData && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 space-y-6 shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#E5E2DC] pb-4">
              <div>
                <div className="text-xs text-[#6B7280]">
                  {activeLeadData.origin}
                  {activeLeadData.utmSource ? ` · UTM: ${activeLeadData.utmSource}` : ''} · Score:{' '}
                  <strong className={scoreColor(activeLeadData.score)}>
                    {activeLeadData.score} ({activeLeadData.scorePoints ?? 0}/100)
                  </strong>
                </div>
                <h2 className="font-display text-2xl font-semibold text-[#0C1117] mt-1">
                  {activeLeadData.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="rounded-lg p-1.5 text-[#6B7280] hover:bg-[#F5F3EE] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onOpenScheduleVisit(activeLeadData)}
                className="rounded-lg bg-[#0C1117] px-3 py-2 text-xs font-semibold text-white cursor-pointer"
              >
                Agendar Visita
              </button>

              {!activeLeadData.clientId && (
                <button
                  type="button"
                  onClick={() => convertLeadToClient(activeLeadData)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#D8D3CA] px-3 py-2 text-xs font-semibold text-[#0C1117] hover:bg-[#F5F3EE] cursor-pointer"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Converter em Cliente</span>
                </button>
              )}

              {buildWhatsAppUrl(
                activeLeadData.phone,
                `Olá ${activeLeadData.name}, tudo bem? Aqui é o Matheus Gonçalves.`
              ) && (
                <a
                  href={
                    buildWhatsAppUrl(
                      activeLeadData.phone,
                      `Olá ${activeLeadData.name}, tudo bem? Aqui é o Matheus Gonçalves.`
                    ) || '#'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>WhatsApp</span>
                </a>
              )}

              <button
                type="button"
                onClick={async () => {
                  await deleteLead(activeLeadData.id, 'Exclusão via ficha do lead (LGPD)');
                  setSelectedLead(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Excluir (LGPD)</span>
              </button>
            </div>

            {/* Stage & Details */}
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-[#E5E2DC] bg-[#FAF9F6] p-4 sm:grid-cols-2 text-xs">
              <div>
                <label className="block text-[#6B7280] mb-1">Etapa do Funil</label>
                <select
                  value={activeLeadData.stageId}
                  onChange={(e) => {
                    const target = stages.find((s) => s.id === e.target.value);
                    if (target) handleStageChange(activeLeadData, target);
                  }}
                  className="w-full rounded-lg border border-[#D8D3CA] bg-white px-2.5 py-2 text-xs font-medium text-[#111827]"
                >
                  {sortedStages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.probability}%)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#6B7280] mb-1">Qualificação Manual</label>
                <select
                  value={activeLeadData.score}
                  onChange={(e) =>
                    updateLeadDetails(activeLeadData.id, {
                      score: e.target.value as Lead['score'],
                    })
                  }
                  className="w-full rounded-lg border border-[#D8D3CA] bg-white px-2.5 py-2 text-xs font-medium text-[#111827]"
                >
                  <option value="Quente">Quente</option>
                  <option value="Morno">Morno</option>
                  <option value="Frio">Frio</option>
                </select>
              </div>
              <div>
                <span className="text-[#6B7280]">Telefone:</span>{' '}
                <strong className="text-[#111827]">{activeLeadData.phone}</strong>
              </div>
              <div>
                <span className="text-[#6B7280]">E-mail:</span>{' '}
                <strong className="text-[#111827]">{activeLeadData.email || '—'}</strong>
              </div>
              <div>
                <span className="text-[#6B7280]">Orçamento:</span>{' '}
                <strong className="font-mono text-[#111827] tabular-nums">
                  {formatCompactBRL(activeLeadData.budget)}
                </strong>
              </div>
              <div>
                <span className="text-[#6B7280]">Prazo:</span>{' '}
                <strong className="text-[#111827]">{activeLeadData.timeframe || '—'}</strong>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#0C1117]">Tags &amp; Segmentação</div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {(activeLeadData.tags || []).map((tag) => (
                  <span key={tag} className="text-[#4B5563]">
                    #{tag}
                  </span>
                ))}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="Nova tag"
                    className="rounded border border-[#D8D3CA] px-2 py-1 text-xs w-28"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="rounded border border-[#D8D3CA] px-2 py-1 text-xs font-medium cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Interaction History */}
            <div className="space-y-3 border-t border-[#E5E2DC] pt-4">
              <div className="text-sm font-semibold text-[#0C1117]">
                Histórico de Interações
              </div>

              <form onSubmit={handleAddActivity} className="flex gap-2">
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value as Activity['type'])}
                  className="rounded-lg border border-[#D8D3CA] px-2.5 py-2 text-xs"
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Ligacao">Ligação</option>
                  <option value="Email">E-mail</option>
                  <option value="Nota">Nota</option>
                </select>
                <input
                  type="text"
                  value={activityText}
                  onChange={(e) => setActivityText(e.target.value)}
                  placeholder="Registrar atendimento, retorno ou observação..."
                  className="flex-1 rounded-lg border border-[#D8D3CA] px-3 py-2 text-xs"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#A37E4D] px-3 py-2 text-xs font-semibold text-white cursor-pointer"
                >
                  Salvar
                </button>
              </form>

              <div className="space-y-2.5">
                {leadActivities.length === 0 ? (
                  <p className="text-xs text-[#9CA3AF]">Nenhuma interação registrada ainda.</p>
                ) : (
                  leadActivities.map((act) => (
                    <div
                      key={act.id}
                      className="rounded-lg border border-[#F0EDE6] bg-[#FAF9F6] p-3 text-xs space-y-1"
                    >
                      <div className="flex justify-between text-[#6B7280]">
                        <span className="font-semibold text-[#0C1117]">{act.type}</span>
                        <span>{formatTimestampDate(act.createdAt)}</span>
                      </div>
                      <p className="text-[#374151]">{act.summary}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOST REASON MODAL */}
      {pendingLostMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={confirmLostMove}
            className="w-full max-w-md rounded-xl bg-white p-6 space-y-4"
          >
            <h3 className="font-display text-xl font-semibold text-[#0C1117]">
              Motivo da perda
            </h3>
            <p className="text-xs text-[#6B7280]">
              Registre o motivo para inteligência comercial ({pendingLostMove.lead.name}).
            </p>
            <input
              type="text"
              required
              value={lostReasonInput}
              onChange={(e) => setLostReasonInput(e.target.value)}
              placeholder="Ex: Preço fora do orçamento, optou por outra região..."
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingLostMove(null)}
                className="rounded-lg border border-[#D8D3CA] px-4 py-2 text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white cursor-pointer"
              >
                Confirmar Perda
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NEW MANUAL LEAD MODAL */}
      {showNewLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleCreateManualLead}
            className="w-full max-w-lg rounded-xl bg-white p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-[#0C1117]">
                Cadastrar Lead Manualmente
              </h3>
              <button
                type="button"
                onClick={() => setShowNewLeadModal(false)}
                className="text-[#6B7280] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                required
                placeholder="Nome completo"
                value={mName}
                onChange={(e) => setMName(e.target.value)}
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Telefone / WhatsApp"
                value={mPhone}
                onChange={(e) => setMPhone(e.target.value)}
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
              <input
                type="email"
                placeholder="E-mail"
                value={mEmail}
                onChange={(e) => setMEmail(e.target.value)}
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
              <select
                value={mOrigin}
                onChange={(e) => setMOrigin(e.target.value as LeadOrigin)}
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Instagram">Instagram</option>
                <option value="Indicacao">Indicação</option>
                <option value="Anuncio">Anúncio</option>
                <option value="Manual">Manual</option>
              </select>
              <select
                value={mProfile}
                onChange={(e) => setMProfile(e.target.value as LeadProfile)}
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              >
                <option value="Investir">Investir</option>
                <option value="Morar">Morar</option>
                <option value="Ambos">Ambos</option>
              </select>
              <input
                placeholder="Orçamento (R$)"
                value={mBudget}
                onChange={(e) => setMBudget(e.target.value)}
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
            </div>

            <select
              value={mPropertyId}
              onChange={(e) => setMPropertyId(e.target.value)}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            >
              <option value="">Sem imóvel específico vinculado</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>

            <textarea
              rows={3}
              placeholder="Observações e contexto do atendimento..."
              value={mNotes}
              onChange={(e) => setMNotes(e.target.value)}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewLeadModal(false)}
                className="rounded-lg border border-[#D8D3CA] px-4 py-2 text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#0C1117] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
              >
                Salvar Lead
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
