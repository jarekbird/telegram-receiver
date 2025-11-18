# PHASE3-046: Review mocking strategies

**Section**: 7. Testing Review
**Subsection**: 7.3
**Task ID**: PHASE3-046

## Description

Review and improve mocking strategies in the codebase to ensure best practices.

## Checklist

- [x] Review mock implementations
- [x] Check for proper mocking
- [x] Review mock data
- [x] Check for mock consistency
- [x] Review spy usage
- [x] Identify improvements
- [x] Document mocking strategy

## Review Findings

### Mock Implementations ✅

**Current State:**
- Three mock files exist in `tests/mocks/`:
  - `telegramApi.ts` - Mocks Telegram Bot API methods
  - `redis.ts` - Mocks Redis client methods
  - `cursorRunnerApi.ts` - Mocks Cursor Runner API methods
- All mocks follow consistent pattern using `jest.fn().mockResolvedValue()`
- Each mock file includes a reset function (`resetTelegramApiMocks`, `resetRedisMocks`, `resetCursorRunnerApiMocks`)

**Assessment:** Mock implementations are well-structured and follow consistent patterns.

**Issues Found:**
1. **Missing Redis method**: Redis mock lacks `setex` method (mentioned in PHASE2-044 but not implemented)
2. **Incomplete Telegram API methods**: Missing common methods like `sendPhoto`, `sendDocument`, `sendVoice`, `editMessageText`, `answerCallbackQuery`
3. **Missing error response mocks**: All mocks only provide success responses; no error response variants

### Mock Consistency ✅

**Current State:**
- All mocks use the same pattern: `jest.fn().mockResolvedValue(...)`
- All mocks include reset functions with consistent naming (`reset*Mocks`)
- Reset functions use the same implementation pattern (`mockClear()`)

**Assessment:** Mock consistency is good across all mock files.

**Improvements Needed:**
- Standardize mock return value structure (some use `{ ok: true }`, others use `{ success: true }`)
- Consider creating a base mock factory for consistency

### Mock Data Quality ⚠️

**Current State:**
- Mock return values are realistic and match expected API response structures
- Telegram API mocks return proper Telegram API response format (`{ ok: true, result: ... }`)
- Cursor Runner API mocks return custom format (`{ success: true, ... }`)
- Redis mocks return appropriate Redis response types

**Issues Found:**
1. **Hardcoded values**: Mock responses use hardcoded values (e.g., `message_id: 1`, `taskId: 'task-123'`)
2. **No factory functions**: Unlike fixtures, mocks don't provide factory functions for customization
3. **Limited response variety**: Only success responses; no error scenarios, edge cases, or different data states

**Recommendations:**
- Add factory functions to mocks for test-specific customization
- Create error response variants for each mock
- Use more dynamic values (timestamps, random IDs) where appropriate

### Spy Usage ⚠️

**Current State:**
- `testUtils.ts` provides `createMockFn` helper for creating typed mocks
- README examples show `jest.spyOn` usage for partial mocking
- No actual test files exist yet to verify spy patterns

**Issues Found:**
1. **No spy examples**: While spies are mentioned in documentation, no concrete examples exist
2. **Missing spy utilities**: No helper functions for common spy patterns
3. **Unclear when to use spies vs mocks**: Documentation doesn't clarify when to use `jest.spyOn` vs `jest.mock`

**Recommendations:**
- Add spy usage examples to mock documentation
- Create helper functions for common spy patterns
- Document when to use spies (partial mocking) vs full mocks (complete replacement)

### Reset/Cleanup Strategies ✅

**Current State:**
- All mocks include reset functions
- Reset functions properly clear mock call history using `mockClear()`
- Reset functions check if function is a mock before clearing (`jest.isMockFunction`)

**Assessment:** Reset strategies are well-implemented and prevent test pollution.

**Improvements Needed:**
- Consider adding a global reset function that resets all mocks at once
- Document when to call reset functions (beforeEach vs afterEach)

### Missing Mocks ⚠️

**Current State:**
- Mocks exist for main external dependencies (Telegram API, Redis, Cursor Runner API)
- No mocks for other dependencies that may be used

**Potential Missing Mocks:**
1. **ElevenLabs API**: Package includes `@elevenlabs/elevenlabs-js` but no mock exists
2. **BullMQ**: Package includes `bullmq` but no mock exists
3. **Express/HTTP**: No HTTP request/response mocks (though Supertest handles this)
4. **File System**: No file system mocks (may be needed for file operations)
5. **Environment Variables**: No mock for process.env access

**Recommendations:**
- Create ElevenLabs API mock when speech-to-text/text-to-speech features are implemented
- Create BullMQ mock when queue processing tests are needed
- Add file system mocks if file operations are added

### Best Practices Adherence ✅

**Current State:**
- Mocks are properly isolated in separate files
- Mocks use Jest's built-in mocking capabilities
- Reset functions ensure test isolation
- Mock structure is maintainable and reusable

**Issues Found:**
1. **Unused dependencies**: `nock` and `sinon` are in package.json but not used (consider removing or documenting usage)
2. **No manual mocks**: No `__mocks__` directory for automatic mocking
3. **No mock factories**: Mocks don't provide factory functions for customization

**Recommendations:**
- Document when to use `nock` (HTTP mocking) vs `jest.mock` (module mocking)
- Consider creating `__mocks__` directory for automatic mocking of external modules
- Add factory functions to mocks for better test flexibility

### Documentation ⚠️

**Current State:**
- Basic README exists in `tests/mocks/` with simple example
- Mock files have minimal inline documentation
- No comprehensive mocking strategy documentation

**Issues Found:**
1. **Incomplete documentation**: README doesn't cover all mocking patterns
2. **No usage examples**: Limited examples of how to use mocks in tests
3. **No best practices guide**: No documentation on when to use different mocking approaches
4. **Missing reset documentation**: No clear guidance on when/how to reset mocks

**Recommendations:**
- Expand mock README with comprehensive usage examples
- Document mocking patterns (mocks vs spies vs manual mocks)
- Add examples for error scenarios and edge cases
- Document reset strategies and best practices

## Recommendations Summary

### High Priority
1. **Add missing Redis method**: Add `setex` method to Redis mock (as mentioned in PHASE2-044)
2. **Expand Telegram API mocks**: Add missing common methods (`sendPhoto`, `sendDocument`, `sendVoice`, `editMessageText`, `answerCallbackQuery`)
3. **Add error response variants**: Create error response mocks for all API mocks

### Medium Priority
1. **Add factory functions**: Create factory functions for mocks to allow test-specific customization
2. **Standardize response formats**: Ensure consistent response structure across all mocks
3. **Improve documentation**: Expand mock README with comprehensive examples and best practices
4. **Add spy utilities**: Create helper functions for common spy patterns

### Low Priority
1. **Create ElevenLabs mock**: Add mock when speech features are implemented
2. **Create BullMQ mock**: Add mock when queue processing tests are needed
3. **Add global reset function**: Create utility to reset all mocks at once
4. **Document nock/sinon usage**: Clarify when to use these libraries vs Jest mocks

## Mocking Strategy Documentation

### Mock Structure

All mocks follow this structure:
```typescript
export const mockServiceName = {
  method1: jest.fn().mockResolvedValue(successResponse),
  method2: jest.fn().mockResolvedValue(successResponse),
};

export const resetServiceNameMocks = () => {
  Object.values(mockServiceName).forEach((mockFn) => {
    if (jest.isMockFunction(mockFn)) {
      mockFn.mockClear();
    }
  });
};
```

### Mock Usage Patterns

**Pattern 1: Module Mocking (Full Replacement)**
```typescript
import { mockTelegramApi } from '../mocks/telegramApi';
jest.mock('@/services/telegramApi', () => mockTelegramApi);
```

**Pattern 2: Partial Mocking (Spy)**
```typescript
import * as telegramApi from '@/services/telegramApi';
jest.spyOn(telegramApi, 'sendMessage').mockResolvedValue({ ok: true });
```

**Pattern 3: Test-Specific Mocking**
```typescript
import { mockTelegramApi } from '../mocks/telegramApi';
beforeEach(() => {
  mockTelegramApi.sendMessage.mockResolvedValue({ ok: true, result: customResult });
});
```

### When to Use Mocks vs Spies

- **Use `jest.mock()` (Full Mock)**: When you want to completely replace a module's implementation
- **Use `jest.spyOn()` (Spy)**: When you want to mock specific methods but keep the rest of the module's functionality
- **Use Manual Mocks (`__mocks__`)**: When you want automatic mocking for a module across all tests

### Reset Strategies

**Before Each Test:**
```typescript
beforeEach(() => {
  resetTelegramApiMocks();
  resetRedisMocks();
});
```

**After Each Test:**
```typescript
afterEach(() => {
  jest.clearAllMocks(); // Clears all mocks globally
});
```

### Mock Best Practices

1. **Isolate mocks**: Keep mocks in separate files in `tests/mocks/`
2. **Reset between tests**: Always reset mocks to prevent test pollution
3. **Use realistic data**: Mock responses should match real API response structures
4. **Provide reset functions**: Each mock should have a reset function
5. **Document usage**: Include examples in mock files or README
6. **Test error scenarios**: Create error response variants for comprehensive testing

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 7. Testing Review
- Review completed: Mocking strategies are well-implemented with identified improvements
- All mock files follow consistent patterns
- Main improvements needed: expand mock coverage, add error variants, improve documentation

- Task can be completed independently by a single agent

## Validation

**Validation Date**: 2025-01-17
**Validated By**: Product Designer Agent

**Validation Results**:
- ✅ All findings verified against actual codebase
- ✅ Missing `setex` method in Redis mock confirmed (tests/mocks/redis.ts)
- ✅ Missing Telegram API methods confirmed (sendVoice, getFile, getWebhookInfo referenced in PHASE2-027; sendPhoto, sendDocument, editMessageText, answerCallbackQuery referenced in other tasks)
- ✅ Missing error response mocks confirmed (all mocks only return success responses)
- ✅ nock and sinon unused confirmed (present in package.json but only referenced in documentation/tasks, not used in actual test code)
- ✅ No `__mocks__` directory confirmed (no manual mocks directory exists)
- ✅ Task description accurately reflects the review scope and findings
- ✅ Recommendations are appropriate and actionable

## Related Tasks

- Previous: PHASE3-045
- Next: PHASE3-047

---

IMPORTANT: When updating system settings (SystemSetting model), you MUST use the cursor-runner-shared-sqlite MCP connection.

IMPORTANT: When working with tasks (creating, querying, updating, or deleting tasks), you MUST use the cursor-runner-shared-sqlite MCP connection. The tasks table is in the shared SQLite database at /app/shared_db/shared.sqlite3.

Tasks Table Schema:
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- prompt: TEXT NOT NULL (the task prompt/description to be executed)
- status: INTEGER NOT NULL DEFAULT 0 (task status enum: 0=ready, 1=complete, 2=archived, 3=backlogged)
- createdat: DATETIME DEFAULT CURRENT_TIMESTAMP
- updatedat: DATETIME DEFAULT CURRENT_TIMESTAMP
- order: INTEGER DEFAULT 0 (lower numbers are processed first)
- uuid: TEXT (unique identifier, indexed)

Task Status Values:
- 0 = ready (ready to be processed by task operator)
- 1 = complete (task has been completed)
- 2 = archived (task has been archived)
- 3 = backlogged (task is in backlog, not ready for processing)

Task Management Examples:
- To create a ready task: INSERT INTO tasks (prompt, "order", status) VALUES ('your prompt here', 0, 0)
- To list ready tasks: SELECT * FROM tasks WHERE status = 0 ORDER BY "order" ASC, id ASC
- To mark a task as complete: UPDATE tasks SET status = 1, updatedat = CURRENT_TIMESTAMP WHERE id = ?
- To archive a task: UPDATE tasks SET status = 2, updatedat = CURRENT_TIMESTAMP WHERE id = ?
- To backlog a task: UPDATE tasks SET status = 3, updatedat = CURRENT_TIMESTAMP WHERE id = ?
- To get next ready task: SELECT * FROM tasks WHERE status = 0 ORDER BY "order" ASC, id ASC LIMIT 1

The task operator agent (when enabled) automatically processes tasks with status = 0 (ready), sending the prompt to cursor-runner for execution.

IMPORTANT: When working with cursor-agents (creating, listing, getting status, or deleting agents), use the Python scripts in /cursor/tools/cursor-agents/ directory. These scripts communicate with the cursor-agents service over HTTP:

Agent Management:
- To list all agents: python3 /cursor/tools/cursor-agents/list_agents.py
- To get agent status: python3 /cursor/tools/cursor-agents/get_agent_status.py --name <agent-name>
- To create an agent: python3 /cursor/tools/cursor-agents/create_agent.py --name <name> --target-url <url> [options]
  - Use --queue <queue-name> to assign the agent to a specific queue (defaults to "default" if not specified)
  - Use --schedule <cron-pattern> for recurring agents (e.g., "0 8 * * *" for daily at 8 AM)
  - Use --one-time for one-time agents that run immediately
- To delete an agent: python3 /cursor/tools/cursor-agents/delete_agent.py --name <agent-name>

Queue Management:
- To list all queues: python3 /cursor/tools/cursor-agents/list_queues.py
- To get queue info: python3 /cursor/tools/cursor-agents/get_queue_info.py --queue-name <queue-name>
- To delete an empty queue: python3 /cursor/tools/cursor-agents/delete_queue.py --queue-name <queue-name>
  - Note: Cannot delete the "default" queue or queues with active jobs

Task Operator Management:
- To enable the task operator: python3 /cursor/tools/cursor-agents/enable_task_operator.py [--queue <queue-name>]
  - The task operator automatically processes tasks from the tasks table in the database
  - It checks for incomplete tasks (lowest order first) and sends them to cursor-runner
  - Automatically re-enqueues itself every 5 seconds while enabled
- To disable the task operator: python3 /cursor/tools/cursor-agents/disable_task_operator.py
  - Sets the task_operator system setting to false, stopping re-enqueueing

When creating an agent, the target URL should be the cursor-runner docker networked URL (http://cursor-runner:3001/cursor/iterate/async) with a prompt that this agent will later execute.

Queue Organization: Agents can be organized into queues to avoid queue bloat. By default, agents are created in the "default" queue. Use descriptive queue names like "daily-tasks", "hourly-sync", or "urgent-jobs" to group related agents together.

IMPORTANT: When creating one-time scripts (shell scripts, Python scripts, etc.), place them in /cursor/scripts. This directory is shared and persistent across container restarts. Do not create scripts in the repository directories or other temporary locations.
