// Vercel serverless entry. `npm run build` (tsc) creates ./dist first.
module.exports = require('../dist/vercel').default;
