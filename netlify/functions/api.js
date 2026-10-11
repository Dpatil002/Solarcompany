/**
 * Netlify Serverless Function Adapter for Shree Ganesha Solar
 * Routes /api/leads, /api/admin/*, and health checks seamlessly on Netlify.
 */

const serverless = require('serverless-http');
const app = require('../../server/index.js');

module.exports.handler = serverless(app);
