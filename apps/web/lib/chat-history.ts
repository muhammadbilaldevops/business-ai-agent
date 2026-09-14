import type { Message } from './localops-types';
export type SavedChat = { id: string; title: string; updatedAt: string; messages: Message[] };
const key = 'business-ai-chats-v1';
export function readChats(): SavedChat[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  const value = JSON.parse(raw);
  if (!Array.isArray(value)) throw new Error('Saved chat history could not be read.');
  return value;
}
export function saveChat(id: string, messages: Message[]) {
  if (!messages.length) return readChats();
  const chats = readChats();
  const previous = chats.find(c => c.id === id);
  const chat: SavedChat = { id, title: previous?.title || messages.find(m => m.role === 'user')?.content.slice(0, 70) || 'Saved chat', updatedAt: new Date().toISOString(), messages };
  const next = [chat, ...chats.filter(c => c.id !== id)];
  try { localStorage.setItem(key, JSON.stringify(next)); }
  catch { throw new Error('Chat could not be saved: browser storage is full or unavailable. Export or delete older chats to free space.'); }
  return next;
}
export function deleteChat(id: string) {
  const next = readChats().filter(c => c.id !== id);
  localStorage.setItem(key, JSON.stringify(next));
  return next;
}
