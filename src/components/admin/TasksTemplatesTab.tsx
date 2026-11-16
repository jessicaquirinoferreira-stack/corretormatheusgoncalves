import React, { useState } from 'react';
import { Bot, Check, Copy, Plus, Zap } from 'lucide-react';
import { runFollowUpAutomation, saveTask } from '../../services/firestoreService';
import type { Lead, SiteSettings, Task, TaskPriority } from '../../types';
import { buildWhatsAppUrl } from '../../utils/formatters';

const MESSAGE_TEMPLATES = [
  {
    id: 'tpl-inicial',
    title: 'Primeiro Contato Consultivo (WhatsApp)',
    channel: 'WhatsApp',
    body: 'Olá {nome}, tudo bem? Aqui é o Matheus Gonçalves. Recebi seu interesse {imovel_ctx} e já separei uma análise de valorização e fluxo para conversarmos com tranquilidade. Qual o melhor horário hoje para falarmos por 5 minutos?',
  },
  {
    id: 'tpl-followup-48h',
    title: 'Follow-up 48h — Retomada Elegante',
    channel: 'WhatsApp',
    body: 'Oi {nome}, passando para saber se conseguiu analisar o material que conversamos {imovel_ctx}. Surgiu uma condição diferenciada na tabela desta semana em Balneário Camboriú / Praia Brava e lembrei do seu perfil. Faz sentido eu te enviar o comparativo?',
  },
  {
    id: 'tpl-visita',
    title: 'Confirmação de Visita Presencial',
    channel: 'WhatsApp',
    body: 'Olá {nome}! Passando para confirmar nossa visita {imovel_ctx}. Estarei no local com o dossiê completo de rentabilidade e memorial descritivo. Até breve!',
  },
  {
    id: 'tpl-email-dossie',
    title: 'Envio de Dossiê Patrimonial (E-mail)',
    channel: 'E-mail',
    body: 'Prezado(a) {nome},\n\nConforme conversamos, segue o estudo completo {imovel_ctx}, contemplando projeção de liquidez, fluxo de pagamento e diferenciais construtivos.\n\nFico à disposição para ajustarmos a proposta ao seu planejamento familiar.\n\nAtenciosamente,\nMatheus Gonçalves',
  },
];

export function TasksTemplatesTab({
  tasks,
  leads,
  settings,
}: {
  tasks: Task[];
  leads: Lead[];
  settings: SiteSettings;
}) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [priority, setPriority] = useState<TaskPriority>('Alta');
  const [leadId, setLeadId] = useState('');
  const [autoMsg, setAutoMsg] = useState<string | null>(null);
  const [selectedLeadForTpl, setSelectedLeadForTpl] = useState<string>(leads[0]?.id || '');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const lead = leads.find((l) => l.id === leadId);
    await saveTask({
      leadId: lead?.id || '',
      leadName: lead?.name || '',
      title,
      dueDate,
      priority,
      status: 'Pendente',
      isAutomated: false,
    });
    setTitle('');
  };

  const handleRunAutomation = async () => {
    const count = await runFollowUpAutomation(leads, tasks);
    setAutoMsg(
      count > 0
        ? `${count} tarefa(s) de follow-up 48h geradas automaticamente.`
        : 'Nenhum lead sem resposta há mais de 48h no momento.'
    );
  };

  const activeLead = leads.find((l) => l.id === selectedLeadForTpl);

  const renderMessage = (body: string) => {
    const nome = activeLead?.name?.split(' ')[0] || 'Cliente';
    const imovelCtx = activeLead?.propertyTitle
      ? `no ${activeLead.propertyTitle}`
      : 'na nossa seleção de imóveis';
    return body
      .replace(/\{nome\}/g, nome)
      .replace(/\{imovel_ctx\}/g, imovelCtx)
      .replace(/\{corretor\}/g, settings.brandName);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#0C1117]">
            Tarefas, Follow-up &amp; Automação
          </h1>
          <p className="text-xs text-[#6B7280]">
            Lembretes programados, regra automática 48h e modelos prontos para WhatsApp e e-mail
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunAutomation}
          className="inline-flex items-center gap-2 rounded-lg bg-[#A37E4D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#8E6C40] cursor-pointer"
        >
          <Zap className="h-3.5 w-3.5" />
          <span>Executar Regra 48h sem Resposta</span>
        </button>
      </div>

      {autoMsg && (
        <div className="rounded-lg border border-[#A37E4D]/40 bg-[#FAF9F6] px-4 py-2.5 text-xs font-medium text-[#0C1117]">
          {autoMsg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Tasks Column */}
        <div className="lg:col-span-6 space-y-4 rounded-xl border border-[#E5E2DC] bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-[#0C1117]">
            Fila de Follow-ups e Tarefas
          </h2>

          <form onSubmit={handleAddTask} className="space-y-2.5 border-b border-[#F0EDE6] pb-4">
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nova tarefa ou lembrete de retorno..."
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-xs"
            />
            <div className="grid grid-cols-3 gap-2">
              <select
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                className="rounded-lg border border-[#D8D3CA] px-2 py-1.5 text-xs"
              >
                <option value="">Lead (opcional)</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded-lg border border-[#D8D3CA] px-2 py-1.5 text-xs"
              />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="rounded-lg border border-[#D8D3CA] px-2 py-1.5 text-xs"
              >
                <option value="Alta">Alta</option>
                <option value="Media">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0C1117] px-3.5 py-2 text-xs font-semibold text-white cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Adicionar Tarefa</span>
            </button>
          </form>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto">
            {tasks.length === 0 ? (
              <p className="text-xs text-[#6B7280] py-4 text-center">Nenhuma tarefa pendente.</p>
            ) : (
              tasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-[#F0EDE6] p-3 text-xs"
                >
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={t.status === 'Concluida'}
                      onChange={() =>
                        saveTask(
                          {
                            ...t,
                            status: t.status === 'Concluida' ? 'Pendente' : 'Concluida',
                          },
                          t.id
                        )
                      }
                      className="mt-0.5 accent-[#A37E4D]"
                    />
                    <div>
                      <div
                        className={`font-medium ${
                          t.status === 'Concluida'
                            ? 'line-through text-[#9CA3AF]'
                            : 'text-[#0C1117]'
                        }`}
                      >
                        {t.title}
                      </div>
                      <div className="text-[11px] text-[#6B7280] mt-0.5 flex items-center gap-2">
                        <span className="font-mono tabular-nums">{t.dueDate}</span>
                        <span>·</span>
                        <span>{t.priority}</span>
                        {t.isAutomated && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1 text-[#8E6C40]">
                              <Bot className="h-3 w-3" /> Auto 48h
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </label>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message Templates Column */}
        <div className="lg:col-span-6 space-y-4 rounded-xl border border-[#E5E2DC] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-[#0C1117]">
              Modelos de Mensagem
            </h2>
            <select
              value={selectedLeadForTpl}
              onChange={(e) => setSelectedLeadForTpl(e.target.value)}
              className="rounded-lg border border-[#D8D3CA] px-2.5 py-1.5 text-xs max-w-[180px]"
            >
              <option value="">Personalizar para lead...</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {MESSAGE_TEMPLATES.map((tpl) => {
              const text = renderMessage(tpl.body);
              const waHref =
                tpl.channel === 'WhatsApp' && activeLead
                  ? buildWhatsAppUrl(activeLead.phone, text)
                  : null;
              return (
                <div
                  key={tpl.id}
                  className="rounded-lg border border-[#E5E2DC] bg-[#FAF9F6] p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0C1117]">{tpl.title}</span>
                    <span className="text-[#6B7280]">{tpl.channel}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-[#374151] whitespace-pre-line">
                    {text}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(text);
                        setCopiedId(tpl.id);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="inline-flex items-center gap-1 rounded border border-[#D8D3CA] bg-white px-2.5 py-1 text-[11px] font-medium cursor-pointer"
                    >
                      {copiedId === tpl.id ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      <span>{copiedId === tpl.id ? 'Copiado' : 'Copiar'}</span>
                    </button>
                    {waHref && (
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded bg-emerald-700 px-2.5 py-1 text-[11px] font-medium text-white"
                      >
                        Enviar no WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
