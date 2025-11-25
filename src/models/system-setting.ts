/**
 * SystemSetting model
 * 
 * Model for storing system-wide boolean settings in the shared SQLite database.
 * Replaces environment variable configuration for feature flags and system toggles.
 * 
 * Reference: jarek-va/app/models/system_setting.rb
 * 
 * The shared database is located at /app/shared_db/shared.sqlite3 and is used
 * by multiple services in the cursor-runner ecosystem.
 */

import Database from 'better-sqlite3';
import logger from '../utils/logger';

/**
 * Path to the shared SQLite database
 * This database is shared across multiple services in the cursor-runner ecosystem
 */
const SHARED_DB_PATH = process.env.SHARED_DB_PATH || '/app/shared_db/shared.sqlite3';

/**
 * SystemSetting class with static methods for easy access
 * Matches Rails SystemSetting model API
 */
class SystemSetting {
  /**
   * Get a setting value by name, returns false if not found
   * 
   * @param name - Setting name
   * @returns Setting value (true or false), defaults to false if not found
   */
  static get(name: string): boolean {
    let db: Database.Database | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      db = new Database(SHARED_DB_PATH);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      db.pragma('journal_mode = WAL');

      // Query for setting value
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const stmt = db.prepare('SELECT value FROM system_settings WHERE name = ?');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const row = stmt.get(name) as { value: number } | undefined;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      db.close();

      // Return boolean value (0 = false, 1 = true)
      return row ? row.value === 1 : false;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      logger.error({ error, name }, 'Error getting system setting');
      if (db) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          db.close();
        } catch (closeError) {
          // Ignore close errors
        }
      }
      return false;
    }
  }

  /**
   * Set a setting value by name, creates if doesn't exist
   * 
   * @param name - Setting name
   * @param value - Setting value (true or false)
   * @returns The set value
   */
  static set(name: string, value: boolean): boolean {
    let db: Database.Database | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      db = new Database(SHARED_DB_PATH);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      db.pragma('journal_mode = WAL');

      // Insert or replace setting value
      // value = 1 means true, value = 0 means false (boolean stored as integer in SQLite)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO system_settings (name, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      stmt.run(name, value ? 1 : 0);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      db.close();

      return value;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      logger.error({ error, name, value }, 'Error setting system setting');
      if (db) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          db.close();
        } catch (closeError) {
          // Ignore close errors
        }
      }
      throw error;
    }
  }

  /**
   * Check if a setting is enabled (true)
   * 
   * @param name - Setting name
   * @returns true if setting is enabled, false otherwise
   */
  static enabled(name: string): boolean {
    return this.get(name);
  }

  /**
   * Check if a setting is disabled (false)
   * 
   * @param name - Setting name
   * @returns true if setting is disabled, false otherwise
   */
  static disabled(name: string): boolean {
    return !this.enabled(name);
  }

  /**
   * Enable a setting
   * 
   * @param name - Setting name
   * @returns The enabled value (true)
   */
  static enable(name: string): boolean {
    return this.set(name, true);
  }

  /**
   * Disable a setting
   * 
   * @param name - Setting name
   * @returns The disabled value (false)
   */
  static disable(name: string): boolean {
    return this.set(name, false);
  }

  /**
   * Toggle a setting
   * 
   * @param name - Setting name
   * @returns The new value after toggling
   */
  static toggle(name: string): boolean {
    const currentValue = this.get(name);
    return this.set(name, !currentValue);
  }
}

export default SystemSetting;
