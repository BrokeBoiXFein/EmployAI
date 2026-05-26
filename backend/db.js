// ============================================================
// Prisma client singleton
// ============================================================
// Why a singleton? PrismaClient opens a connection pool to Postgres.
// If you do `new PrismaClient()` in every file, you get many pools
// and eventually run out of database connections. One instance,
// shared everywhere = clean.
// ============================================================

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  // Log slow queries during dev so we can spot performance problems early
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error']
});

module.exports = prisma;
