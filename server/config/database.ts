import { existsSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  url?: string;
}

// Environment variables are already set by the system
function validateEnvVariables() {
  const requiredVars = ['PGHOST', 'PGPORT', 'PGUSER', 'PGPASSWORD', 'PGDATABASE', 'DATABASE_URL'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`[Database] Warning: Missing environment variables: ${missingVars.join(', ')}`);
  } else {
    console.log('[Database] All required environment variables are present');
  }
}

export function getDatabaseConfig(): DatabaseConfig {
  // Validate environment variables are present
  validateEnvVariables();

  // Use environment variables directly
  const config: DatabaseConfig = {
    host: process.env.PGHOST!,
    port: parseInt(process.env.PGPORT!, 10),
    user: process.env.PGUSER!,
    password: process.env.PGPASSWORD!,
    database: process.env.PGDATABASE!,
    url: process.env.DATABASE_URL
  };

  console.log('[Database] Database configuration loaded from environment variables');

  // Validate configuration
  const requiredFields: (keyof DatabaseConfig)[] = ['host', 'port', 'user', 'password', 'database'];
  const missingFields = requiredFields.filter(field => !config[field]);

  if (missingFields.length > 0) {
    console.warn(`[Database] Warning: Missing configuration fields: ${missingFields.join(', ')}`);
    console.warn('[Database] Using default values for missing fields');
  }

  return config;
}

export function getConnectionString(): string {
  const config = getDatabaseConfig();
  return config.url || `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
}
