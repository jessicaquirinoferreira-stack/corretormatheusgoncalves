import 'dotenv/config';
import { execFile } from 'child_process';
import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { put, del } from '@vercel/blob';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

const isVercel = Boolean(process.env.VERCEL);

function resolveWritableUploadDir(): string {
  const preferred = path.resolve(__dirname, 'public/uploads');
  try {
    if (!isVercel) {
      if (!fs.existsSync(preferred)) {
        fs.mkdirSync(preferred, { recursive: true });
      }
      return preferred;
    }
  } catch (err) {
    console.warn('Public uploads directory is read-only, falling back to tmp:', err);
  }
  const tmpDir = path.join(os.tmpdir(), 'mg-uploads');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  return tmpDir;
}

const localUploadDir = resolveWritableUploadDir();
app.use('/uploads', express.static(localUploadDir));
const publicDir = fs.existsSync(path.resolve(__dirname, 'public'))
  ? path.resolve(__dirname, 'public')
  : path.resolve(process.cwd(), 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// Persistent server store for CMS + CRM synchronized with admin@x.com panel
const bundledDataDir = fs.existsSync(path.resolve(__dirname, '.data/cms-crm-store.json'))
  ? path.resolve(__dirname, '.data')
  : path.resolve(process.cwd(), '.data');
const bundledStoreFile = path.join(bundledDataDir, 'cms-crm-store.json');
const runtimeStoreFile = isVercel
  ? path.join(os.tmpdir(), 'mg-cms-crm-store.json')
  : bundledStoreFile;

if (!isVercel) {
  try {
    if (!fs.existsSync(bundledDataDir)) {
      fs.mkdirSync(bundledDataDir, { recursive: true });
    }
  } catch (err) {
    console.warn('Data directory creation skipped (read-only):', err);
  }
}

interface StoreState {
  settings: Record<string, unknown> | null;
  properties: Record<string, unknown>[];
  empreendimentos: Record<string, unknown>[];
  landingPages: Record<string, unknown>[];
  pipelineStages: Record<string, unknown>[];
  leads: Record<string, unknown>[];
  clients: Record<string, unknown>[];
  activities: Record<string, unknown>[];
  visits: Record<string, unknown>[];
  proposals: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
  media: Record<string, unknown>[];
  analytics: Record<string, unknown>[];
  adminLogs: Record<string, unknown>[];
}

const DEFAULT_STORE: StoreState = {
  settings: null,
  properties: [],
  empreendimentos: [],
  landingPages: [],
  pipelineStages: [],
  leads: [],
  clients: [],
  activities: [],
  visits: [],
  proposals: [],
  tasks: [],
  media: [],
  analytics: [],
  adminLogs: [],
};

function readStore(): StoreState {
  try {
    if (runtimeStoreFile !== bundledStoreFile && fs.existsSync(runtimeStoreFile)) {
      const raw = fs.readFileSync(runtimeStoreFile, 'utf-8');
      return { ...DEFAULT_STORE, ...(JSON.parse(raw) as Partial<StoreState>) };
    }
    if (fs.existsSync(bundledStoreFile)) {
      const raw = fs.readFileSync(bundledStoreFile, 'utf-8');
      return { ...DEFAULT_STORE, ...(JSON.parse(raw) as Partial<StoreState>) };
    }
  } catch (err) {
    console.error('Failed reading store:', err);
  }
  return { ...DEFAULT_STORE };
}

function writeStore(next: StoreState): void {
  const payload = JSON.stringify(next, null, 2);
  try {
    fs.writeFileSync(runtimeStoreFile, payload, 'utf-8');
  } catch (err) {
    const fallbackFile = path.join(os.tmpdir(), 'mg-cms-crm-store.json');
    try {
      fs.writeFileSync(fallbackFile, payload, 'utf-8');
    } catch (fallbackErr) {
      console.warn('Failed writing store to tmp fallback:', fallbackErr, err);
    }
  }
}

// Admin authentication (admin@x.com / admin4321)
const ADMIN_EMAIL = (process.env.ADMIN_LOGIN_EMAIL || 'admin@x.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_LOGIN_PASSWORD || 'admin4321';
const TOKEN_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  crypto.createHash('sha256').update(`${ADMIN_EMAIL}:${ADMIN_PASSWORD}:mg-crm`).digest('hex');

function signAdminToken(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({ email, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token?: string): string | null {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  if (sig !== expected) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as {
      email?: string;
      exp?: number;
    };
    if (!decoded.email || !decoded.exp || decoded.exp < Date.now()) return null;
    return decoded.email;
  } catch {
    return null;
  }
}

function requireAdmin(req: express.Request, res: express.Response): string | null {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const email = verifyAdminToken(token);
  if (!email) {
    res.status(401).json({ error: 'Sessão administrativa inválida ou expirada.' });
    return null;
  }
  return email;
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  });
});

// Admin Login & Verification
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = password || '';

  if (cleanEmail === ADMIN_EMAIL && cleanPass === ADMIN_PASSWORD) {
    const token = signAdminToken(cleanEmail);
    res.json({ ok: true, email: cleanEmail, token });
    return;
  }
  res.status(401).json({ error: 'Credenciais inválidas. Verifique o e-mail e a senha.' });
});

app.get('/api/admin/verify', (req, res) => {
  const email = requireAdmin(req, res);
  if (!email) return;
  res.json({ ok: true, email });
});

// Public State & Public Lead/Analytics Ingestion
app.get('/api/public/state', (_req, res) => {
  const store = readStore();
  res.json({
    settings: store.settings,
    properties: store.properties.filter((p) => p.isPublic !== false),
    empreendimentos: store.empreendimentos.filter((e) => e.isPublic !== false),
    landingPages: store.landingPages.filter((l) => l.isPublic !== false),
  });
});

app.post('/api/public/leads', (req, res) => {
  const store = readStore();
  const lead = req.body as Record<string, unknown>;
  const id = String(lead.id || `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const record = {
    ...lead,
    id,
    createdAt: lead.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.leads = [record, ...store.leads.filter((l) => l.id !== id)];
  writeStore(store);
  res.json({ ok: true, id });
});

app.post('/api/public/analytics', (req, res) => {
  const store = readStore();
  const ev = req.body as Record<string, unknown>;
  const id = `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  store.analytics = [
    { ...ev, id, createdAt: new Date().toISOString() },
    ...store.analytics.slice(0, 499),
  ];
  writeStore(store);
  res.json({ ok: true });
});

// Admin Full State Read & Sync
app.get('/api/admin/state', (req, res) => {
  const email = requireAdmin(req, res);
  if (!email) return;
  const store = readStore();
  res.json(store);
});

app.post('/api/admin/bootstrap', (req, res) => {
  const email = requireAdmin(req, res);
  if (!email) return;
  const incoming = req.body as Partial<StoreState>;
  const store = readStore();
  let changed = false;

  if (!store.settings && incoming.settings) {
    store.settings = incoming.settings;
    changed = true;
  }
  if (store.pipelineStages.length === 0 && incoming.pipelineStages?.length) {
    store.pipelineStages = incoming.pipelineStages;
    changed = true;
  }
  if (store.empreendimentos.length === 0 && incoming.empreendimentos?.length) {
    store.empreendimentos = incoming.empreendimentos;
    changed = true;
  }
  if (store.properties.length === 0 && incoming.properties?.length) {
    store.properties = incoming.properties;
    changed = true;
  }
  if (store.landingPages.length === 0 && incoming.landingPages?.length) {
    store.landingPages = incoming.landingPages;
    changed = true;
  }

  if (changed) writeStore(store);
  res.json(store);
});

app.post('/api/admin/collection', (req, res) => {
  const email = requireAdmin(req, res);
  if (!email) return;

  const { collection, action, id, data } = req.body as {
    collection: keyof StoreState;
    action: 'upsert' | 'delete' | 'set_settings';
    id?: string;
    data?: Record<string, unknown>;
  };

  const store = readStore();

  if (action === 'set_settings' && data) {
    store.settings = { ...data, updatedAt: new Date().toISOString() };
    writeStore(store);
    res.json({ ok: true, settings: store.settings });
    return;
  }

  if (!Array.isArray(store[collection])) {
    res.status(400).json({ error: 'Coleção inválida.' });
    return;
  }

  const list = store[collection] as Record<string, unknown>[];
  if (action === 'delete' && id) {
    (store[collection] as Record<string, unknown>[]) = list.filter((item) => item.id !== id);
  } else if (action === 'upsert' && data) {
    const itemId = String(data.id || id || `${collection}_${Date.now()}`);
    const existing = list.find((item) => item.id === itemId);
    const nextItem = {
      ...(existing || {}),
      ...data,
      id: itemId,
      createdAt: existing?.createdAt || data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    (store[collection] as Record<string, unknown>[]) = [
      nextItem,
      ...list.filter((item) => item.id !== itemId),
    ];
  }

  writeStore(store);
  res.json({ ok: true });
});

async function compressVideoWithFfmpeg(
  inputBuffer: Buffer,
  originalFilename: string
): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
  const tempBase = `mg_vid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const ext = path.extname(originalFilename) || '.mp4';
  const inputPath = path.join(os.tmpdir(), `${tempBase}_in${ext}`);
  const outputPath = path.join(os.tmpdir(), `${tempBase}_out.mp4`);

  try {
    fs.writeFileSync(inputPath, inputBuffer);
    await execFileAsync(
      'ffmpeg',
      [
        '-y',
        '-i',
        inputPath,
        '-c:v',
        'libx264',
        '-crf',
        '24',
        '-preset',
        'veryfast',
        '-vf',
        "scale='min(1280,iw)':-2",
        '-movflags',
        '+faststart',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        outputPath,
      ],
      { timeout: 120000 }
    );

    if (fs.existsSync(outputPath)) {
      const compressed = fs.readFileSync(outputPath);
      if (compressed.length > 0 && compressed.length <= inputBuffer.length) {
        const cleanBase = path.basename(originalFilename, ext);
        return {
          buffer: compressed,
          filename: `${cleanBase}.mp4`,
          contentType: 'video/mp4',
        };
      }
      if (compressed.length > 0 && ext.toLowerCase() !== '.mp4') {
        const cleanBase = path.basename(originalFilename, ext);
        return {
          buffer: compressed,
          filename: `${cleanBase}.mp4`,
          contentType: 'video/mp4',
        };
      }
    }
  } catch (err) {
    console.warn('ffmpeg compression skipped, keeping original video:', err);
  } finally {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }

  return {
    buffer: inputBuffer,
    filename: originalFilename,
    contentType: 'video/mp4',
  };
}

async function storeUploadedBuffer(
  buffer: Buffer,
  filename: string,
  folder: string,
  contentType: string
): Promise<{ url: string; storage: 'vercel-blob' | 'local-fallback'; sizeBytes: number }> {
  const sanitizedName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const cleanFolder = (folder || 'geral').replace(/[^a-zA-Z0-9_-]/g, '_');

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blobPath = `matheus-goncalves/${cleanFolder}/${Date.now()}-${sanitizedName}`;
    const blob = await put(blobPath, buffer, {
      access: 'public',
      contentType: contentType || 'application/octet-stream',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return {
      url: blob.url,
      storage: 'vercel-blob',
      sizeBytes: buffer.length,
    };
  }

  const folderDir = path.join(localUploadDir, cleanFolder);
  if (!fs.existsSync(folderDir)) {
    fs.mkdirSync(folderDir, { recursive: true });
  }
  const storedName = `${Date.now()}-${sanitizedName}`;
  const targetPath = path.join(folderDir, storedName);
  fs.writeFileSync(targetPath, buffer);

  return {
    url: `/uploads/${cleanFolder}/${storedName}`,
    storage: 'local-fallback',
    sizeBytes: buffer.length,
  };
}

app.post(
  '/api/media/upload-binary',
  express.raw({ type: '*/*', limit: '250mb' }),
  async (req, res) => {
    try {
      const rawFilename = decodeURIComponent(String(req.headers['x-filename'] || 'arquivo.bin'));
      const folder = decodeURIComponent(String(req.headers['x-folder'] || 'geral'));
      const incomingType = String(
        req.headers['x-content-type'] || req.headers['content-type'] || 'application/octet-stream'
      );

      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        res.status(400).json({ error: 'Arquivo vazio ou não enviado.' });
        return;
      }

      const originalSizeBytes = req.body.length;
      let finalBuffer: Buffer = req.body;
      let finalFilename = rawFilename;
      let finalMime = incomingType;

      if (incomingType.startsWith('video/')) {
        const compressed = await compressVideoWithFfmpeg(finalBuffer, rawFilename);
        finalBuffer = compressed.buffer;
        finalFilename = compressed.filename;
        finalMime = compressed.contentType;
      }

      const stored = await storeUploadedBuffer(finalBuffer, finalFilename, folder, finalMime);
      res.json({
        ...stored,
        originalSizeBytes,
        mimeType: finalMime,
        filename: finalFilename,
      });
    } catch (error) {
      console.error('Binary media upload error:', error);
      res.status(500).json({ error: 'Falha ao processar upload de mídia.' });
    }
  }
);

app.post('/api/media/upload', async (req, res) => {
  try {
    const { filename, contentType, base64Data, folder } = req.body as {
      filename?: string;
      contentType?: string;
      base64Data?: string;
      folder?: string;
    };

    if (!filename || !base64Data) {
      res.status(400).json({ error: 'Nome do arquivo e conteúdo são obrigatórios.' });
      return;
    }

    const rawBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    let buffer: Buffer = Buffer.from(rawBase64, 'base64');
    let finalFilename = filename;
    let finalMime = contentType || 'application/octet-stream';

    if (buffer.length > 40 * 1024 * 1024) {
      res.status(413).json({ error: 'Arquivo excede o limite de 40MB neste modo.' });
      return;
    }

    if (finalMime.startsWith('video/')) {
      const compressed = await compressVideoWithFfmpeg(buffer, filename);
      buffer = compressed.buffer;
      finalFilename = compressed.filename;
      finalMime = compressed.contentType;
    }

    const stored = await storeUploadedBuffer(buffer, finalFilename, folder || 'geral', finalMime);
    res.json({
      ...stored,
      mimeType: finalMime,
      filename: finalFilename,
    });
  } catch (error) {
    console.error('Media upload error:', error);
    res.status(500).json({ error: 'Falha ao processar upload de mídia.' });
  }
});

app.post('/api/media/delete', async (req, res) => {
  try {
    const { url } = req.body as { url?: string };
    if (!url) {
      res.status(400).json({ error: 'URL obrigatória.' });
      return;
    }

    if (url.startsWith('https://') && process.env.BLOB_READ_WRITE_TOKEN) {
      await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
      res.json({ deleted: true, storage: 'vercel-blob' });
      return;
    }

    if (url.startsWith('/uploads/')) {
      const rel = url.replace(/^\/uploads\//, '');
      const safePath = path.resolve(localUploadDir, rel);
      if (safePath.startsWith(localUploadDir) && fs.existsSync(safePath)) {
        fs.unlinkSync(safePath);
      }
      res.json({ deleted: true, storage: 'local-fallback' });
      return;
    }

    res.json({ deleted: true, storage: 'reference-only' });
  } catch (error) {
    console.error('Media delete error:', error);
    res.status(500).json({ error: 'Falha ao remover mídia.' });
  }
});

interface MatchCandidateProperty {
  id: string;
  title: string;
  slug?: string;
  city: string;
  neighborhood: string;
  type: string;
  purpose: string;
  status: string;
  price: number;
  areaPrivate: number;
  bedrooms?: number;
  suites: number;
  parkingSpaces: number;
  estimatedAnnualYield?: number;
  shortDescription?: string;
  fullDescription?: string;
  features?: string[];
  paymentPlan?: string;
  isPublic?: boolean;
}

interface MatchCandidateEmp {
  id: string;
  name: string;
  slug?: string;
  city: string;
  neighborhood: string;
  stage: string;
  deliveryForecast?: string;
  startingPrice: number;
  estimatedAppreciation?: number;
  summary?: string;
  amenities?: string[];
  isPublic?: boolean;
}

function normalizePt(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function extractBudgetFromQuery(qNorm: string): number | null {
  const milMatch = qNorm.match(/(?:ate|max|maximo|no maximo|por volta de|r\$)?\s*(\d+(?:[.,]\d+)?)\s*(?:m|mi|milhao|milhoes)\b/);
  if (milMatch) {
    const val = parseFloat(milMatch[1].replace(',', '.'));
    if (!Number.isNaN(val) && val > 0) return Math.round(val * 1_000_000);
  }
  const fullMatch = qNorm.match(/r\$\s*(\d{1,3}(?:\.\d{3}){2,})/);
  if (fullMatch) {
    const val = Number(fullMatch[1].replace(/\./g, ''));
    if (!Number.isNaN(val) && val > 100_000) return val;
  }
  return null;
}

function extractMinSuitesFromQuery(qNorm: string): number | null {
  const m = qNorm.match(/(\d+)\s*(?:\+\s*)?(?:suites?|quartos?|dormitorios?)/);
  if (m) {
    const n = Number(m[1]);
    if (!Number.isNaN(n) && n > 0 && n <= 10) return n;
  }
  return null;
}

function extractMinAreaFromQuery(qNorm: string): number | null {
  const m = qNorm.match(/(\d{2,4})\s*(?:m2|m²|metros)/);
  if (m) {
    const n = Number(m[1]);
    if (!Number.isNaN(n) && n >= 30 && n <= 3000) return n;
  }
  return null;
}

function computeHeuristicMatch(
  query: string,
  props: MatchCandidateProperty[],
  emps: MatchCandidateEmp[]
) {
  const qNorm = normalizePt(query);
  const tokens = qNorm
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !['para', 'com', 'que', 'uma', 'meu', 'minha', 'quero', 'sonho', 'procuro', 'algo', 'imovel', 'imoveis'].includes(t));

  const maxBudget = extractBudgetFromQuery(qNorm);
  const minSuites = extractMinSuitesFromQuery(qNorm);
  const minArea = extractMinAreaFromQuery(qNorm);

  const wantsBC = qNorm.includes('balneario') || qNorm.includes('camboriu') || /\bbc\b/.test(qNorm) || qNorm.includes('barra sul') || qNorm.includes('avenida atlantica');
  const wantsBrava = qNorm.includes('brava') || qNorm.includes('itajai');
  const wantsInvest = qNorm.includes('invest') || qNorm.includes('lucr') || qNorm.includes('valoriz') || qNorm.includes('rentabil') || qNorm.includes('planta') || qNorm.includes('lancamento');
  const wantsMorar = qNorm.includes('morar') || qNorm.includes('familia') || qNorm.includes('filhos') || qNorm.includes('resid');
  const wantsSea = qNorm.includes('mar') || qNorm.includes('praia') || qNorm.includes('frente') || qNorm.includes('vista') || qNorm.includes('areia');
  const wantsPenthouse = qNorm.includes('cobertura') || qNorm.includes('duplex') || qNorm.includes('triplex');
  const wantsDiferenciado = qNorm.includes('diferenciado') || qNorm.includes('terrac') || qNorm.includes('garden');
  const wantsCasa = qNorm.includes('casa') || qNorm.includes('condominio');

  const scoredProps = props.map((p) => {
    let score = 48;
    const reasons: string[] = [];
    const highlights: string[] = [];

    const textBlob = normalizePt(
      `${p.title} ${p.city} ${p.neighborhood} ${p.type} ${p.status} ${p.shortDescription || ''} ${p.fullDescription || ''} ${(p.features || []).join(' ')} ${p.paymentPlan || ''}`
    );

    if (wantsBC && normalizePt(p.city).includes('balneario')) {
      score += 16;
      highlights.push('Balneário Camboriú');
      reasons.push('localizado em Balneário Camboriú conforme sua preferência');
    } else if (wantsBC && !normalizePt(p.city).includes('balneario')) {
      score -= 8;
    }

    if (wantsBrava && normalizePt(p.city).includes('brava')) {
      score += 16;
      highlights.push('Praia Brava');
      reasons.push('situado na Praia Brava');
    } else if (wantsBrava && !normalizePt(p.city).includes('brava')) {
      score -= 8;
    }

    if (wantsInvest && (p.purpose === 'investir' || p.purpose === 'ambos' || (p.estimatedAnnualYield ?? 0) >= 12)) {
      score += 12;
      if (p.estimatedAnnualYield) highlights.push(`~${p.estimatedAnnualYield}% a.a. est.`);
      reasons.push('alinhado à tese de valorização e liquidez');
    }

    if (wantsMorar && (p.purpose === 'comprar' || p.purpose === 'ambos')) {
      score += 10;
      reasons.push('excelente planta para moradia');
    }

    if (wantsSea && (textBlob.includes('frente mar') || textBlob.includes('vista') || textBlob.includes('mar') || textBlob.includes('praia') || textBlob.includes('atlantica'))) {
      score += 12;
      highlights.push('Proximidade / Vista Mar');
      reasons.push('com forte conexão com o mar');
    }

    if (wantsPenthouse && normalizePt(p.type).includes('cobertura')) {
      score += 15;
      highlights.push('Cobertura');
    } else if (wantsDiferenciado && normalizePt(p.type).includes('diferenciado')) {
      score += 15;
      highlights.push('Diferenciado');
    } else if (wantsCasa && normalizePt(p.type).includes('casa')) {
      score += 15;
      highlights.push('Casa');
    }

    if (maxBudget !== null) {
      if (p.price <= maxBudget) {
        score += 14;
        highlights.push('Dentro do orçamento');
        reasons.push('enquadrado no teto de investimento informado');
      } else {
        const overRatio = (p.price - maxBudget) / maxBudget;
        score -= Math.min(24, Math.round(overRatio * 45));
      }
    }

    if (minSuites !== null) {
      if (p.suites >= minSuites) {
        score += 10;
        highlights.push(`${p.suites} suítes`);
      } else {
        score -= (minSuites - p.suites) * 8;
      }
    }

    if (minArea !== null) {
      if (p.areaPrivate >= minArea) {
        score += 8;
        highlights.push(`${p.areaPrivate} m²`);
      } else {
        score -= 8;
      }
    }

    let tokenHits = 0;
    for (const tk of tokens) {
      if (textBlob.includes(tk)) tokenHits += 1;
    }
    score += Math.min(16, tokenHits * 4);

    if (p.status === 'Vendido') score -= 35;

    const clampedScore = Math.max(38, Math.min(97, Math.round(score)));
    const defaultReason =
      reasons.length > 0
        ? `Opção compatível por ser ${reasons.slice(0, 2).join(' e ')}, com ${p.areaPrivate} m² e ${p.suites} suítes.`
        : `Imóvel disponível em ${p.neighborhood} (${p.areaPrivate} m², ${p.suites} suítes) selecionado pela proximidade ao perfil descrito.`;

    if (highlights.length === 0) {
      highlights.push(`${p.suites} suítes`, `${p.areaPrivate} m²`, p.status);
    }

    return {
      propertyId: p.id,
      matchPercent: clampedScore,
      reason: defaultReason.charAt(0).toUpperCase() + defaultReason.slice(1),
      highlights: highlights.slice(0, 3),
    };
  });

  scoredProps.sort((a, b) => b.matchPercent - a.matchPercent);

  const scoredEmps = emps
    .map((e) => {
      let score = 40;
      const blob = normalizePt(`${e.name} ${e.city} ${e.neighborhood} ${e.stage} ${e.summary || ''} ${(e.amenities || []).join(' ')}`);
      if (wantsBC && normalizePt(e.city).includes('balneario')) score += 20;
      if (wantsBrava && normalizePt(e.city).includes('brava')) score += 20;
      if (wantsInvest && (e.estimatedAppreciation ?? 0) >= 12) score += 15;
      if (maxBudget !== null && e.startingPrice <= maxBudget) score += 15;
      for (const tk of tokens) {
        if (blob.includes(tk)) score += 5;
      }
      return {
        empreendimentoId: e.id,
        score,
        reason: `${e.name} (${e.stage}) em ${e.neighborhood} com unidades a partir de R$ ${e.startingPrice.toLocaleString('pt-BR')}.`,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(({ empreendimentoId, reason }) => ({ empreendimentoId, reason }));

  const summaryParts: string[] = [];
  if (wantsBC) summaryParts.push('Balneário Camboriú');
  if (wantsBrava) summaryParts.push('Praia Brava');
  if (minSuites) summaryParts.push(`${minSuites}+ suítes`);
  if (maxBudget) summaryParts.push(`até R$ ${(maxBudget / 1_000_000).toFixed(1).replace('.0', '')}M`);
  if (wantsInvest) summaryParts.push('foco em valorização');

  return {
    summary:
      summaryParts.length > 0
        ? `Analisamos o portfólio disponível priorizando ${summaryParts.join(', ')} e ordenamos os imóveis mais próximos do que você descreveu.`
        : 'Analisamos todo o portfólio disponível em Balneário Camboriú e Praia Brava e selecionamos os imóveis mais próximos da sua descrição.',
    criteriaSummary: summaryParts,
    matches: scoredProps.slice(0, 6),
    empreendimentoMatches: scoredEmps,
    engine: 'semantic-local' as const,
  };
}

app.post('/api/ai/match-properties', async (req, res) => {
  try {
    const body = req.body as {
      query?: string;
      properties?: MatchCandidateProperty[];
      empreendimentos?: MatchCandidateEmp[];
    };

    const query = String(body.query || '').trim();
    if (query.length < 3) {
      res.status(400).json({ error: 'Descreva com um pouco mais de detalhes o imóvel que você procura.' });
      return;
    }

    const store = readStore();
    const rawProps =
      Array.isArray(body.properties) && body.properties.length > 0
        ? body.properties
        : (store.properties as unknown as MatchCandidateProperty[]);
    const rawEmps =
      Array.isArray(body.empreendimentos) && body.empreendimentos.length > 0
        ? body.empreendimentos
        : (store.empreendimentos as unknown as MatchCandidateEmp[]);

    const publicProps = rawProps.filter((p) => p.isPublic !== false && p.status !== 'Vendido');
    const candidateProps = publicProps.length > 0 ? publicProps : rawProps.filter((p) => p.isPublic !== false);
    const candidateEmps = rawEmps.filter((e) => e.isPublic !== false);

    if (candidateProps.length === 0 && candidateEmps.length === 0) {
      res.json({
        summary: 'No momento não há imóveis disponíveis cadastrados no catálogo público.',
        criteriaSummary: [],
        matches: [],
        empreendimentoMatches: [],
        engine: 'empty',
      });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.json(computeHeuristicMatch(query, candidateProps, candidateEmps));
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const compactCatalog = {
        imoveisDisponiveis: candidateProps.map((p) => ({
          id: p.id,
          titulo: p.title,
          cidade: p.city,
          bairro: p.neighborhood,
          tipo: p.type,
          objetivo: p.purpose,
          status: p.status,
          valorBRL: p.price,
          areaPrivativaM2: p.areaPrivate,
          suites: p.suites,
          vagas: p.parkingSpaces,
          retornoAnualEstPct: p.estimatedAnnualYield ?? null,
          resumo: p.shortDescription || '',
          diferenciais: (p.features || []).slice(0, 8),
          pagamento: p.paymentPlan || '',
        })),
        empreendimentosDisponiveis: candidateEmps.map((e) => ({
          id: e.id,
          nome: e.name,
          cidade: e.city,
          bairro: e.neighborhood,
          estagio: e.stage,
          entrega: e.deliveryForecast || '',
          valorInicialBRL: e.startingPrice,
          valorizacaoAnualEstPct: e.estimatedAppreciation ?? null,
          resumo: e.summary || '',
          lazer: (e.amenities || []).slice(0, 6),
        })),
      };

      const prompt = `Pedido / sonho do cliente:\n"${query}"\n\nCatálogo real disponível agora:\n${JSON.stringify(compactCatalog)}`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'Você é o consultor imobiliário sênior de Matheus Gonçalves em Balneário Camboriú e Praia Brava. Analise o desejo do cliente em linguagem natural e encontre os imóveis disponíveis MAIS PRÓXIMOS do pedido real — mesmo se não houver correspondência 100% exata, selecione os melhores aproximados e seja transparente no motivo (ex.: "fica ligeiramente acima do teto, porém entrega frente mar e 4 suítes"). Nunca invente IDs; use apenas IDs existentes em imoveisDisponiveis e empreendimentosDisponiveis. Retorne até 6 imóveis ordenados do maior matchPercent ao menor, e até 2 empreendimentos relevantes. Escreva em português do Brasil elegante, objetivo e consultivo.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: 'Resumo consultivo de 1 a 2 frases explicando o critério adotado na seleção.',
              },
              criteriaSummary: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Até 4 critérios curtos identificados no pedido (ex: Praia Brava, Frente Mar, Até R$ 6M).',
              },
              matches: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    propertyId: { type: Type.STRING },
                    matchPercent: { type: Type.INTEGER },
                    reason: {
                      type: Type.STRING,
                      description: 'Explicação objetiva em 1-2 frases de por que este imóvel atende ou se aproxima do pedido.',
                    },
                    highlights: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Até 3 pontos fortes curtos compatíveis.',
                    },
                  },
                },
              },
              empreendimentoMatches: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    empreendimentoId: { type: Type.STRING },
                    reason: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      const parsed = JSON.parse((aiResponse.text ?? '{}').trim()) as {
        summary?: string;
        criteriaSummary?: string[];
        matches?: { propertyId: string; matchPercent: number; reason: string; highlights?: string[] }[];
        empreendimentoMatches?: { empreendimentoId: string; reason: string }[];
      };

      const validPropIds = new Set(candidateProps.map((p) => p.id));
      const validEmpIds = new Set(candidateEmps.map((e) => e.id));

      const cleanMatches = (parsed.matches || [])
        .filter((m) => validPropIds.has(m.propertyId))
        .slice(0, 6)
        .map((m) => ({
          propertyId: m.propertyId,
          matchPercent: Math.max(35, Math.min(99, Math.round(Number(m.matchPercent) || 75))),
          reason: String(m.reason || '').trim(),
          highlights: Array.isArray(m.highlights) ? m.highlights.slice(0, 3) : [],
        }));

      const cleanEmps = (parsed.empreendimentoMatches || [])
        .filter((e) => validEmpIds.has(e.empreendimentoId))
        .slice(0, 2);

      if (cleanMatches.length === 0) {
        const fallback = computeHeuristicMatch(query, candidateProps, candidateEmps);
        res.json({
          ...fallback,
          summary: parsed.summary || fallback.summary,
          criteriaSummary: parsed.criteriaSummary?.length ? parsed.criteriaSummary : fallback.criteriaSummary,
        });
        return;
      }

      res.json({
        summary: parsed.summary || 'Selecionamos os imóveis disponíveis mais próximos do seu perfil.',
        criteriaSummary: Array.isArray(parsed.criteriaSummary) ? parsed.criteriaSummary.slice(0, 4) : [],
        matches: cleanMatches,
        empreendimentoMatches: cleanEmps,
        engine: 'gemini-4-hydrogen',
      });
    } catch (geminiErr) {
      console.warn('Gemini AI match fallback engaged:', geminiErr);
      res.json(computeHeuristicMatch(query, candidateProps, candidateEmps));
    }
  } catch (error) {
    console.error('AI match-properties error:', error);
    res.status(500).json({ error: 'Não foi possível processar a busca inteligente no momento.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vitePkg = 'vite';
    const { createServer: createViteServer } = await import(/* @vite-ignore */ vitePkg);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (!isVercel) {
  startServer();
}

export { app };
export default app;
