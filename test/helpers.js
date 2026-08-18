'use strict';

process.env.APP_SECRET = process.env.APP_SECRET || 'test-secret-key-1234567890';
delete process.env.STRIPE_SECRET_KEY; // force MOCK mode for deterministic tests

const { createApp } = require('../server/app');

async function startServer() {
  const app = createApp();
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  return {
    base,
    async stop() {
      await new Promise((r) => server.close(r));
    }
  };
}

module.exports = { startServer };
