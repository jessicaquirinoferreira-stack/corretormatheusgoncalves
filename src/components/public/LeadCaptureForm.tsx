import React, { useEffect, useState } from 'react';
import { CheckCircle2, MessageSquare } from 'lucide-react';
import { submitPublicLead } from '../../services/firestoreService';
import type { LeadOrigin, LeadProfile, SiteSettings } from '../../types';
import { buildWhatsAppUrl, captureUtmParams } from '../../utils/formatters';

interface LeadCaptureFormProps {
  origin?: LeadOrigin;
  propertyId?: string;
  propertyTitle?: string;
  defaultProfile?: LeadProfile;
  ctaLabel?: string;
  dark?: boolean;
  settings?: SiteSettings;
  prefilledNotes?: string;
}

export function LeadCaptureForm({
  origin,
  propertyId,
  propertyTitle,
  defaultProfile = 'Investir',
  ctaLabel = 'Solicitar Atendimento Consultivo',
  dark = false,
  settings,
  prefilledNotes,
}: LeadCaptureFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState<LeadProfile>(defaultProfile);
  const [budgetStr, setBudgetStr] = useState('');
  const [timeframe, setTimeframe] = useState('Até 3 meses');
  const [notes, setNotes] = useState(prefilledNotes || '');
  const [lgpdConsent, setLgpdConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  useEffect(() => {
    if (prefilledNotes) {
      setNotes(prefilledNotes);
    }
  }, [prefilledNotes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError('Informe seu nome completo.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 8) {
      setError('Informe um telefone ou WhatsApp válido com DDD.');
      return;
    }
    if (!lgpdConsent) {
      setError('É necessário concordar com o tratamento de dados conforme a LGPD.');
      return;
    }

    setSubmitting(true);
    try {
      const utm = captureUtmParams();
      const numericBudget = Number(budgetStr.replace(/[^\d]/g, '')) || 0;
      const finalOrigin: LeadOrigin = origin || utm.inferredOrigin || 'Site';

      const id = await submitPublicLead({
        name,
        phone,
        email,
        origin: finalOrigin,
        utmSource: utm.utmSource,
        utmMedium: utm.utmMedium,
        utmCampaign: utm.utmCampaign,
        propertyId,
        propertyTitle,
        budget: numericBudget,
        timeframe,
        profile,
        notes,
        lgpdConsent,
      });
      setSubmittedId(id);
    } catch {
      setError('Não foi possível enviar sua solicitação agora. Tente novamente em instantes.');
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappHref = buildWhatsAppUrl(
    settings?.whatsapp || settings?.phone,
    `Olá Matheus, acabei de enviar meus dados pelo site${propertyTitle ? ` sobre ${propertyTitle}` : ''}. Meu nome é ${name}.`
  );

  if (submittedId) {
    return (
      <div
        className={`rounded-xl border p-6 ${
          dark
            ? 'border-white/15 bg-white/5 text-white'
            : 'border-[#E5E2DC] bg-white text-[#111827]'
        }`}
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-[#A37E4D]" />
          <div className="space-y-2">
            <h4 className="font-display text-xl font-semibold">
              Solicitação registrada com sucesso
            </h4>
            <p className={`text-sm leading-relaxed ${dark ? 'text-white/75' : 'text-[#4B5563]'}`}>
              Seus dados foram encaminhados diretamente ao atendimento privado de Matheus Gonçalves
              para uma análise patrimonial personalizada.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#A37E4D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#8E6C40] transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Continuar no WhatsApp</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  setSubmittedId(null);
                  setName('');
                  setPhone('');
                  setEmail('');
                  setNotes('');
                }}
                className={`text-xs font-medium underline underline-offset-4 cursor-pointer ${
                  dark ? 'text-white/70 hover:text-white' : 'text-[#4B5563] hover:text-[#0C1117]'
                }`}
              >
                Enviar outra solicitação
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const inputClass = dark
    ? 'w-full rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#A37E4D] focus:outline-none'
    : 'w-full rounded-lg border border-[#D8D3CA] bg-white px-3.5 py-2.5 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#A37E4D] focus:outline-none';

  const labelClass = dark
    ? 'block text-xs font-medium text-white/80 mb-1.5'
    : 'block text-xs font-medium text-[#374151] mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {propertyTitle && (
        <div
          className={`rounded-lg border px-3.5 py-2.5 text-xs ${
            dark
              ? 'border-[#A37E4D]/40 bg-[#A37E4D]/10 text-[#E6D5B8]'
              : 'border-[#E5E2DC] bg-[#F5F3EE] text-[#374151]'
          }`}
        >
          Interesse vinculado: <strong className="font-semibold">{propertyTitle}</strong>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Nome completo *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>WhatsApp / Telefone *</label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(47) 99999-9999"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Objetivo principal</label>
          <select
            value={profile}
            onChange={(e) => setProfile(e.target.value as LeadProfile)}
            className={inputClass}
          >
            <option value="Investir" className="text-[#111827]">Investir com lucratividade</option>
            <option value="Morar" className="text-[#111827]">Morar com a família</option>
            <option value="Ambos" className="text-[#111827]">Morar e valorizar patrimônio</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Investimento estimado (R$)</label>
          <input
            type="text"
            value={budgetStr}
            onChange={(e) => setBudgetStr(e.target.value)}
            placeholder="Ex: 3.500.000"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Prazo de decisão</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className={inputClass}
          >
            <option value="Imediato (até 30 dias)" className="text-[#111827]">Imediato (até 30 dias)</option>
            <option value="Até 3 meses" className="text-[#111827]">Até 3 meses</option>
            <option value="3 a 6 meses" className="text-[#111827]">3 a 6 meses</option>
            <option value="Planejamento patrimonial" className="text-[#111827]">Planejamento patrimonial</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Observações ou preferências</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Região desejada, preferência de andar, vista mar ou condição de pagamento..."
          className={inputClass}
        />
      </div>

      <label className={`flex items-start gap-2.5 text-xs cursor-pointer ${dark ? 'text-white/75' : 'text-[#4B5563]'}`}>
        <input
          type="checkbox"
          checked={lgpdConsent}
          onChange={(e) => setLgpdConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-[#D8D3CA] accent-[#A37E4D]"
        />
        <span>
          Concordo com o uso dos meus dados exclusivamente para atendimento imobiliário consultivo por
          Matheus Gonçalves, conforme a Lei Geral de Proteção de Dados (LGPD).
        </span>
      </label>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-[#A37E4D] px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#8E6C40] disabled:opacity-60 cursor-pointer"
      >
        {submitting ? 'Enviando solicitação...' : ctaLabel}
      </button>
    </form>
  );
}
