import type {
  Empreendimento,
  LandingPage,
  PipelineStage,
  Property,
  SiteSettings,
} from '../types';

export const HERO_IMAGE = '/src/assets/images/hero_balneario_skyline_1794837417280.jpg';
export const BRAVA_APARTMENT_IMAGE = '/src/assets/images/property_penthouse_brava_1794837418850.jpg';
export const BC_PENTHOUSE_IMAGE = '/src/assets/images/property_oceanfront_bc_1794837418202.jpg';
export const BRAVA_RESERVE_IMAGE = '/src/assets/images/development_brava_reserve_1794837418898.jpg';
export const MATHEUS_PORTRAIT_IMAGE = '/matheus-goncalves.jpg';
export const FLAGSHIP_LANDING_IMAGE = '/src/assets/images/landing_private_tower_1794837420277.jpg';

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  brandName: 'Matheus Gonçalves',
  headline: 'Especialista em imóveis e lucratividade em Balneário Camboriú e Praia Brava.',
  subheadline:
    'Assessoria patrimonial, análise de rentabilidade e atendimento próximo, ético e orientado à construção do patrimônio da sua família.',
  heroImage: HERO_IMAGE,
  heroCtaPrimary: 'Explorar Portfólio',
  heroCtaSecondary: 'Coleção Privada Praia Brava',
  aboutKicker: 'Propósito, Ética e Patrimônio',
  aboutTitle: 'Matheus Gonçalves',
  aboutSubtitle: 'Pai do Mathias e do Martin · Sócio · Balneário Camboriú e Praia Brava',
  aboutBio1:
    'Com cerca de 18 meses de atuação intensa no mercado imobiliário do litoral norte catarinense, construí meu trabalho sobre pilares inegociáveis: gratidão, transparência ética e foco genuíno na realização do patrimônio familiar.',
  aboutBio2:
    'Cada recomendação em Balneário Camboriú e Praia Brava nasce de uma análise criteriosa de liquidez, valorização por metro quadrado e fluxo financeiro, garantindo segurança tanto para quem escolhe um novo lar quanto para quem busca lucratividade sólida.',
  aboutImage: MATHEUS_PORTRAIT_IMAGE,
  awardTitle: 'Indicado ao Real Estate Awards — Região Sul',
  awardDescription:
    'Indicado pela @atrinca.realestate como um dos 9 Corretores Destaque da Região Sul, reconhecimento ao compromisso ético e aos resultados entregues aos clientes.',
  differentialsTitle: 'Atendimento próximo e decisão guiada por fundamentos',
  differentials: [
    {
      num: '01.',
      title: 'Estudo de Lucratividade',
      desc: 'Projeção realista de valorização, custo de oportunidade e estratégia de entrada e saída.',
    },
    {
      num: '02.',
      title: 'Seleção Estratégica',
      desc: 'Filtramos apenas empreendimentos com histórico sólido de construtora e localização premium.',
    },
    {
      num: '03.',
      title: 'Visão Familiar',
      desc: 'Entendemos a dinâmica da sua família para unir qualidade de vida e preservação patrimonial.',
    },
    {
      num: '04.',
      title: 'Ética Ponta a Ponta',
      desc: 'Acompanhamento transparente da visita à análise contratual, proposta e documentação.',
    },
  ],
  ctaTitle: 'Receba uma seleção personalizada para o seu momento',
  ctaSubtitle:
    'Compartilhe seu objetivo — moradia em família ou alocação de capital em Balneário Camboriú e Praia Brava — e receba opções com comparativo de valorização e fluxo.',
  creci: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  instagramHandle: '@matheus_goncalves_mg',
  seoTitle: 'Matheus Gonçalves — Imóveis e Lucratividade | Balneário Camboriú e Praia Brava',
  seoDescription:
    'Especialista em imóveis e lucratividade em Balneário Camboriú e Praia Brava. Atendimento ético, próximo e orientado a resultados.',
  footerNote:
    'Atendimento consultivo para moradia e investimento patrimonial em Balneário Camboriú e Praia Brava.',
  officialLogoUrl: '/logo-oficial-mg.png',
  watermarkEnabled: true,
  watermarkPosition: 'bottom-right',
  watermarkOpacity: 0.78,
};

export const DEFAULT_PIPELINE_STAGES: PipelineStage[] = [
  { id: 'novo_lead', name: 'Novo Lead', order: 1, probability: 10, isWon: false, isLost: false },
  { id: 'contato_inicial', name: 'Contato Inicial', order: 2, probability: 20, isWon: false, isLost: false },
  { id: 'qualificado', name: 'Qualificado', order: 3, probability: 35, isWon: false, isLost: false },
  { id: 'visita_agendada', name: 'Visita Agendada', order: 4, probability: 50, isWon: false, isLost: false },
  { id: 'visita_realizada', name: 'Visita Realizada', order: 5, probability: 65, isWon: false, isLost: false },
  { id: 'proposta_enviada', name: 'Proposta Enviada', order: 6, probability: 75, isWon: false, isLost: false },
  { id: 'negociacao', name: 'Negociação', order: 7, probability: 85, isWon: false, isLost: false },
  { id: 'documentacao', name: 'Documentação', order: 8, probability: 92, isWon: false, isLost: false },
  { id: 'fechado_ganho', name: 'Fechado (Ganho)', order: 9, probability: 100, isWon: true, isLost: false },
  { id: 'perdido', name: 'Perdido', order: 10, probability: 0, isWon: false, isLost: true },
];

export const DEFAULT_EMPREENDIMENTOS: Empreendimento[] = [
  {
    id: 'emp_brava_ocean_reserve',
    name: 'Brava Ocean Reserve',
    slug: 'brava-ocean-reserve',
    developer: 'Incorporadora Litoral Sul',
    city: 'Praia Brava',
    neighborhood: 'Praia Brava Norte',
    deliveryForecast: 'Dezembro 2027',
    stage: 'Lancamento',
    startingPrice: 3850000,
    estimatedAppreciation: 22,
    featured: true,
    isPublic: true,
    summary:
      'Arquitetura orgânica entre a Mata Atlântica e o mar da Praia Brava, com baixa densidade e alta liquidez patrimonial.',
    description:
      'Empreendimento boutique desenhado para famílias que buscam privacidade absoluta e investidores atentos à curva de valorização da Praia Brava Norte. Unidades amplas com brises em bronze, spa privativo e vista definitiva para o oceano.',
    coverImage: BRAVA_RESERVE_IMAGE,
    gallery: [BRAVA_RESERVE_IMAGE, BRAVA_APARTMENT_IMAGE],
    videos: [],
    amenities: [
      'Piscina aquecida com borda infinita',
      'Wellness & Spa privativo',
      'Wine bar e espaço gourmet frente mata',
      'Infraestrutura completa para carros elétricos',
      'Concierge e segurança 24h',
    ],
  },
  {
    id: 'emp_atlantica_horizon',
    name: 'Atlântica Horizon Residence',
    slug: 'atlantica-horizon-residence',
    developer: 'Construtora Atlântica Prime',
    city: 'Balneario Camboriu',
    neighborhood: 'Barra Sul',
    deliveryForecast: 'Pronto para morar',
    stage: 'Pronto',
    startingPrice: 5400000,
    estimatedAppreciation: 16,
    featured: true,
    isPublic: true,
    summary:
      'Torre icônica na Barra Sul com lazer suspenso, vista panorâmica da orla e acabamento em mármore travertino.',
    description:
      'Localizado no metro quadrado mais valorizado de Balneário Camboriú, o Atlântica Horizon combina um apartamento por andar, pé-direito duplo no living e estrutura náutica a poucos minutos da marina.',
    coverImage: FLAGSHIP_LANDING_IMAGE,
    gallery: [FLAGSHIP_LANDING_IMAGE, HERO_IMAGE],
    videos: [],
    amenities: [
      'Um apartamento por andar',
      'Rooftop lounge panorâmico',
      'Academia panorâmica',
      'Elevador privativo biométrico',
      'Box de praia individual',
    ],
  },
];

export const DEFAULT_PROPERTIES: Property[] = [
  {
    id: 'prop_cobertura_atlantica_sul',
    title: 'Cobertura Frente Mar Barra Sul',
    slug: 'cobertura-frente-mar-barra-sul',
    purpose: 'ambos',
    type: 'Cobertura',
    city: 'Balneario Camboriu',
    neighborhood: 'Barra Sul',
    price: 8900000,
    areaPrivate: 312,
    suites: 4,
    parkingSpaces: 4,
    estimatedAnnualYield: 18.5,
    status: 'Disponivel',
    featured: true,
    isPublic: true,
    empreendimentoId: 'emp_atlantica_horizon',
    shortDescription:
      'Terraço com piscina aquecida privativa e vista livre para toda a enseada de Balneário Camboriú.',
    description:
      'Unidade exclusiva em andar alto na Barra Sul, projetada para integrar família e sofisticação. Living com 95 m², cozinha gourmet integrada em travertino bruto, quatro suítes amplas e terraço descoberto com piscina de borda infinita voltada ao nascer do sol.',
    coverImage: BC_PENTHOUSE_IMAGE,
    gallery: [BC_PENTHOUSE_IMAGE, HERO_IMAGE],
    videos: [],
    highlights: [
      'Piscina privativa aquecida no terraço',
      '4 suítes plenas com vista mar',
      'Potencial histórico de valorização acima da média da orla',
      '4 vagas privativas de garagem',
    ],
    viewsCount: 0,
  },
  {
    id: 'prop_brava_vista_mar',
    title: 'Residência Vista Mar Praia Brava',
    slug: 'residencia-vista-mar-praia-brava',
    purpose: 'investir',
    type: 'Apartamento',
    city: 'Praia Brava',
    neighborhood: 'Praia Brava Norte',
    price: 4290000,
    areaPrivate: 198,
    suites: 4,
    parkingSpaces: 3,
    estimatedAnnualYield: 22.0,
    status: 'Disponivel',
    featured: true,
    isPublic: true,
    empreendimentoId: 'emp_brava_ocean_reserve',
    shortDescription:
      'Planta fluida com fechamento em vidro piso-teto, marcenaria em freijó natural e rentabilidade projetada na planta.',
    description:
      'Oportunidade estratégica na Praia Brava com fluxo de pagamento facilitado direto durante a obra. Ideal para composição patrimonial com forte demanda de locação de alto padrão e valorização acelerada até a entrega das chaves.',
    coverImage: BRAVA_APARTMENT_IMAGE,
    gallery: [BRAVA_APARTMENT_IMAGE, BRAVA_RESERVE_IMAGE],
    highlights: [
      'Fluxo de pagamento direto com correção previsível',
      'Vista definitiva para o mar e mata preservada',
      'Ilha gourmet em mármore travertino',
      'Alta liquidez para revenda pós-entrega',
    ],
    viewsCount: 0,
  },
  {
    id: 'prop_diferenciado_centro_bc',
    title: 'Diferenciado Terraço Atlântico',
    slug: 'diferenciado-terraco-atlantico',
    purpose: 'comprar',
    type: 'Diferenciado',
    city: 'Balneario Camboriu',
    neighborhood: 'Centro',
    price: 3650000,
    areaPrivate: 225,
    suites: 3,
    parkingSpaces: 3,
    estimatedAnnualYield: 14.8,
    status: 'Disponivel',
    featured: true,
    isPublic: true,
    empreendimentoId: 'emp_atlantica_horizon',
    shortDescription:
      'Amplitude de casa suspensa a poucos passos da Avenida Atlântica, pensada para a convivência familiar.',
    description:
      'Apartamento diferenciado com amplo terraço privativo ao ar livre, churrasqueira a carvão e espaço para receber amigos e família com conforto e segurança no coração de Balneário Camboriú.',
    coverImage: HERO_IMAGE,
    gallery: [HERO_IMAGE, BC_PENTHOUSE_IMAGE],
    highlights: [
      'Terraço externo de 75 m² privativos',
      'Acesso rápido à praia e gastronomia do Centro',
      'Acabamento acústico e térmico superior',
    ],
    viewsCount: 0,
  },
];

export const DEFAULT_LANDING_PAGES: LandingPage[] = [
  {
    id: 'lp_brava_ocean_reserve',
    title: 'Brava Ocean Reserve — Private Collection',
    slug: 'brava-ocean-reserve',
    kicker: 'Edição Limitada · Praia Brava',
    subtitle:
      'Arquitetura autoral frente ao mar com projeção patrimonial de alta lucratividade e entrada planejada.',
    heroImage: FLAGSHIP_LANDING_IMAGE,
    ctaLabel: 'Solicitar Dossiê e Tabela Privada',
    targetEntityType: 'empreendimento',
    targetEntityId: 'emp_brava_ocean_reserve',
    isFlagshipPremium: true,
    isPublic: true,
    highlights: [
      'Apenas 2 unidades por andar com privacidade acústica total',
      'Projeção de valorização estimada em 22% ao ano até a entrega',
      'Condição direta estratégica com menor exposição de capital inicial',
      'Atendimento direto com Matheus Gonçalves para análise de fluxo e saída',
    ],
    metrics: [
      '198 m² a 310 m² privativos',
      '3 a 4 suítes com vista mar',
      'Entrega Dez/2027',
    ],
  },
];
