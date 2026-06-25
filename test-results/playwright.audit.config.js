const path = require('path');
module.exports = { testDir: __dirname, testMatch: '**/audit-live.spec.js', timeout: 30000, use: { browserName: 'chromium' } };
