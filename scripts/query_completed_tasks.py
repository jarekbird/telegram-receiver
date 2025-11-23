#!/usr/bin/env python3
"""
Query and display completed tasks from the shared SQLite database.
Completed tasks have status = 1.
"""
import sqlite3
import sys
from datetime import datetime

DB_PATH = "/app/shared_db/shared.sqlite3"

def format_datetime(dt_string):
    """Format datetime string for display"""
    if not dt_string:
        return "N/A"
    try:
        # Try to parse and format the datetime
        dt = datetime.fromisoformat(dt_string.replace('Z', '+00:00'))
        return dt.strftime("%B %d, %Y at %H:%M:%S")
    except:
        return dt_string

def query_completed_tasks():
    """Query and display all completed tasks"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row  # Enable column access by name
        cursor = conn.cursor()
        
        # Query completed tasks (status = 1)
        cursor.execute("""
            SELECT id, uuid, prompt, status, createdat, updatedat, "order"
            FROM tasks 
            WHERE status = 1
            ORDER BY updatedat DESC, id ASC
        """)
        
        completed_tasks = cursor.fetchall()
        
        # Get summary statistics
        cursor.execute("SELECT COUNT(*) FROM tasks WHERE status = 1")
        completed_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM tasks WHERE status = 0")
        ready_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM tasks WHERE status = 4")
        in_progress_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM tasks")
        total_count = cursor.fetchone()[0]
        
        conn.close()
        
        # Display results
        print("=" * 80)
        print("COMPLETED TASKS QUERY RESULTS")
        print("=" * 80)
        print(f"\nTotal Completed Tasks: {completed_count}\n")
        
        if completed_tasks:
            print("Completed Task Details:")
            print("-" * 80)
            for idx, task in enumerate(completed_tasks, 1):
                print(f"\nTask #{idx}:")
                print(f"  ID: {task['id']}")
                print(f"  UUID: {task['uuid']}")
                print(f"  Status: {task['status']} (Complete)")
                print(f"  Created: {format_datetime(task['createdat'])}")
                print(f"  Completed: {format_datetime(task['updatedat'])}")
                print(f"  Order: {task['order']}")
                print(f"  Prompt: {task['prompt'][:200]}{'...' if len(task['prompt']) > 200 else ''}")
        else:
            print("No completed tasks found in the database.")
        
        print("\n" + "=" * 80)
        print("Task Status Summary:")
        print(f"  - Ready (status 0): {ready_count} tasks")
        print(f"  - Complete (status 1): {completed_count} tasks")
        print(f"  - In Progress (status 4): {in_progress_count} tasks")
        print(f"  - Total: {total_count} tasks")
        print("=" * 80)
        
        return completed_tasks
        
    except sqlite3.Error as e:
        print(f"Database error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    query_completed_tasks()
    sys.exit(0)
