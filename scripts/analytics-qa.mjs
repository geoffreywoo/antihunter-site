import { readFileSync } from 'node:fs';

const EVENTS = ['experience_view', 'experience_complete', 'share_intent', 'token_info_view'];
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;

/** Private, evidence-backed totals for a Pacific day, campaign, and episode. */
export function validateQaLedger(ledger) {
  if (ledger?.version !== 1 || !Array.isArray(ledger.offsets)) throw new Error('Invalid analytics QA ledger');
  const keys = new Set();
  for (const entry of ledger.offsets) {
    if (!entry || entry.verified !== true || typeof entry.receipt !== 'string' || !entry.receipt.trim()
        || typeof entry.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.day)
        || !Number.isFinite(Date.parse(entry.day)) || new Date(entry.day).toISOString().slice(0, 10) !== entry.day
        || typeof entry.campaignId !== 'string' || !ID.test(entry.campaignId)
        || typeof entry.episodeId !== 'string' || !ID.test(entry.episodeId)
        || !entry.counts || typeof entry.counts !== 'object' || Array.isArray(entry.counts)) {
      throw new Error('Analytics QA offsets require a verified receipt and valid Pacific day/campaign/episode');
    }
    const counts = Object.entries(entry.counts);
    if (!counts.length || counts.some(([name, value]) => !EVENTS.includes(name) || !Number.isSafeInteger(value) || value < 0)) {
      throw new Error('Analytics QA offsets must contain nonnegative custom-event counts only');
    }
    const key = `${entry.day}:${entry.campaignId}:${entry.episodeId}`;
    if (keys.has(key)) throw new Error(`Duplicate analytics QA total: ${key}`);
    keys.add(key);
  }
  return ledger.offsets;
}

export function loadQaOffsets(path) {
  let raw;
  try { raw = readFileSync(path, 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  return validateQaLedger(JSON.parse(raw));
}

/** Adjust participation only: never manufacture absent data or alter billable usage. */
export function excludeVerifiedQa(campaigns, day, offsets) {
  return campaigns.map(campaign => {
    const offset = offsets.find(entry => entry.day === day && entry.campaignId === campaign.campaignId && entry.episodeId === campaign.episodeId);
    if (!offset) return { ...campaign };
    const adjusted = { ...campaign };
    for (const name of EVENTS) {
      if (Number.isSafeInteger(campaign[name]) && campaign[name] >= 0 && offset.counts[name] !== undefined) {
        // Collector acceptance can precede aggregate reporting; never report negative participation.
        adjusted[name] = Math.max(0, campaign[name] - offset.counts[name]);
      }
    }
    return adjusted;
  });
}
