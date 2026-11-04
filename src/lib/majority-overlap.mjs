// Original invented binary-task arithmetic. No provider or campaign data.
export function summarize(rows) {
  if (!Array.isArray(rows) || rows.length === 0) throw new TypeError('A nonempty task array is required');
  const counts = Array(8).fill(0);
  const correctByVoter = [0, 0, 0];
  let majorityCorrect = 0, unanimous = 0, wrongVotes = 0;
  for (const row of rows) {
    if (![0, 1].includes(row.truth) || !Array.isArray(row.predictions) || row.predictions.length !== 3 || Array.from(row.predictions).some(x => ![0, 1].includes(x))) throw new TypeError('Each task needs one binary truth and exactly three binary predictions');
    const errors = row.predictions.map((x, i) => { if (x === row.truth) correctByVoter[i]++; return Number(x !== row.truth); });
    counts[4 * errors[0] + 2 * errors[1] + errors[2]]++;
    wrongVotes += errors[0] + errors[1] + errors[2];
    const vote = Number(row.predictions.reduce((sum, x) => sum + x, 0) >= 2);
    majorityCorrect += Number(vote === row.truth);
    unanimous += Number(row.predictions.every(x => x === row.predictions[0]));
  }
  return { tasks: rows.length, correctByVoter, majorityCorrect, unanimous, wrongVotes, errorPatternCounts: counts };
}

export function scenario(name) {
  const blocks = {
    shared: [[7, 20], [0, 80]],
    separate: [[4, 20], [2, 20], [1, 20], [0, 40]],
    paired: [[6, 10], [5, 10], [3, 10], [0, 70]],
  }[name];
  if (!blocks) throw new TypeError('Unknown invented scenario');
  const rows = [];
  for (const [mask, count] of blocks) {
    for (let j = 0; j < count; j++) {
      const truth = rows.length % 2;
      rows.push({ task: rows.length + 1, truth, predictions: [4, 2, 1].map(bit => truth ^ Number(Boolean(mask & bit))) });
    }
  }
  return rows;
}

export function independentExample() {
  // Exact enumeration of the eight outcomes of three stipulated independent
  // Bernoulli votes with p(correct)=4/5. Denominator: 5^3 = 125.
  let favorableWeight = 0, totalWeight = 0;
  for (let pattern = 0; pattern < 8; pattern++) {
    const correctVotes = [4, 2, 1].filter(bit => pattern & bit).length;
    const weight = 4 ** correctVotes;
    totalWeight += weight;
    if (correctVotes >= 2) favorableWeight += weight;
  }
  return { favorableWeight, totalWeight };
}
