import { inject, track } from '@vercel/analytics';
import { CAMPAIGN, EVENT_NAMES, analyticsEpisode, canCollect, cleanAnalyticsUrl, eventKey, pacificDay, safeEpisode, type GrowthEvent } from '../lib/growth-analytics';

// Preview and local QA do not collect. Inputs and URL fragments never enter telemetry.
if (import.meta.env.PROD && ['antihunter.com', 'www.antihunter.com'].includes(location.hostname)) {
  let control: unknown = null;
  let injected = false;
  let initialControlPending = true;
  let refreshing = false;
  const pending = new Map<string, { name: GrowthEvent; episode: string }>();
  let cohortDay = '';
  let cohort = 1;
  const sent = new Set<string>();
  const episode = analyticsEpisode(location.pathname);
  function currentCohort() {
    const day = pacificDay();
    if (day === cohortDay) return cohort;
    cohortDay = day;
    const key = `antihunter:sample:${day}`;
    cohort = Math.random();
    try {
      const saved = sessionStorage.getItem(key);
      if (saved !== null && Number(saved) >= 0 && Number(saved) < 1) cohort = Number(saved);
      else sessionStorage.setItem(key, String(cohort));
    } catch { /* Per-page sampling if storage is unavailable. */ }
    return cohort;
  }
  function send(name: GrowthEvent, requestedEpisode: unknown = episode) {
    const safe = safeEpisode(requestedEpisode);
    if (initialControlPending) {
      if (pending.size < 32) pending.set(`${name}:${safe}`, { name, episode: safe });
      return;
    }
    if (!injected || !canCollect(control, currentCohort())) return;
    const key = eventKey(pacificDay(), name, safe);
    if (sent.has(key)) return;
    try { if (sessionStorage.getItem(key)) return; } catch { /* In-memory dedup remains. */ }
    sent.add(key);
    try { sessionStorage.setItem(key, '1'); } catch { /* No calculator inputs stored here. */ }
    track(name, { campaign: CAMPAIGN, episode: safe });
  }
  async function refreshControl() {
    if (refreshing) return;
    refreshing = true;
    try {
      const response = await fetch('https://clawfable.com/api/public/antihunter/analytics-control', { credentials: 'omit', signal: AbortSignal.timeout(4000) });
      control = response.ok ? await response.json() : null;
    } catch { control = null; }
    finally { refreshing = false; }
    initialControlPending = false;
    if (!canCollect(control, currentCohort())) { pending.clear(); return; }
    if (!injected) {
      inject({ mode: 'production', debug: false, beforeSend(event) {
        if (!canCollect(control, currentCohort())) return null;
        return { ...event, url: cleanAnalyticsUrl(event.url) };
      } });
      injected = true;
    }
    if (episode === 'hidden-cost') send('experience_view');
    if (episode === 'token') send('token_info_view');
    for (const item of pending.values()) send(item.name, item.episode);
    pending.clear();
  }
  window.addEventListener('antihunter:analytics', (event) => {
    const detail = (event as CustomEvent).detail;
    if (detail && EVENT_NAMES.includes(detail.name)) send(detail.name, detail.episode);
  });
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-growth-event]') : null;
    const name = target?.dataset.growthEvent;
    if (name && EVENT_NAMES.includes(name as GrowthEvent)) send(name as GrowthEvent, target?.dataset.episode || episode);
  });
  void refreshControl();
  setInterval(() => { if (!document.hidden) void refreshControl(); }, 60_000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void refreshControl(); });
}
