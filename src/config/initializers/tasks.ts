/**
 * Tasks Initializer
 *
 * This initializer sets all tasks in the shared SQLite database to ready status.
 * It ensures that all tasks are in the ready state (status = 0) when the application starts.
 *
 * The shared database is located at /app/shared_db/shared.sqlite3 and is used
 * by multiple services in the cursor-runner ecosystem.
 *
 * @example
 * ```typescript
 * import { initializeTasks } from './config/initializers/tasks';
 * initializeTasks();
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
 * Initialize tasks in the shared database
 * Sets all tasks to ready status (status = 0)
 *
 * This function:
 * 1. Connects to the shared SQLite database
 * 2. Updates all tasks to have status = 0 (ready)
 * 3. Updates the updatedat timestamp for all affected tasks
 * 4. Closes the database connection
 *
 * Task Status Values:
 * - 0 = ready (ready to be processed by task operator)
 * - 1 = complete (task has been completed)
 * - 2 = archived (task has been archived)
 * - 3 = backlogged (task is in backlog, not ready for processing)
 *
 * @throws {Error} If database operations fail
 */
export function initializeTasks(): void {
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  let db: Database.Database | null = null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    logger.info({ dbPath: SHARED_DB_PATH }, 'Initializing tasks to ready status');

    // Open database connection
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    db = new Database(SHARED_DB_PATH);

    // Enable WAL mode for better concurrency (allows multiple readers)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    db.pragma('journal_mode = WAL');

    // Update all tasks to ready status (status = 0)
    // Also update the updatedat timestamp
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const stmt = db.prepare(`
      UPDATE tasks
      SET status = 0, updatedat = CURRENT_TIMESTAMP
      WHERE status != 0
    `);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const result = stmt.run();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const changes = result.changes;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    logger.info({ tasksUpdated: changes }, 'Tasks initialized to ready status');

    // Close database connection
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    db.close();
    db = null;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    logger.info('Tasks initialization completed');
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    logger.error({ error, dbPath: SHARED_DB_PATH }, 'Failed to initialize tasks');

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
