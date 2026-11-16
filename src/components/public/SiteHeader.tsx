import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export interface NavRouteProps {
  currentPath: string;
  navigate: (path: string) => void;
  brandName: string;
  logoUrl?: string;
}

const NAV_LINKS = [
  { label: 'Início', path: '/' },
  { label: 'Comprar', path: '/comprar' },
  { label: 'Investir', path: '/investir' },
  { label: 'Empreendimentos', path: '/empreendimentos' },
  { label: 'Destaques', path: '/destaques' },
  { label: 'Sobre', path: '/sobre' },
];

export function SiteHeader({ currentPath, navigate, brandName, logoUrl }: NavRouteProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (path: string) => {
    setMobileOpen(false);
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#E5E2DC] bg-[#FAF9F6]/94 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-6 px-6">
        {/* Zone 1: Large, completely visible Brand Logo within fixed 72px menu height */}
        <button
          type="button"
          aria-label={brandName}
          onClick={() => handleNav('/')}
          className="flex h-full items-center py-[3px] shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A37E4D]"
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={brandName}
              referrerPolicy="no-referrer"
              className="h-[58px] sm:h-[66px] w-auto max-w-[180px] object-contain"
            />
          ) : (
            <span className="font-display text-xl font-semibold tracking-tight text-[#0C1117] whitespace-nowrap">
              {brandName}
            </span>
          )}
        </button>

        {/* Zone 2: Concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Navegação principal">
          {NAV_LINKS.map((item) => {
            const active =
              item.path === '/'
                ? currentPath === '/'
                : currentPath.startsWith(item.path);
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNav(item.path)}
                className={`relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A37E4D] ${
                  active
                    ? 'text-[#0C1117]'
                    : 'text-[#4B5563] hover:text-[#0C1117]'
                }`}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[1px] h-[1.5px] bg-[#A37E4D]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNav('/contato')}
            className="hidden md:inline-flex items-center justify-center rounded-lg bg-[#0C1117] px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#1E293B] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A37E4D]"
          >
            Contato
          </button>

          <button
            type="button"
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#E5E2DC] text-[#0C1117] cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="md:hidden border-t border-[#E5E2DC] bg-[#FAF9F6] px-6 py-4"
          >
            <div className="flex flex-col gap-2">
              {NAV_LINKS.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleNav(item.path)}
                  className={`flex h-11 items-center text-left text-sm font-medium ${
                    currentPath === item.path ? 'text-[#A37E4D]' : 'text-[#111827]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleNav('/contato')}
                className="mt-2 h-11 w-full rounded-lg bg-[#0C1117] px-4 text-sm font-medium text-white"
              >
                Contato
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
