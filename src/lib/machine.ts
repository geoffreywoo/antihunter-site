/** Local scenario arithmetic. No provider prices or inferred user data. */
export const MACHINE_FIELDS = {
  costPerAttempt: { label: 'Cost per attempt', min: 0, max: 1_000_000, key: 'c' },
  attempts: { label: 'Attempts per accepted result', min: 1, max: 1_000_000, key: 'a' },
  reviewMinutes: { label: 'Review minutes per accepted result', min: 0, max: 1_000_000, key: 'm' },
  hourlyRate: { label: 'Reviewer hourly rate', min: 0, max: 1_000_000, key: 'h' },
  revenue: { label: 'Revenue per accepted result', min: 0, max: 1_000_000, key: 'r' },
} as const;

export type MachineField = keyof typeof MACHINE_FIELDS;
export type MachineScenario = Record<MachineField, number>;
export type MachineValidation =
  | { ok: true; value: MachineScenario }
  | { ok: false; errors: Partial<Record<MachineField, string>> };

export const EXAMPLE_SCENARIO: MachineScenario = {
  costPerAttempt: 0.02, attempts: 3, reviewMinutes: 4, hourlyRate: 90, revenue: 5,
};

export function validateScenario(input: Record<string, unknown>): MachineValidation {
  const errors: Partial<Record<MachineField, string>> = {};
  const value = {} as MachineScenario;
  for (const field of Object.keys(MACHINE_FIELDS) as MachineField[]) {
    const raw = input[field];
    const spec = MACHINE_FIELDS[field];
    const numeric = typeof raw === 'number'
      || (typeof raw === 'string' && /^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d{1,3})?$/i.test(raw.trim()));
    const parsed = numeric ? Number(raw) : NaN;
    const positiveMantissa = typeof raw === 'string' && /[1-9]/.test(raw.trim().split(/e/i)[0]);
    if (!Number.isFinite(parsed) || parsed < spec.min || parsed > spec.max) {
      errors[field] = `Enter a number from ${spec.min.toLocaleString('en-US')} to ${spec.max.toLocaleString('en-US')}.`;
    } else if ((parsed > 0 && parsed < 0.000000001) || (parsed === 0 && positiveMantissa)) {
      errors[field] = 'Use zero or a value of at least 0.000000001.';
    } else {
      value[field] = parsed;
    }
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

export function calculateScenario(scenario: MachineScenario) {
  const checked = validateScenario(scenario);
  if (!checked.ok) throw new RangeError('Invalid machine scenario');
  const inference = scenario.costPerAttempt * scenario.attempts;
  const review = scenario.reviewMinutes / 60 * scenario.hourlyRate;
  const total = inference + review;
  const contribution = scenario.revenue - total;
  // Treat arithmetic dust as a tie, not an editorial finding.
  const tied = Math.abs(inference - review) <= Number.EPSILON * Math.max(inference, review) * 4;
  const driver = total === 0 ? 'none' : tied ? 'equal' : review > inference ? 'review' : 'inference';
  return {
    inference, review, total, contribution, driver,
    reviewShare: total ? review / total : 0,
    inferenceShare: total ? inference / total : 0,
    contributionRate: scenario.revenue ? contribution / scenario.revenue : null,
  };
}

/** A fragment is generated only on a visitor's explicit share action. */
export function scenarioFragment(scenario: MachineScenario): string {
  const checked = validateScenario(scenario);
  if (!checked.ok) throw new RangeError('Invalid machine scenario');
  const params = new URLSearchParams({ v: '1' });
  for (const field of Object.keys(MACHINE_FIELDS) as MachineField[]) {
    params.set(MACHINE_FIELDS[field].key, String(scenario[field]));
  }
  return `#${params}`;
}

export function parseScenarioFragment(fragment: string): MachineScenario | null {
  if (!fragment || fragment.length > 512 || !fragment.startsWith('#')) return null;
  const params = new URLSearchParams(fragment.slice(1));
  const expected = ['v', ...Object.values(MACHINE_FIELDS).map((field) => field.key)];
  if ([...params].length !== expected.length || params.get('v') !== '1') return null;
  if (expected.some((key) => params.getAll(key).length !== 1)) return null;
  const raw = Object.fromEntries((Object.keys(MACHINE_FIELDS) as MachineField[])
    .map((field) => [field, params.get(MACHINE_FIELDS[field].key)]));
  const checked = validateScenario(raw);
  return checked.ok ? checked.value : null;
}
