import React, { useState, useEffect } from 'react';
import { Newspaper, ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

const CATEGORY_STYLES = {
  'Giro Diário': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  'Relatório Semanal': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  'Flash de Mercado': { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
};

const DEFAULT_STYLE = { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };

function InsightCard({ post }) {
  const [expanded, setExpanded] = useState(false);
  const style = CATEGORY_STYLES[post.categoria] || DEFAULT_STYLE;

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <article className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
              {post.categoria}
            </span>
            <span className="text-xs text-gray-500">{formatDate(post.publishedAt)}</span>
          </div>
          <h2 className="text-lg font-bold text-white leading-snug">{post.titulo}</h2>
        </div>
      </div>

      <div className={`text-gray-400 text-sm leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}>
        {post.corpo}
      </div>

      {post.corpo && post.corpo.length > 200 && (
        <button
          onClick={() => setExpanded(p => !p)}
          className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors outline-none"
        >
          {expanded ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Ler menos</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> Ler mais</>
          )}
        </button>
      )}
    </article>
  );
}

export default function InsightsFeed() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const postsRef = collection(db, 'public_content', 'insights', 'posts');
    const q = query(postsRef, orderBy('publishedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setPosts(data);
      setIsLoading(false);
    }, (err) => {
      console.error('Erro ao carregar insights:', err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in pb-12 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-yellow-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Insights Mercurius</h1>
          <p className="text-gray-400 text-sm mt-1">
            Análises e visão de mercado exclusivas para clientes VIP.
          </p>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="bg-[#111] border border-gray-800 rounded-2xl p-12 text-center">
          <Newspaper className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 font-semibold">Nenhum insight publicado ainda.</p>
          <p className="text-gray-500 text-sm mt-1">A equipa Mercurius publicará a sua visão de mercado aqui.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <InsightCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
