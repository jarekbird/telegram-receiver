/**
 * System Settings Initializer
 *
 * This initializer sets up system-wide settings in the shared SQLite database.
 * It ensures that required system settings are initialized with their default values.
 *
 * The shared database is located at /app/shared_db/shared.sqlite3 and is used
 * by multiple services in the cursor-runner ecosystem.
 *
 * @example
 * ```typescript
 * import { initializeSystemSettings } from './config/initializers/system-settings';
 * await initializeSystemSettings();
 * ```
 */

import Database from 'better-sqlite3';
import logger from '../logger';

/**
 * Path to the shared SQLite database
 * This database is shared across multiple services in the cursor-runner ecosystem
 */
const SHARED_DB_PATH = process.env.SHARED_DB_PATH || '/app/shared_db/shared.sqlite3';

/**
 * Initialize system settings in the shared database
 * Sets default values for system settings if they don't already exist
 *
 * This function:
 * 1. Connects to the shared SQLite database
 * 2. Ensures the system_settings table exists (with proper schema)
 * 3. Sets the debug system setting to true (creates if doesn't exist, updates if exists)
 * 4. Closes the database connection
 *
 * @throws {Error} If database operations fail
 */
export function initializeSystemSettings(): void {
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  let db: Database.Database | null = null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    logger.info({ dbPath: SHARED_DB_PATH }, 'Initializing system settings');

    // Open database connection
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    db = new Database(SHARED_DB_PATH);

    // Enable WAL mode for better concurrency (allows multiple readers)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    db.pragma('journal_mode = WAL');

    // Ensure system_settings table exists
    // Schema matches Rails SystemSetting model:
    // - id: INTEGER PRIMARY KEY AUTOINCREMENT
    // - name: TEXT NOT NULL UNIQUE
    // - value: INTEGER NOT NULL (0 = false, 1 = true, stored as boolean in Rails)
    // - created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
    // - updated_at: DATETIME DEFAULT CURRENT_TIMESTAMP
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    db.exec(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        value INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index on name for faster lookups
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_system_settings_name ON system_settings(name)
    `);

    // Set debug system setting to true
    // Use INSERT OR REPLACE to handle both create and update cases
    // value = 1 means true (boolean stored as integer in SQLite)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO system_settings (name, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    stmt.run('debug', 1);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    logger.info({ setting: 'debug', value: true }, 'System setting initialized');

    // Close database connection
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    db.close();
    db = null;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    logger.info('System settings initialization completed');
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    logger.error({ error, dbPath: SHARED_DB_PATH }, 'Failed to initialize system settings');

    // Ensure database connection is closed on error
    if (db) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        db.close();
      } catch (closeError) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        logger.error({ error: closeError }, 'Failed to close database connection');
      }
    }

    throw error;
  }
}
