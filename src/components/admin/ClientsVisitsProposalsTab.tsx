import React, { useMemo, useState } from 'react';
import { Calendar, ExternalLink, FileText, Loader2, Plus, Trash2, Upload, Users, X } from 'lucide-react';
import {
  addActivity,
  deleteClientLGPD,
  saveClient,
  saveProposal,
  saveVisit,
} from '../../services/firestoreService';
import type {
  Activity,
  Client,
  DocumentationStatus,
  Lead,
  LeadProfile,
  MediaAsset,
  Property,
  Proposal,
  ProposalStatus,
  Visit,
  VisitStatus,
} from '../../types';
import { formatBRL, formatTimestampDate } from '../../utils/formatters';
import { uploadBatchDeviceFiles } from '../../utils/mediaProcessor';
import { SingleAssetUploader } from './DeviceMediaUploader';

export function ClientsCRMView({
  clients,
  properties,
  visits,
  proposals,
  activities,
}: {
  clients: Client[];
  properties: Property[];
  visits: Visit[];
  proposals: Proposal[];
  activities: Activity[];
}) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState<LeadProfile>('Investir');
  const [budgetMax, setBudgetMax] = useState('');
  const [notes, setNotes] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [linkPropertyId, setLinkPropertyId] = useState('');
  const [uploadingDocs, setUploadingDocs] = useState(false);

  const activeClient = useMemo(
    () => (selectedClient ? clients.find((c) => c.id === selectedClient.id) || selectedClient : null),
    [clients, selectedClient]
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveClient({
      name,
      phone,
      email,
      profile,
      budgetMin: 0,
      budgetMax: Number(budgetMax.replace(/[^\d]/g, '')) || 0,
      preferredCities: ['Balneario Camboriu', 'Praia Brava'],
      interestPropertyIds: [],
      viewedPropertyIds: [],
      notes,
      documents: [],
      lgpdConsent: true,
    });
    setShowNew(false);
    setName('');
    setPhone('');
    setEmail('');
    setBudgetMax('');
    setNotes('');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#0C1117]">
            Gestão de Clientes &amp; Relacionamento
          </h1>
          <p className="text-xs text-[#6B7280]">
            Fichas completas, múltiplos imóveis de interesse, histórico de visitas, propostas e documentos
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0C1117] px-3.5 py-2 text-xs font-semibold text-white cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-xl border border-[#E5E2DC] bg-white p-10 text-center space-y-2">
          <Users className="h-7 w-7 mx-auto text-[#9CA3AF]" />
          <p className="text-sm font-medium text-[#111827]">Nenhum cliente cadastrado ainda</p>
          <p className="text-xs text-[#6B7280]">
            Converta um lead do funil ou cadastre um cliente diretamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedClient(c)}
              className="rounded-xl border border-[#E5E2DC] bg-white p-5 text-left space-y-2 hover:border-[#A37E4D] cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="font-semibold text-[#0C1117]">{c.name}</div>
                <span className="text-xs text-[#8E6C40] font-medium">{c.profile}</span>
              </div>
              <div className="text-xs text-[#6B7280]">{c.phone} · {c.email || 'Sem e-mail'}</div>
              <div className="pt-2 border-t border-[#F0EDE6] flex justify-between text-xs text-[#4B5563]">
                <span>{(c.interestPropertyIds || []).length} imóveis vinculados</span>
                <span className="font-mono tabular-nums">{formatBRL(c.budgetMax)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {activeClient && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-[#E5E2DC] pb-4">
              <div>
                <div className="text-xs text-[#6B7280]">Ficha do Cliente · {activeClient.profile}</div>
                <h2 className="font-display text-2xl font-semibold text-[#0C1117]">
                  {activeClient.name}
                </h2>
                <div className="text-xs text-[#4B5563] mt-1">
                  {activeClient.phone} {activeClient.email ? `· ${activeClient.email}` : ''}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClient(null)}
                className="p-1.5 text-[#6B7280] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Linked Interest Properties */}
            <div className="space-y-2.5">
              <div className="text-sm font-semibold text-[#0C1117]">Imóveis de Interesse Vinculados</div>
              <div className="flex gap-2">
                <select
                  value={linkPropertyId}
                  onChange={(e) => setLinkPropertyId(e.target.value)}
                  className="flex-1 rounded-lg border border-[#D8D3CA] px-3 py-2 text-xs"
                >
                  <option value="">Selecionar imóvel para vincular...</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={async () => {
                    if (!linkPropertyId) return;
                    const next = Array.from(
                      new Set([...(activeClient.interestPropertyIds || []), linkPropertyId])
                    );
                    await saveClient({ ...activeClient, interestPropertyIds: next }, activeClient.id);
                    setLinkPropertyId('');
                  }}
                  className="rounded-lg bg-[#0C1117] px-3 py-2 text-xs font-semibold text-white cursor-pointer"
                >
                  Vincular
                </button>
              </div>
              <div className="space-y-1.5 text-xs">
                {(activeClient.interestPropertyIds || []).map((pid) => {
                  const p = properties.find((x) => x.id === pid);
                  return (
                    <div
                      key={pid}
                      className="flex items-center justify-between rounded-lg border border-[#F0EDE6] px-3 py-2"
                    >
                      <span>{p?.title || pid}</span>
                      <span className="font-mono text-[#6B7280] tabular-nums">
                        {p ? formatBRL(p.price) : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-2.5 border-t border-[#E5E2DC] pt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-[#0C1117]">Documentos Anexados</div>
                <label className="inline-flex items-center gap-1.5 rounded-lg bg-[#0C1117] px-3 py-1.5 text-xs font-semibold text-white cursor-pointer">
                  {uploadingDocs ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  <span>{uploadingDocs ? 'Enviando...' : 'Subir Documentos'}</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf,.doc,.docx"
                    disabled={uploadingDocs}
                    onChange={async (e) => {
                      const files = e.target.files ? Array.from(e.target.files) : [];
                      if (files.length === 0) return;
                      setUploadingDocs(true);
                      try {
                        const uploaded = await uploadBatchDeviceFiles({
                          files,
                          folder: 'documentos',
                        });
                        const nextDocs = [
                          ...(activeClient.documents || []),
                          ...uploaded.map((u) => u.url),
                        ];
                        await saveClient({ ...activeClient, documents: nextDocs }, activeClient.id);
                      } finally {
                        setUploadingDocs(false);
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              {(activeClient.documents || []).length === 0 ? (
                <p className="text-xs text-[#6B7280]">Nenhum documento enviado do dispositivo.</p>
              ) : (
                <div className="space-y-1.5">
                  {(activeClient.documents || []).map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 rounded-lg border border-[#F0EDE6] px-3 py-2 text-xs text-[#374151]"
                    >
                      <a
                        href={d}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 min-w-0 hover:text-[#8E6C40]"
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0 text-[#A37E4D]" />
                        <span className="truncate">{d.split('/').pop() || d}</span>
                      </a>
                      <button
                        type="button"
                        onClick={async () => {
                          const nextDocs = (activeClient.documents || []).filter((_, idx) => idx !== i);
                          await saveClient({ ...activeClient, documents: nextDocs }, activeClient.id);
                        }}
                        className="text-rose-600 hover:text-rose-800 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Visits & Proposals Summary */}
            <div className="grid grid-cols-2 gap-4 border-t border-[#E5E2DC] pt-4 text-xs">
              <div className="rounded-lg bg-[#FAF9F6] p-3">
                <div className="text-[#6B7280]">Visitas vinculadas</div>
                <div className="font-mono text-lg font-semibold text-[#0C1117] tabular-nums">
                  {visits.filter((v) => v.clientId === activeClient.id || v.clientName === activeClient.name).length}
                </div>
              </div>
              <div className="rounded-lg bg-[#FAF9F6] p-3">
                <div className="text-[#6B7280]">Propostas enviadas</div>
                <div className="font-mono text-lg font-semibold text-[#0C1117] tabular-nums">
                  {proposals.filter((p) => p.clientId === activeClient.id || p.clientName === activeClient.name).length}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3 border-t border-[#E5E2DC] pt-4">
              <div className="text-sm font-semibold text-[#0C1117]">Timeline &amp; Notas</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Adicionar nota ao relacionamento..."
                  className="flex-1 rounded-lg border border-[#D8D3CA] px-3 py-2 text-xs"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!noteInput.trim()) return;
                    await addActivity({
                      clientId: activeClient.id,
                      type: 'Nota',
                      summary: noteInput.trim(),
                    });
                    setNoteInput('');
                  }}
                  className="rounded-lg bg-[#A37E4D] px-3 py-2 text-xs font-semibold text-white cursor-pointer"
                >
                  Registrar
                </button>
              </div>
              <div className="space-y-2">
                {activities
                  .filter((a) => a.clientId === activeClient.id)
                  .map((a) => (
                    <div key={a.id} className="rounded-lg border border-[#F0EDE6] p-2.5 text-xs">
                      <div className="flex justify-between text-[#6B7280]">
                        <span className="font-semibold text-[#0C1117]">{a.type}</span>
                        <span>{formatTimestampDate(a.createdAt)}</span>
                      </div>
                      <p className="text-[#374151] mt-1">{a.summary}</p>
                    </div>
                  ))}
              </div>
            </div>

            <div className="border-t border-[#E5E2DC] pt-4 flex justify-end">
              <button
                type="button"
                onClick={async () => {
                  await deleteClientLGPD(activeClient.id);
                  setSelectedClient(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Excluir Dados (LGPD)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleCreate} className="w-full max-w-md rounded-xl bg-white p-6 space-y-3">
            <h3 className="font-display text-xl font-semibold text-[#0C1117]">Novo Cliente</h3>
            <input
              required
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Telefone / WhatsApp"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            />
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={profile}
                onChange={(e) => setProfile(e.target.value as LeadProfile)}
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              >
                <option value="Investir">Investir</option>
                <option value="Morar">Morar</option>
                <option value="Ambos">Ambos</option>
              </select>
              <input
                placeholder="Orçamento máximo (R$)"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
            </div>
            <textarea
              rows={3}
              placeholder="Preferências de busca..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="rounded-lg border border-[#D8D3CA] px-4 py-2 text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#0C1117] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
              >
                Salvar Cliente
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export function VisitsCRMView({
  visits,
  properties,
  leads,
  prefillLead,
  onClearPrefill,
}: {
  visits: Visit[];
  properties: Property[];
  leads: Lead[];
  prefillLead: Lead | null;
  onClearPrefill: () => void;
}) {
  const [showForm, setShowForm] = useState(Boolean(prefillLead));
  const [clientName, setClientName] = useState(prefillLead?.name || '');
  const [leadId, setLeadId] = useState(prefillLead?.id || '');
  const [propertyId, setPropertyId] = useState(prefillLead?.propertyId || properties[0]?.id || '');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 10));
  const [scheduledTime, setScheduledTime] = useState('14:30');
  const [reminderForClient, setReminderForClient] = useState(true);
  const [feedbackEditId, setFeedbackEditId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  const sortedVisits = useMemo(
    () =>
      visits
        .slice()
        .sort((a, b) => `${a.scheduledDate} ${a.scheduledTime}`.localeCompare(`${b.scheduledDate} ${b.scheduledTime}`)),
    [visits]
  );

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const prop = properties.find((p) => p.id === propertyId);
    await saveVisit({
      leadId,
      clientName,
      propertyId: prop?.id || propertyId || 'manual',
      propertyTitle: prop?.title || 'Imóvel selecionado',
      scheduledDate,
      scheduledTime,
      status: 'Confirmada',
      reminderForClient,
      feedback: '',
    });
    setShowForm(false);
    onClearPrefill();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#0C1117]">
            Agenda &amp; Visitas
          </h1>
          <p className="text-xs text-[#6B7280]">
            Agendamento, status, lembretes e registro de feedback pós-visita
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0C1117] px-3.5 py-2 text-xs font-semibold text-white cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Agendar Visita</span>
        </button>
      </div>

      {sortedVisits.length === 0 ? (
        <div className="rounded-xl border border-[#E5E2DC] bg-white p-10 text-center space-y-2">
          <Calendar className="h-7 w-7 mx-auto text-[#9CA3AF]" />
          <p className="text-sm font-medium text-[#111827]">Nenhuma visita agendada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedVisits.map((v) => (
            <div
              key={v.id}
              className="rounded-xl border border-[#E5E2DC] bg-white p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono text-[#8E6C40] tabular-nums">
                  <span>{v.scheduledDate}</span>
                  <span>·</span>
                  <span>{v.scheduledTime}</span>
                  {v.reminderForClient && <span>· Lembrete ativo</span>}
                </div>
                <div className="font-semibold text-[#0C1117]">
                  {v.clientName} — {v.propertyTitle}
                </div>
                {v.feedback && (
                  <p className="text-xs text-[#4B5563]">Feedback: {v.feedback}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={v.status}
                  onChange={(e) =>
                    saveVisit({ ...v, status: e.target.value as VisitStatus }, v.id)
                  }
                  className="rounded-lg border border-[#D8D3CA] px-2.5 py-1.5 text-xs font-medium"
                >
                  <option value="Confirmada">Confirmada</option>
                  <option value="Realizada">Realizada</option>
                  <option value="Reagendada">Reagendada</option>
                  <option value="Cancelada">Cancelada</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setFeedbackEditId(v.id);
                    setFeedbackText(v.feedback || '');
                  }}
                  className="rounded-lg border border-[#D8D3CA] px-3 py-1.5 text-xs font-medium cursor-pointer"
                >
                  Feedback pós-visita
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {feedbackEditId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 space-y-4">
            <h3 className="font-display text-xl font-semibold text-[#0C1117]">
              Feedback pós-visita
            </h3>
            <textarea
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Impressões do cliente, objeções, interesse em proposta..."
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFeedbackEditId(null)}
                className="rounded-lg border border-[#D8D3CA] px-4 py-2 text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = visits.find((v) => v.id === feedbackEditId);
                  if (target) {
                    await saveVisit(
                      { ...target, status: 'Realizada', feedback: feedbackText },
                      target.id
                    );
                  }
                  setFeedbackEditId(null);
                }}
                className="rounded-lg bg-[#0C1117] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
              >
                Salvar Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSchedule} className="w-full max-w-md rounded-xl bg-white p-6 space-y-3">
            <h3 className="font-display text-xl font-semibold text-[#0C1117]">Agendar Visita</h3>
            <select
              value={leadId}
              onChange={(e) => {
                const l = leads.find((x) => x.id === e.target.value);
                setLeadId(e.target.value);
                if (l) setClientName(l.name);
              }}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            >
              <option value="">Selecionar lead (opcional)</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <input
              required
              placeholder="Nome do cliente / visitante"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            />
            <select
              required
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
              <input
                type="time"
                required
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-[#374151]">
              <input
                type="checkbox"
                checked={reminderForClient}
                onChange={(e) => setReminderForClient(e.target.checked)}
              />
              <span>Incluir lembrete para o cliente</span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  onClearPrefill();
                }}
                className="rounded-lg border border-[#D8D3CA] px-4 py-2 text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#0C1117] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
              >
                Confirmar Agendamento
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export function ProposalsCRMView({
  proposals,
  properties,
  clients,
  media,
}: {
  proposals: Proposal[];
  properties: Property[];
  clients: Client[];
  media: MediaAsset[];
}) {
  const [showNew, setShowNew] = useState(false);
  const [clientName, setClientName] = useState('');
  const [propertyId, setPropertyId] = useState(properties[0]?.id || '');
  const [proposedValue, setProposedValue] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const prop = properties.find((p) => p.id === propertyId);
    await saveProposal({
      clientName,
      propertyId: prop?.id || propertyId || 'manual',
      propertyTitle: prop?.title || 'Imóvel',
      version: 1,
      proposedValue: Number(proposedValue.replace(/[^\d]/g, '')) || prop?.price || 0,
      paymentTerms,
      documentationStatus: 'Pendente',
      status: 'Rascunho',
      documentUrl,
    });
    setShowNew(false);
    setClientName('');
    setProposedValue('');
    setPaymentTerms('');
    setDocumentUrl('');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#0C1117]">
            Propostas &amp; Documentação
          </h1>
          <p className="text-xs text-[#6B7280]">
            Geração de propostas, controle de versões e status documental
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0C1117] px-3.5 py-2 text-xs font-semibold text-white cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nova Proposta</span>
        </button>
      </div>

      {proposals.length === 0 ? (
        <div className="rounded-xl border border-[#E5E2DC] bg-white p-10 text-center text-sm text-[#6B7280]">
          Nenhuma proposta registrada ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-[#E5E2DC] bg-white p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="space-y-1">
                <div className="text-xs font-mono text-[#8E6C40] tabular-nums">
                  Versão v{p.version} · {formatBRL(p.proposedValue)}
                </div>
                <div className="font-semibold text-[#0C1117]">
                  {p.clientName} — {p.propertyTitle}
                </div>
                {p.paymentTerms && (
                  <p className="text-xs text-[#4B5563]">Condições: {p.paymentTerms}</p>
                )}
                {p.documentUrl && (
                  <a
                    href={p.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#8E6C40] hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Abrir documento anexado</span>
                  </a>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={p.status}
                  onChange={(e) =>
                    saveProposal({ ...p, status: e.target.value as ProposalStatus }, p.id)
                  }
                  className="rounded-lg border border-[#D8D3CA] px-2.5 py-1.5 text-xs font-medium"
                >
                  <option value="Rascunho">Rascunho</option>
                  <option value="Enviada">Enviada</option>
                  <option value="Em Analise">Em Análise</option>
                  <option value="Aceita">Aceita</option>
                  <option value="Recusada">Recusada</option>
                </select>

                <select
                  value={p.documentationStatus}
                  onChange={(e) =>
                    saveProposal(
                      { ...p, documentationStatus: e.target.value as DocumentationStatus },
                      p.id
                    )
                  }
                  className="rounded-lg border border-[#D8D3CA] px-2.5 py-1.5 text-xs font-medium"
                >
                  <option value="Pendente">Doc: Pendente</option>
                  <option value="Em Conferencia">Doc: Em Conferência</option>
                  <option value="Aprovada">Doc: Aprovada</option>
                </select>

                <button
                  type="button"
                  onClick={() =>
                    saveProposal({ ...p, version: p.version + 1 }, p.id)
                  }
                  className="rounded-lg border border-[#D8D3CA] px-3 py-1.5 text-xs font-medium cursor-pointer"
                >
                  Nova versão (v{p.version + 1})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleCreate} className="w-full max-w-md rounded-xl bg-white p-6 space-y-3">
            <h3 className="font-display text-xl font-semibold text-[#0C1117]">Gerar Proposta</h3>
            <input
              required
              list="clients-datalist"
              placeholder="Nome do cliente"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            />
            <datalist id="clients-datalist">
              {clients.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({formatBRL(p.price)})
                </option>
              ))}
            </select>
            <input
              required
              placeholder="Valor proposto (R$)"
              value={proposedValue}
              onChange={(e) => setProposedValue(e.target.value)}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            />
            <textarea
              rows={3}
              placeholder="Condições de pagamento (entrada, reforços, financiamento)..."
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            />
            <SingleAssetUploader
              label="Anexar Documento / Proposta (opcional)"
              value={documentUrl}
              onChange={setDocumentUrl}
              folder="documentos"
              accept="application/pdf,image/*,.doc,.docx"
              media={media}
              helperText="Suba PDF, imagem ou contrato diretamente do dispositivo para Vercel Blob"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="rounded-lg border border-[#D8D3CA] px-4 py-2 text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#0C1117] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
              >
                Criar Proposta v1
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
