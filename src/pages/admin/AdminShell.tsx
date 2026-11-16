import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Building,
  Building2,
  Calendar,
  CheckSquare,
  FileText,
  FolderOpen,
  Kanban,
  Layers,
  Lock,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  DEFAULT_EMPREENDIMENTOS,
  DEFAULT_LANDING_PAGES,
  DEFAULT_PIPELINE_STAGES,
  DEFAULT_PROPERTIES,
} from '../../data/seedData';
import {
  bootstrapInitialFirestoreData,
  fetchServerAdminState,
  subscribeAdminLogs,
  subscribeAllEmpreendimentos,
  subscribeAllLandingPages,
  subscribeAllProperties,
  subscribeCRMCollection,
  subscribeRecentAnalytics,
} from '../../services/firestoreService';
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
} from '../../types';
import { AdminDashboardTab } from '../../components/admin/AdminDashboardTab';
import { PipelineKanbanTab } from '../../components/admin/PipelineKanbanTab';
import {
  ClientsCRMView,
  ProposalsCRMView,
  VisitsCRMView,
} from '../../components/admin/ClientsVisitsProposalsTab';
import { TasksTemplatesTab } from '../../components/admin/TasksTemplatesTab';
import {
  EmpreendimentosCmsView,
  LandingPagesCmsView,
  PropertiesCmsView,
} from '../../components/admin/CmsCatalogTab';
import {
  MediaHubView,
  SecurityLgpdLogsView,
  SiteSettingsView,
} from '../../components/admin/MediaSettingsLogsTab';

type AdminTabId =
  | 'dashboard'
  | 'pipeline'
  | 'clients'
  | 'visits'
  | 'proposals'
  | 'tasks'
  | 'properties'
  | 'empreendimentos'
  | 'landingPages'
  | 'media'
  | 'settings'
  | 'security';

export function AdminShell({
  settings,
  navigate,
}: {
  settings: SiteSettings;
  navigate: (path: string) => void;
}) {
  const {
    user,
    adminEmail,
    adminToken,
    firebaseAdminReady,
    loading,
    isAdmin,
    authError,
    signInWithCredentials,
    signInWithGoogle,
    logout,
  } = useAuth();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTabId>('dashboard');
  const [visitPrefillLead, setVisitPrefillLead] = useState<Lead | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);

  // Private CRM & CMS state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>(DEFAULT_PIPELINE_STAGES);
  const [clients, setClients] = useState<Client[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [properties, setProperties] = useState<Property[]>(DEFAULT_PROPERTIES);
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>(DEFAULT_EMPREENDIMENTOS);
  const [landingPages, setLandingPages] = useState<LandingPage[]>(DEFAULT_LANDING_PAGES);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsEvent[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);

  const applyServerState = useCallback((state: Record<string, unknown> | null) => {
    if (!state) return;
    if (Array.isArray(state.leads)) setLeads(state.leads as Lead[]);
    if (Array.isArray(state.pipelineStages) && state.pipelineStages.length > 0) {
      setStages(state.pipelineStages as PipelineStage[]);
    }
    if (Array.isArray(state.clients)) setClients(state.clients as Client[]);
    if (Array.isArray(state.activities)) setActivities(state.activities as Activity[]);
    if (Array.isArray(state.visits)) setVisits(state.visits as Visit[]);
    if (Array.isArray(state.proposals)) setProposals(state.proposals as Proposal[]);
    if (Array.isArray(state.tasks)) setTasks(state.tasks as Task[]);
    if (Array.isArray(state.properties) && state.properties.length > 0) {
      setProperties(state.properties as Property[]);
    }
    if (Array.isArray(state.empreendimentos) && state.empreendimentos.length > 0) {
      setEmpreendimentos(state.empreendimentos as Empreendimento[]);
    }
    if (Array.isArray(state.landingPages) && state.landingPages.length > 0) {
      setLandingPages(state.landingPages as LandingPage[]);
    }
    if (Array.isArray(state.media)) setMedia(state.media as MediaAsset[]);
    if (Array.isArray(state.analytics)) setAnalytics(state.analytics as AnalyticsEvent[]);
    if (Array.isArray(state.adminLogs)) setLogs(state.adminLogs as AdminLog[]);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    let active = true;
    setBootstrapping(true);
    bootstrapInitialFirestoreData()
      .then((bootState) => {
        if (active && bootState) applyServerState(bootState);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setBootstrapping(false);
      });

    const syncFromServer = () => {
      if (!adminToken) return;
      fetchServerAdminState().then((st) => {
        if (active && st) applyServerState(st);
      });
    };

    window.addEventListener('mg:state-updated', syncFromServer);
    const poll = adminToken ? window.setInterval(syncFromServer, 6000) : undefined;

    const unsubs: (() => void)[] = [];
    if (firebaseAdminReady) {
      unsubs.push(
        subscribeCRMCollection<Lead>('leads', (list) => {
          if (list.length > 0) setLeads(list);
        }),
        subscribeCRMCollection<PipelineStage>('pipelineStages', (list) => {
          if (list.length > 0) setStages(list);
        }),
        subscribeCRMCollection<Client>('clients', setClients),
        subscribeCRMCollection<Activity>('activities', setActivities),
        subscribeCRMCollection<Visit>('visits', setVisits),
        subscribeCRMCollection<Proposal>('proposals', setProposals),
        subscribeCRMCollection<Task>('tasks', setTasks),
        subscribeCRMCollection<MediaAsset>('media', setMedia),
        subscribeAllProperties((list) => {
          if (list.length > 0) setProperties(list);
        }),
        subscribeAllEmpreendimentos((list) => {
          if (list.length > 0) setEmpreendimentos(list);
        }),
        subscribeAllLandingPages((list) => {
          if (list.length > 0) setLandingPages(list);
        }),
        subscribeRecentAnalytics(setAnalytics),
        subscribeAdminLogs(setLogs)
      );
    }

    return () => {
      active = false;
      window.removeEventListener('mg:state-updated', syncFromServer);
      if (poll) window.clearInterval(poll);
      unsubs.forEach((u) => u());
    };
  }, [isAdmin, adminToken, firebaseAdminReady, applyServerState]);

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    await signInWithCredentials(loginEmail, loginPassword);
    setSigningIn(false);
  };

  if (loading && !adminToken) {
    return (
      <div className="min-h-screen bg-[#090D12] flex items-center justify-center p-6">
        <div className="text-sm text-white/70">Carregando painel administrativo...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#090D12] flex items-center justify-center p-6 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-[#A37E4D]/15 blur-3xl"
        />

        <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl p-8 text-white space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[#C8B08A]">
              <Lock className="h-4 w-4" />
              <span>Acesso Administrativo Privado</span>
            </div>
            <h1 className="font-display text-3xl font-semibold">
              Painel &amp; CRM Imobiliário
            </h1>
            <p className="text-sm text-white/70">
              Entre com suas credenciais administrativas para gerenciar todo o site, imóveis, landing pages e o CRM completo.
            </p>
          </div>

          <form onSubmit={handleCredentialLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                E-mail Administrativo
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@x.com"
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-[#A37E4D] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Senha
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-[#A37E4D] focus:outline-none"
              />
            </div>

            {authError && (
              <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-xs text-rose-200">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={signingIn}
              className="w-full rounded-lg bg-[#A37E4D] px-5 py-3 text-sm font-semibold text-white hover:bg-[#8E6C40] disabled:opacity-60 transition-colors cursor-pointer"
            >
              {signingIn ? 'Autenticando...' : 'Entrar no Painel Completo'}
            </button>
          </form>

          <div className="border-t border-white/10 pt-4 space-y-3">
            <button
              type="button"
              onClick={signInWithGoogle}
              className="w-full rounded-lg border border-white/15 bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-white/80 hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              Ou conectar conta Google (Sincronização Firebase)
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar ao site público</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const newLeadsCount = leads.filter((l) => l.stageId === 'novo_lead').length;
  const pendingTasksCount = tasks.filter((t) => t.status === 'Pendente').length;

  const navGroups: {
    group: string;
    items: {
      id: AdminTabId;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      count?: number;
    }[];
  }[] = [
    {
      group: 'CRM Comercial',
      items: [
        { id: 'dashboard', label: 'Dashboard & Relatórios', icon: BarChart3 },
        { id: 'pipeline', label: 'Funil & Leads', icon: Kanban, count: newLeadsCount },
        { id: 'clients', label: 'Clientes', icon: Users },
        { id: 'visits', label: 'Agenda & Visitas', icon: Calendar },
        { id: 'proposals', label: 'Propostas & Docs', icon: FileText },
        { id: 'tasks', label: 'Tarefas & Automação', icon: CheckSquare, count: pendingTasksCount },
      ],
    },
    {
      group: 'Editor do Site & Portfólio',
      items: [
        { id: 'settings', label: 'Editar Todo o Site', icon: Settings },
        { id: 'properties', label: 'Imóveis', icon: Building2 },
        { id: 'empreendimentos', label: 'Empreendimentos', icon: Building },
        { id: 'landingPages', label: 'Landing Pages', icon: Layers },
        { id: 'media', label: 'Mídia (Vercel Blob)', icon: FolderOpen },
        { id: 'security', label: 'Auditoria & LGPD', icon: ShieldCheck },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-[#E5E2DC] bg-white flex flex-col">
        <div className="p-5 border-b border-[#F0EDE6] flex items-center justify-between lg:block">
          <div>
            <div className="font-display text-lg font-semibold text-[#0C1117]">
              {settings.brandName}
            </div>
            <div className="text-[11px] text-[#6B7280]">Centro Comercial &amp; Editor</div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="lg:mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#8E6C40] hover:text-[#0C1117] cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Ver site público</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          {navGroups.map((g) => (
            <div key={g.group} className="space-y-1">
              <div className="px-3 text-[11px] font-semibold tracking-wider text-[#9CA3AF]">
                {g.group}
              </div>
              {g.items.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#0C1117] text-white'
                        : 'text-[#374151] hover:bg-[#F5F3EE]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {typeof item.count === 'number' && item.count > 0 && (
                      <span
                        className={`font-mono text-[11px] tabular-nums ${
                          active ? 'text-[#C8B08A]' : 'text-[#8E6C40] font-semibold'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-[#F0EDE6] p-4 space-y-2">
          {!user && (
            <button
              type="button"
              onClick={signInWithGoogle}
              className="w-full rounded-lg border border-[#D8D3CA] px-2.5 py-1.5 text-[11px] font-medium text-[#374151] hover:bg-[#F5F3EE] cursor-pointer"
            >
              Vincular Google Firebase
            </button>
          )}
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="truncate text-[#6B7280]">{adminEmail || 'admin@x.com'}</span>
            <button
              type="button"
              onClick={logout}
              title="Sair"
              className="p-1.5 text-[#6B7280] hover:text-rose-700 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 p-6 lg:p-8 overflow-x-hidden">
        {bootstrapping && leads.length === 0 && properties.length === 0 ? (
          <div className="rounded-xl border border-[#E5E2DC] bg-white p-8 text-sm text-[#6B7280]">
            Inicializando painel administrativo...
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <AdminDashboardTab
                leads={leads}
                stages={stages}
                properties={properties}
                visits={visits}
                analytics={analytics}
              />
            )}
            {activeTab === 'pipeline' && (
              <PipelineKanbanTab
                leads={leads}
                stages={stages}
                activities={activities}
                properties={properties}
                onOpenScheduleVisit={(lead) => {
                  setVisitPrefillLead(lead);
                  setActiveTab('visits');
                }}
              />
            )}
            {activeTab === 'clients' && (
              <ClientsCRMView
                clients={clients}
                properties={properties}
                visits={visits}
                proposals={proposals}
                activities={activities}
              />
            )}
            {activeTab === 'visits' && (
              <VisitsCRMView
                visits={visits}
                properties={properties}
                leads={leads}
                prefillLead={visitPrefillLead}
                onClearPrefill={() => setVisitPrefillLead(null)}
              />
            )}
            {activeTab === 'proposals' && (
              <ProposalsCRMView
                proposals={proposals}
                properties={properties}
                clients={clients}
                media={media}
              />
            )}
            {activeTab === 'tasks' && (
              <TasksTemplatesTab tasks={tasks} leads={leads} settings={settings} />
            )}
            {activeTab === 'properties' && (
              <PropertiesCmsView
                properties={properties}
                empreendimentos={empreendimentos}
                media={media}
                settings={settings}
                onNavigatePublic={navigate}
              />
            )}
            {activeTab === 'empreendimentos' && (
              <EmpreendimentosCmsView
                empreendimentos={empreendimentos}
                properties={properties}
                media={media}
                settings={settings}
                onNavigatePublic={navigate}
              />
            )}
            {activeTab === 'landingPages' && (
              <LandingPagesCmsView
                landingPages={landingPages}
                empreendimentos={empreendimentos}
                media={media}
                settings={settings}
                onNavigatePublic={navigate}
              />
            )}
            {activeTab === 'media' && <MediaHubView media={media} settings={settings} />}
            {activeTab === 'settings' && <SiteSettingsView settings={settings} media={media} />}
            {activeTab === 'security' && <SecurityLgpdLogsView logs={logs} />}
          </>
        )}
      </main>
    </div>
  );
}
