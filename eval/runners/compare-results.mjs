import { readFile } from 'node:fs/promises';

const [baselinePath, candidatePath] = process.argv.slice(2);
if (!baselinePath || !candidatePath) {
  console.error('usage: node compare-results.mjs baseline.jsonl candidate.jsonl');
  process.exit(2);
}

async function load(path) {
  const text = await readFile(path, 'utf8');
  return text.split(/\r?\n/).filter(Boolean).map((line, index) => {
    const row = JSON.parse(line);
    for (const key of ['task_id', 'success', 'input_tokens', 'output_tokens', 'total_tokens']) {
      if (!(key in row)) throw new Error(`${path}:${index + 1} missing ${key}`);
    }
    return row;
  });
}
const [baseline, candidate] = await Promise.all([load(baselinePath), load(candidatePath)]);
const byId = rows => new Map(rows.map(row => [row.task_id, row]));
const left = byId(baseline), right = byId(candidate);
const ids = [...new Set([...left.keys(), ...right.keys()])].sort();
if (ids.length === 0 || ids.some(id => !left.has(id) || !right.has(id))) throw new Error('task_id sets must match and be non-empty');
const mean = (rows, field) => rows.reduce((sum, row) => sum + Number(row[field] ?? 0), 0) / rows.length;
const successRate = rows => rows.filter(row => row.success === true).length / rows.length;
const summary = {
  mode: 'comparison',
  tasks: ids.length,
  baseline: { success_rate: successRate(baseline), total_tokens: mean(baseline, 'total_tokens'), latency_ms: mean(baseline, 'latency_ms') },
  candidate: { success_rate: successRate(candidate), total_tokens: mean(candidate, 'total_tokens'), latency_ms: mean(candidate, 'latency_ms') }
};
summary.delta = {
  success_rate: summary.candidate.success_rate - summary.baseline.success_rate,
  total_tokens: summary.candidate.total_tokens - summary.baseline.total_tokens,
  latency_ms: summary.candidate.latency_ms - summary.baseline.latency_ms
};
summary.accepted = summary.delta.success_rate >= 0 && summary.delta.total_tokens < 0;
console.log(JSON.stringify(summary, null, 2));
if (!summary.accepted) process.exitCode = 1;
