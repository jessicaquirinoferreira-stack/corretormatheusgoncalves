import React, { useEffect, useState } from 'react';
import { Award, Film, Loader2, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { DEFAULT_SITE_SETTINGS } from '../../data/seedData';
import { removeMediaAssetRecord, saveSiteSettings } from '../../services/firestoreService';
import type { AdminLog, DifferentialItem, MediaAsset, SiteSettings } from '../../types';
import { formatTimestampDate } from '../../utils/formatters';
import {
  buildWatermarkOptions,
  formatBytes,
  isVideoUrl,
  uploadBatchDeviceFiles,
  type BatchUploadProgress,
} from '../../utils/mediaProcessor';
import { ResilientImage } from '../motion/MotionPrimitives';
import { SingleAssetUploader } from './DeviceMediaUploader';

export function MediaHubView({
  media,
  settings,
}: {
  media: MediaAsset[];
  settings?: SiteSettings;
}) {
  const [folder, setFolder] = useState('imoveis');
  const [applyWatermark, setApplyWatermark] = useState(true);
  const [progress, setProgress] = useState<BatchUploadProgress | null>(null);
  const [blobActive, setBlobActive] = useState<boolean | null>(null);
  const [summaryMsg, setSummaryMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setBlobActive(Boolean(d.blobConfigured)))
      .catch(() => setBlobActive(false));
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setError(null);
    setSummaryMsg(null);

    try {
      const watermark = buildWatermarkOptions(
        settings,
        Boolean(settings?.officialLogoUrl && applyWatermark)
      );
      const uploaded = await uploadBatchDeviceFiles({
        files,
        folder,
        watermark,
        onProgress: setProgress,
      });

      const origTotal = uploaded.reduce((acc, i) => acc + i.originalSizeBytes, 0);
      const compTotal = uploaded.reduce((acc, i) => acc + i.sizeBytes, 0);
      const pct =
        origTotal > 0 ? Math.max(0, Math.round(((origTotal - compTotal) / origTotal) * 100)) : 0;

      setSummaryMsg(
        `${uploaded.length} arquivo(s) otimizado(s) e salvo(s): ${formatBytes(origTotal)} → ${formatBytes(
          compTotal
        )}${pct > 0 ? ` (-${pct}%)` : ''}.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar arquivo.');
    } finally {
      setProgress(null);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#0C1117]">
            Biblioteca de Mídia (Vercel Blob)
          </h1>
          <p className="text-xs text-[#6B7280]">
            {blobActive
              ? 'Vercel Blob ativo via BLOB_READ_WRITE_TOKEN · Upload ilimitado de fotos, vídeos e anexos com compressão.'
              : 'Armazenamento interno ativo (adicione BLOB_READ_WRITE_TOKEN nos Secrets para CDN Vercel Blob).'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {settings?.officialLogoUrl && (
            <label className="inline-flex items-center gap-2 rounded-lg border border-[#D8D3CA] bg-white px-3 py-2 text-xs font-medium text-[#0C1117] cursor-pointer">
              <input
                type="checkbox"
                checked={applyWatermark}
                onChange={(e) => setApplyWatermark(e.target.checked)}
                className="accent-[#A37E4D]"
              />
              <Award className="h-3.5 w-3.5 text-[#A37E4D]" />
              <span>Marca d&apos;água oficial</span>
            </label>
          )}

          <select
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            className="rounded-lg border border-[#D8D3CA] bg-white px-3 py-2 text-xs font-medium"
          >
            <option value="imoveis">Pasta: Imóveis</option>
            <option value="empreendimentos">Pasta: Empreendimentos</option>
            <option value="landing-pages">Pasta: Landing Pages</option>
            <option value="branding">Pasta: Branding / Logo</option>
            <option value="documentos">Pasta: Documentos</option>
          </select>

          <label className="inline-flex items-center gap-2 rounded-lg bg-[#0C1117] px-4 py-2 text-xs font-semibold text-white cursor-pointer">
            {progress ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            <span>{progress ? 'Otimizando e enviando...' : 'Subir Fotos / Vídeos'}</span>
            <input
              type="file"
              multiple
              accept="image/*,video/*,application/pdf,.doc,.docx"
              onChange={handleUpload}
              className="hidden"
              disabled={Boolean(progress)}
            />
          </label>
        </div>
      </div>

      {progress && (
        <div className="rounded-xl border border-[#A37E4D]/30 bg-white p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-[#0C1117]">
            <span className="truncate">
              Processando {progress.completed + 1} de {progress.total}: {progress.currentName}
            </span>
            <span className="font-mono text-[#8E6C40] tabular-nums">
              {Math.round(((progress.completed + 0.5) / Math.max(1, progress.total)) * 100)}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F0EDE6]">
            <div
              className="h-full bg-[#A37E4D] transition-all duration-200"
              style={{
                width: `${Math.round(((progress.completed + 0.5) / Math.max(1, progress.total)) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {summaryMsg && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-800">
          {summaryMsg}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}

      {media.length === 0 ? (
        <div className="rounded-xl border border-[#E5E2DC] bg-white p-10 text-center text-sm text-[#6B7280]">
          Nenhum arquivo enviado ainda. Selecione quantas fotos, vídeos ou documentos desejar do seu dispositivo.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {media.map((m) => {
            const isVideo = (m.mimeType || '').startsWith('video/') || isVideoUrl(m.url);
            const isImage = (m.mimeType || '').startsWith('image/') && !isVideo;
            return (
              <div key={m.id} className="rounded-xl border border-[#E5E2DC] bg-white overflow-hidden">
                <div className="aspect-[4/3] bg-[#0C1117] flex items-center justify-center">
                  {isVideo ? (
                    <video
                      src={m.url}
                      controls
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  ) : isImage || !m.mimeType ? (
                    <ResilientImage src={m.url} alt={m.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-center text-white/80 p-4 space-y-1">
                      <Film className="h-6 w-6 mx-auto text-[#C8B08A]" />
                      <div className="text-xs truncate max-w-[180px]">{m.name}</div>
                    </div>
                  )}
                </div>
                <div className="p-3.5 space-y-2">
                  <div className="text-xs font-semibold text-[#0C1117] truncate">{m.name}</div>
                  <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                    <span>Pasta: {m.folder}</span>
                    {m.sizeBytes ? (
                      <span className="font-mono tabular-nums">{formatBytes(m.sizeBytes)}</span>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-[#8E6C40] hover:underline"
                    >
                      Abrir arquivo
                    </a>
                    <button
                      type="button"
                      onClick={() => removeMediaAssetRecord(m)}
                      className="text-rose-600 hover:text-rose-800 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SiteSettingsView({
  settings,
  media,
}: {
  settings: SiteSettings;
  media?: MediaAsset[];
}) {
  const [form, setForm] = useState<SiteSettings>({
    ...DEFAULT_SITE_SETTINGS,
    ...settings,
    differentials:
      settings.differentials && settings.differentials.length > 0
        ? settings.differentials
        : DEFAULT_SITE_SETTINGS.differentials,
  });
  const [sectionTab, setSectionTab] = useState<'geral' | 'hero' | 'sobre' | 'diferenciais'>('geral');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm((prev) => ({
      ...DEFAULT_SITE_SETTINGS,
      ...prev,
      ...settings,
      differentials:
        settings.differentials && settings.differentials.length > 0
          ? settings.differentials
          : prev.differentials || DEFAULT_SITE_SETTINGS.differentials,
    }));
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSiteSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateDiff = (idx: number, patch: Partial<DifferentialItem>) => {
    const next = (form.differentials || DEFAULT_SITE_SETTINGS.differentials!).map((item, i) =>
      i === idx ? { ...item, ...patch } : item
    );
    setForm({ ...form, differentials: next });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#0C1117]">
            Editor Completo do Site &amp; Marca d&apos;Água Oficial
          </h1>
          <p className="text-xs text-[#6B7280]">
            Gerencie sua Logo Oficial (marca d&apos;água automática nas fotos), imagens do dispositivo, textos, contatos e SEO
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-xs font-semibold text-emerald-700">
              Alterações publicadas no site!
            </span>
          )}
          <button
            type="submit"
            className="rounded-lg bg-[#0C1117] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#1E293B] cursor-pointer"
          >
            Publicar Alterações no Site
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-[#E5E2DC] bg-white p-1.5">
        {[
          { id: 'geral', label: 'Logo Oficial, Contatos & SEO' },
          { id: 'hero', label: 'Capa & Hero Principal' },
          { id: 'sobre', label: 'Sobre Matheus & Prêmio' },
          { id: 'diferenciais', label: 'Diferenciais & CTA Final' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSectionTab(tab.id as typeof sectionTab)}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              sectionTab === tab.id
                ? 'bg-[#0C1117] text-white'
                : 'text-[#4B5563] hover:bg-[#F5F3EE]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {sectionTab === 'geral' && (
        <div className="rounded-xl border border-[#E5E2DC] bg-white p-6 space-y-5">
          {/* Official Logo & Watermark Configuration */}
          <div className="space-y-4 border-b border-[#F0EDE6] pb-5">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#0C1117]">
                Logo Oficial &amp; Marca d&apos;Água Automática
              </h2>
              <p className="text-xs text-[#6B7280]">
                Suba sua logo oficial (preferencialmente PNG transparente). Ela será aplicada automaticamente como marca d&apos;água nas fotos dos imóveis e empreendimentos.
              </p>
            </div>

            <SingleAssetUploader
              label="Logo Oficial da Marca"
              value={form.officialLogoUrl || ''}
              onChange={(url) => setForm({ ...form, officialLogoUrl: url, watermarkEnabled: true })}
              folder="branding"
              media={media}
              isLogo={true}
              helperText="Preserva transparência e otimiza automaticamente no Vercel Blob"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-1">
              <label className="flex items-center gap-2 rounded-lg border border-[#E5E2DC] px-3 py-2 text-xs font-medium text-[#0C1117] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.watermarkEnabled !== false}
                  onChange={(e) => setForm({ ...form, watermarkEnabled: e.target.checked })}
                  className="accent-[#A37E4D]"
                />
                <span>Ativar marca d&apos;água ao enviar fotos</span>
              </label>

              <div>
                <label className="block text-[11px] font-medium text-[#4B5563] mb-1">
                  Posição da Marca d&apos;Água
                </label>
                <select
                  value={form.watermarkPosition || 'bottom-right'}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      watermarkPosition: e.target.value as SiteSettings['watermarkPosition'],
                    })
                  }
                  className="w-full rounded-lg border border-[#D8D3CA] px-3 py-1.5 text-xs"
                >
                  <option value="bottom-right">Canto inferior direito</option>
                  <option value="bottom-left">Canto inferior esquerdo</option>
                  <option value="center">Centro da foto</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-[#4B5563] mb-1">
                  <span>Opacidade</span>
                  <span className="font-mono tabular-nums">
                    {Math.round((form.watermarkOpacity ?? 0.78) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={25}
                  max={100}
                  step={5}
                  value={Math.round((form.watermarkOpacity ?? 0.78) * 100)}
                  onChange={(e) =>
                    setForm({ ...form, watermarkOpacity: Number(e.target.value) / 100 })
                  }
                  className="w-full accent-[#A37E4D]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Nome da Marca</label>
              <input
                required
                value={form.brandName}
                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Instagram</label>
              <input
                required
                value={form.instagramHandle}
                onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })}
                className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">CRECI (opcional)</label>
              <input
                placeholder="Deixe vazio ou preencha seu CRECI"
                value={form.creci || ''}
                onChange={(e) => setForm({ ...form, creci: e.target.value })}
                className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">WhatsApp Oficial (com DDD)</label>
              <input
                placeholder="Ex: 47999999999"
                value={form.whatsapp || ''}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Telefone</label>
              <input
                placeholder="Pendente de preenchimento"
                value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">E-mail Comercial</label>
              <input
                type="email"
                placeholder="Pendente de preenchimento"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Endereço do Escritório</label>
            <input
              placeholder="Pendente de preenchimento"
              value={form.address || ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-[#F0EDE6] pt-4">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Título SEO (Google)</label>
              <input
                value={form.seoTitle || ''}
                onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Descrição SEO</label>
              <input
                value={form.seoDescription || ''}
                onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Texto Institucional do Rodapé</label>
            <textarea
              rows={2}
              value={form.footerNote || ''}
              onChange={(e) => setForm({ ...form, footerNote: e.target.value })}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      {sectionTab === 'hero' && (
        <div className="rounded-xl border border-[#E5E2DC] bg-white p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Título Principal (Hero)</label>
            <input
              required
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Subtítulo do Hero</label>
            <textarea
              rows={3}
              value={form.subheadline || ''}
              onChange={(e) => setForm({ ...form, subheadline: e.target.value })}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Botão Principal</label>
              <input
                value={form.heroCtaPrimary || ''}
                onChange={(e) => setForm({ ...form, heroCtaPrimary: e.target.value })}
                className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Link Secundário</label>
              <input
                value={form.heroCtaSecondary || ''}
                onChange={(e) => setForm({ ...form, heroCtaSecondary: e.target.value })}
                className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
            </div>
          </div>

          <SingleAssetUploader
            label="Imagem de Fundo do Hero"
            value={form.heroImage || ''}
            onChange={(url) => setForm({ ...form, heroImage: url })}
            folder="site"
            settings={form}
            media={media}
            helperText="Envie diretamente do seu dispositivo com compressão automática para Vercel Blob"
          />
        </div>
      )}

      {sectionTab === 'sobre' && (
        <div className="rounded-xl border border-[#E5E2DC] bg-white p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Chamada da Seção</label>
              <input
                value={form.aboutKicker || ''}
                onChange={(e) => setForm({ ...form, aboutKicker: e.target.value })}
                className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Título (Nome)</label>
              <input
                value={form.aboutTitle || ''}
                onChange={(e) => setForm({ ...form, aboutTitle: e.target.value })}
                className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Subtítulo / Bio curta</label>
            <input
              value={form.aboutSubtitle || ''}
              onChange={(e) => setForm({ ...form, aboutSubtitle: e.target.value })}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Parágrafo 1 da História</label>
            <textarea
              rows={3}
              value={form.aboutBio1 || ''}
              onChange={(e) => setForm({ ...form, aboutBio1: e.target.value })}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Parágrafo 2 da História</label>
            <textarea
              rows={3}
              value={form.aboutBio2 || ''}
              onChange={(e) => setForm({ ...form, aboutBio2: e.target.value })}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            />
          </div>

          <SingleAssetUploader
            label="Foto de Retrato (Seção Sobre)"
            value={form.aboutImage || ''}
            onChange={(url) => setForm({ ...form, aboutImage: url })}
            folder="site"
            settings={form}
            media={media}
            helperText="Suba do seu dispositivo ou escolha do acervo interno"
          />

          <div className="grid grid-cols-1 gap-4 border-t border-[#F0EDE6] pt-4">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Título do Reconhecimento / Prêmio</label>
              <input
                value={form.awardTitle || ''}
                onChange={(e) => setForm({ ...form, awardTitle: e.target.value })}
                className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Descrição do Reconhecimento</label>
              <textarea
                rows={2}
                value={form.awardDescription || ''}
                onChange={(e) => setForm({ ...form, awardDescription: e.target.value })}
                className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {sectionTab === 'diferenciais' && (
        <div className="rounded-xl border border-[#E5E2DC] bg-white p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Título da Seção de Diferenciais</label>
            <input
              value={form.differentialsTitle || ''}
              onChange={(e) => setForm({ ...form, differentialsTitle: e.target.value })}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(form.differentials || DEFAULT_SITE_SETTINGS.differentials!).map((diff, idx) => (
              <div key={idx} className="rounded-lg border border-[#E5E2DC] p-4 space-y-2">
                <div className="flex gap-2">
                  <input
                    value={diff.num}
                    onChange={(e) => updateDiff(idx, { num: e.target.value })}
                    className="w-14 rounded border border-[#D8D3CA] px-2 py-1 text-xs font-mono"
                  />
                  <input
                    value={diff.title}
                    onChange={(e) => updateDiff(idx, { title: e.target.value })}
                    className="flex-1 rounded border border-[#D8D3CA] px-2.5 py-1 text-xs font-semibold"
                  />
                </div>
                <textarea
                  rows={2}
                  value={diff.desc}
                  onChange={(e) => updateDiff(idx, { desc: e.target.value })}
                  className="w-full rounded border border-[#D8D3CA] px-2.5 py-1.5 text-xs"
                />
              </div>
            ))}
          </div>

          <div className="border-t border-[#F0EDE6] pt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Título da Chamada Final (CTA)</label>
              <input
                value={form.ctaTitle || ''}
                onChange={(e) => setForm({ ...form, ctaTitle: e.target.value })}
                className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Subtítulo da Chamada Final</label>
              <textarea
                rows={2}
                value={form.ctaSubtitle || ''}
                onChange={(e) => setForm({ ...form, ctaSubtitle: e.target.value })}
                className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

export function SecurityLgpdLogsView({ logs }: { logs: AdminLog[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[#0C1117]">
          Segurança, Auditoria &amp; LGPD
        </h1>
        <p className="text-xs text-[#6B7280]">
          Registro de ações administrativas e conformidade com a Lei Geral de Proteção de Dados
        </p>
      </div>

      <div className="rounded-xl border border-[#E5E2DC] bg-white p-5 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-[#A37E4D] shrink-0 mt-0.5" />
        <div className="text-xs text-[#374151] space-y-1">
          <div className="font-semibold text-[#0C1117]">Proteção Zero-Trust Ativa</div>
          <p>
            Todas as coleções privadas do CRM (leads, clientes, visitas, propostas, tarefas e logs)
            estão protegidas por autenticação administrativa e regras de segurança no Firestore.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[#E5E2DC] bg-white overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E5E2DC] text-[#6B7280]">
              <th className="py-3 px-4 font-medium">Data</th>
              <th className="py-3 px-4 font-medium">Responsável</th>
              <th className="py-3 px-4 font-medium">Ação</th>
              <th className="py-3 px-4 font-medium">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[#9CA3AF]">
                  Nenhum log administrativo registrado ainda.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-[#F5F3EE] last:border-0">
                  <td className="py-2.5 px-4 font-mono text-[#6B7280] tabular-nums">
                    {formatTimestampDate(log.createdAt)}
                  </td>
                  <td className="py-2.5 px-4 text-[#111827]">{log.actorEmail}</td>
                  <td className="py-2.5 px-4 font-medium text-[#0C1117]">{log.action}</td>
                  <td className="py-2.5 px-4 text-[#4B5563]">{log.details || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
