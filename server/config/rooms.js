export const ROOMS = [
  {
    id: 'general',
    name: 'General',
    topic: 'Conversación abierta para todos',
    theme: 'general',
    icon: 'bi-chat-heart-fill',
  },
  {
    id: 'tech',
    name: 'Tecnología',
    topic: 'Programación, IA y gadgets',
    theme: 'tech',
    icon: 'bi-cpu-fill',
  },
  {
    id: 'gaming',
    name: 'Gaming',
    topic: 'Videojuegos y eSports',
    theme: 'gaming',
    icon: 'bi-controller',
  },
  {
    id: 'music',
    name: 'Música',
    topic: 'Artistas, álbumes y conciertos',
    theme: 'music',
    icon: 'bi-music-note-beamed',
  },
  {
    id: 'sports',
    name: 'Deportes',
    topic: 'Fútbol, NBA y más',
    theme: 'sports',
    icon: 'bi-trophy-fill',
  },
];

export function getRoomById(roomId) {
  return ROOMS.find((room) => room.id === roomId) ?? null;
}
