export const DEFAULT_ROOMS = [
  { id: 'general', name: 'General', topic: 'Conversación abierta para todos', theme: 'general', icon: 'bi-chat-heart-fill', userCount: 0 },
  { id: 'tech', name: 'Tecnología', topic: 'Programación, IA y gadgets', theme: 'tech', icon: 'bi-cpu-fill', userCount: 0 },
  { id: 'gaming', name: 'Gaming', topic: 'Videojuegos y eSports', theme: 'gaming', icon: 'bi-controller', userCount: 0 },
  { id: 'music', name: 'Música', topic: 'Artistas, álbumes y conciertos', theme: 'music', icon: 'bi-music-note-beamed', userCount: 0 },
  { id: 'sports', name: 'Deportes', topic: 'Fútbol, NBA y más', theme: 'sports', icon: 'bi-trophy-fill', userCount: 0 },
];

export const ROOM_THEMES = {
  general: {
    label: 'General',
    className: 'theme-general',
    accent: '#5865f2',
  },
  tech: {
    label: 'Tecnología',
    className: 'theme-tech',
    accent: '#0ea5e9',
  },
  gaming: {
    label: 'Gaming',
    className: 'theme-gaming',
    accent: '#a855f7',
  },
  music: {
    label: 'Música',
    className: 'theme-music',
    accent: '#f97316',
  },
  sports: {
    label: 'Deportes',
    className: 'theme-sports',
    accent: '#ef4444',
  },
};

export function getThemeClass(theme) {
  return ROOM_THEMES[theme]?.className ?? 'theme-general';
}
