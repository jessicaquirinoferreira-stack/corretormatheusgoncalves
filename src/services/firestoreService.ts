import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { getStoredAdminEmail, getStoredAdminToken } from '../contexts/AuthContext';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import {
  DEFAULT_EMPREENDIMENTOS,
  DEFAULT_LANDING_PAGES,
  DEFAULT_PIPELINE_STAGES,
  DEFAULT_PROPERTIES,
  DEFAULT_SITE_SETTINGS,
} from '../data/seedData';
import type {
  Activity,
  AdminLog,
  AnalyticsEvent,
  Client,
  Empreendimento,
  LandingPage,
  Lead,
  MediaAsset,
  PipelineStage,
  Property,
  Proposal,
  SiteSettings,
  Task,
  Visit,
} from '../types';
import { calculateLeadScore, getTimestampMs } from '../utils/formatters';

function cleanId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
}

function notifyStateUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mg:state-updated'));
  }
}

async function serverCollectionSync(
  collectionName: string,
  action: 'upsert' | 'delete' | 'set_settings',
  payload: { id?: string; data?: Record<string, unknown> }
): Promise<void> {
  const token = getStoredAdminToken();
  if (!token) return;
  await fetch('/api/admin/collection', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      collection: collectionName,
      action,
      id: payload.id,
      data: payload.data,
    }),
  }).catch(() => undefined);
  notifyStateUpdated();
}

function isFirebaseReadyAdmin(): boolean {
  return Boolean(auth.currentUser && auth.currentUser.emailVerified);
}

export async function fetchServerPublicState(): Promise<{
  settings: SiteSettings | null;
  properties: Property[];
  empreendimentos: Empreendimento[];
  landingPages: LandingPage[];
} | null> {
  try {
    const res = await fetch('/api/public/state');
    if (!res.ok) return null;
    return (await res.json()) as {
      settings: SiteSettings | null;
      properties: Property[];
      empreendimentos: Empreendimento[];
      landingPages: LandingPage[];
    };
  } catch {
    return null;
  }
}

export async function fetchServerAdminState(): Promise<Record<string, unknown> | null> {
  const token = getStoredAdminToken();
  if (!token) return null;
  try {
    const res = await fetch('/api/admin/state', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// --- Public Listeners & Queries ---

export function subscribePublicProperties(
  onData: (items: Property[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'properties';
  const q = query(collection(db, path), where('isPublic', '==', true));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ ...(d.data() as Property), id: d.id }));
      if (list.length > 0) onData(list);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export function subscribeAllProperties(onData: (items: Property[]) => void): Unsubscribe {
  const path = 'properties';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const list = snap.docs.map((d) => ({ ...(d.data() as Property), id: d.id }));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export function subscribePublicEmpreendimentos(
  onData: (items: Empreendimento[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'empreendimentos';
  const q = query(collection(db, path), where('isPublic', '==', true));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ ...(d.data() as Empreendimento), id: d.id }));
      if (list.length > 0) onData(list);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export function subscribeAllEmpreendimentos(onData: (items: Empreendimento[]) => void): Unsubscribe {
  const path = 'empreendimentos';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const list = snap.docs.map((d) => ({ ...(d.data() as Empreendimento), id: d.id }));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export function subscribePublicLandingPages(
  onData: (items: LandingPage[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'landingPages';
  const q = query(collection(db, path), where('isPublic', '==', true));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ ...(d.data() as LandingPage), id: d.id }));
      if (list.length > 0) onData(list);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export function subscribeAllLandingPages(onData: (items: LandingPage[]) => void): Unsubscribe {
  const path = 'landingPages';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const list = snap.docs.map((d) => ({ ...(d.data() as LandingPage), id: d.id }));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export function subscribeSiteSettings(onData: (settings: SiteSettings) => void): Unsubscribe {
  return onSnapshot(
    doc(db, 'siteSettings', 'main'),
    (snap) => {
      if (snap.exists()) {
        onData({ ...DEFAULT_SITE_SETTINGS, ...(snap.data() as SiteSettings) });
      }
    },
    () => undefined
  );
}

// --- Public Lead Submission & Analytics ---

export async function submitPublicLead(input: {
  name: string;
  phone: string;
  email?: string;
  origin: Lead['origin'];
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  propertyId?: string;
  propertyTitle?: string;
  budget?: number;
  timeframe?: string;
  profile: Lead['profile'];
  notes?: string;
  lgpdConsent: boolean;
}): Promise<string> {
  const { score, points } = calculateLeadScore({
    budget: input.budget,
    timeframe: input.timeframe,
    profile: input.profile,
    email: input.email,
    propertyId: input.propertyId,
    notes: input.notes,
  });

  const basePayload = {
    name: input.name.trim().slice(0, 140),
    phone: input.phone.trim().slice(0, 40),
    email: (input.email || '').trim().slice(0, 160),
    origin: input.origin,
    utmSource: (input.utmSource || '').slice(0, 100),
    utmMedium: (input.utmMedium || '').slice(0, 100),
    utmCampaign: (input.utmCampaign || '').slice(0, 120),
    propertyId: (input.propertyId || '').slice(0, 128),
    propertyTitle: (input.propertyTitle || '').slice(0, 160),
    budget: typeof input.budget === 'number' && input.budget >= 0 ? input.budget : 0,
    timeframe: (input.timeframe || '').slice(0, 80),
    profile: input.profile,
    notes: (input.notes || '').trim().slice(0, 2000),
    score,
    scorePoints: points,
    stageId: 'novo_lead',
    probability: 10,
    potentialValue: typeof input.budget === 'number' && input.budget > 0 ? input.budget : 0,
    tags: [input.profile, input.origin].slice(0, 10),
    lgpdConsent: input.lgpdConsent === true,
  };

  let createdId = `lead_${Date.now()}`;

  // 1. Always persist via server API so Admin Panel (admin@x.com) receives it immediately
  try {
    const res = await fetch('/api/public/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(basePayload),
    });
    if (res.ok) {
      const data = (await res.json()) as { id: string };
      createdId = data.id;
    }
  } catch {
    // Continue to Firestore attempt
  }

  // 2. Also write to Firestore
  try {
    await setDoc(doc(db, 'leads', cleanId(createdId)), {
      ...basePayload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Non-blocking if Firestore rules reject duplicate/offline
  }

  await trackAnalyticsEvent({
    eventType: 'lead_submit',
    path: typeof window !== 'undefined' ? window.location.pathname : '/',
    entityId: input.propertyId || createdId,
    utmSource: input.utmSource || '',
  });

  notifyStateUpdated();
  return createdId;
}

export async function trackAnalyticsEvent(input: {
  eventType: AnalyticsEvent['eventType'];
  path: string;
  entityId?: string;
  utmSource?: string;
}): Promise<void> {
  const payload = {
    eventType: input.eventType,
    path: (input.path || '/').slice(0, 240),
    entityId: (input.entityId || '').slice(0, 128),
    utmSource: (input.utmSource || '').slice(0, 100),
  };

  fetch('/api/public/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => undefined);

  try {
    await addDoc(collection(db, 'analytics'), {
      ...payload,
      createdAt: serverTimestamp(),
    });
  } catch {
    // Non-blocking telemetry
  }
}

// --- Admin Audit Logging ---

export async function logAdminAction(
  action: string,
  entityType: string,
  entityId = '',
  details = ''
): Promise<void> {
  const id = `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const actorEmail = (auth.currentUser?.email || getStoredAdminEmail() || 'admin@x.com').slice(0, 160);
  const logEntry = {
    id,
    actorEmail,
    action: action.slice(0, 120),
    entityType: entityType.slice(0, 80),
    entityId: entityId.slice(0, 128),
    details: details.slice(0, 500),
  };

  await serverCollectionSync('adminLogs', 'upsert', { id, data: logEntry });

  if (isFirebaseReadyAdmin()) {
    try {
      await setDoc(doc(db, 'adminLogs', id), {
        actorEmail: logEntry.actorEmail,
        action: logEntry.action,
        entityType: logEntry.entityType,
        entityId: logEntry.entityId,
        details: logEntry.details,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'adminLogs');
    }
  }
}

// --- Idempotent Admin Bootstrap ---

export async function bootstrapInitialFirestoreData(): Promise<Record<string, unknown> | null> {
  const token = getStoredAdminToken();
  let serverState: Record<string, unknown> | null = null;

  if (token) {
    try {
      const res = await fetch('/api/admin/bootstrap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          settings: DEFAULT_SITE_SETTINGS,
          pipelineStages: DEFAULT_PIPELINE_STAGES,
          empreendimentos: DEFAULT_EMPREENDIMENTOS,
          properties: DEFAULT_PROPERTIES,
          landingPages: DEFAULT_LANDING_PAGES,
        }),
      });
      if (res.ok) {
        serverState = (await res.json()) as Record<string, unknown>;
      }
    } catch {
      // ignore
    }
  }

  if (isFirebaseReadyAdmin()) {
    try {
      const settingsSnap = await getDoc(doc(db, 'siteSettings', 'main'));
      if (!settingsSnap.exists()) {
        await setDoc(doc(db, 'siteSettings', 'main'), {
          brandName: DEFAULT_SITE_SETTINGS.brandName,
          headline: DEFAULT_SITE_SETTINGS.headline,
          subheadline: DEFAULT_SITE_SETTINGS.subheadline || '',
          creci: DEFAULT_SITE_SETTINGS.creci || '',
          phone: DEFAULT_SITE_SETTINGS.phone || '',
          whatsapp: DEFAULT_SITE_SETTINGS.whatsapp || '',
          email: DEFAULT_SITE_SETTINGS.email || '',
          address: DEFAULT_SITE_SETTINGS.address || '',
          instagramHandle: DEFAULT_SITE_SETTINGS.instagramHandle,
          seoTitle: DEFAULT_SITE_SETTINGS.seoTitle || '',
          seoDescription: DEFAULT_SITE_SETTINGS.seoDescription || '',
          footerNote: DEFAULT_SITE_SETTINGS.footerNote || '',
          updatedAt: serverTimestamp(),
        });
      }

      const stagesSnap = await getDocs(collection(db, 'pipelineStages'));
      if (stagesSnap.empty) {
        for (const stage of DEFAULT_PIPELINE_STAGES) {
          await setDoc(doc(db, 'pipelineStages', cleanId(stage.id)), {
            name: stage.name,
            order: stage.order,
            probability: stage.probability,
            isWon: stage.isWon,
            isLost: stage.isLost,
            updatedAt: serverTimestamp(),
          });
        }
      }

      const empSnap = await getDocs(collection(db, 'empreendimentos'));
      if (empSnap.empty) {
        for (const emp of DEFAULT_EMPREENDIMENTOS) {
          await setDoc(doc(db, 'empreendimentos', cleanId(emp.id)), {
            ...emp,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }

      const propSnap = await getDocs(collection(db, 'properties'));
      if (propSnap.empty) {
        for (const prop of DEFAULT_PROPERTIES) {
          await setDoc(doc(db, 'properties', cleanId(prop.id)), {
            ...prop,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }

      const lpSnap = await getDocs(collection(db, 'landingPages'));
      if (lpSnap.empty) {
        for (const lp of DEFAULT_LANDING_PAGES) {
          await setDoc(doc(db, 'landingPages', cleanId(lp.id)), {
            ...lp,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'bootstrap');
    }
  }

  return serverState;
}

// --- Admin Subscriptions (Firestore when Google Auth active) ---

export function subscribeCRMCollection<T>(
  collectionName: string,
  onData: (items: T[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, collectionName),
    (snap) => {
      const list = snap.docs.map(
        (d) => ({ ...(d.data() as Record<string, unknown>), id: d.id } as T)
      );
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, collectionName)
  );
}

export function subscribeRecentAnalytics(onData: (items: AnalyticsEvent[]) => void): Unsubscribe {
  const path = 'analytics';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(250));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ ...(d.data() as AnalyticsEvent), id: d.id })));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export function subscribeAdminLogs(onData: (items: AdminLog[]) => void): Unsubscribe {
  const path = 'adminLogs';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(100));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ ...(d.data() as AdminLog), id: d.id })));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

// --- CRUD Operations (Dual: Server Store + Firestore when Google Auth active) ---

export async function saveProperty(
  property: Omit<Property, 'createdAt' | 'updatedAt'>,
  isNew: boolean
): Promise<void> {
  const id = cleanId(property.id || `prop_${Date.now()}`);
  const sanitized = {
    id,
    title: property.title.slice(0, 160),
    slug: property.slug.slice(0, 160),
    purpose: property.purpose,
    type: property.type,
    city: property.city,
    neighborhood: property.neighborhood.slice(0, 100),
    price: Number(property.price) || 0,
    areaPrivate: Number(property.areaPrivate) || 0,
    suites: Number(property.suites) || 0,
    parkingSpaces: Number(property.parkingSpaces) || 0,
    estimatedAnnualYield: Number(property.estimatedAnnualYield) || 0,
    status: property.status,
    featured: Boolean(property.featured),
    isPublic: property.status !== 'Oculto' && Boolean(property.isPublic),
    empreendimentoId: (property.empreendimentoId || '').slice(0, 128),
    shortDescription: (property.shortDescription || '').slice(0, 400),
    description: (property.description || '').slice(0, 5000),
    coverImage: (property.coverImage || '').slice(0, 600),
    gallery: (property.gallery || []).slice(0, 500),
    videos: (property.videos || []).slice(0, 200),
    highlights: (property.highlights || []).slice(0, 15),
    viewsCount: Number(property.viewsCount) || 0,
  };

  await serverCollectionSync('properties', 'upsert', { id, data: sanitized });

  if (isFirebaseReadyAdmin()) {
    const docRef = doc(db, 'properties', id);
    try {
      const existing = await getDoc(docRef);
      const createdAt = existing.exists() ? existing.data().createdAt : serverTimestamp();
      await setDoc(docRef, {
        ...sanitized,
        createdAt,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, `properties/${id}`);
    }
  }
  await logAdminAction(isNew ? 'Criou imóvel' : 'Atualizou imóvel', 'property', id, sanitized.title);
}

export async function removeProperty(id: string): Promise<void> {
  await serverCollectionSync('properties', 'delete', { id });
  if (isFirebaseReadyAdmin()) {
    try {
      await deleteDoc(doc(db, 'properties', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `properties/${id}`);
    }
  }
  await logAdminAction('Removeu imóvel', 'property', id);
}

export async function saveEmpreendimento(
  emp: Omit<Empreendimento, 'createdAt' | 'updatedAt'>,
  isNew: boolean
): Promise<void> {
  const id = cleanId(emp.id || `emp_${Date.now()}`);
  const sanitized = {
    id,
    name: emp.name.slice(0, 160),
    slug: emp.slug.slice(0, 160),
    developer: emp.developer.slice(0, 120),
    city: emp.city,
    neighborhood: (emp.neighborhood || '').slice(0, 100),
    deliveryForecast: emp.deliveryForecast.slice(0, 80),
    stage: emp.stage,
    startingPrice: Number(emp.startingPrice) || 0,
    estimatedAppreciation: Number(emp.estimatedAppreciation) || 0,
    featured: Boolean(emp.featured),
    isPublic: Boolean(emp.isPublic),
    summary: (emp.summary || '').slice(0, 500),
    description: (emp.description || '').slice(0, 5000),
    coverImage: (emp.coverImage || '').slice(0, 600),
    gallery: (emp.gallery || []).slice(0, 500),
    videos: (emp.videos || []).slice(0, 200),
    amenities: (emp.amenities || []).slice(0, 20),
  };

  await serverCollectionSync('empreendimentos', 'upsert', { id, data: sanitized });

  if (isFirebaseReadyAdmin()) {
    const docRef = doc(db, 'empreendimentos', id);
    try {
      const existing = await getDoc(docRef);
      const createdAt = existing.exists() ? existing.data().createdAt : serverTimestamp();
      await setDoc(docRef, {
        ...sanitized,
        createdAt,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, `empreendimentos/${id}`);
    }
  }
  await logAdminAction(
    isNew ? 'Criou empreendimento' : 'Atualizou empreendimento',
    'empreendimento',
    id,
    sanitized.name
  );
}

export async function removeEmpreendimento(id: string): Promise<void> {
  await serverCollectionSync('empreendimentos', 'delete', { id });
  if (isFirebaseReadyAdmin()) {
    try {
      await deleteDoc(doc(db, 'empreendimentos', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `empreendimentos/${id}`);
    }
  }
  await logAdminAction('Removeu empreendimento', 'empreendimento', id);
}

export async function saveLandingPage(
  lp: Omit<LandingPage, 'createdAt' | 'updatedAt'>,
  isNew: boolean
): Promise<void> {
  const id = cleanId(lp.id || `lp_${Date.now()}`);
  const sanitized = {
    id,
    title: lp.title.slice(0, 160),
    slug: lp.slug.slice(0, 160),
    subtitle: lp.subtitle.slice(0, 300),
    kicker: (lp.kicker || '').slice(0, 120),
    heroImage: lp.heroImage.slice(0, 600),
    ctaLabel: lp.ctaLabel.slice(0, 80),
    targetEntityType: lp.targetEntityType || 'empreendimento',
    targetEntityId: (lp.targetEntityId || '').slice(0, 128),
    isFlagshipPremium: Boolean(lp.isFlagshipPremium),
    isPublic: Boolean(lp.isPublic),
    highlights: (lp.highlights || []).slice(0, 12),
    metrics: (lp.metrics || []).slice(0, 8),
  };

  await serverCollectionSync('landingPages', 'upsert', { id, data: sanitized });

  if (isFirebaseReadyAdmin()) {
    const docRef = doc(db, 'landingPages', id);
    try {
      const existing = await getDoc(docRef);
      const createdAt = existing.exists() ? existing.data().createdAt : serverTimestamp();
      await setDoc(docRef, {
        ...sanitized,
        createdAt,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, `landingPages/${id}`);
    }
  }
  await logAdminAction(
    isNew ? 'Criou landing page' : 'Atualizou landing page',
    'landingPage',
    id,
    sanitized.title
  );
}

export async function removeLandingPage(id: string): Promise<void> {
  await serverCollectionSync('landingPages', 'delete', { id });
  if (isFirebaseReadyAdmin()) {
    try {
      await deleteDoc(doc(db, 'landingPages', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `landingPages/${id}`);
    }
  }
  await logAdminAction('Removeu landing page', 'landingPage', id);
}

export async function createManualLead(
  lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'score' | 'scorePoints'>
): Promise<string> {
  const id = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const { score, points } = calculateLeadScore({
    budget: lead.budget,
    timeframe: lead.timeframe,
    profile: lead.profile,
    email: lead.email,
    propertyId: lead.propertyId,
    notes: lead.notes,
  });

  const payload = {
    id,
    name: lead.name.slice(0, 140),
    phone: lead.phone.slice(0, 40),
    email: (lead.email || '').slice(0, 160),
    origin: lead.origin,
    utmSource: (lead.utmSource || '').slice(0, 100),
    utmMedium: (lead.utmMedium || '').slice(0, 100),
    utmCampaign: (lead.utmCampaign || '').slice(0, 120),
    propertyId: (lead.propertyId || '').slice(0, 128),
    propertyTitle: (lead.propertyTitle || '').slice(0, 160),
    budget: Number(lead.budget) || 0,
    timeframe: (lead.timeframe || '').slice(0, 80),
    profile: lead.profile,
    notes: (lead.notes || '').slice(0, 2000),
    score,
    scorePoints: points,
    stageId: lead.stageId || 'novo_lead',
    probability: Number(lead.probability) || 10,
    potentialValue: Number(lead.potentialValue ?? lead.budget) || 0,
    lostReason: (lead.lostReason || '').slice(0, 300),
    tags: (lead.tags || []).slice(0, 10),
    clientId: (lead.clientId || '').slice(0, 128),
    lgpdConsent: Boolean(lead.lgpdConsent),
  };

  await serverCollectionSync('leads', 'upsert', { id, data: payload });

  if (isFirebaseReadyAdmin()) {
    try {
      await setDoc(doc(db, 'leads', id), {
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        origin: payload.origin,
        utmSource: payload.utmSource,
        utmMedium: payload.utmMedium,
        utmCampaign: payload.utmCampaign,
        propertyId: payload.propertyId,
        propertyTitle: payload.propertyTitle,
        budget: payload.budget,
        timeframe: payload.timeframe,
        profile: payload.profile,
        notes: payload.notes,
        score: payload.score,
        scorePoints: payload.scorePoints,
        stageId: payload.stageId,
        probability: payload.probability,
        potentialValue: payload.potentialValue,
        lostReason: payload.lostReason,
        tags: payload.tags,
        clientId: payload.clientId,
        lgpdConsent: payload.lgpdConsent,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'leads');
    }
  }

  await logAdminAction('Cadastrou lead manualmente', 'lead', id, lead.name);
  return id;
}

export async function updateLeadStage(
  lead: Lead,
  newStage: PipelineStage,
  lostReason?: string
): Promise<void> {
  const nextLostReason = newStage.isLost
    ? (lostReason || lead.lostReason || 'Não informado').slice(0, 300)
    : '';
  await serverCollectionSync('leads', 'upsert', {
    id: lead.id,
    data: {
      ...lead,
      stageId: newStage.id,
      probability: newStage.probability,
      lostReason: nextLostReason,
      lastContactAt: new Date().toISOString(),
    },
  });

  if (isFirebaseReadyAdmin()) {
    try {
      await updateDoc(doc(db, 'leads', lead.id), {
        stageId: newStage.id,
        probability: newStage.probability,
        lostReason: nextLostReason,
        lastContactAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leads/${lead.id}`);
    }
  }

  await addActivity({
    leadId: lead.id,
    clientId: lead.clientId || '',
    type: 'Sistema',
    summary: `Movido para etapa "${newStage.name}" (${newStage.probability}%)${
      newStage.isLost && lostReason ? ` — Motivo: ${lostReason}` : ''
    }`,
  });
  await logAdminAction('Alterou etapa do lead', 'lead', lead.id, `${lead.name} -> ${newStage.name}`);
}

export async function updateLeadDetails(leadId: string, patch: Partial<Lead>): Promise<void> {
  await serverCollectionSync('leads', 'upsert', {
    id: leadId,
    data: { id: leadId, ...patch },
  });

  if (isFirebaseReadyAdmin()) {
    const cleanPatch: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (patch.name !== undefined) cleanPatch.name = patch.name.slice(0, 140);
    if (patch.phone !== undefined) cleanPatch.phone = patch.phone.slice(0, 40);
    if (patch.email !== undefined) cleanPatch.email = patch.email.slice(0, 160);
    if (patch.budget !== undefined) cleanPatch.budget = Number(patch.budget) || 0;
    if (patch.potentialValue !== undefined) cleanPatch.potentialValue = Number(patch.potentialValue) || 0;
    if (patch.timeframe !== undefined) cleanPatch.timeframe = patch.timeframe.slice(0, 80);
    if (patch.profile !== undefined) cleanPatch.profile = patch.profile;
    if (patch.notes !== undefined) cleanPatch.notes = patch.notes.slice(0, 2000);
    if (patch.score !== undefined) cleanPatch.score = patch.score;
    if (patch.tags !== undefined) cleanPatch.tags = patch.tags.slice(0, 10);
    if (patch.clientId !== undefined) cleanPatch.clientId = patch.clientId.slice(0, 128);
    try {
      await updateDoc(doc(db, 'leads', leadId), cleanPatch);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leads/${leadId}`);
    }
  }
}

export async function deleteLead(leadId: string, reason = 'Exclusão administrativa / LGPD'): Promise<void> {
  await serverCollectionSync('leads', 'delete', { id: leadId });
  if (isFirebaseReadyAdmin()) {
    try {
      await deleteDoc(doc(db, 'leads', leadId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `leads/${leadId}`);
    }
  }
  await logAdminAction('Removeu lead', 'lead', leadId, reason);
}

export async function convertLeadToClient(lead: Lead): Promise<string> {
  if (lead.clientId) return lead.clientId;
  const clientId = await saveClient({
    name: lead.name.slice(0, 140),
    phone: lead.phone.slice(0, 40),
    email: (lead.email || '').slice(0, 160),
    profile: lead.profile,
    budgetMin: lead.budget ? Math.round(lead.budget * 0.8) : 0,
    budgetMax: lead.budget || 0,
    preferredCities: ['Balneario Camboriu', 'Praia Brava'],
    interestPropertyIds: lead.propertyId ? [lead.propertyId] : [],
    viewedPropertyIds: [],
    notes: (lead.notes || '').slice(0, 4000),
    documents: [],
    lgpdConsent: lead.lgpdConsent,
  });

  await updateLeadDetails(lead.id, { clientId });
  await addActivity({
    leadId: lead.id,
    clientId,
    type: 'Sistema',
    summary: 'Lead convertido para ficha completa de cliente.',
  });
  await logAdminAction('Converteu lead em cliente', 'client', clientId, lead.name);
  return clientId;
}

export async function saveClient(
  client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>,
  existingId?: string
): Promise<string> {
  const id = cleanId(existingId || `cli_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
  const payload = {
    id,
    name: client.name.slice(0, 140),
    phone: client.phone.slice(0, 40),
    email: (client.email || '').slice(0, 160),
    profile: client.profile,
    budgetMin: Number(client.budgetMin) || 0,
    budgetMax: Number(client.budgetMax) || 0,
    preferredCities: (client.preferredCities || []).slice(0, 5),
    interestPropertyIds: (client.interestPropertyIds || []).slice(0, 20),
    viewedPropertyIds: (client.viewedPropertyIds || []).slice(0, 30),
    notes: (client.notes || '').slice(0, 4000),
    documents: (client.documents || []).slice(0, 20),
    lgpdConsent: Boolean(client.lgpdConsent),
  };

  await serverCollectionSync('clients', 'upsert', { id, data: payload });

  if (isFirebaseReadyAdmin()) {
    try {
      const existing = await getDoc(doc(db, 'clients', id));
      const createdAt = existing.exists() ? existing.data().createdAt : serverTimestamp();
      await setDoc(doc(db, 'clients', id), {
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        profile: payload.profile,
        budgetMin: payload.budgetMin,
        budgetMax: payload.budgetMax,
        preferredCities: payload.preferredCities,
        interestPropertyIds: payload.interestPropertyIds,
        viewedPropertyIds: payload.viewedPropertyIds,
        notes: payload.notes,
        documents: payload.documents,
        lgpdConsent: payload.lgpdConsent,
        createdAt,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, existingId ? OperationType.UPDATE : OperationType.CREATE, `clients/${id}`);
    }
  }

  await logAdminAction(existingId ? 'Atualizou cliente' : 'Criou cliente', 'client', id, payload.name);
  return id;
}

export async function deleteClientLGPD(clientId: string): Promise<void> {
  await serverCollectionSync('clients', 'delete', { id: clientId });
  if (isFirebaseReadyAdmin()) {
    try {
      await deleteDoc(doc(db, 'clients', clientId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `clients/${clientId}`);
    }
  }
  await logAdminAction('Exclusão LGPD de cliente', 'client', clientId, 'Dados removidos por solicitação LGPD');
}

export async function addActivity(input: {
  leadId?: string;
  clientId?: string;
  type: Activity['type'];
  summary: string;
}): Promise<void> {
  const id = `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const payload = {
    id,
    leadId: (input.leadId || '').slice(0, 128),
    clientId: (input.clientId || '').slice(0, 128),
    type: input.type,
    summary: input.summary.slice(0, 500),
    createdBy: (auth.currentUser?.email || getStoredAdminEmail() || 'Matheus Gonçalves').slice(0, 120),
  };

  await serverCollectionSync('activities', 'upsert', { id, data: payload });

  if (isFirebaseReadyAdmin()) {
    try {
      await setDoc(doc(db, 'activities', id), {
        leadId: payload.leadId,
        clientId: payload.clientId,
        type: payload.type,
        summary: payload.summary,
        createdBy: payload.createdBy,
        createdAt: serverTimestamp(),
      });
      if (input.leadId) {
        await updateDoc(doc(db, 'leads', input.leadId), {
          lastContactAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'activities');
    }
  }
}

export async function saveVisit(
  visit: Omit<Visit, 'id' | 'createdAt' | 'updatedAt'>,
  existingId?: string
): Promise<void> {
  const id = cleanId(existingId || `vis_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
  const payload = {
    id,
    leadId: (visit.leadId || '').slice(0, 128),
    clientId: (visit.clientId || '').slice(0, 128),
    clientName: visit.clientName.slice(0, 140),
    propertyId: visit.propertyId.slice(0, 128),
    propertyTitle: visit.propertyTitle.slice(0, 160),
    scheduledDate: visit.scheduledDate.slice(0, 32),
    scheduledTime: visit.scheduledTime.slice(0, 16),
    status: visit.status,
    reminderForClient: Boolean(visit.reminderForClient),
    feedback: (visit.feedback || '').slice(0, 2000),
  };

  await serverCollectionSync('visits', 'upsert', { id, data: payload });

  if (isFirebaseReadyAdmin()) {
    try {
      const existing = await getDoc(doc(db, 'visits', id));
      const createdAt = existing.exists() ? existing.data().createdAt : serverTimestamp();
      await setDoc(doc(db, 'visits', id), {
        leadId: payload.leadId,
        clientId: payload.clientId,
        clientName: payload.clientName,
        propertyId: payload.propertyId,
        propertyTitle: payload.propertyTitle,
        scheduledDate: payload.scheduledDate,
        scheduledTime: payload.scheduledTime,
        status: payload.status,
        reminderForClient: payload.reminderForClient,
        feedback: payload.feedback,
        createdAt,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, existingId ? OperationType.UPDATE : OperationType.CREATE, `visits/${id}`);
    }
  }

  if (!existingId) {
    await addActivity({
      leadId: payload.leadId,
      clientId: payload.clientId,
      type: 'Visita',
      summary: `Visita agendada para ${payload.scheduledDate} às ${payload.scheduledTime} — ${payload.propertyTitle}`,
    });
  }
  await logAdminAction(existingId ? 'Atualizou visita' : 'Agendou visita', 'visit', id, payload.clientName);
}

export async function saveProposal(
  proposal: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt'>,
  existingId?: string
): Promise<void> {
  const id = cleanId(existingId || `prop_doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
  const payload = {
    id,
    leadId: (proposal.leadId || '').slice(0, 128),
    clientId: (proposal.clientId || '').slice(0, 128),
    clientName: proposal.clientName.slice(0, 140),
    propertyId: proposal.propertyId.slice(0, 128),
    propertyTitle: proposal.propertyTitle.slice(0, 160),
    version: Math.max(1, Number(proposal.version) || 1),
    proposedValue: Number(proposal.proposedValue) || 0,
    paymentTerms: (proposal.paymentTerms || '').slice(0, 1500),
    documentationStatus: proposal.documentationStatus,
    status: proposal.status,
    documentUrl: (proposal.documentUrl || '').slice(0, 600),
  };

  await serverCollectionSync('proposals', 'upsert', { id, data: payload });

  if (isFirebaseReadyAdmin()) {
    try {
      const existing = await getDoc(doc(db, 'proposals', id));
      const createdAt = existing.exists() ? existing.data().createdAt : serverTimestamp();
      await setDoc(doc(db, 'proposals', id), {
        leadId: payload.leadId,
        clientId: payload.clientId,
        clientName: payload.clientName,
        propertyId: payload.propertyId,
        propertyTitle: payload.propertyTitle,
        version: payload.version,
        proposedValue: payload.proposedValue,
        paymentTerms: payload.paymentTerms,
        documentationStatus: payload.documentationStatus,
        status: payload.status,
        documentUrl: payload.documentUrl,
        createdAt,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, existingId ? OperationType.UPDATE : OperationType.CREATE, `proposals/${id}`);
    }
  }

  if (!existingId) {
    await addActivity({
      leadId: payload.leadId,
      clientId: payload.clientId,
      type: 'Proposta',
      summary: `Proposta v${payload.version} criada para ${payload.propertyTitle} (${payload.status})`,
    });
  }
  await logAdminAction(
    existingId ? 'Atualizou proposta' : 'Gerou proposta',
    'proposal',
    id,
    `${payload.propertyTitle} v${payload.version}`
  );
}

export async function saveTask(
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
  existingId?: string
): Promise<void> {
  const id = cleanId(existingId || `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
  const payload = {
    id,
    leadId: (task.leadId || '').slice(0, 128),
    leadName: (task.leadName || '').slice(0, 140),
    title: task.title.slice(0, 200),
    dueDate: task.dueDate.slice(0, 32),
    priority: task.priority,
    status: task.status,
    isAutomated: Boolean(task.isAutomated),
  };

  await serverCollectionSync('tasks', 'upsert', { id, data: payload });

  if (isFirebaseReadyAdmin()) {
    try {
      const existing = await getDoc(doc(db, 'tasks', id));
      const createdAt = existing.exists() ? existing.data().createdAt : serverTimestamp();
      await setDoc(doc(db, 'tasks', id), {
        leadId: payload.leadId,
        leadName: payload.leadName,
        title: payload.title,
        dueDate: payload.dueDate,
        priority: payload.priority,
        status: payload.status,
        isAutomated: payload.isAutomated,
        createdAt,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, existingId ? OperationType.UPDATE : OperationType.CREATE, `tasks/${id}`);
    }
  }
}

export async function savePipelineStage(stage: PipelineStage): Promise<void> {
  const id = cleanId(stage.id);
  const payload = {
    id,
    name: stage.name.slice(0, 80),
    order: Number(stage.order) || 1,
    probability: Math.min(100, Math.max(0, Number(stage.probability) || 0)),
    isWon: Boolean(stage.isWon),
    isLost: Boolean(stage.isLost),
  };

  await serverCollectionSync('pipelineStages', 'upsert', { id, data: payload });

  if (isFirebaseReadyAdmin()) {
    try {
      await setDoc(doc(db, 'pipelineStages', id), {
        name: payload.name,
        order: payload.order,
        probability: payload.probability,
        isWon: payload.isWon,
        isLost: payload.isLost,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `pipelineStages/${id}`);
    }
  }
  await logAdminAction('Atualizou etapa do funil', 'pipelineStage', id, stage.name);
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  const fullPayload = {
    ...settings,
    brandName: settings.brandName.slice(0, 120),
    headline: settings.headline.slice(0, 220),
    subheadline: (settings.subheadline || '').slice(0, 400),
    creci: (settings.creci || '').slice(0, 80),
    phone: (settings.phone || '').slice(0, 40),
    whatsapp: (settings.whatsapp || '').slice(0, 40),
    email: (settings.email || '').slice(0, 160),
    address: (settings.address || '').slice(0, 240),
    instagramHandle: settings.instagramHandle.slice(0, 80),
    seoTitle: (settings.seoTitle || '').slice(0, 120),
    seoDescription: (settings.seoDescription || '').slice(0, 240),
    footerNote: (settings.footerNote || '').slice(0, 300),
    officialLogoUrl: (settings.officialLogoUrl || '').slice(0, 600),
    watermarkEnabled: settings.watermarkEnabled !== false,
    watermarkPosition: settings.watermarkPosition || 'bottom-right',
    watermarkOpacity:
      typeof settings.watermarkOpacity === 'number' ? settings.watermarkOpacity : 0.78,
  };

  await serverCollectionSync('settings', 'set_settings', { data: fullPayload as Record<string, unknown> });

  if (isFirebaseReadyAdmin()) {
    try {
      await setDoc(doc(db, 'siteSettings', 'main'), {
        brandName: fullPayload.brandName,
        headline: fullPayload.headline,
        subheadline: fullPayload.subheadline,
        creci: fullPayload.creci,
        phone: fullPayload.phone,
        whatsapp: fullPayload.whatsapp,
        email: fullPayload.email,
        address: fullPayload.address,
        instagramHandle: fullPayload.instagramHandle,
        seoTitle: fullPayload.seoTitle,
        seoDescription: fullPayload.seoDescription,
        footerNote: fullPayload.footerNote,
        officialLogoUrl: fullPayload.officialLogoUrl,
        watermarkEnabled: fullPayload.watermarkEnabled,
        watermarkPosition: fullPayload.watermarkPosition,
        watermarkOpacity: fullPayload.watermarkOpacity,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'siteSettings/main');
    }
  }

  await logAdminAction('Atualizou conteúdo e configurações do site', 'siteSettings', 'main');
}

export async function saveMediaAssetRecord(asset: Omit<MediaAsset, 'id' | 'createdAt'>): Promise<string> {
  const id = `med_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const payload = {
    id,
    name: asset.name.slice(0, 160),
    url: asset.url.slice(0, 600),
    folder: asset.folder.slice(0, 80),
    mimeType: (asset.mimeType || 'image/jpeg').slice(0, 80),
    sizeBytes: Number(asset.sizeBytes) || 0,
  };

  await serverCollectionSync('media', 'upsert', { id, data: payload });

  if (isFirebaseReadyAdmin()) {
    try {
      await setDoc(doc(db, 'media', id), {
        name: payload.name,
        url: payload.url,
        folder: payload.folder,
        mimeType: payload.mimeType,
        sizeBytes: payload.sizeBytes,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'media');
    }
  }

  await logAdminAction('Enviou mídia', 'media', id, asset.name);
  return id;
}

export async function removeMediaAssetRecord(asset: MediaAsset): Promise<void> {
  await fetch('/api/media/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: asset.url }),
  }).catch(() => undefined);

  await serverCollectionSync('media', 'delete', { id: asset.id });

  if (isFirebaseReadyAdmin()) {
    try {
      await deleteDoc(doc(db, 'media', asset.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `media/${asset.id}`);
    }
  }

  await logAdminAction('Removeu mídia', 'media', asset.id, asset.name);
}

export async function runFollowUpAutomation(leads: Lead[], existingTasks: Task[]): Promise<number> {
  const now = Date.now();
  const fortyEightHoursMs = 48 * 60 * 60 * 1000;
  let createdCount = 0;

  for (const lead of leads) {
    if (lead.stageId === 'fechado_ganho' || lead.stageId === 'perdido') continue;
    const lastMs = getTimestampMs(lead.lastContactAt) || getTimestampMs(lead.createdAt);
    if (!lastMs || now - lastMs < fortyEightHoursMs) continue;

    const alreadyHasPendingAuto = existingTasks.some(
      (t) => t.leadId === lead.id && t.status === 'Pendente' && t.isAutomated
    );
    if (alreadyHasPendingAuto) continue;

    const due = new Date(now + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await saveTask({
      leadId: lead.id,
      leadName: lead.name,
      title: `Follow-up automático 48h: retomar contato com ${lead.name}`,
      dueDate: due,
      priority: lead.score === 'Quente' ? 'Alta' : 'Media',
      status: 'Pendente',
      isAutomated: true,
    });
    createdCount += 1;
  }

  if (createdCount > 0) {
    await logAdminAction('Executou automação 48h', 'task', '', `${createdCount} tarefas criadas`);
  }
  return createdCount;
}
