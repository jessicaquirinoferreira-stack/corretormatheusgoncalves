import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { AuthProvider } from './contexts/AuthContext';
import {
  DEFAULT_EMPREENDIMENTOS,
  DEFAULT_LANDING_PAGES,
  DEFAULT_PROPERTIES,
  DEFAULT_SITE_SETTINGS,
} from './data/seedData';
import { testFirestoreConnection } from './firebase';
import {
  fetchServerPublicState,
  subscribePublicEmpreendimentos,
  subscribePublicLandingPages,
  subscribePublicProperties,
  subscribeSiteSettings,
  trackAnalyticsEvent,
} from './services/firestoreService';
import type { Empreendimento, LandingPage, Property, SiteSettings } from './types';
import { captureUtmParams } from './utils/formatters';
import { ScrollProgressRule } from './components/motion/MotionPrimitives';
import { SiteHeader } from './components/public/SiteHeader';
import { SiteIntro } from './components/public/SiteIntro';
import { SiteFooter } from './components/public/SiteFooter';
import { HomePage, type HomePageSearchFilter } from './pages/public/HomePage';
import { EmpreendimentosPage, PropertiesCatalogPage } from './pages/public/CatalogPages';
import {
  AboutPage,
  ContactPage,
  EmpreendimentoDetailPage,
  PropertyDetailPage,
} from './pages/public/DetailPages';
import { FlagshipLandingPage } from './pages/public/FlagshipLandingPage';
import { AdminShell } from './pages/admin/AdminShell';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
          <div className="max-w-md rounded-xl border border-[#E5E2DC] bg-white p-6 space-y-3">
            <h2 className="font-display text-xl font-semibold text-[#0C1117]">
              Ocorreu um erro inesperado
            </h2>
            <p className="text-xs text-[#6B7280] break-words">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-[#0C1117] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
            >
              Recarregar aplicação
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [path, setPath] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname || '/' : '/'
  );
  const [introDone, setIntroDone] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.location.pathname.startsWith('/admin') : false
  );
  const [quickFilter, setQuickFilter] = useState<HomePageSearchFilter | null>(null);

  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [properties, setProperties] = useState<Property[]>(DEFAULT_PROPERTIES);
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>(DEFAULT_EMPREENDIMENTOS);
  const [landingPages, setLandingPages] = useState<LandingPage[]>(DEFAULT_LANDING_PAGES);

  const syncPublicFromServer = useCallback(async () => {
    const serverState = await fetchServerPublicState();
    if (!serverState) return;
    if (serverState.settings) {
      const normalizedAbout =
        serverState.settings.aboutImage &&
        !serverState.settings.aboutImage.includes('matheus_broker_portrait_')
          ? serverState.settings.aboutImage
          : DEFAULT_SITE_SETTINGS.aboutImage;
      setSettings({
        ...DEFAULT_SITE_SETTINGS,
        ...serverState.settings,
        aboutImage: normalizedAbout,
        officialLogoUrl:
          serverState.settings.officialLogoUrl || DEFAULT_SITE_SETTINGS.officialLogoUrl,
      });
    }
    if (serverState.properties && serverState.properties.length > 0) {
      setProperties(serverState.properties);
    }
    if (serverState.empreendimentos && serverState.empreendimentos.length > 0) {
      setEmpreendimentos(serverState.empreendimentos);
    }
    if (serverState.landingPages && serverState.landingPages.length > 0) {
      setLandingPages(serverState.landingPages);
    }
  }, []);

  useEffect(() => {
    testFirestoreConnection();
    syncPublicFromServer();

    const onUpdated = () => {
      syncPublicFromServer();
    };
    window.addEventListener('mg:state-updated', onUpdated);

    const unsubSettings = subscribeSiteSettings((s) =>
      setSettings((prev) => ({
        ...prev,
        ...s,
        aboutImage:
          s.aboutImage && !s.aboutImage.includes('matheus_broker_portrait_')
            ? s.aboutImage
            : prev.aboutImage || DEFAULT_SITE_SETTINGS.aboutImage,
        officialLogoUrl:
          s.officialLogoUrl || prev.officialLogoUrl || DEFAULT_SITE_SETTINGS.officialLogoUrl,
      }))
    );
    const unsubProps = subscribePublicProperties((list) => {
      if (list.length > 0) setProperties(list);
    });
    const unsubEmps = subscribePublicEmpreendimentos((list) => {
      if (list.length > 0) setEmpreendimentos(list);
    });
    const unsubLps = subscribePublicLandingPages((list) => {
      if (list.length > 0) setLandingPages(list);
    });

    const onPopState = () => {
      setPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('mg:state-updated', onUpdated);
      window.removeEventListener('popstate', onPopState);
      unsubSettings();
      unsubProps();
      unsubEmps();
      unsubLps();
    };
  }, [syncPublicFromServer]);

  useEffect(() => {
    if (settings.seoTitle) {
      document.title = settings.seoTitle;
    }
  }, [settings.seoTitle]);

  useEffect(() => {
    if (!path.startsWith('/admin')) {
      const utm = captureUtmParams();
      trackAnalyticsEvent({
        eventType: 'page_view',
        path,
        utmSource: utm.utmSource,
      });
    }
  }, [path]);

  const navigate = (nextPath: string) => {
    if (nextPath !== path) {
      window.history.pushState({}, '', nextPath);
      setPath(nextPath);
      if (nextPath === '/destaques') {
        setTimeout(() => {
          document.getElementById('destaques')?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (!nextPath.startsWith('/admin')) {
        syncPublicFromServer();
      }
    } else if (nextPath === '/destaques') {
      document.getElementById('destaques')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleQuickSearch = (filter: HomePageSearchFilter) => {
    setQuickFilter(filter);
    navigate(filter.purpose === 'investir' ? '/investir' : '/comprar');
  };

  const renderRoute = () => {
    if (path.startsWith('/admin')) {
      return <AdminShell settings={settings} navigate={navigate} />;
    }

    if (path.startsWith('/lp/')) {
      const slug = path.replace('/lp/', '').replace(/\/$/, '');
      const lp = landingPages.find((l) => l.slug === slug) || landingPages[0];
      const linkedEmp = empreendimentos.find((e) => e.id === lp?.targetEntityId);
      const linkedProp = properties.find((p) => p.id === lp?.targetEntityId);
      return (
        <>
          <ScrollProgressRule />
          <FlagshipLandingPage
            landingPage={lp}
            linkedEmpreendimento={linkedEmp}
            linkedProperty={linkedProp}
            settings={settings}
            navigate={navigate}
          />
        </>
      );
    }

    let content: React.ReactNode = null;

    if (path === '/' || path === '' || path === '/destaques') {
      content = (
        <HomePage
          settings={settings}
          properties={properties}
          empreendimentos={empreendimentos}
          navigate={navigate}
          onQuickSearch={handleQuickSearch}
        />
      );
    } else if (path === '/comprar') {
      content = (
        <PropertiesCatalogPage
          mode="comprar"
          properties={properties}
          initialFilter={quickFilter}
          navigate={navigate}
        />
      );
    } else if (path === '/investir') {
      content = (
        <PropertiesCatalogPage
          mode="investir"
          properties={properties}
          initialFilter={quickFilter}
          navigate={navigate}
        />
      );
    } else if (path === '/empreendimentos') {
      content = (
        <EmpreendimentosPage
          empreendimentos={empreendimentos}
          properties={properties}
          navigate={navigate}
        />
      );
    } else if (path === '/sobre') {
      content = <AboutPage settings={settings} navigate={navigate} />;
    } else if (path === '/contato') {
      content = <ContactPage settings={settings} />;
    } else if (path.startsWith('/imovel/')) {
      const slug = path.replace('/imovel/', '').replace(/\/$/, '');
      const prop = properties.find((p) => p.slug === slug);
      const emp = prop?.empreendimentoId
        ? empreendimentos.find((e) => e.id === prop.empreendimentoId)
        : undefined;
      const related = prop
        ? properties.filter((p) => p.id !== prop.id && p.isPublic !== false).slice(0, 3)
        : [];
      content = (
        <PropertyDetailPage
          property={prop}
          empreendimento={emp}
          relatedProperties={related}
          settings={settings}
          navigate={navigate}
        />
      );
    } else if (path.startsWith('/empreendimento/')) {
      const slug = path.replace('/empreendimento/', '').replace(/\/$/, '');
      const emp = empreendimentos.find((e) => e.slug === slug);
      const linked = emp ? properties.filter((p) => p.empreendimentoId === emp.id) : [];
      content = (
        <EmpreendimentoDetailPage
          empreendimento={emp}
          linkedProperties={linked}
          settings={settings}
          navigate={navigate}
        />
      );
    } else {
      content = (
        <HomePage
          settings={settings}
          properties={properties}
          empreendimentos={empreendimentos}
          navigate={navigate}
          onQuickSearch={handleQuickSearch}
        />
      );
    }

    return (
      <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
        <ScrollProgressRule />
        <SiteHeader
          currentPath={path}
          navigate={navigate}
          brandName={settings.brandName}
          logoUrl={settings.officialLogoUrl}
        />
        <main className="flex-1">{content}</main>
        <SiteFooter settings={settings} navigate={navigate} />
      </div>
    );
  };

  return (
    <AppErrorBoundary>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <AnimatePresence>
            {!introDone && !path.startsWith('/admin') && (
              <SiteIntro
                brandName={settings.brandName}
                onComplete={() => setIntroDone(true)}
              />
            )}
          </AnimatePresence>
          {renderRoute()}
        </AuthProvider>
      </MotionConfig>
    </AppErrorBoundary>
  );
}
