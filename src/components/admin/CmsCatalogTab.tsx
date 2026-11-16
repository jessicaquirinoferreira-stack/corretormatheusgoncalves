import React, { useState } from 'react';
import { ExternalLink, Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  removeEmpreendimento,
  removeLandingPage,
  removeProperty,
  saveEmpreendimento,
  saveLandingPage,
  saveProperty,
} from '../../services/firestoreService';
import type {
  CityOption,
  Empreendimento,
  EmpreendimentoStage,
  LandingPage,
  MediaAsset,
  Property,
  PropertyPurpose,
  PropertyStatus,
  PropertyType,
  SiteSettings,
} from '../../types';
import { formatBRL, slugify } from '../../utils/formatters';
import { MultiMediaGalleryUploader, SingleAssetUploader } from './DeviceMediaUploader';

export function PropertiesCmsView({
  properties,
  empreendimentos,
  media,
  settings,
  onNavigatePublic,
}: {
  properties: Property[];
  empreendimentos: Empreendimento[];
  media: MediaAsset[];
  settings: SiteSettings;
  onNavigatePublic: (path: string) => void;
}) {
  const [editing, setEditing] = useState<Partial<Property> | null>(null);
  const [isNew, setIsNew] = useState(false);

  const openNew = () => {
    setIsNew(true);
    setEditing({
      id: `prop_${Date.now()}`,
      title: '',
      slug: '',
      purpose: 'ambos',
      type: 'Apartamento',
      city: 'Balneario Camboriu',
      neighborhood: 'Barra Sul',
      price: 3500000,
      areaPrivate: 180,
      suites: 3,
      parkingSpaces: 3,
      estimatedAnnualYield: 18,
      status: 'Disponivel',
      featured: true,
      isPublic: true,
      empreendimentoId: '',
      shortDescription: '',
      description: '',
      coverImage: '',
      gallery: [],
      videos: [],
      highlights: [],
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.title) return;
    const galleryList = (editing.gallery || []).filter(Boolean);
    const cover = editing.coverImage || galleryList[0] || '';
    await saveProperty(
      {
        id: editing.id || `prop_${Date.now()}`,
        title: editing.title,
        slug: editing.slug || slugify(editing.title),
        purpose: (editing.purpose || 'ambos') as PropertyPurpose,
        type: (editing.type || 'Apartamento') as PropertyType,
        city: (editing.city || 'Balneario Camboriu') as CityOption,
        neighborhood: editing.neighborhood || 'Centro',
        price: Number(editing.price) || 0,
        areaPrivate: Number(editing.areaPrivate) || 0,
        suites: Number(editing.suites) || 0,
        parkingSpaces: Number(editing.parkingSpaces) || 0,
        estimatedAnnualYield: Number(editing.estimatedAnnualYield) || 0,
        status: (editing.status || 'Disponivel') as PropertyStatus,
        featured: Boolean(editing.featured),
        isPublic: editing.status !== 'Oculto' && Boolean(editing.isPublic),
        empreendimentoId: editing.empreendimentoId || '',
        shortDescription: editing.shortDescription || '',
        description: editing.description || '',
        coverImage: cover,
        gallery: galleryList.length > 0 ? galleryList : cover ? [cover] : [],
        videos: (editing.videos || []).filter(Boolean),
        highlights: editing.highlights || [],
        viewsCount: editing.viewsCount || 0,
      },
      isNew
    );
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#0C1117]">
            Gerenciamento de Imóveis
          </h1>
          <p className="text-xs text-[#6B7280]">
            Adicione ou edite imóveis com upload ilimitado de fotos e vídeos do dispositivo via Vercel Blob
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0C1117] px-3.5 py-2 text-xs font-semibold text-white cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Novo Imóvel</span>
        </button>
      </div>

      <div className="rounded-xl border border-[#E5E2DC] bg-white overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#E5E2DC] text-xs text-[#6B7280]">
              <th className="py-3 px-4 font-medium">Título</th>
              <th className="py-3 px-4 font-medium">Cidade / Bairro</th>
              <th className="py-3 px-4 font-medium">Mídia</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium text-right">Valor</th>
              <th className="py-3 px-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => {
              const photoCount = Array.from(
                new Set([p.coverImage, ...(p.gallery || [])].filter(Boolean))
              ).length;
              const videoCount = (p.videos || []).length;
              return (
                <tr key={p.id} className="border-b border-[#F5F3EE] last:border-0">
                  <td className="py-3 px-4">
                    <div className="font-medium text-[#0C1117]">{p.title}</div>
                    <div className="text-xs text-[#6B7280]">
                      /{p.slug} {p.featured ? '· Destaque' : ''}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-[#4B5563]">
                    {p.city === 'Balneario Camboriu' ? 'BC' : 'Praia Brava'} · {p.neighborhood}
                  </td>
                  <td className="py-3 px-4 text-xs text-[#6B7280] tabular-nums">
                    {photoCount} foto(s) · {videoCount} vídeo(s)
                  </td>
                  <td className="py-3 px-4 text-xs font-medium">{p.status}</td>
                  <td className="py-3 px-4 text-right font-mono text-xs tabular-nums">
                    {formatBRL(p.price)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onNavigatePublic(`/imovel/${p.slug}`)}
                        className="p-1.5 text-[#6B7280] hover:text-[#0C1117] cursor-pointer"
                        title="Abrir página pública"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsNew(false);
                          setEditing(p);
                        }}
                        className="p-1.5 text-[#6B7280] hover:text-[#0C1117] cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeProperty(p.id)}
                        className="p-1.5 text-rose-600 hover:text-rose-800 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 p-4 overflow-y-auto">
          <form onSubmit={handleSave} className="w-full max-w-3xl rounded-xl bg-white p-6 space-y-4 my-6">
            <div className="flex items-center justify-between border-b border-[#F0EDE6] pb-3">
              <h3 className="font-display text-xl font-semibold text-[#0C1117]">
                {isNew ? 'Cadastrar Imóvel' : 'Editar Imóvel'}
              </h3>
              <button type="button" onClick={() => setEditing(null)} className="cursor-pointer">
                <X className="h-5 w-5 text-[#6B7280]" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                required
                placeholder="Título do imóvel"
                value={editing.title || ''}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    title: e.target.value,
                    slug: isNew ? slugify(e.target.value) : editing.slug,
                  })
                }
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Slug URL (ex: cobertura-barra-sul)"
                value={editing.slug || ''}
                onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
              <select
                value={editing.city || 'Balneario Camboriu'}
                onChange={(e) => setEditing({ ...editing, city: e.target.value as CityOption })}
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              >
                <option value="Balneario Camboriu">Balneário Camboriú</option>
                <option value="Praia Brava">Praia Brava</option>
              </select>
              <input
                required
                placeholder="Bairro (ex: Barra Sul)"
                value={editing.neighborhood || ''}
                onChange={(e) => setEditing({ ...editing, neighborhood: e.target.value })}
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
              <select
                value={editing.type || 'Apartamento'}
                onChange={(e) => setEditing({ ...editing, type: e.target.value as PropertyType })}
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              >
                <option value="Apartamento">Apartamento</option>
                <option value="Cobertura">Cobertura</option>
                <option value="Diferenciado">Diferenciado</option>
                <option value="Casa">Casa</option>
                <option value="Terreno">Terreno</option>
                <option value="Sala Comercial">Sala Comercial</option>
              </select>
              <select
                value={editing.purpose || 'ambos'}
                onChange={(e) =>
                  setEditing({ ...editing, purpose: e.target.value as PropertyPurpose })
                }
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              >
                <option value="ambos">Morar e Investir</option>
                <option value="comprar">Comprar / Morar</option>
                <option value="investir">Investir</option>
              </select>
              <input
                type="number"
                placeholder="Valor (R$)"
                value={editing.price ?? 0}
                onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Área privativa (m²)"
                value={editing.areaPrivate ?? 0}
                onChange={(e) => setEditing({ ...editing, areaPrivate: Number(e.target.value) })}
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Suítes"
                value={editing.suites ?? 0}
                onChange={(e) => setEditing({ ...editing, suites: Number(e.target.value) })}
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Vagas"
                value={editing.parkingSpaces ?? 0}
                onChange={(e) => setEditing({ ...editing, parkingSpaces: Number(e.target.value) })}
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
              <select
                value={editing.status || 'Disponivel'}
                onChange={(e) => setEditing({ ...editing, status: e.target.value as PropertyStatus })}
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              >
                <option value="Disponivel">Disponível</option>
                <option value="Reservado">Reservado</option>
                <option value="Vendido">Vendido</option>
                <option value="Oculto">Oculto</option>
              </select>
              <select
                value={editing.empreendimentoId || ''}
                onChange={(e) => setEditing({ ...editing, empreendimentoId: e.target.value })}
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              >
                <option value="">Sem empreendimento vinculado</option>
                {empreendimentos.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            <MultiMediaGalleryUploader
              folder="imoveis"
              coverImage={editing.coverImage || ''}
              gallery={editing.gallery || []}
              videos={editing.videos || []}
              settings={settings}
              media={media}
              onChange={({ coverImage, gallery, videos }) =>
                setEditing({ ...editing, coverImage, gallery, videos })
              }
            />

            <textarea
              rows={2}
              placeholder="Resumo curto para o card"
              value={editing.shortDescription || ''}
              onChange={(e) => setEditing({ ...editing, shortDescription: e.target.value })}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            />
            <textarea
              rows={3}
              placeholder="Descrição completa"
              value={editing.description || ''}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            />

            <label className="flex items-center gap-2 text-xs text-[#374151]">
              <input
                type="checkbox"
                checked={Boolean(editing.featured)}
                onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
              />
              <span>Destacar na Home</span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-[#D8D3CA] px-4 py-2 text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#0C1117] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
              >
                Salvar Imóvel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export function EmpreendimentosCmsView({
  empreendimentos,
  properties,
  media,
  settings,
  onNavigatePublic,
}: {
  empreendimentos: Empreendimento[];
  properties: Property[];
  media: MediaAsset[];
  settings: SiteSettings;
  onNavigatePublic: (path: string) => void;
}) {
  const [editing, setEditing] = useState<Partial<Empreendimento> | null>(null);
  const [isNew, setIsNew] = useState(false);

  const openNew = () => {
    setIsNew(true);
    setEditing({
      id: `emp_${Date.now()}`,
      name: '',
      slug: '',
      developer: '',
      city: 'Praia Brava',
      neighborhood: '',
      deliveryForecast: '2028',
      stage: 'Lancamento',
      startingPrice: 3000000,
      estimatedAppreciation: 20,
      featured: true,
      isPublic: true,
      summary: '',
      description: '',
      coverImage: '',
      gallery: [],
      videos: [],
      amenities: [],
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.name) return;
    const galleryList = (editing.gallery || []).filter(Boolean);
    const cover = editing.coverImage || galleryList[0] || '';
    await saveEmpreendimento(
      {
        id: editing.id || `emp_${Date.now()}`,
        name: editing.name,
        slug: editing.slug || slugify(editing.name),
        developer: editing.developer || 'Incorporadora Parceira',
        city: (editing.city || 'Praia Brava') as CityOption,
        neighborhood: editing.neighborhood || '',
        deliveryForecast: editing.deliveryForecast || '2028',
        stage: (editing.stage || 'Lancamento') as EmpreendimentoStage,
        startingPrice: Number(editing.startingPrice) || 0,
        estimatedAppreciation: Number(editing.estimatedAppreciation) || 0,
        featured: Boolean(editing.featured),
        isPublic: Boolean(editing.isPublic),
        summary: editing.summary || '',
        description: editing.description || '',
        coverImage: cover,
        gallery: galleryList.length > 0 ? galleryList : cover ? [cover] : [],
        videos: (editing.videos || []).filter(Boolean),
        amenities: editing.amenities || [],
      },
      isNew
    );
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#0C1117]">
            Gestão de Empreendimentos
          </h1>
          <p className="text-xs text-[#6B7280]">
            Gerencie projetos com galeria ilimitada de fotos, vídeos e marca d&apos;água oficial
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0C1117] px-3.5 py-2 text-xs font-semibold text-white cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Novo Empreendimento</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {empreendimentos.map((emp) => {
          const linked = properties.filter((p) => p.empreendimentoId === emp.id).length;
          const photoCount = Array.from(
            new Set([emp.coverImage, ...(emp.gallery || [])].filter(Boolean))
          ).length;
          const videoCount = (emp.videos || []).length;
          return (
            <div key={emp.id} className="rounded-xl border border-[#E5E2DC] bg-white p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-[#6B7280]">
                    {emp.developer} · {emp.stage}
                  </div>
                  <h3 className="font-display text-xl font-semibold text-[#0C1117]">{emp.name}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onNavigatePublic(`/empreendimento/${emp.slug}`)}
                    className="p-1.5 text-[#6B7280] hover:text-[#0C1117] cursor-pointer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNew(false);
                      setEditing(emp);
                    }}
                    className="p-1.5 text-[#6B7280] hover:text-[#0C1117] cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeEmpreendimento(emp.id)}
                    className="p-1.5 text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="text-xs text-[#4B5563]">
                A partir de <strong className="font-mono">{formatBRL(emp.startingPrice)}</strong> ·{' '}
                {linked} imóvel(is) · {photoCount} foto(s) · {videoCount} vídeo(s)
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 p-4 overflow-y-auto">
          <form onSubmit={handleSave} className="w-full max-w-3xl rounded-xl bg-white p-6 space-y-4 my-6">
            <div className="flex items-center justify-between border-b border-[#F0EDE6] pb-3">
              <h3 className="font-display text-xl font-semibold text-[#0C1117]">
                {isNew ? 'Novo Empreendimento' : 'Editar Empreendimento'}
              </h3>
              <button type="button" onClick={() => setEditing(null)} className="cursor-pointer">
                <X className="h-5 w-5 text-[#6B7280]" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                required
                placeholder="Nome do empreendimento"
                value={editing.name || ''}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    name: e.target.value,
                    slug: isNew ? slugify(e.target.value) : editing.slug,
                  })
                }
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Construtora / Incorporadora"
                value={editing.developer || ''}
                onChange={(e) => setEditing({ ...editing, developer: e.target.value })}
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
              <select
                value={editing.city || 'Praia Brava'}
                onChange={(e) => setEditing({ ...editing, city: e.target.value as CityOption })}
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              >
                <option value="Praia Brava">Praia Brava</option>
                <option value="Balneario Camboriu">Balneário Camboriú</option>
              </select>
              <select
                value={editing.stage || 'Lancamento'}
                onChange={(e) =>
                  setEditing({ ...editing, stage: e.target.value as EmpreendimentoStage })
                }
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              >
                <option value="Pre-Lancamento">Pré-Lançamento</option>
                <option value="Lancamento">Lançamento</option>
                <option value="Em Construcao">Em Construção</option>
                <option value="Pronto">Pronto</option>
              </select>
              <input
                placeholder="Previsão de entrega"
                value={editing.deliveryForecast || ''}
                onChange={(e) => setEditing({ ...editing, deliveryForecast: e.target.value })}
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Valor inicial (R$)"
                value={editing.startingPrice ?? 0}
                onChange={(e) => setEditing({ ...editing, startingPrice: Number(e.target.value) })}
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
            </div>

            <MultiMediaGalleryUploader
              folder="empreendimentos"
              coverImage={editing.coverImage || ''}
              gallery={editing.gallery || []}
              videos={editing.videos || []}
              settings={settings}
              media={media}
              onChange={({ coverImage, gallery, videos }) =>
                setEditing({ ...editing, coverImage, gallery, videos })
              }
            />

            <textarea
              rows={2}
              placeholder="Resumo para o card"
              value={editing.summary || ''}
              onChange={(e) => setEditing({ ...editing, summary: e.target.value })}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            />
            <textarea
              rows={3}
              placeholder="Descrição completa do empreendimento"
              value={editing.description || ''}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-[#D8D3CA] px-4 py-2 text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#0C1117] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
              >
                Salvar Empreendimento
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export function LandingPagesCmsView({
  landingPages,
  empreendimentos,
  media,
  settings,
  onNavigatePublic,
}: {
  landingPages: LandingPage[];
  empreendimentos: Empreendimento[];
  media: MediaAsset[];
  settings: SiteSettings;
  onNavigatePublic: (path: string) => void;
}) {
  const [editing, setEditing] = useState<Partial<LandingPage> | null>(null);
  const [isNew, setIsNew] = useState(false);

  const openNew = () => {
    setIsNew(true);
    setEditing({
      id: `lp_${Date.now()}`,
      title: '',
      slug: '',
      kicker: 'Campanha Privada',
      subtitle: '',
      heroImage: '/src/assets/images/landing_private_tower_1794837420277.jpg',
      ctaLabel: 'Solicitar Dossiê Completo',
      targetEntityType: 'empreendimento',
      targetEntityId: empreendimentos[0]?.id || '',
      isFlagshipPremium: false,
      isPublic: true,
      highlights: [],
      metrics: [],
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.title) return;
    await saveLandingPage(
      {
        id: editing.id || `lp_${Date.now()}`,
        title: editing.title,
        slug: editing.slug || slugify(editing.title),
        kicker: editing.kicker || '',
        subtitle: editing.subtitle || '',
        heroImage:
          editing.heroImage || '/src/assets/images/landing_private_tower_1794837420277.jpg',
        ctaLabel: editing.ctaLabel || 'Receber Tabela',
        targetEntityType: editing.targetEntityType || 'empreendimento',
        targetEntityId: editing.targetEntityId || '',
        isFlagshipPremium: Boolean(editing.isFlagshipPremium),
        isPublic: Boolean(editing.isPublic),
        highlights: editing.highlights || [],
        metrics: editing.metrics || [],
      },
      isNew
    );
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#0C1117]">
            Landing Pages &amp; Campanhas
          </h1>
          <p className="text-xs text-[#6B7280]">
            Crie, edite e publique landing pages de alta conversão integradas ao funil de leads
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0C1117] px-3.5 py-2 text-xs font-semibold text-white cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nova Landing Page</span>
        </button>
      </div>

      <div className="space-y-3">
        {landingPages.map((lp) => (
          <div
            key={lp.id}
            className="rounded-xl border border-[#E5E2DC] bg-white p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1">
              <div className="text-xs text-[#8E6C40] font-medium">
                {lp.isFlagshipPremium ? 'Landing Page Flagship Premium' : 'Campanha'} ·{' '}
                {lp.isPublic ? 'Publicada' : 'Rascunho'}
              </div>
              <div className="font-display text-lg font-semibold text-[#0C1117]">{lp.title}</div>
              <div className="text-xs text-[#6B7280]">/lp/{lp.slug}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigatePublic(`/lp/${lp.slug}`)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#D8D3CA] px-3 py-1.5 text-xs font-semibold cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Visualizar</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsNew(false);
                  setEditing(lp);
                }}
                className="rounded-lg border border-[#D8D3CA] p-1.5 cursor-pointer"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => removeLandingPage(lp.id)}
                className="rounded-lg border border-rose-200 p-1.5 text-rose-600 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 p-4 overflow-y-auto">
          <form onSubmit={handleSave} className="w-full max-w-2xl rounded-xl bg-white p-6 space-y-4 my-6">
            <div className="flex items-center justify-between border-b border-[#F0EDE6] pb-3">
              <h3 className="font-display text-xl font-semibold text-[#0C1117]">
                {isNew ? 'Criar Landing Page' : 'Editar Landing Page'}
              </h3>
              <button type="button" onClick={() => setEditing(null)} className="cursor-pointer">
                <X className="h-5 w-5 text-[#6B7280]" />
              </button>
            </div>
            <input
              required
              placeholder="Título da campanha"
              value={editing.title || ''}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  title: e.target.value,
                  slug: isNew ? slugify(e.target.value) : editing.slug,
                })
              }
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                placeholder="Slug (/lp/...)"
                value={editing.slug || ''}
                onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
              <input
                placeholder="Kicker (ex: Edição Limitada)"
                value={editing.kicker || ''}
                onChange={(e) => setEditing({ ...editing, kicker: e.target.value })}
                className="rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
              />
            </div>
            <textarea
              rows={2}
              placeholder="Subtítulo de proposta de valor"
              value={editing.subtitle || ''}
              onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            />
            <input
              placeholder="Texto do botão CTA"
              value={editing.ctaLabel || ''}
              onChange={(e) => setEditing({ ...editing, ctaLabel: e.target.value })}
              className="w-full rounded-lg border border-[#D8D3CA] px-3 py-2 text-sm"
            />

            <SingleAssetUploader
              label="Imagem de Capa da Landing Page"
              value={editing.heroImage || ''}
              onChange={(url) => setEditing({ ...editing, heroImage: url })}
              folder="landing-pages"
              settings={settings}
              media={media}
              applyWatermark={true}
              helperText="Enviada diretamente do dispositivo e otimizada para Vercel Blob"
            />

            <div className="flex items-center gap-5 text-xs">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(editing.isPublic)}
                  onChange={(e) => setEditing({ ...editing, isPublic: e.target.checked })}
                />
                <span>Publicada</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(editing.isFlagshipPremium)}
                  onChange={(e) =>
                    setEditing({ ...editing, isFlagshipPremium: e.target.checked })
                  }
                />
                <span>Ativar simulador &amp; seções Flagship Premium</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-[#D8D3CA] px-4 py-2 text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#0C1117] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
              >
                Salvar Landing Page
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
