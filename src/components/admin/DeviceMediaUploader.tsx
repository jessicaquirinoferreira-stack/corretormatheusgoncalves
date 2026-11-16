import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  Film,
  ImagePlus,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
import { saveSiteSettings } from '../../services/firestoreService';
import type { MediaAsset, SiteSettings } from '../../types';
import {
  applyWatermarkToExistingImageUrl,
  buildWatermarkOptions,
  formatBytes,
  isVideoUrl,
  uploadBatchDeviceFiles,
  uploadSingleDeviceFile,
  type BatchUploadProgress,
} from '../../utils/mediaProcessor';
import { ResilientImage } from '../motion/MotionPrimitives';

export function SingleAssetUploader({
  label,
  value,
  onChange,
  folder,
  accept = 'image/*',
  settings,
  media = [],
  isLogo = false,
  applyWatermark = false,
  helperText,
}: {
  label: string;
  value?: string;
  onChange: (nextUrl: string) => void;
  folder: string;
  accept?: string;
  settings?: SiteSettings;
  media?: MediaAsset[];
  isLogo?: boolean;
  applyWatermark?: boolean;
  helperText?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);

  const imageAssets = media.filter(
    (m) => (m.mimeType || '').startsWith('image/') || !isVideoUrl(m.url)
  );

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setStats(null);
    setUploading(true);
    try {
      const res = await uploadSingleDeviceFile({
        file,
        folder,
        isLogo,
        watermark:
          !isLogo && applyWatermark && settings?.officialLogoUrl
            ? buildWatermarkOptions(settings, true)
            : undefined,
      });
      onChange(res.url);
      if (res.originalSizeBytes > 0) {
        const savedPct = Math.max(
          0,
          Math.round(((res.originalSizeBytes - res.sizeBytes) / res.originalSizeBytes) * 100)
        );
        setStats(
          `Otimizado: ${formatBytes(res.originalSizeBytes)} → ${formatBytes(res.sizeBytes)}${
            savedPct > 0 ? ` (-${savedPct}%)` : ''
          }`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar arquivo.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F6] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-[#0C1117]">{label}</div>
          {helperText && <div className="text-[11px] text-[#6B7280]">{helperText}</div>}
        </div>
        <div className="flex items-center gap-2">
          {imageAssets.length > 0 && accept.includes('image') && (
            <button
              type="button"
              onClick={() => setShowLibrary((v) => !v)}
              className="rounded-lg border border-[#D8D3CA] bg-white px-3 py-1.5 text-[11px] font-medium text-[#374151] hover:bg-[#F5F3EE] cursor-pointer"
            >
              {showLibrary ? 'Fechar acervo' : 'Escolher do acervo'}
            </button>
          )}
          <label className="inline-flex items-center gap-1.5 rounded-lg bg-[#0C1117] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#1E293B] cursor-pointer">
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            <span>{uploading ? 'Otimizando...' : 'Subir do Dispositivo'}</span>
            <input
              type="file"
              accept={accept}
              onChange={handleFile}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {value && (
        <div className="flex items-center gap-4 rounded-lg border border-[#E5E2DC] bg-white p-2.5">
          {accept.includes('image') ? (
            <div
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-md border border-[#F0EDE6] ${
                isLogo ? 'bg-[#0C1117] p-2 flex items-center justify-center' : 'bg-[#111827]'
              }`}
            >
              <ResilientImage
                src={value}
                alt={label}
                className={`h-full w-full ${isLogo ? 'object-contain' : 'object-cover'}`}
              />
            </div>
          ) : (
            <div className="h-12 px-3 rounded-md bg-[#FAF9F6] flex items-center text-xs font-medium text-[#0C1117]">
              Arquivo anexado
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="text-xs font-medium text-[#0C1117] truncate">
              {value.split('?')[0].split('/').pop() || 'Arquivo armazenado'}
            </div>
            {stats ? (
              <div className="text-[11px] font-medium text-emerald-700">{stats}</div>
            ) : (
              <div className="text-[11px] text-[#6B7280]">Armazenado via Vercel Blob Storage</div>
            )}
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            title="Remover"
            className="p-1.5 text-rose-600 hover:text-rose-800 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {showLibrary && imageAssets.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 pt-1">
          {imageAssets.slice(0, 15).map((item) => {
            const active = value === item.url;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange(item.url);
                  setShowLibrary(false);
                }}
                className={`group relative aspect-[4/3] overflow-hidden rounded-lg border cursor-pointer ${
                  active ? 'border-[#A37E4D] ring-2 ring-[#A37E4D]' : 'border-[#E5E2DC]'
                }`}
              >
                <ResilientImage
                  src={item.url}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
                {active && (
                  <span className="absolute top-1 right-1 rounded-full bg-[#A37E4D] p-0.5 text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}
    </div>
  );
}

export function MultiMediaGalleryUploader({
  folder,
  coverImage,
  gallery,
  videos,
  onChange,
  settings,
  media = [],
}: {
  folder: string;
  coverImage: string;
  gallery: string[];
  videos: string[];
  onChange: (next: { coverImage: string; gallery: string[]; videos: string[] }) => void;
  settings?: SiteSettings;
  media?: MediaAsset[];
}) {
  const [applyWatermark, setApplyWatermark] = useState(true);
  const [progress, setProgress] = useState<BatchUploadProgress | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [reapplyingWatermark, setReapplyingWatermark] = useState(false);
  const [summaryMsg, setSummaryMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);

  const hasOfficialLogo = Boolean(settings?.officialLogoUrl);
  const allImages = Array.from(
    new Set([coverImage, ...gallery].filter((u) => Boolean(u) && !isVideoUrl(u)))
  );

  const handleBatchUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setError(null);
    setSummaryMsg(null);

    try {
      const watermark = buildWatermarkOptions(
        settings,
        hasOfficialLogo && applyWatermark
      );
      const uploaded = await uploadBatchDeviceFiles({
        files,
        folder,
        watermark,
        onProgress: setProgress,
      });

      const newImages = uploaded.filter((u) => u.kind === 'image').map((u) => u.url);
      const newVideos = uploaded.filter((u) => u.kind === 'video').map((u) => u.url);

      const nextGallery = Array.from(new Set([...allImages, ...newImages]));
      const nextCover = coverImage || nextGallery[0] || '';
      const nextVideos = Array.from(new Set([...videos, ...newVideos]));

      onChange({
        coverImage: nextCover,
        gallery: nextGallery,
        videos: nextVideos,
      });

      const origTotal = uploaded.reduce((acc, i) => acc + i.originalSizeBytes, 0);
      const compTotal = uploaded.reduce((acc, i) => acc + i.sizeBytes, 0);
      const pct = origTotal > 0 ? Math.max(0, Math.round(((origTotal - compTotal) / origTotal) * 100)) : 0;

      setSummaryMsg(
        `${uploaded.length} arquivo(s) enviado(s) com sucesso (${formatBytes(origTotal)} → ${formatBytes(
          compTotal
        )}${pct > 0 ? `, economia de ${pct}%` : ''}).`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar arquivos.');
    } finally {
      setProgress(null);
    }
  };

  const handleQuickLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;
    setUploadingLogo(true);
    setError(null);
    try {
      const uploaded = await uploadSingleDeviceFile({
        file,
        folder: 'branding',
        isLogo: true,
      });
      await saveSiteSettings({
        ...settings,
        officialLogoUrl: uploaded.url,
        watermarkEnabled: true,
      });
      setApplyWatermark(true);
      setSummaryMsg('Logo Oficial configurada! Todas as novas fotos receberão sua marca d’água.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar Logo Oficial.');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleWatermarkExistingPhotos = async () => {
    if (!hasOfficialLogo || allImages.length === 0) return;
    setReapplyingWatermark(true);
    setError(null);
    setSummaryMsg(null);

    try {
      const watermark = buildWatermarkOptions(settings, true);
      const updatedMap = new Map<string, string>();
      for (let i = 0; i < allImages.length; i += 1) {
        const src = allImages[i];
        setProgress({
          completed: i,
          total: allImages.length,
          currentName: 'Aplicando marca d’água oficial...',
          totalOriginalBytes: 0,
          totalCompressedBytes: 0,
        });
        const res = await applyWatermarkToExistingImageUrl(src, folder, watermark);
        updatedMap.set(src, res.url);
      }

      const nextGallery = allImages.map((u) => updatedMap.get(u) || u);
      const nextCover = updatedMap.get(coverImage) || nextGallery[0] || '';
      onChange({ coverImage: nextCover, gallery: nextGallery, videos });
      setSummaryMsg(
        `Marca d’água oficial aplicada e otimizada em ${allImages.length} foto(s) no Vercel Blob.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível aplicar a marca d’água em uma das imagens.'
      );
    } finally {
      setProgress(null);
      setReapplyingWatermark(false);
    }
  };

  const moveImage = (idx: number, dir: -1 | 1) => {
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= allImages.length) return;
    const copy = allImages.slice();
    const [item] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, item);
    onChange({ coverImage: copy[0] || '', gallery: copy, videos });
  };

  const removeImage = (url: string) => {
    const nextGallery = allImages.filter((u) => u !== url);
    const nextCover = coverImage === url ? nextGallery[0] || '' : coverImage;
    onChange({ coverImage: nextCover, gallery: nextGallery, videos });
  };

  const removeVideo = (url: string) => {
    onChange({ coverImage, gallery: allImages, videos: videos.filter((v) => v !== url) });
  };

  return (
    <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F6] p-4 space-y-4">
      {/* Header + Watermark Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E2DC] pb-3">
        <div>
          <div className="text-xs font-semibold text-[#0C1117]">
            Galeria de Fotos &amp; Vídeos (Upload Ilimitado · Vercel Blob)
          </div>
          <p className="text-[11px] text-[#6B7280]">
            Compressão automática inteligente mantendo nitidez máxima · Zero links externos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasOfficialLogo ? (
            <label className="inline-flex items-center gap-2 rounded-lg border border-[#D8D3CA] bg-white px-3 py-1.5 text-[11px] font-medium text-[#0C1117] cursor-pointer">
              <input
                type="checkbox"
                checked={applyWatermark}
                onChange={(e) => setApplyWatermark(e.target.checked)}
                className="accent-[#A37E4D]"
              />
              <Award className="h-3.5 w-3.5 text-[#A37E4D]" />
              <span>Marca d&apos;água Oficial automática</span>
            </label>
          ) : (
            <label className="inline-flex items-center gap-1.5 rounded-lg border border-[#A37E4D]/40 bg-white px-3 py-1.5 text-[11px] font-semibold text-[#8E6C40] hover:bg-[#FAF9F6] cursor-pointer">
              {uploadingLogo ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Award className="h-3.5 w-3.5" />
              )}
              <span>{uploadingLogo ? 'Enviando Logo...' : 'Subir Logo Oficial p/ Marca d’Água'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleQuickLogoUpload}
                disabled={uploadingLogo}
                className="hidden"
              />
            </label>
          )}

          {hasOfficialLogo && allImages.length > 0 && (
            <button
              type="button"
              disabled={reapplyingWatermark || Boolean(progress)}
              onClick={handleWatermarkExistingPhotos}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D8D3CA] bg-white px-3 py-1.5 text-[11px] font-medium text-[#0C1117] hover:bg-[#F5F3EE] disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#A37E4D]" />
              <span>Carimbar fotos atuais</span>
            </button>
          )}
        </div>
      </div>

      {/* Upload Action Buttons (Unlimited multi-select) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#D8D3CA] bg-white px-4 py-4 text-xs font-semibold text-[#0C1117] hover:border-[#A37E4D] transition-colors cursor-pointer">
          <ImagePlus className="h-4 w-4 text-[#A37E4D]" />
          <span>Subir Fotos (quantas quiser)</span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => {
              handleBatchUpload(e.target.files);
              e.target.value = '';
            }}
            disabled={Boolean(progress)}
            className="hidden"
          />
        </label>

        <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#D8D3CA] bg-white px-4 py-4 text-xs font-semibold text-[#0C1117] hover:border-[#A37E4D] transition-colors cursor-pointer">
          <Video className="h-4 w-4 text-[#A37E4D]" />
          <span>Subir Vídeos (quantos quiser)</span>
          <input
            type="file"
            multiple
            accept="video/*"
            onChange={(e) => {
              handleBatchUpload(e.target.files);
              e.target.value = '';
            }}
            disabled={Boolean(progress)}
            className="hidden"
          />
        </label>
      </div>

      {/* Optional pick from already uploaded Media Hub */}
      {media.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowLibrary((v) => !v)}
            className="text-[11px] font-medium text-[#8E6C40] underline underline-offset-4 cursor-pointer"
          >
            {showLibrary
              ? 'Ocultar acervo do Vercel Blob'
              : 'Adicionar fotos/vídeos já enviados ao acervo'}
          </button>
        </div>
      )}

      {showLibrary && media.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 rounded-lg border border-[#E5E2DC] bg-white p-3">
          {media.map((m) => {
            const isVid = (m.mimeType || '').startsWith('video/') || isVideoUrl(m.url);
            const alreadyAdded = isVid ? videos.includes(m.url) : allImages.includes(m.url);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  if (isVid) {
                    if (!videos.includes(m.url)) {
                      onChange({ coverImage, gallery: allImages, videos: [...videos, m.url] });
                    }
                  } else if (!allImages.includes(m.url)) {
                    const nextG = [...allImages, m.url];
                    onChange({ coverImage: coverImage || nextG[0], gallery: nextG, videos });
                  }
                }}
                className={`relative aspect-[4/3] overflow-hidden rounded-lg border cursor-pointer ${
                  alreadyAdded ? 'border-[#A37E4D] ring-2 ring-[#A37E4D]' : 'border-[#E5E2DC]'
                }`}
              >
                {isVid ? (
                  <div className="h-full w-full bg-[#0C1117] flex flex-col items-center justify-center text-white p-1">
                    <Film className="h-4 w-4 text-[#C8B08A]" />
                    <span className="text-[9px] truncate w-full text-center mt-1">{m.name}</span>
                  </div>
                ) : (
                  <ResilientImage src={m.url} alt={m.name} className="h-full w-full object-cover" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Upload Progress Indicator */}
      {progress && (
        <div className="rounded-lg border border-[#A37E4D]/30 bg-white p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-[#0C1117]">
            <span className="inline-flex items-center gap-2 truncate">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#A37E4D]" />
              <span className="truncate">
                Otimizando &amp; enviando {progress.completed + 1} de {progress.total}:{' '}
                {progress.currentName}
              </span>
            </span>
            <span className="font-mono text-[11px] text-[#8E6C40] tabular-nums">
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
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {summaryMsg}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Photos Grid */}
      {allImages.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-[#374151]">
            Fotos ({allImages.length})
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {allImages.map((url, idx) => {
              const isCover = url === coverImage || (!coverImage && idx === 0);
              return (
                <div
                  key={`${url}-${idx}`}
                  className={`rounded-lg border bg-white overflow-hidden ${
                    isCover ? 'border-[#A37E4D] ring-1 ring-[#A37E4D]' : 'border-[#E5E2DC]'
                  }`}
                >
                  <div className="aspect-[4/3] bg-[#111827] relative">
                    <ResilientImage
                      src={url}
                      alt={`Foto ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-2 flex items-center justify-between gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => onChange({ coverImage: url, gallery: allImages, videos })}
                      className={`font-semibold cursor-pointer ${
                        isCover ? 'text-[#8E6C40]' : 'text-[#4B5563] hover:text-[#0C1117]'
                      }`}
                    >
                      {isCover ? 'Capa Principal' : 'Definir Capa'}
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveImage(idx, -1)}
                        disabled={idx === 0}
                        className="p-0.5 text-[#6B7280] disabled:opacity-30 cursor-pointer"
                        title="Mover esquerda"
                      >
                        <ArrowLeft className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(idx, 1)}
                        disabled={idx === allImages.length - 1}
                        className="p-0.5 text-[#6B7280] disabled:opacity-30 cursor-pointer"
                        title="Mover direita"
                      >
                        <ArrowRight className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className="p-0.5 text-rose-600 hover:text-rose-800 cursor-pointer"
                        title="Remover foto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Videos Grid */}
      {videos.length > 0 && (
        <div className="space-y-2 border-t border-[#E5E2DC] pt-3">
          <div className="text-xs font-semibold text-[#374151]">
            Vídeos ({videos.length})
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {videos.map((vUrl, idx) => (
              <div
                key={`${vUrl}-${idx}`}
                className="rounded-lg border border-[#E5E2DC] bg-white overflow-hidden"
              >
                <video
                  src={vUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="aspect-video w-full bg-[#090D12] object-cover"
                />
                <div className="px-3 py-2 flex items-center justify-between text-xs">
                  <span className="text-[#4B5563] truncate">Vídeo {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeVideo(vUrl)}
                    className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remover</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
