// Original finite-window illustration. One-hour, constant-power buckets only.
// State is output-equivalent deliverable MWh, not a real battery nameplate.
const MAX_MAGNITUDE = 1_000_000;
function amount(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > MAX_MAGNITUDE) throw new TypeError(`${name} must be a finite number from 0 to 1000000`);
  return value;
}
function sum(values) {
  let total = 0, correction = 0;
  for (const value of values) { const y = value - correction, next = total + y; correction = (next - total) - y; total = next; }
  return total;
}
export function dispatch(input) {
  if (!input || typeof input !== 'object') throw new TypeError('A complete input is required');
  const { generationMW, loadMW, storage } = input;
  if (!Array.isArray(generationMW) || !Array.isArray(loadMW) || !generationMW.length || generationMW.length > 24 || generationMW.length !== loadMW.length) throw new TypeError('Matching complete arrays of 1 to 24 one-hour buckets required');
  const generation = Array.from(generationMW, (x, i) => amount(x, `generation[${i}]`));
  const load = Array.from(loadMW, (x, i) => amount(x, `load[${i}]`));
  if (!storage || typeof storage !== 'object') throw new TypeError('Explicit storage settings required, including zero-storage cases');
  const capacity = amount(storage.capacityMWh, 'capacityMWh'), chargeLimit = amount(storage.chargeMW, 'chargeMW'), dischargeLimit = amount(storage.dischargeMW, 'dischargeMW');
  const initial = amount(storage.initialMWh, 'initialMWh'), eta = storage.eta;
  if (typeof eta !== 'number' || !Number.isFinite(eta) || eta <= 0 || eta > 1) throw new TypeError('eta must be in (0,1]');
  if (initial > capacity) throw new RangeError('Initial deliverable energy exceeds capacity');
  let state = initial;
  const rows = generation.map((g, hour) => {
    const l = load[hour], before = state, direct = Math.min(g, l), surplus = g - direct, deficit = l - direct;
    const charge = Math.min(surplus, chargeLimit, Math.max(0, capacity - before) / eta);
    const discharge = Math.min(deficit, dischargeLimit, before);
    // Surplus and deficit cannot both be positive in a constant-power bucket.
    state = Math.min(capacity, Math.max(0, before + eta * charge - discharge));
    return { hour, hoursPerStep: 1, generationMWh: g, loadMWh: l, directMWh: direct, chargedInputMWh: charge, dischargedOutputMWh: discharge, servedMWh: direct + discharge, conversionLossMWh: (1 - eta) * charge, curtailedMWh: surplus - charge, unservedMWh: deficit - discharge, storedBeforeMWh: before, storedAfterMWh: state };
  });
  const totals = Object.fromEntries(['generationMWh','loadMWh','directMWh','chargedInputMWh','dischargedOutputMWh','servedMWh','conversionLossMWh','curtailedMWh','unservedMWh'].map(key => [key, sum(rows.map(row => row[key]))]));
  return { rows, totals: { ...totals, initialStoredMWh: initial, finalStoredMWh: state }, settings: { capacityMWh: capacity, chargeMW: chargeLimit, dischargeMW: dischargeLimit, eta, initialMWh: initial, hoursPerStep: 1, stateCoordinate: 'output-equivalent deliverable MWh', numericalRangeMaximum: MAX_MAGNITUDE } };
}
