import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import * as schema from "@db/schema";
import { type NeonDatabase } from 'drizzle-orm/neon-serverless';
import { trains, locations, users } from "@db/schema";
import { TrainType, UserRole } from "@db/schema";
import { eq } from "drizzle-orm";
import { crypto } from '../server/auth';

// Configure Neon to use the ws package
neonConfig.webSocketConstructor = ws;

import { getDatabaseConfig } from "../server/config/database";

try {
  const dbConfig = getDatabaseConfig();
  process.env.DATABASE_URL = process.env.DATABASE_URL || dbConfig.url;
} catch (error) {
  console.error("[Database] Configuration error:", error);
  throw new Error("Failed to initialize database configuration. Please check your settings.");
}

async function createDbConnection(retries = 5, delay = 5000): Promise<NeonDatabase<typeof schema>> {
  try {
    const dbConfig = getDatabaseConfig();
    process.env.DATABASE_URL = process.env.DATABASE_URL || dbConfig.url;

    try {
      neonConfig.webSocketConstructor = ws;
      const db = drizzle(process.env.DATABASE_URL || '', { schema });
      
      // Verify connection with a simple query
      await db.select().from(trains).limit(1);
      console.log("[Database] Connection established successfully");
      return db;
    } catch (error) {
      if (retries > 0) {
        console.log(`[Database] Connection failed, retrying in ${delay/1000}s... (${retries} attempts remaining)`);
        console.log(`[Database] Using connection string: postgresql://${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return createDbConnection(retries - 1, delay);
      }
      
      console.error("[Database] Failed to establish connection after multiple attempts");
      console.error("[Database] Please verify your database configuration:");
      console.error(`[Database] Host: ${dbConfig.host}`);
      console.error(`[Database] Port: ${dbConfig.port}`);
      console.error(`[Database] Database: ${dbConfig.database}`);
      throw new Error("Database connection failed. Please check your configuration and ensure the database is running.");
    }
  } catch (error) {
    console.error("[Database] Configuration error:", error);
    throw new Error("Failed to initialize database configuration. Please check your settings.");
  }
}

// Initialize database instance
let db: NeonDatabase<typeof schema>;

export async function initializeDb() {
  try {
    // First, ensure we have valid configuration
    const dbConfig = getDatabaseConfig();
    console.log("[Database] Configuration loaded successfully");
    console.log(`[Database] Attempting to connect to: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

    // Try to establish connection
    db = await createDbConnection();

    // Verify connection with a simple query
    await db.select().from(users).limit(1);
    console.log("[Database] Database connection verified successfully");

    // Attempt to seed initial data
    const seedResult = await seedInitialData();
    if (seedResult) {
      console.log("[Database] Initial data seeded successfully");
    } else {
      console.warn("[Database] Initial data seeding skipped or failed");
    }

    return db;
  } catch (error) {
    console.error("[Database] Failed to initialize database:", error);
    console.error("[Database] Please ensure:");
    console.error("1. Database server is running and accessible");
    console.error("2. Database credentials are correct");
    console.error("3. Database exists and is properly configured");
    throw error;
  }
}

// Make db available for import
export { db };

// Seed initial data
export async function seedInitialData() {
  if (!db) {
    console.error("[Database] Database not initialized");
    return false;
  }

  try {
    // Create initial admin user with known credentials
    const [existingAdmin] = await db.select()
      .from(users)
      .where(eq(users.username, 'admin'))
      .limit(1);
      
    if (!existingAdmin) {
      const hashedPassword = await crypto.hash('admin123');
      await db.insert(users).values({
        username: 'admin',
        password: hashedPassword,
        role: 'admin' as const
      });
      console.log("[Database] Created admin user with credentials - username: admin, password: admin123");
    }
    // Admin user creation is sufficient for initial setup
    console.log("[Database] Initial setup completed");

    return true;
  } catch (error) {
    console.error("[Database] Seeding failed:", error);
    return false;
  }
}

// Add health check endpoint
export async function checkDbConnection() {
  try {
    await db.select().from(schema.trains).limit(1);
    return true;
  } catch (error) {
    console.error("[Database] Health check failed:", error);
    return false;
  }
}

// Run initial seeding
seedInitialData().catch(console.error);
