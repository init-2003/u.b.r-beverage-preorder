import sql from 'mssql';

const sqlConfig: sql.config = {
  user: process.env.DB_USERNAME || 'sa',
  password: process.env.DB_PASSWORD || '1201455',
  server: process.env.DB_HOST || '192.168.2.3',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_DATABASE || 'DBUbonRR',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 15,
    min: 2,
    idleTimeoutMillis: 30000,
  },
};

declare global {
  // eslint-disable-next-line no-var
  var mssqlPool: sql.ConnectionPool | undefined;
}

export async function getDbPool(): Promise<sql.ConnectionPool> {
  if (process.env.NODE_ENV === 'development') {
    if (!global.mssqlPool || !global.mssqlPool.connected) {
      global.mssqlPool = await new sql.ConnectionPool(sqlConfig).connect();
    }
    return global.mssqlPool;
  }

  if (!global.mssqlPool || !global.mssqlPool.connected) {
    global.mssqlPool = await new sql.ConnectionPool(sqlConfig).connect();
  }
  return global.mssqlPool;
}

export { sql };
