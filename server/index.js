'use strict';

const { createApp } = require('./app');
const checkout = require('./lib/checkout');

const PORT = process.env.PORT || 3000;
const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`ClaudeFarm running on http://localhost:${PORT}`);
  console.log(`Checkout mode: ${checkout.isLive() ? 'LIVE (Stripe)' : 'MOCK (set STRIPE_SECRET_KEY for live)'}`);
});

process.on('SIGTERM', () => server.close());

module.exports = { server, app };
