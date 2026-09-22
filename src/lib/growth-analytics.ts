export const CAMPAIGN = 'thirty-dollar-machine';
export const EVENT_NAMES = ['experience_view', 'experience_complete', 'share_intent', 'token_info_view'] as const;
export type GrowthEvent = typeof EVENT_NAMES[number];
export interface AnalyticsControl { day: string; sampleRate: number; expiresAt: string }
export function pacificDay(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function canCollect(value: unknown, cohort: number, now = new Date()): value is AnalyticsControl {
  if (!value || typeof value !== 'object' || !Number.isFinite(cohort) || cohort < 0 || cohort >= 1) return false;
  const control = value as AnalyticsControl;
  const expires = Date.parse(control.expiresAt);
  return control.day === pacificDay(now) && [0.1, 1].includes(control.sampleRate)
    && Number.isFinite(expires) && expires > now.getTime()
    && expires <= now.getTime() + 90 * 60_000 && cohort < control.sampleRate;
}
export function cleanAnalyticsUrl(url: string): string {
  const parsed = new URL(url);
  return parsed.origin + parsed.pathname;
}
export function analyticsEpisode(pathname: string): string {
  if (pathname.replace(/\/$/, '') === '/machine') return 'hidden-cost';
  if (pathname.replace(/\/$/, '') === '/two-orders') return 'two-orders';
  if (pathname.startsWith('/acts/')) return safeEpisode(pathname.split('/').filter(Boolean)[1]);
  if (pathname.replace(/\/$/, '') === '/token') return 'token';
  return 'launch';
}
export function safeEpisode(value: unknown): string {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/.test(value) ? value : 'launch';
}
export function eventKey(day: string, event: GrowthEvent, episode: string): string {
  return `antihunter:event:${day}:${CAMPAIGN}:${episode}:${event}`;
}
