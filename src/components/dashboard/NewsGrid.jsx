import React, { useState, useEffect } from 'react';
import { BookOpen, Zap, BarChart2, Calendar, User, ArrowRight } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format a Firestore Timestamp or ISO string into a readable date.
 *
 * @param {object|string|null} value
 * @returns {string}
 */
function formatDate(value) {
  if (!value) return '';
  try {
    const date = value?.toDate ? value.toDate() : new Date(value);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// NewsCard sub-component
// ---------------------------------------------------------------------------

/**
 * NewsCard — individual card for a content item.
 *
 * @param {object}  props
 * @param {string}  props.type          - 'article' | 'airdrop' | 'defi'
 * @param {string}  props.title         - Content title
 * @param {string}  [props.excerpt]     - Short description / excerpt
 * @param {string}  [props.imageUrl]    - Cover image URL
 * @param {string}  [props.author]      - Author name
 * @param {*}       [props.date]        - Publication date (Firestore Timestamp or ISO string)
 * @param {string}  [props.category]    - Category label
 * @param {Function} [props.onClick]    - Click handler
 */
function NewsCard({ type, title, excerpt, imageUrl, author, date, category, onClick }) {
  const typeConfig = {
    article: {
      icon: BookOpen,
      iconBg: 'rgba(0,255,239,0.1)',
      iconBorder: 'rgba(0,255,239,0.25)',
      iconColor: '#67E8F9',
      accentColor: 'rgba(0,255,239,0.5)',
      label: 'Research',
    },
    airdrop: {
      icon: Zap,
      iconBg: 'rgba(168,85,247,0.1)',
      iconBorder: 'rgba(168,85,247,0.25)',
      iconColor: '#D8B4FE',
      accentColor: 'rgba(168,85,247,0.5)',
      label: 'Airdrop',
    },
    defi: {
      icon: BarChart2,
      iconBg: 'rgba(251,191,36,0.1)',
      iconBorder: 'rgba(251,191,36,0.25)',
      iconColor: '#FCD34D',
      accentColor: 'rgba(251,191,36,0.5)',
      label: 'DeFi',
    },
  };

  const config = typeConfig[type] ?? typeConfig.article;
  const Icon = config.icon;

  return (
    <div
      className="relative overflow-hidden rounded-2xl flex flex-col transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
      style={{
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: '1px',
          background: `linear-gradient(to right, transparent, ${config.accentColor}, transparent)`,
        }}
      />

      {/* Cover image or placeholder */}
      <div
        className="w-full overflow-hidden flex-shrink-0"
        style={{ height: '140px', background: 'rgba(255,255,255,0.03)' }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: config.iconBg, border: `1px solid ${config.iconBorder}` }}
            >
              <Icon className="w-6 h-6" style={{ color: config.iconColor }} />
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Category badge */}
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{
              background: config.iconBg,
              border: `1px solid ${config.iconBorder}`,
              color: config.iconColor,
            }}
          >
            {category || config.label}
          </span>
        </div>

        {/* Title — clamp to 2 lines */}
        <h4
          className="text-sm font-bold text-text-primary leading-snug"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </h4>

        {/* Excerpt — optional */}
        {excerpt && (
          <p
            className="text-xs text-text-tertiary leading-relaxed flex-1"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {excerpt}
          </p>
        )}

        {/* Footer: author + date */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/[0.04]">
          <div className="flex items-center gap-1.5 text-xs text-text-tertiary min-w-0">
            <User className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{author || 'Equipa Mercurius'}</span>
          </div>
          {date && (
            <div className="flex items-center gap-1 text-[10px] text-text-muted flex-shrink-0 ml-2">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(date)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PlaceholderCard — shown when no content is available
// ---------------------------------------------------------------------------

function PlaceholderCard({ type }) {
  const typeConfig = {
    article: { icon: BookOpen, label: 'Research', color: '#67E8F9' },
    airdrop: { icon: Zap, label: 'Airdrop', color: '#D8B4FE' },
    defi: { icon: BarChart2, label: 'Estratégia DeFi', color: '#FCD34D' },
  };

  const config = typeConfig[type] ?? typeConfig.article;
  const Icon = config.icon;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3"
      style={{
        background: 'rgba(255,255,255,0.015)',
        border: '1px dashed rgba(255,255,255,0.08)',
        minHeight: '240px',
      }}
    >
      <Icon className="w-8 h-8 opacity-30" style={{ color: config.color }} />
      <p className="text-sm text-text-muted font-medium">Nenhum {config.label} ainda</p>
      <p className="text-xs text-text-muted opacity-70">Conteúdo em breve</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NewsGrid — main export
// ---------------------------------------------------------------------------

/**
 * NewsGrid — 3-column grid showing the latest content from 3 Firestore collections.
 *
 * Queries:
 *   - research_articles  → orderBy publishedAt desc, limit 1
 *   - airdrops           → orderBy createdAt desc, limit 1
 *   - defi_strategies    → orderBy createdAt desc, limit 1
 *
 * Falls back to a placeholder card when a collection is empty.
 */
const NewsGrid = React.memo(function NewsGrid() {
  const [items, setItems] = useState({ article: null, airdrop: null, defi: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchLatest() {
      try {
        const [articleSnap, airdropSnap, defiSnap] = await Promise.allSettled([
          getDocs(query(collection(db, 'research_articles'), orderBy('publishedAt', 'desc'), limit(1))),
          getDocs(query(collection(db, 'airdrops'), orderBy('createdAt', 'desc'), limit(1))),
          getDocs(query(collection(db, 'defi_strategies'), orderBy('createdAt', 'desc'), limit(1))),
        ]);

        if (cancelled) return;

        const extract = (result) => {
          if (result.status !== 'fulfilled') return null;
          const snap = result.value;
          if (snap.empty) return null;
          const doc = snap.docs[0];
          return { id: doc.id, ...doc.data() };
        };

        setItems({
          article: extract(articleSnap),
          airdrop: extract(airdropSnap),
          defi: extract(defiSnap),
        });
      } catch (error) {
        console.error('[NewsGrid] Error fetching content:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchLatest();

    return () => { cancelled = true; };
  }, []);

  return (
    <section className="mb-6 animate-fade-in">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan" />
          Novidades
        </h3>
        <span className="text-xs text-text-tertiary flex items-center gap-1">
          Mais recentes
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          // Skeleton loaders
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl animate-pulse"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                height: '280px',
              }}
            />
          ))
        ) : (
          <>
            {/* Research Article */}
            {items.article ? (
              <NewsCard
                type="article"
                title={items.article.title || 'Sem título'}
                excerpt={items.article.excerpt || items.article.description}
                imageUrl={items.article.coverImage || items.article.imageUrl}
                author={items.article.author}
                date={items.article.publishedAt}
                category={items.article.category}
              />
            ) : (
              <PlaceholderCard type="article" />
            )}

            {/* Latest Airdrop */}
            {items.airdrop ? (
              <NewsCard
                type="airdrop"
                title={items.airdrop.name || items.airdrop.title || 'Sem título'}
                excerpt={items.airdrop.description || items.airdrop.excerpt}
                imageUrl={items.airdrop.imageUrl || items.airdrop.logo}
                author={items.airdrop.addedBy}
                date={items.airdrop.createdAt}
                category={items.airdrop.type || 'Airdrop'}
              />
            ) : (
              <PlaceholderCard type="airdrop" />
            )}

            {/* DeFi Strategy */}
            {items.defi ? (
              <NewsCard
                type="defi"
                title={items.defi.name || items.defi.title || 'Sem título'}
                excerpt={items.defi.description || items.defi.excerpt}
                imageUrl={items.defi.imageUrl}
                author={items.defi.addedBy}
                date={items.defi.createdAt}
                category={items.defi.protocol || 'DeFi'}
              />
            ) : (
              <PlaceholderCard type="defi" />
            )}
          </>
        )}
      </div>
    </section>
  );
});

export default NewsGrid;
