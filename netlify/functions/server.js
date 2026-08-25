'use strict';

/**
 * Netlify Functions entry point for the ClaudeFarm Express app.
 *
 * We wrap the existing Express app with serverless-http and expose it as a
 * catch-all function. All non-static routes are redirected here by netlify.toml.
 * Binary downloads (zip artifacts) are enabled via binary content types.
 */
const serverless = require('serverless-http');
const { createApp } = require('../../server/app');

const app = createApp();

const handler = serverless(app, {
  binary: ['application/zip', 'application/octet-stream', 'image/*']
});

module.exports.handler = handler;
