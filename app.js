/**
 * Production entry point for Omukweyo
 * This file starts the Express API server which also serves the built frontend
 */

// Import the compiled API server
import('./apps/api/dist/index.js').catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
