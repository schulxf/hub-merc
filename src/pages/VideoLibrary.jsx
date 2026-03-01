import React, { useState, useEffect } from 'react';
import { GraduationCap, Play, X, Loader2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

const CATEGORY_STYLES = {
  'Protocolos DeFi':  { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20'  },
  'Gestão de Risco':  { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/20'   },
  'Ferramentas':      { bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/20' },
};
const DEFAULT_STYLE = { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };

// Extract YouTube video ID from various URL formats
function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function VideoCard({ video, onPlay }) {
  const videoId = extractYouTubeId(video.url);
  const thumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : null;
  const style = CATEGORY_STYLES[video.categoria] || DEFAULT_STYLE;

  return (
    <article className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden shadow-xl hover:border-gray-700 transition-colors group">
      {/* Thumbnail */}
      <div
        className="relative aspect-video bg-gray-900 cursor-pointer overflow-hidden"
        onClick={() => onPlay(video)}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={video.titulo}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <GraduationCap className="w-12 h-12 text-gray-700" />
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
          {video.categoria}
        </span>
        <h3 className="text-sm font-bold text-white mt-2 leading-snug line-clamp-2">{video.titulo}</h3>
        {video.descricao && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{video.descricao}</p>
        )}
        <button
          onClick={() => onPlay(video)}
          className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors outline-none"
        >
          <Play className="w-3 h-3 fill-blue-400" />
          Assistir
        </button>
      </div>
    </article>
  );
}

function VideoModal({ video, onClose }) {
  const videoId = extractYouTubeId(video.url);
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
    : null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#111] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-white truncate pr-4">{video.titulo}</h3>
            {video.descricao && <p className="text-xs text-gray-400 mt-0.5 truncate">{video.descricao}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors outline-none flex-shrink-0 ml-3"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="aspect-video bg-black">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={video.titulo}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <p>URL de vídeo inválido.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const CATEGORIES = ['Todos', 'Protocolos DeFi', 'Gestão de Risco', 'Ferramentas'];

export default function VideoLibrary() {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState(null);
  const [activeCategory, setActiveCategory] = useState('Todos');

  useEffect(() => {
    const videosRef = collection(db, 'public_content', 'academy', 'videos');
    const q = query(videosRef, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setVideos(data);
      setIsLoading(false);
    }, () => setIsLoading(false));
    return () => unsub();
  }, []);

  const filtered = activeCategory === 'Todos'
    ? videos
    : videos.filter(v => v.categoria === activeCategory);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Academia DeFi</h1>
          <p className="text-gray-400 text-sm mt-1">
            Tutoriais exclusivos para dominar os protocolos da sua estratégia.
          </p>
        </div>
      </div>

      {/* Category Filter */}
      {videos.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors outline-none ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#111] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {videos.length === 0 ? (
        <div className="bg-[#111] border border-gray-800 rounded-2xl p-16 text-center">
          <GraduationCap className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 font-semibold">Nenhum vídeo publicado ainda.</p>
          <p className="text-gray-500 text-sm mt-1">
            A equipa Mercurius adicionará tutoriais DeFi exclusivos em breve.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#111] border border-gray-800 rounded-2xl p-12 text-center">
          <p className="text-gray-400">Nenhum vídeo nesta categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(video => (
            <VideoCard key={video.id} video={video} onPlay={setActiveVideo} />
          ))}
        </div>
      )}

      {/* Video Player Modal */}
      {activeVideo && (
        <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />
      )}
    </div>
  );
}
