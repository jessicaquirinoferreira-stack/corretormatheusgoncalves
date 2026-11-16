import type { Timestamp } from 'firebase/firestore';

export type CityOption = 'Balneario Camboriu' | 'Praia Brava';
export type PropertyPurpose = 'comprar' | 'investir' | 'ambos';
export type PropertyType =
  | 'Apartamento'
  | 'Cobertura'
  | 'Diferenciado'
  | 'Casa'
  | 'Terreno'
  | 'Sala Comercial';
export type PropertyStatus = 'Disponivel' | 'Reservado' | 'Vendido' | 'Oculto';

export interface Property {
  id: string;
  title: string;
  slug: string;
  purpose: PropertyPurpose;
  type: PropertyType;
  city: CityOption;
  neighborhood: string;
  price: number;
  areaPrivate: number;
  suites: number;
  parkingSpaces: number;
  estimatedAnnualYield?: number;
  status: PropertyStatus;
  featured: boolean;
  isPublic: boolean;
  empreendimentoId?: string;
  shortDescription?: string;
  description?: string;
  coverImage?: string;
  gallery?: string[];
  videos?: string[];
  highlights?: string[];
  viewsCount?: number;
  createdAt?: Timestamp | Date | string;
  updatedAt?: Timestamp | Date | string;
}

export type EmpreendimentoStage = 'Pre-Lancamento' | 'Lancamento' | 'Em Construcao' | 'Pronto';

export interface Empreendimento {
  id: string;
  name: string;
  slug: string;
  developer: string;
  city: CityOption;
  neighborhood?: string;
  deliveryForecast: string;
  stage: EmpreendimentoStage;
  startingPrice: number;
  estimatedAppreciation?: number;
  featured: boolean;
  isPublic: boolean;
  summary?: string;
  description?: string;
  coverImage?: string;
  gallery?: string[];
  videos?: string[];
  amenities?: string[];
  createdAt?: Timestamp | Date | string;
  updatedAt?: Timestamp | Date | string;
}

export interface LandingPage {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  kicker?: string;
  heroImage: string;
  ctaLabel: string;
  targetEntityType?: 'property' | 'empreendimento';
  targetEntityId?: string;
  isFlagshipPremium: boolean;
  isPublic: boolean;
  highlights?: string[];
  metrics?: string[];
  createdAt?: Timestamp | Date | string;
  updatedAt?: Timestamp | Date | string;
}

export type LeadOrigin =
  | 'Site'
  | 'Landing Page'
  | 'WhatsApp'
  | 'Instagram'
  | 'Anuncio'
  | 'Indicacao'
  | 'Manual';
export type LeadProfile = 'Morar' | 'Investir' | 'Ambos';
export type LeadScore = 'Quente' | 'Morno' | 'Frio';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  origin: LeadOrigin;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  propertyId?: string;
  propertyTitle?: string;
  budget?: number;
  timeframe?: string;
  profile: LeadProfile;
  notes?: string;
  score: LeadScore;
  scorePoints?: number;
  stageId: string;
  probability?: number;
  potentialValue?: number;
  lostReason?: string;
  tags?: string[];
  clientId?: string;
  lgpdConsent: boolean;
  lastContactAt?: Timestamp | Date | string;
  createdAt?: Timestamp | Date | string;
  updatedAt?: Timestamp | Date | string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  profile: LeadProfile;
  budgetMin?: number;
  budgetMax?: number;
  preferredCities?: string[];
  interestPropertyIds?: string[];
  viewedPropertyIds?: string[];
  notes?: string;
  documents?: string[];
  lgpdConsent: boolean;
  createdAt?: Timestamp | Date | string;
  updatedAt?: Timestamp | Date | string;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  probability: number;
  isWon: boolean;
  isLost: boolean;
  updatedAt?: Timestamp | Date | string;
}

export type ActivityType =
  | 'Ligacao'
  | 'WhatsApp'
  | 'Email'
  | 'Visita'
  | 'Proposta'
  | 'Nota'
  | 'Sistema';

export interface Activity {
  id: string;
  leadId?: string;
  clientId?: string;
  type: ActivityType;
  summary: string;
  createdBy: string;
  createdAt?: Timestamp | Date | string;
}

export type VisitStatus = 'Confirmada' | 'Realizada' | 'Cancelada' | 'Reagendada';

export interface Visit {
  id: string;
  leadId?: string;
  clientId?: string;
  clientName: string;
  propertyId: string;
  propertyTitle: string;
  scheduledDate: string;
  scheduledTime: string;
  status: VisitStatus;
  reminderForClient?: boolean;
  feedback?: string;
  createdAt?: Timestamp | Date | string;
  updatedAt?: Timestamp | Date | string;
}

export type ProposalStatus = 'Rascunho' | 'Enviada' | 'Em Analise' | 'Aceita' | 'Recusada';
export type DocumentationStatus = 'Pendente' | 'Em Conferencia' | 'Aprovada';

export interface Proposal {
  id: string;
  leadId?: string;
  clientId?: string;
  clientName: string;
  propertyId: string;
  propertyTitle: string;
  version: number;
  proposedValue: number;
  paymentTerms?: string;
  documentationStatus: DocumentationStatus;
  status: ProposalStatus;
  documentUrl?: string;
  createdAt?: Timestamp | Date | string;
  updatedAt?: Timestamp | Date | string;
}

export type TaskPriority = 'Alta' | 'Media' | 'Baixa';
export type TaskStatus = 'Pendente' | 'Concluida';

export interface Task {
  id: string;
  leadId?: string;
  leadName?: string;
  title: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  isAutomated: boolean;
  createdAt?: Timestamp | Date | string;
  updatedAt?: Timestamp | Date | string;
}

export interface DifferentialItem {
  num: string;
  title: string;
  desc: string;
}

export interface SiteSettings {
  brandName: string;
  headline: string;
  subheadline?: string;
  heroImage?: string;
  heroCtaPrimary?: string;
  heroCtaSecondary?: string;
  aboutKicker?: string;
  aboutTitle?: string;
  aboutSubtitle?: string;
  aboutBio1?: string;
  aboutBio2?: string;
  aboutImage?: string;
  awardTitle?: string;
  awardDescription?: string;
  differentialsTitle?: string;
  differentials?: DifferentialItem[];
  ctaTitle?: string;
  ctaSubtitle?: string;
  creci?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  instagramHandle: string;
  seoTitle?: string;
  seoDescription?: string;
  footerNote?: string;
  officialLogoUrl?: string;
  watermarkEnabled?: boolean;
  watermarkPosition?: 'bottom-right' | 'bottom-left' | 'center';
  watermarkOpacity?: number;
  updatedAt?: Timestamp | Date | string;
}

export interface AnalyticsEvent {
  id: string;
  eventType: 'page_view' | 'property_view' | 'empreendimento_view' | 'landing_view' | 'lead_submit';
  path: string;
  entityId?: string;
  utmSource?: string;
  createdAt?: Timestamp | Date | string;
}

export interface MediaAsset {
  id: string;
  name: string;
  url: string;
  folder: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt?: Timestamp | Date | string;
}

export interface AdminLog {
  id: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  createdAt?: Timestamp | Date | string;
}
