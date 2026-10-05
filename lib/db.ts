import sql from 'mssql';

const sqlConfig: sql.config = {
  user: process.env.DB_USERNAME || 'sa',
  password: process.env.DB_PASSWORD || '1201455',
  server: process.env.DB_HOST || '192.168.2.3',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_DATABASE || 'DBUbonRR',
  connectionTimeout: 10000, // 10 seconds to establish TCP/TDS connection
  requestTimeout: 25000,    // 25 seconds max execution time per query
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    // Increased pool capacity to comfortably handle high concurrent traffic
    max: parseInt(process.env.DB_POOL_MAX || '30', 10),
    min: parseInt(process.env.DB_POOL_MIN || '5', 10),
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
    acquireTimeoutMillis: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT || '15000', 10),
  },
};

declare global {
  var mssqlPool: sql.ConnectionPool | undefined;
  var mssqlPoolPromise: Promise<sql.ConnectionPool> | undefined;
}

/**
 * Get or initialize the database connection pool.
 * Implements a Singleton Promise Lock to prevent connection storms (race conditions)
 * when multiple requests arrive concurrently during pool initialization.
 */
export async function getDbPool(): Promise<sql.ConnectionPool> {
  // If pool already exists and is healthy, return it immediately
  if (global.mssqlPool && global.mssqlPool.connected) {
    return global.mssqlPool;
  }

  // If a connection attempt is already in-flight, await the same promise
  if (global.mssqlPoolPromise) {
    return global.mssqlPoolPromise;
  }

  // Create connection promise with race-condition lock
  global.mssqlPoolPromise = (async () => {
    try {
      // If previous pool was disconnected or errored, close it cleanly
      if (global.mssqlPool) {
        try {
          await global.mssqlPool.close();
        } catch { }
      }

      const pool = new sql.ConnectionPool(sqlConfig);

      // Handle connection errors gracefully without crashing the Node process
      pool.on('error', (err) => {
        console.error('[MSSQL Pool Error]:', err.message || err);
        // Reset pool so the next query will automatically trigger a clean reconnect
        global.mssqlPool = undefined;
        global.mssqlPoolPromise = undefined;
      });

      const connectedPool = await pool.connect();
      global.mssqlPool = connectedPool;
      return connectedPool;
    } catch (err) {
      console.error('[MSSQL Connection Initialization Failed]:', err);
      global.mssqlPool = undefined;
      global.mssqlPoolPromise = undefined;
      throw err;
    } finally {
      // Clear in-flight promise once connection attempt settles
      global.mssqlPoolPromise = undefined;
    }
  })();

  return global.mssqlPoolPromise;
}

/**
 * Helper to inspect the current health and capacity of the connection pool
 */
export function getPoolStatus() {
  if (!global.mssqlPool) {
    return { status: 'disconnected', size: 0, available: 0, pending: 0, borrowed: 0 };
  }

  const internalPool = (global.mssqlPool as any)?.pool;
  return {
    status: global.mssqlPool.connected ? 'connected' : 'connecting',
    size: internalPool?.size || 0,
    available: internalPool?.available || 0,
    pending: internalPool?.pending || 0,
    borrowed: internalPool?.borrowed || 0,
    max: sqlConfig.pool?.max || 30,
    min: sqlConfig.pool?.min || 5,
  };
}

export { sql };
