import { saveMediaAssetRecord } from '../services/firestoreService';
import type { SiteSettings } from '../types';

export interface UploadedMediaResult {
  url: string;
  name: string;
  mimeType: string;
  originalSizeBytes: number;
  sizeBytes: number;
  storage: string;
  kind: 'image' | 'video' | 'document';
}

export interface BatchUploadProgress {
  completed: number;
  total: number;
  currentName: string;
  totalOriginalBytes: number;
  totalCompressedBytes: number;
}

export interface WatermarkOptions {
  enabled: boolean;
  logoUrl?: string;
  position?: 'bottom-right' | 'bottom-left' | 'center';
  opacity?: number;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function isVideoUrl(url: string): boolean {
  const clean = url.split('?')[0].toLowerCase();
  return (
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.m4v') ||
    clean.endsWith('.ogg')
  );
}

async function fetchUrlAsObjectUrl(url: string): Promise<{ objectUrl: string; sizeBytes: number }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao carregar imagem (${res.status})`);
  const blob = await res.blob();
  return { objectUrl: URL.createObjectURL(blob), sizeBytes: blob.size };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Não foi possível decodificar a imagem selecionada.'));
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Falha ao comprimir imagem no navegador.'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

export async function processAndCompressImage(
  source: File | string,
  options: {
    maxDimension?: number;
    quality?: number;
    preserveTransparency?: boolean;
    watermark?: WatermarkOptions;
    fallbackName?: string;
  } = {}
): Promise<{
  blob: Blob;
  filename: string;
  mimeType: string;
  originalSizeBytes: number;
}> {
  const maxDim = options.maxDimension ?? 1920;
  const quality = options.quality ?? 0.84;

  let sourceObjectUrl = '';
  let originalSizeBytes = 0;
  let originalName = options.fallbackName || 'imagem.webp';

  try {
    if (typeof source === 'string') {
      const loaded = await fetchUrlAsObjectUrl(source);
      sourceObjectUrl = loaded.objectUrl;
      originalSizeBytes = loaded.sizeBytes;
      const base = source.split('?')[0].split('/').pop() || 'imagem';
      originalName = base;
    } else {
      sourceObjectUrl = URL.createObjectURL(source);
      originalSizeBytes = source.size;
      originalName = source.name;
    }

    const img = await loadImage(sourceObjectUrl);
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
    const targetW = Math.max(1, Math.round((img.naturalWidth || 1200) * scale));
    const targetH = Math.max(1, Math.round((img.naturalHeight || 800) * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Contexto Canvas 2D indisponível.');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetW, targetH);

    // Apply Official Logo Watermark if configured and enabled
    if (
      !options.preserveTransparency &&
      options.watermark?.enabled &&
      options.watermark.logoUrl
    ) {
      let logoObjectUrl = '';
      try {
        const fetchedLogo = await fetchUrlAsObjectUrl(options.watermark.logoUrl);
        logoObjectUrl = fetchedLogo.objectUrl;
        const logoImg = await loadImage(logoObjectUrl);
        const logoAspect = (logoImg.naturalWidth || 1) / (logoImg.naturalHeight || 1);

        let drawW = Math.min(targetW * 0.24, Math.max(100, Math.round(targetW * 0.16)));
        let drawH = drawW / logoAspect;
        const maxLogoH = targetH * 0.18;
        if (drawH > maxLogoH) {
          drawH = maxLogoH;
          drawW = drawH * logoAspect;
        }

        const pad = Math.max(18, Math.round(targetW * 0.032));
        const pos = options.watermark.position || 'bottom-right';
        let x = targetW - drawW - pad;
        let y = targetH - drawH - pad;

        if (pos === 'bottom-left') {
          x = pad;
          y = targetH - drawH - pad;
        } else if (pos === 'center') {
          x = (targetW - drawW) / 2;
          y = (targetH - drawH) / 2;
        }

        ctx.save();
        ctx.globalAlpha = Math.min(1, Math.max(0.15, options.watermark.opacity ?? 0.78));
        ctx.shadowColor = 'rgba(255, 255, 255, 0.55)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.drawImage(logoImg, x, y, drawW, drawH);
        ctx.restore();
      } catch (err) {
        console.warn('Não foi possível aplicar marca d’água oficial:', err);
      } finally {
        if (logoObjectUrl) URL.revokeObjectURL(logoObjectUrl);
      }
    }

    const baseName = originalName.replace(/\.[^.]+$/, '') || 'midia';
    const targetMime = options.preserveTransparency ? 'image/webp' : 'image/webp';
    let blob = await canvasToBlob(canvas, targetMime, options.preserveTransparency ? 0.92 : quality);

    // Fallback to JPEG if browser cannot encode WebP
    if (blob.type !== 'image/webp' && !options.preserveTransparency) {
      blob = await canvasToBlob(canvas, 'image/jpeg', 0.85);
    }

    const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/jpeg' ? 'jpg' : 'webp';
    return {
      blob,
      filename: `${baseName}.${ext}`,
      mimeType: blob.type || 'image/webp',
      originalSizeBytes,
    };
  } finally {
    if (sourceObjectUrl) URL.revokeObjectURL(sourceObjectUrl);
  }
}

async function uploadBinaryPayload(
  payload: Blob,
  filename: string,
  folder: string,
  contentType: string
): Promise<{
  url: string;
  storage: string;
  sizeBytes: number;
  originalSizeBytes: number;
  mimeType: string;
  filename: string;
}> {
  const res = await fetch('/api/media/upload-binary', {
    method: 'POST',
    headers: {
      'Content-Type': contentType || 'application/octet-stream',
      'X-Filename': encodeURIComponent(filename),
      'X-Folder': encodeURIComponent(folder),
      'X-Content-Type': contentType || 'application/octet-stream',
    },
    body: payload,
  });

  if (!res.ok) {
    let msg = 'Erro ao enviar arquivo para o armazenamento.';
    try {
      const err = (await res.json()) as { error?: string };
      if (err.error) msg = err.error;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  return (await res.json()) as {
    url: string;
    storage: string;
    sizeBytes: number;
    originalSizeBytes: number;
    mimeType: string;
    filename: string;
  };
}

export function buildWatermarkOptions(
  settings?: SiteSettings,
  overrideEnabled?: boolean
): WatermarkOptions {
  return {
    enabled:
      overrideEnabled !== undefined
        ? overrideEnabled
        : Boolean(settings?.officialLogoUrl && settings?.watermarkEnabled !== false),
    logoUrl: settings?.officialLogoUrl || '',
    position: settings?.watermarkPosition || 'bottom-right',
    opacity: typeof settings?.watermarkOpacity === 'number' ? settings.watermarkOpacity : 0.78,
  };
}

export async function uploadSingleDeviceFile(params: {
  file: File;
  folder: string;
  watermark?: WatermarkOptions;
  isLogo?: boolean;
}): Promise<UploadedMediaResult> {
  const { file, folder, watermark, isLogo } = params;
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (isImage) {
    const processed = await processAndCompressImage(file, {
      maxDimension: isLogo ? 800 : 1920,
      quality: isLogo ? 0.92 : 0.84,
      preserveTransparency: Boolean(isLogo),
      watermark: isLogo ? undefined : watermark,
    });

    const uploaded = await uploadBinaryPayload(
      processed.blob,
      processed.filename,
      folder,
      processed.mimeType
    );

    await saveMediaAssetRecord({
      name: uploaded.filename,
      url: uploaded.url,
      folder,
      mimeType: uploaded.mimeType,
      sizeBytes: uploaded.sizeBytes,
    });

    return {
      url: uploaded.url,
      name: uploaded.filename,
      mimeType: uploaded.mimeType,
      originalSizeBytes: processed.originalSizeBytes,
      sizeBytes: uploaded.sizeBytes,
      storage: uploaded.storage,
      kind: 'image',
    };
  }

  const uploaded = await uploadBinaryPayload(
    file,
    file.name,
    folder,
    file.type || (isVideo ? 'video/mp4' : 'application/octet-stream')
  );

  await saveMediaAssetRecord({
    name: uploaded.filename || file.name,
    url: uploaded.url,
    folder,
    mimeType: uploaded.mimeType,
    sizeBytes: uploaded.sizeBytes,
  });

  return {
    url: uploaded.url,
    name: uploaded.filename || file.name,
    mimeType: uploaded.mimeType,
    originalSizeBytes: file.size,
    sizeBytes: uploaded.sizeBytes,
    storage: uploaded.storage,
    kind: isVideo ? 'video' : 'document',
  };
}

export async function uploadBatchDeviceFiles(params: {
  files: File[];
  folder: string;
  watermark?: WatermarkOptions;
  onProgress?: (progress: BatchUploadProgress) => void;
}): Promise<UploadedMediaResult[]> {
  const { files, folder, watermark, onProgress } = params;
  const results: UploadedMediaResult[] = [];
  let completed = 0;
  let totalOriginalBytes = 0;
  let totalCompressedBytes = 0;

  // Process sequentially/small concurrency so browser memory stays smooth even for 50+ files
  for (const file of files) {
    onProgress?.({
      completed,
      total: files.length,
      currentName: file.name,
      totalOriginalBytes,
      totalCompressedBytes,
    });

    const res = await uploadSingleDeviceFile({ file, folder, watermark });
    results.push(res);
    completed += 1;
    totalOriginalBytes += res.originalSizeBytes;
    totalCompressedBytes += res.sizeBytes;

    onProgress?.({
      completed,
      total: files.length,
      currentName: file.name,
      totalOriginalBytes,
      totalCompressedBytes,
    });
  }

  return results;
}

export async function applyWatermarkToExistingImageUrl(
  imageUrl: string,
  folder: string,
  watermark: WatermarkOptions
): Promise<UploadedMediaResult> {
  const processed = await processAndCompressImage(imageUrl, {
    maxDimension: 1920,
    quality: 0.85,
    preserveTransparency: false,
    watermark: { ...watermark, enabled: true },
  });

  const uploaded = await uploadBinaryPayload(
    processed.blob,
    processed.filename,
    folder,
    processed.mimeType
  );

  await saveMediaAssetRecord({
    name: uploaded.filename,
    url: uploaded.url,
    folder,
    mimeType: uploaded.mimeType,
    sizeBytes: uploaded.sizeBytes,
  });

  return {
    url: uploaded.url,
    name: uploaded.filename,
    mimeType: uploaded.mimeType,
    originalSizeBytes: processed.originalSizeBytes,
    sizeBytes: uploaded.sizeBytes,
    storage: uploaded.storage,
    kind: 'image',
  };
}
