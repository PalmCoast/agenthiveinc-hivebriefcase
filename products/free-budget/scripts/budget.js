'use strict';

/**
 * ClaudeFarm — Budget skill (free)
 *
 * Turns a rough, messy description of income and spending into a clean,
 * repeatable monthly budget using the 50/30/20 framework.
 *
 * This is real, deterministic logic — the same input always produces the
 * same output. It is the exact skill that powers the live demo on the site
 * and the file customers download for free.
 */

const NEEDS = new Set([
  'rent', 'mortgage', 'housing', 'utilities', 'electric', 'water', 'gas',
  'groceries', 'food', 'insurance', 'health', 'transport', 'transit',
  'car', 'fuel', 'phone', 'internet', 'childcare', 'debt', 'loan', 'minimums'
]);

const WANTS = new Set([
  'dining', 'restaurants', 'takeout', 'entertainment', 'subscriptions',
  'streaming', 'shopping', 'travel', 'hobbies', 'gym', 'coffee', 'games', 'fun'
]);

function classify(label) {
  const key = String(label || '').toLowerCase();
  if (NEEDS.has(key)) return 'needs';
  if (WANTS.has(key)) return 'wants';
  return 'wants'; // default unknown discretionary spend to "wants"
}

function money(n) {
  return '$' + Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

function pct(part, whole) {
  if (!whole) return '0%';
  return Math.round((part / whole) * 100) + '%';
}

/**
 * Parse an input string like:
 *   "income 5000 rent 1500 groceries 500 dining 300 streaming 40"
 * into { income, items: [{label, amount, bucket}] }.
 *
 * If no income keyword is present the first number is treated as income.
 * If the input is empty or just "budget", a realistic sample is used so the
 * live demo always shows a meaningful result.
 */
function parse(input) {
  const raw = String(input || '').trim().toLowerCase();
  const cleaned = raw.replace(/^budget\b/, '').trim();

  if (!cleaned) {
    return {
      sample: true,
      income: 5200,
      items: [
        { label: 'rent', amount: 1800, bucket: 'needs' },
        { label: 'groceries', amount: 600, bucket: 'needs' },
        { label: 'utilities', amount: 220, bucket: 'needs' },
        { label: 'transport', amount: 180, bucket: 'needs' },
        { label: 'insurance', amount: 240, bucket: 'needs' },
        { label: 'dining', amount: 420, bucket: 'wants' },
        { label: 'subscriptions', amount: 95, bucket: 'wants' },
        { label: 'shopping', amount: 300, bucket: 'wants' }
      ]
    };
  }

  const tokens = cleaned.split(/[\s,]+/).filter(Boolean);
  let income = 0;
  const items = [];
  let pendingLabel = null;

  for (const tok of tokens) {
    const num = Number(tok.replace(/[$,/mo]/gi, ''));
    const isNumber = tok !== '' && !Number.isNaN(num);
    if (isNumber) {
      if (pendingLabel === 'income' || pendingLabel === 'salary' || pendingLabel === 'pay') {
        income += num;
      } else if (pendingLabel) {
        items.push({ label: pendingLabel, amount: num, bucket: classify(pendingLabel) });
      } else if (income === 0 && items.length === 0) {
        income = num; // first bare number = income
      } else {
        items.push({ label: 'other', amount: num, bucket: 'wants' });
      }
      pendingLabel = null;
    } else {
      pendingLabel = tok;
    }
  }

  return { sample: false, income, items };
}

/**
 * Core skill entry point. Returns a structured budget result.
 */
function run(input) {
  const { sample, income, items } = parse(input);

  const spent = items.reduce((s, i) => s + i.amount, 0);
  const needs = items.filter((i) => i.bucket === 'needs').reduce((s, i) => s + i.amount, 0);
  const wants = items.filter((i) => i.bucket === 'wants').reduce((s, i) => s + i.amount, 0);
  const leftover = income - spent;

  const target = {
    needs: Math.round(income * 0.5),
    wants: Math.round(income * 0.3),
    savings: Math.round(income * 0.2)
  };

  const warnings = [];
  if (income <= 0) {
    warnings.push('No income detected. Add an income amount, e.g. "income 5000".');
  } else {
    if (needs > target.needs) {
      warnings.push(`Needs are ${pct(needs, income)} of income (target 50%). Fixed costs are high.`);
    }
    if (wants > target.wants) {
      warnings.push(`Wants are ${pct(wants, income)} of income (target 30%). Trim discretionary spend.`);
    }
    if (leftover < target.savings) {
      warnings.push(`Savings would be ${money(Math.max(0, leftover))} (target ${money(target.savings)}).`);
    }
    if (leftover < 0) {
      warnings.push(`You are OVER budget by ${money(Math.abs(leftover))}. Spending exceeds income.`);
    }
  }

  return {
    sample,
    income,
    spent,
    needs,
    wants,
    leftover,
    target,
    items,
    warnings,
    generatedAt: null // set by callers that want a timestamp; kept null for deterministic output
  };
}

/**
 * Render a budget result as a monospace terminal report.
 */
function format(result) {
  const lines = [];
  lines.push('CLAUDE SKILL: budget  (ClaudeFarm · free)');
  lines.push('======================================');
  if (result.sample) {
    lines.push('(no numbers given — showing a sample budget)');
    lines.push('');
  }
  lines.push(`Monthly income        ${money(result.income)}`);
  lines.push(`Total spending        ${money(result.spent)}  (${pct(result.spent, result.income)})`);
  lines.push('');
  lines.push('BREAKDOWN');
  for (const item of result.items) {
    const tag = item.bucket === 'needs' ? '[need]' : '[want]';
    lines.push(`  ${tag} ${item.label.padEnd(14)} ${money(item.amount)}`);
  }
  lines.push('');
  lines.push('50 / 30 / 20 CHECK');
  lines.push(`  Needs    ${money(result.needs).padEnd(9)} / target ${money(result.target.needs)}  (${pct(result.needs, result.income)})`);
  lines.push(`  Wants    ${money(result.wants).padEnd(9)} / target ${money(result.target.wants)}  (${pct(result.wants, result.income)})`);
  lines.push(`  Savings  ${money(Math.max(0, result.leftover)).padEnd(9)} / target ${money(result.target.savings)}  (${pct(Math.max(0, result.leftover), result.income)})`);
  lines.push('');
  if (result.warnings.length) {
    lines.push('NOTES');
    for (const w of result.warnings) lines.push(`  ! ${w}`);
  } else {
    lines.push('NOTES');
    lines.push('  ✓ On track with the 50/30/20 framework.');
  }
  lines.push('');
  lines.push(result.leftover >= 0
    ? `RESULT: ${money(result.leftover)} left to save or invest this month.`
    : `RESULT: adjust spending — you are ${money(Math.abs(result.leftover))} short.`);
  return lines.join('\n');
}

module.exports = { run, format, parse, classify };

// Allow running directly from the CLI: `node scripts/budget.js "income 5000 rent 1500"`
if (require.main === module) {
  const input = process.argv.slice(2).join(' ');
  console.log(format(run(input)));
}
