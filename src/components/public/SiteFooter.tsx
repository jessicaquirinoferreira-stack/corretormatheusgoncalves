import React from 'react';
import { Lock } from 'lucide-react';
import type { SiteSettings } from '../../types';

export function SiteFooter({
  settings,
  navigate,
}: {
  settings: SiteSettings;
  navigate: (path: string) => void;
}) {
  const igUsername = settings.instagramHandle.replace('@', '').trim() || 'matheus_goncalves_mg';

  return (
    <footer className="border-t border-[#E5E2DC] bg-[#0C1117] text-[#E5E7EB]">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5 space-y-4">
            {settings.officialLogoUrl ? (
              <img
                src={settings.officialLogoUrl}
                alt={settings.brandName}
                referrerPolicy="no-referrer"
                className="h-24 md:h-28 w-auto object-contain invert brightness-110 contrast-110"
              />
            ) : (
              <div className="font-display text-2xl font-semibold text-white">
                {settings.brandName}
              </div>
            )}
            <p className="max-w-md text-sm leading-relaxed text-[#9CA3AF]">
              {settings.footerNote ||
                'Especialista em imóveis e lucratividade em Balneário Camboriú e Praia Brava. Atendimento próximo, ético e orientado à construção de patrimônio familiar.'}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#C8B08A]">
              <span>Balneário Camboriú</span>
              <span aria-hidden="true">·</span>
              <span>Praia Brava</span>
              <span aria-hidden="true">·</span>
              <a
                href={`https://www.instagram.com/${igUsername}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[#A37E4D]/50 underline-offset-4 hover:text-white transition-colors"
              >
                {settings.instagramHandle || '@matheus_goncalves_mg'}
              </a>
            </div>
          </div>

          <div className="md:col-span-3 space-y-3">
            <div className="text-xs font-semibold tracking-wider text-[#9CA3AF]">
              Navegação
            </div>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Início', path: '/' },
                { label: 'Comprar Imóveis', path: '/comprar' },
                { label: 'Investir com Lucratividade', path: '/investir' },
                { label: 'Empreendimentos', path: '/empreendimentos' },
                { label: 'Sobre Matheus Gonçalves', path: '/sobre' },
                { label: 'Atendimento e Contato', path: '/contato' },
              ].map((link) => (
                <li key={link.path}>
                  <button
                    type="button"
                    onClick={() => navigate(link.path)}
                    className="text-[#D1D5DB] hover:text-white transition-colors cursor-pointer"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <div className="text-xs font-semibold tracking-wider text-[#9CA3AF]">
              Atendimento &amp; Dados Oficiais
            </div>
            <div className="space-y-2 text-sm text-[#D1D5DB]">
              {settings.creci && <p>CRECI: {settings.creci}</p>}
              {settings.phone && <p>Telefone: {settings.phone}</p>}
              {settings.email && <p>E-mail: {settings.email}</p>}
              {settings.address && <p>Endereço: {settings.address}</p>}
              {!settings.phone && !settings.email && (
                <p className="text-[#9CA3AF]">
                  Solicite atendimento personalizado diretamente pelo formulário de contato ou Instagram oficial.
                </p>
              )}
              <button
                type="button"
                onClick={() => navigate('/lp/brava-ocean-reserve')}
                className="mt-2 inline-block text-xs font-medium text-[#C8B08A] underline underline-offset-4 hover:text-white cursor-pointer"
              >
                Acessar Coleção Privada Brava Ocean Reserve
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-xs text-[#9CA3AF] sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <span>© {new Date().getFullYear()} {settings.brandName}</span>
            <span aria-hidden="true">·</span>
            <span>Tratamento de dados em conformidade com a LGPD</span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-white transition-colors cursor-pointer"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Painel Admin</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
