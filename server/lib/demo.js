'use strict';

const path = require('path');
const { ROOT } = require('./catalog');

/**
 * Runs the real free "budget" skill in-process (no shell) and returns the
 * exact terminal output a customer would get after downloading it. This is the
 * proof engine for the homepage live demo.
 */
const budgetPath = path.join(ROOT, 'products', 'free-budget', 'scripts', 'budget.js');
// eslint-disable-next-line import/no-dynamic-require
const budget = require(budgetPath);

const MAX_INPUT = 400;

function runDemo(command, input) {
  const cmd = String(command || 'budget').trim().toLowerCase();
  const arg = String(input || '').slice(0, MAX_INPUT);

  if (cmd !== 'budget') {
    return {
      ok: false,
      command: cmd,
      error: `Unknown command "${cmd}". This demo runs the free skill: type "budget".`,
      output: null
    };
  }

  const result = budget.run(arg);
  return {
    ok: true,
    command: 'budget',
    output: budget.format(result),
    structured: result
  };
}

module.exports = { runDemo, MAX_INPUT };
