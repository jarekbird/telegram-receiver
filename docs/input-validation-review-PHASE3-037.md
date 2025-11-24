# Input Validation Review - PHASE3-037

**Task ID**: PHASE3-037  
**Section**: 6. Security Review  
**Subsection**: 6.2  
**Date**: 2024

## Executive Summary

This document provides a comprehensive review of input validation in the telegram-receiver codebase, comparing the current implementation (or planned implementation) with the Rails reference implementation in jarek-va. The review identifies validation gaps, security vulnerabilities, and provides recommendations for secure input validation practices.

## Current Implementation Status

### Implemented Components

1. **Express Body Parsers** (`src/app.ts`)
   - JSON body parser: `express.json()` (line 16)
     - No explicit size limit configured
     - Default limit: 100kb (Express default)
   - URL-encoded body parser: `express.urlencoded({ extended: true })` (line 23)
     - No explicit size limit configured
     - Default limit: 100kb (Express default)
   - Status: ✅ Implemented (but missing size limits)

2. **Request Logger Middleware** (`src/middleware/request-logger.middleware.ts`)
   - Logs requests with request IDs
   - Status: ✅ Implemented

3. **Error Handler Middleware** (`src/middleware/error-handler.middleware.ts`)
   - Generic error handling
   - Status: ✅ Implemented

4. **TypeScript Types** (`src/types/`)
   - Type definitions for Telegram, Cursor Runner, ElevenLabs
   - Status: ✅ Implemented (compile-time validation only)

### Missing Components

The following validation-related components are **not yet implemented** in telegram-receiver:

1. **Telegram Controller** - No implementation found
2. **Cursor Runner Callback Controller** - No implementation found
3. **Agent Tools Controller** - No implementation found
4. **Input Validation Middleware** - No validation middleware found
5. **Validation Library** - No validation library (Zod, Joi, express-validator) installed
6. **Request Body Size Limits** - No explicit limits configured
7. **Input Sanitization Utilities** - No sanitization functions found
8. **Type Validation at Runtime** - Only compile-time TypeScript validation exists

## Rails Implementation Analysis

### 1. Telegram Webhook Endpoint (`POST /telegram/webhook`)

**Rails Implementation** (`jarek-va/app/controllers/telegram_controller.rb`):

**Validation**:
- ✅ Checks Content-Type header: `request.content_type&.include?('application/json')` (line 15)
- ❌ No explicit JSON parsing validation (relies on Rails automatic parsing)
- ❌ No `params.permit()` - directly accesses `request.parameters` or `params`
- ❌ No request body size limit
- ❌ No Telegram update structure validation
- ❌ No sanitization of update data before processing

**Security Concerns**:
1. ⚠️ **No Structure Validation**: Doesn't validate Telegram update structure (message, edited_message, callback_query)
2. ⚠️ **No Size Limits**: No protection against large payload DoS attacks
3. ⚠️ **No Field Validation**: Doesn't validate required fields in update structure
4. ⚠️ **No Sanitization**: Update data passed directly to job without sanitization

**Node.js Recommendations**:
- ✅ Validate request body is valid JSON (Express does this automatically, but handle errors gracefully)
- ✅ Validate Content-Type header is `application/json` (or handle gracefully)
- ✅ Validate Telegram update structure (must have at least one of: message, edited_message, callback_query)
- ✅ Validate required fields in update structure (e.g., message.chat.id, message.message_id)
- ✅ Set request body size limit (e.g., 1MB for Telegram updates)
- ✅ Sanitize update data before processing (escape HTML entities if using HTML parse_mode)
- ✅ Use validation library (Zod, Joi) for structure validation

**Status**: ❌ Not implemented in telegram-receiver

---

### 2. Cursor-Runner Callback Endpoint (`POST /cursor-runner/callback`)

**Rails Implementation** (`jarek-va/app/controllers/cursor_runner_callback_controller.rb`):

**Validation**:
- ✅ Uses `params.permit()` with specific allowed fields (lines 11-15):
  - `success`, `requestId`, `request_id`, `repository`, `branchName`, `branch_name`
  - `iterations`, `maxIterations`, `max_iterations`, `output`, `error`
  - `exitCode`, `exit_code`, `duration`, `timestamp`
- ✅ Validates `request_id` is present (lines 19-22): Returns 400 if blank
- ✅ Normalizes camelCase/snake_case field names via `normalize_result()` method (line 99)
- ✅ Handles boolean conversion for `success` field (lines 146-151):
  - Converts: `true`, `'true'`, `1`, `'1'` → `true`
  - Converts: `false`, `'false'`, `0`, `'0'`, `nil` → `false`
- ✅ Sanitizes output by removing ANSI escape sequences via `clean_ansi_escape_sequences()` method (line 320)
- ✅ Truncates output to max length (3500 chars in debug mode, 4000 chars otherwise) (line 284)
- ❌ No explicit type validation (relies on Rails type coercion)
- ❌ No request body size limit
- ❌ No validation of numeric field ranges (iterations, max_iterations, exit_code)
- ❌ No validation of string length limits for `output` and `error` fields (only truncates)

**Security Concerns**:
1. ⚠️ **No Type Validation**: Doesn't explicitly validate field types (e.g., iterations must be integer)
2. ⚠️ **No Size Limits**: No protection against large payload DoS attacks
3. ⚠️ **No String Length Validation**: Only truncates output, doesn't validate input length
4. ⚠️ **No Numeric Range Validation**: Doesn't validate iterations, max_iterations, exit_code are within reasonable ranges
5. ✅ **Good Sanitization**: Removes ANSI escape sequences (good practice)
6. ✅ **Good Whitelisting**: Uses `params.permit()` to restrict allowed fields

**Node.js Recommendations**:
- ✅ Validate request body is valid JSON
- ✅ Validate `request_id` is present and not blank (return 400 if missing)
- ✅ Validate allowed fields only (equivalent to Rails `params.permit()`)
- ✅ Validate field types:
  - `success`: boolean (handle string "true"/"false" conversion)
  - `iterations`, `max_iterations`, `exit_code`: integers
  - `duration`: number or string (validate format)
  - `output`, `error`: strings
  - `repository`, `branch_name`, `timestamp`: strings
- ✅ Validate string length limits for `output` and `error` fields (e.g., 10MB max)
- ✅ Validate numeric ranges (e.g., iterations >= 0, max_iterations >= 1, exit_code >= -128 && <= 255)
- ✅ Handle both camelCase and snake_case field names (normalize)
- ✅ Validate boolean conversion for `success` field (handle string "true"/"false")
- ✅ Set request body size limit (e.g., 10MB for callbacks with large output)
- ✅ Sanitize output by removing ANSI escape sequences
- ✅ Truncate long outputs to prevent exceeding Telegram's 4096 character message limit

**Status**: ❌ Not implemented in telegram-receiver

---

### 3. Admin Endpoints

#### 3.1 Set Webhook (`POST /telegram/set_webhook`)

**Rails Implementation** (`jarek-va/app/controllers/telegram_controller.rb` lines 51-70):

**Validation**:
- ❌ No `params.permit()` - directly accesses `params[:url]` and `params[:secret_token]`
- ❌ No URL format validation (line 54: `params[:url] || default_webhook_url`)
- ❌ No `secret_token` format validation (line 55: `params[:secret_token] || Rails.application.config.telegram_webhook_secret`)
- ❌ No validation that URL is valid format (not malicious)
- ❌ No parameter injection protection

**Security Concerns**:
1. ⚠️ **No URL Validation**: Doesn't validate URL format (could be malicious)
2. ⚠️ **No Secret Token Validation**: Doesn't validate secret_token format/character restrictions
3. ⚠️ **No Parameter Injection Protection**: Directly uses params without sanitization
4. ⚠️ **No Whitelisting**: Doesn't use `params.permit()` to restrict allowed fields

**Node.js Recommendations**:
- ✅ Validate `url` parameter format (if provided):
  - Must be valid URL format
  - Must use HTTPS in production (or allow HTTP in development)
  - Must not contain malicious patterns (e.g., `javascript:`, `data:`)
- ✅ Validate `secret_token` parameter (if provided):
  - Must be non-empty string
  - Consider character restrictions (e.g., alphanumeric + special chars)
  - Consider length restrictions (e.g., 8-128 characters)
- ✅ Use `params.permit()` equivalent to restrict allowed fields
- ✅ Validate URL is not malicious (check for protocol whitelist, no dangerous schemes)
- ✅ Check for parameter injection vulnerabilities

**Status**: ❌ Not implemented in telegram-receiver

#### 3.2 Webhook Info (`GET /telegram/webhook_info`)

**Rails Implementation** (`jarek-va/app/controllers/telegram_controller.rb` lines 73-88):

**Validation**:
- ✅ No params required (admin authentication only)
- ✅ No validation needed (read-only endpoint)

**Status**: ✅ No validation needed (read-only endpoint)

#### 3.3 Delete Webhook (`DELETE /telegram/webhook`)

**Rails Implementation** (`jarek-va/app/controllers/telegram_controller.rb` lines 91-106):

**Validation**:
- ✅ No params required (admin authentication only)
- ✅ No validation needed (action-only endpoint)

**Status**: ✅ No validation needed (action-only endpoint)

---

### 4. Agent Tools Endpoint (`POST /agent-tools`)

**Rails Implementation** (`jarek-va/app/controllers/agent_tools_controller.rb`):

**Validation**:
- ✅ Uses `validate_request_params` before_action (lines 48-56):
  - Checks `params[:tool]` is present (returns 400 if missing)
- ❌ Does NOT use `params.permit()` - directly accesses `params[:tool]`, `params[:args]`, `params[:conversation_id]`
- ❌ No validation of `args` parameter structure (if provided)
- ❌ No validation of `conversation_id` parameter format (if provided)
- ❌ No type validation for `tool` (should be string)
- ❌ No type validation for `args` (should be object/hash)
- ❌ No type validation for `conversation_id` (should be string)

**Security Concerns**:
1. ⚠️ **No Whitelisting**: Doesn't use `params.permit()` to restrict allowed fields
2. ⚠️ **No Structure Validation**: Doesn't validate `args` parameter structure
3. ⚠️ **No Format Validation**: Doesn't validate `conversation_id` format (if it has specific structure)
4. ⚠️ **No Type Validation**: Doesn't validate parameter types

**Node.js Recommendations**:
- ✅ Validate request body structure
- ✅ Validate `tool` parameter is present (return 400 if missing)
- ✅ Validate `tool` is a string
- ✅ Validate `args` parameter structure (if provided):
  - Must be object/hash (not array, not primitive)
  - Validate nested structure if tool has specific requirements
- ✅ Validate `conversation_id` parameter format (if provided):
  - Must be string
  - Validate format if it has specific structure (e.g., UUID format)
- ✅ Consider using `params.permit()` equivalent to restrict allowed fields
- ✅ Validate authentication header (`X-EL-Secret` or `Authorization: Bearer <token>`)

**Status**: ❌ Not implemented in telegram-receiver

---

## Input Sanitization Analysis

### Current Rails Sanitization

1. **ANSI Escape Sequence Removal** (`cursor_runner_callback_controller.rb` line 320):
   ```ruby
   def clean_ansi_escape_sequences(text)
     text.gsub(/\u001b\[[?0-9;]*[a-zA-Z]/, '')
         .gsub("\r\n", "\n")
         .strip
   end
   ```
   - ✅ Removes ANSI escape codes (e.g., `\u001b[?25h`, `\u001b[0m`)
   - ✅ Normalizes line endings (`\r\n` → `\n`)
   - ✅ Strips whitespace

2. **Output Truncation** (`cursor_runner_callback_controller.rb` line 284):
   - Truncates output to 3500 chars (debug mode) or 4000 chars (normal mode)
   - Prevents exceeding Telegram's 4096 character message limit

3. **HTML Entity Escaping** (not explicitly done in Rails):
   - ⚠️ Rails doesn't explicitly escape HTML entities in Telegram messages
   - ⚠️ Uses HTML parse_mode but doesn't sanitize user-controlled data
   - ⚠️ Risk: XSS if user-controlled data contains HTML entities

### Security Concerns

1. ⚠️ **No HTML Entity Escaping**: Telegram messages with HTML parse_mode don't escape user-controlled data
2. ⚠️ **No XSS Protection**: User-controlled data in Telegram messages could contain malicious HTML
3. ⚠️ **No File Path Validation**: When downloading files from Telegram, no validation for directory traversal (`../`)
4. ⚠️ **No URL Validation**: URLs in admin endpoints not validated for malicious schemes

### Node.js Recommendations

**String Sanitization**:
- ✅ Sanitize `output` and `error` fields from cursor-runner callbacks:
  - Remove ANSI escape sequences (as done in Rails)
  - Remove carriage return/newline sequences (`\r\n` → `\n`)
  - Strip whitespace
- ✅ Escape HTML entities in Telegram message text when using HTML parse_mode:
  - Escape: `<`, `>`, `&`, `"`, `'`
  - Use library like `he` (HTML entities) or built-in escaping
- ✅ Validate and sanitize URLs in admin endpoints:
  - Check for valid URL format
  - Whitelist allowed protocols (https, http in dev)
  - Reject dangerous schemes (`javascript:`, `data:`, `file:`)
- ✅ Check for XSS vulnerabilities in user-controlled data:
  - Escape HTML entities when using HTML parse_mode
  - Validate and sanitize all user input before rendering
- ✅ Truncate long outputs to prevent exceeding Telegram's 4096 character message limit

**File Path Handling**:
- ✅ Validate file paths don't contain directory traversal (`../`):
  - Check for `../` patterns
  - Normalize paths and check they're within allowed directories
- ✅ Validate file paths are within allowed directories:
  - Use `path.resolve()` and check path starts with allowed directory
  - Reject paths outside allowed directories
- ✅ Check for path injection vulnerabilities:
  - Validate path format
  - Reject absolute paths if not allowed
  - Reject paths with null bytes

**Status**: ❌ Not implemented in telegram-receiver

---

## Type Validation Analysis

### Current Rails Type Handling

1. **Boolean Conversion** (`cursor_runner_callback_controller.rb` lines 146-151):
   ```ruby
   success_bool = case success_value
                  when true, 'true', 1, '1'
                    true
                  when false, 'false', 0, '0', nil
                    false
                  end
   ```
   - ✅ Handles multiple boolean representations
   - ✅ Converts strings, numbers, and booleans to boolean

2. **Numeric Fields**:
   - Rails uses `|| 0` or `|| 25` for defaults (lines 158-160)
   - ❌ No explicit type validation (relies on Rails type coercion)
   - ❌ No range validation

3. **String Fields**:
   - Rails uses `|| ''` for defaults (line 161)
   - ❌ No explicit type validation
   - ❌ No length validation

### Security Concerns

1. ⚠️ **No Explicit Type Validation**: Rails relies on type coercion, which can be unpredictable
2. ⚠️ **No Range Validation**: Numeric fields (iterations, max_iterations, exit_code) not validated for reasonable ranges
3. ⚠️ **No Length Validation**: String fields not validated for maximum length
4. ⚠️ **Type Coercion Issues**: String "123" might be coerced to number, but "abc" might cause errors

### Node.js Recommendations

**Type Validation**:
- ✅ Validate numeric fields are numbers (not strings):
  - `iterations`: integer >= 0
  - `max_iterations`: integer >= 1
  - `exit_code`: integer >= -128 && <= 255
  - `duration`: number or string (validate format if string)
- ✅ Validate boolean fields are booleans (handle string conversions):
  - Handle: `true`, `'true'`, `1`, `'1'` → `true`
  - Handle: `false`, `'false'`, `0`, `'0'`, `null`, `undefined` → `false`
  - Reject invalid values (return 400 Bad Request)
- ✅ Validate string fields are strings:
  - `request_id`: non-empty string
  - `repository`: string (validate format if needed)
  - `branch_name`: string (validate format if needed)
  - `output`, `error`: strings (validate length)
  - `timestamp`: string (validate format if needed)
- ✅ Validate array/object structures match expected types:
  - Telegram update structure (message, edited_message, callback_query)
  - Agent tools `args` parameter (must be object)
- ✅ Use TypeScript types for compile-time validation
- ✅ Add runtime type validation where needed (using validation library like Zod or Joi)
- ✅ Handle default values for optional fields:
  - `iterations` defaults to 0
  - `max_iterations` defaults to 25
  - `output` defaults to empty string

**Status**: ❌ Not implemented in telegram-receiver

---

## Injection Vulnerabilities Analysis

### SQL Injection

**Rails Implementation**:
- ✅ Uses ActiveRecord ORM (parameterized queries by default)
- ✅ No raw SQL queries found in controllers
- ⚠️ Note: telegram-receiver uses Redis, not SQL database (no SQL injection risk)

**Node.js Recommendations**:
- ✅ Review any database queries (if applicable)
- ✅ Verify parameterized queries are used
- ✅ Check Redis key construction for injection risks

**Status**: ✅ N/A (telegram-receiver uses Redis, not SQL database)

---

### Command Injection

**Rails Implementation**:
- ⚠️ No explicit command execution found in controllers
- ⚠️ File operations (downloading from Telegram) might use shell commands
- ⚠️ No validation of file paths before operations

**Security Concerns**:
1. ⚠️ **File Path Injection**: File paths from Telegram not validated
2. ⚠️ **Command Execution**: If shell commands are used, inputs not validated

**Node.js Recommendations**:
- ✅ Review any shell command execution
- ✅ Validate inputs before passing to shell commands
- ✅ Use safe command execution methods (avoid `exec()`, use `spawn()` with proper escaping)
- ✅ Validate file paths for directory traversal
- ✅ Use `child_process.spawn()` with array arguments instead of string commands

**Status**: ❌ Not implemented (need to review when file operations are implemented)

---

### NoSQL Injection

**Rails Implementation**:
- ✅ Uses Redis for callback state management
- ⚠️ Redis keys constructed from `request_id` (user-controlled in callbacks)
- ⚠️ No validation of `request_id` format before using as Redis key

**Security Concerns**:
1. ⚠️ **Redis Key Injection**: `request_id` from cursor-runner callback used directly as Redis key
2. ⚠️ **Key Pattern Injection**: Malicious `request_id` could match multiple keys (if using patterns)

**Node.js Recommendations**:
- ✅ Review Redis operations for injection risks
- ✅ Validate Redis key names:
  - Sanitize `request_id` before using as Redis key
  - Use key prefixes (e.g., `cursor:callback:{request_id}`)
  - Validate `request_id` format (e.g., UUID format)
- ✅ Avoid using user-controlled data directly in Redis key patterns
- ✅ Use parameterized key construction (concatenate safely)

**Status**: ❌ Not implemented (need to review when Redis operations are implemented)

---

### Template Injection

**Rails Implementation**:
- ⚠️ No template rendering found in controllers
- ⚠️ Telegram messages use string interpolation (not templates)
- ⚠️ No validation of template variables

**Node.js Recommendations**:
- ✅ Review any template rendering (if applicable)
- ✅ Validate template variables
- ✅ Use safe template engines (avoid `eval()` or `Function()`)

**Status**: ✅ N/A (no template rendering found)

---

## Request Size Limits Analysis

### Current Express Configuration

**Rails Implementation**:
- ❌ No explicit request body size limits in Rails
- ⚠️ Rails has default limits (typically 2MB for JSON, but configurable)

**Express Implementation** (`src/app.ts`):
- ❌ `express.json()` - No `limit` option (defaults to 100kb)
- ❌ `express.urlencoded()` - No `limit` option (defaults to 100kb)
- ⚠️ Default limits are too small for large payloads (cursor-runner callbacks with large output)

### Security Concerns

1. ⚠️ **Default Limits Too Small**: 100kb default is too small for cursor-runner callbacks
2. ⚠️ **No DoS Protection**: No protection against large payload DoS attacks
3. ⚠️ **Inconsistent Limits**: Different endpoints might need different limits

### Node.js Recommendations

**Request Size Limits**:
- ✅ Set appropriate limits for `express.json()`:
  - Telegram webhook: 1MB (Telegram updates are small)
  - Cursor-runner callback: 10MB (output/error fields can be large)
  - Agent tools: 1MB (tool requests are small)
- ✅ Set appropriate limits for `express.urlencoded()`:
  - Admin endpoints: 1MB (URL-encoded form data is small)
- ✅ Consider endpoint-specific limits (use middleware per route)
- ✅ Handle 413 Payload Too Large errors gracefully:
  - Return 413 status with clear error message
  - Log oversized requests for security monitoring
- ✅ Document size limits in configuration
- ✅ Consider Telegram update size limits (Telegram API has its own limits, but validate client-side)

**Example Implementation**:
```typescript
// For Telegram webhook
app.use('/telegram/webhook', express.json({ limit: '1mb' }));

// For cursor-runner callback
app.use('/cursor-runner/callback', express.json({ limit: '10mb' }));

// For agent tools
app.use('/agent-tools', express.json({ limit: '1mb' }));
```

**Status**: ❌ Not implemented in telegram-receiver

---

## Validation Gaps Identified

### Critical Issues

1. **No Request Body Validation**
   - Telegram webhook: No structure validation, no size limits
   - Cursor-runner callback: No type validation, no size limits
   - Agent tools: No structure validation, no type validation

2. **No Input Sanitization**
   - No HTML entity escaping for Telegram messages
   - No file path validation for directory traversal
   - No URL validation for malicious schemes

3. **No Type Validation**
   - No runtime type validation (only compile-time TypeScript)
   - No numeric range validation
   - No string length validation

4. **No Request Size Limits**
   - Default 100kb limits are too small
   - No DoS protection against large payloads

### High Priority Issues

5. **Missing Whitelisting**
   - Telegram webhook: No `params.permit()` equivalent
   - Admin endpoints: No `params.permit()` equivalent
   - Agent tools: No `params.permit()` equivalent

6. **Missing Field Validation**
   - `request_id` validation (only presence check, no format validation)
   - `url` parameter validation (no format validation)
   - `args` parameter validation (no structure validation)

7. **Missing Sanitization Steps**
   - Telegram update data before processing
   - File paths when downloading from Telegram
   - HTML entities in Telegram messages

### Medium Priority Issues

8. **Validation Inconsistencies**
   - Some endpoints use `params.permit()`, others don't
   - Some endpoints validate required fields, others don't
   - Inconsistent error response formats

9. **Missing Error Handling for Validation Failures**
   - No consistent error response format (400 Bad Request for validation errors)
   - Error messages might leak sensitive information

10. **No Validation Library**
    - No validation library (Zod, Joi, express-validator) installed
    - Manual validation would be error-prone

---

## Validation Strategy Documentation

### Recommended Validation Library

**Options**:
1. **Zod** - TypeScript-first schema validation
   - Pros: TypeScript integration, type inference, good performance
   - Cons: Requires TypeScript
2. **Joi** - JavaScript schema validation
   - Pros: Mature, feature-rich, good documentation
   - Cons: No TypeScript type inference
3. **express-validator** - Express middleware for validation
   - Pros: Express integration, built on validator.js
   - Cons: Less type-safe, more verbose

**Recommendation**: **Zod** (best TypeScript integration, type inference, good performance)

### Validation Patterns

**1. Request Body Validation**:
```typescript
import { z } from 'zod';

const cursorRunnerCallbackSchema = z.object({
  success: z.union([z.boolean(), z.string(), z.number()]).transform(val => {
    if (val === true || val === 'true' || val === 1 || val === '1') return true;
    if (val === false || val === 'false' || val === 0 || val === '0' || val === null) return false;
    throw new Error('Invalid boolean value');
  }),
  requestId: z.string().optional(),
  request_id: z.string().optional(),
  repository: z.string().optional(),
  branchName: z.string().optional(),
  branch_name: z.string().optional(),
  iterations: z.number().int().min(0).optional().default(0),
  maxIterations: z.number().int().min(1).optional(),
  max_iterations: z.number().int().min(1).optional(),
  output: z.string().max(10 * 1024 * 1024).optional().default(''), // 10MB max
  error: z.string().max(10 * 1024 * 1024).optional(),
  exitCode: z.number().int().min(-128).max(255).optional(),
  exit_code: z.number().int().min(-128).max(255).optional(),
  duration: z.union([z.number(), z.string()]).optional(),
  timestamp: z.string().optional(),
}).refine(data => data.requestId || data.request_id, {
  message: 'request_id is required',
  path: ['requestId', 'request_id'],
});
```

**2. Validation Middleware**:
```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      next(error);
    }
  };
}
```

**3. Field Normalization**:
```typescript
function normalizeCursorRunnerCallback(body: any) {
  return {
    success: normalizeBoolean(body.success || body.Success),
    request_id: body.requestId || body.request_id,
    repository: body.repository || body.Repository,
    branch_name: body.branchName || body.branch_name,
    iterations: normalizeInteger(body.iterations || body.Iterations, 0),
    max_iterations: normalizeInteger(body.maxIterations || body.max_iterations, 25),
    output: sanitizeOutput(body.output || body.Output || ''),
    error: sanitizeOutput(body.error || body.Error),
    exit_code: normalizeInteger(body.exitCode || body.exit_code, 0),
    duration: body.duration || body.Duration,
    timestamp: body.timestamp || body.Timestamp,
  };
}
```

**4. Sanitization Functions**:
```typescript
function cleanAnsiEscapeSequences(text: string): string {
  if (!text) return '';
  // Remove ANSI escape codes
  return text
    .replace(/\u001b\[[?0-9;]*[a-zA-Z]/g, '')
    .replace(/\r\n/g, '\n')
    .trim();
}

function escapeHtmlEntities(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

### Error Response Format

**Standardized Error Response**:
```typescript
{
  error: 'Validation failed',
  details: [
    {
      field: 'request_id',
      message: 'request_id is required',
    },
    {
      field: 'iterations',
      message: 'iterations must be a non-negative integer',
    },
  ],
}
```

**HTTP Status Codes**:
- `400 Bad Request` - Validation errors
- `413 Payload Too Large` - Request body too large
- `415 Unsupported Media Type` - Invalid Content-Type
- `422 Unprocessable Entity` - Valid JSON but invalid structure

---

## Implementation Recommendations

### Immediate Actions (Before Implementation)

1. ✅ **Install Validation Library**
   - Install Zod: `npm install zod`
   - Create validation schemas for all endpoints
   - Create validation middleware

2. ✅ **Configure Request Size Limits**
   - Set appropriate limits for each endpoint
   - Handle 413 errors gracefully
   - Document limits in configuration

3. ✅ **Create Sanitization Utilities**
   - Create `src/utils/sanitization.ts` with sanitization functions
   - Implement ANSI escape sequence removal
   - Implement HTML entity escaping
   - Implement file path validation

### Implementation Requirements

4. ✅ **Implement Request Body Validation**
   - Validate JSON structure for all endpoints
   - Validate required fields
   - Validate field types
   - Validate field formats (URLs, UUIDs, etc.)

5. ✅ **Implement Input Sanitization**
   - Sanitize all string inputs
   - Escape HTML entities for Telegram messages
   - Validate file paths
   - Validate URLs

6. ✅ **Implement Type Validation**
   - Validate numeric fields (type and range)
   - Validate boolean fields (handle conversions)
   - Validate string fields (type and length)
   - Validate array/object structures

7. ✅ **Implement Whitelisting**
   - Use `params.permit()` equivalent for all endpoints
   - Restrict allowed fields
   - Reject unknown fields

### Security Enhancements

8. ⚠️ **Add Request Size Limits**
   - Configure endpoint-specific limits
   - Handle oversized requests gracefully
   - Log oversized requests for security monitoring

9. ⚠️ **Add Injection Protection**
   - Validate Redis key construction
   - Validate file paths for directory traversal
   - Validate command inputs (if shell commands are used)

10. ⚠️ **Add Rate Limiting**
    - Add rate limiting for validation endpoints
    - Prevent DoS attacks
    - Log excessive validation failures

---

## Checklist Status

### Request Body Validation

- [ ] Review Telegram webhook endpoint (`POST /telegram/webhook`)
  - [ ] Validate request body is valid JSON
  - [ ] Validate Content-Type header is `application/json` (or handle gracefully)
  - [ ] Validate Telegram update structure (message, edited_message, callback_query)
  - [ ] Check for required fields in update structure
  - [ ] Validate request body size limits (prevent DoS via large payloads)
  - [ ] Verify update data is sanitized before processing

- [ ] Review cursor-runner callback endpoint (`POST /cursor-runner/callback`)
  - [ ] Validate request body is valid JSON
  - [ ] Validate `request_id` is present and not blank (return 400 if missing)
  - [ ] Validate allowed fields only (equivalent to Rails `params.permit()`)
  - [ ] Validate field types (success: boolean, iterations: integer, etc.)
  - [ ] Validate string length limits for `output` and `error` fields
  - [ ] Handle both camelCase and snake_case field names (normalize)
  - [ ] Validate boolean conversion for `success` field (handle string "true"/"false")
  - [ ] Validate numeric fields (iterations, max_iterations, exit_code) are valid numbers
  - [ ] Check for request body size limits

- [ ] Review admin endpoints (`POST /telegram/set_webhook`, `GET /telegram/webhook_info`, `DELETE /telegram/webhook`)
  - [ ] Validate `url` parameter format (if provided in set_webhook)
  - [ ] Validate `secret_token` parameter (if provided in set_webhook)
  - [ ] Validate URL is valid format (not malicious)
  - [ ] Validate `admin_secret` parameter/header (checked in `authenticate_admin` but not explicitly permitted)
  - [ ] Check for parameter injection vulnerabilities

- [ ] Review agent tools endpoint (`POST /agent-tools`)
  - [ ] Validate request body structure
  - [ ] Validate `tool` parameter is present (Rails uses `validate_request_params` before_action)
  - [ ] Validate `args` parameter structure (if provided)
  - [ ] Validate `conversation_id` parameter format (if provided)
  - [ ] Consider using `params.permit()` equivalent to restrict allowed fields (Rails doesn't use permit here)
  - [ ] Validate authentication header (`X-EL-Secret` or `Authorization: Bearer <token>`)

### Input Sanitization

- [ ] Review all string inputs for sanitization
  - [ ] Sanitize `output` and `error` fields from cursor-runner callbacks
  - [ ] Remove ANSI escape sequences from output (as done in Rails `clean_ansi_escape_sequences()` method)
  - [ ] Remove carriage return/newline sequences (`\r\n` -> `\n`) and strip whitespace
  - [ ] Sanitize Telegram message text before processing (escape HTML entities when using HTML parse_mode)
  - [ ] Escape HTML entities in TelegramService when sending messages with HTML parse_mode (prevents Telegram parsing errors)
  - [ ] Validate and sanitize URLs in admin endpoints
  - [ ] Check for XSS vulnerabilities in user-controlled data
  - [ ] Truncate long outputs to prevent exceeding Telegram's 4096 character message limit

- [ ] Review file path handling
  - [ ] Validate file paths don't contain directory traversal (`../`)
  - [ ] Validate file paths are within allowed directories
  - [ ] Check for path injection vulnerabilities

### Type Validation

- [ ] Review type checking for all endpoints
  - [ ] Validate numeric fields are numbers (not strings) - `iterations`, `max_iterations`, `exit_code`, `duration`
  - [ ] Validate boolean fields are booleans (handle string conversions)
    - Rails `normalize_result()` handles: `true`, `'true'`, `1`, `'1'` -> `true`; `false`, `'false'`, `0`, `'0'`, `nil` -> `false`
  - [ ] Validate string fields are strings - `request_id`, `repository`, `branch_name`, `output`, `error`, `timestamp`
  - [ ] Validate array/object structures match expected types (Telegram update structure)
  - [ ] Use TypeScript types for compile-time validation
  - [ ] Add runtime type validation where needed (using validation library like Zod or Joi)
  - [ ] Handle default values for optional fields (e.g., `iterations` defaults to 0, `max_iterations` defaults to 25)

### Injection Vulnerabilities

- [ ] Check for SQL injection risks
  - [ ] Review any database queries (if applicable)
  - [ ] Verify parameterized queries are used
  - [ ] Check Redis key construction for injection risks

- [ ] Check for command injection risks
  - [ ] Review any shell command execution
  - [ ] Validate inputs before passing to shell commands
  - [ ] Use safe command execution methods

- [ ] Check for NoSQL injection risks
  - [ ] Review Redis operations for injection risks
  - [ ] Validate Redis key names

- [ ] Check for template injection risks
  - [ ] Review any template rendering (if applicable)
  - [ ] Validate template variables

### File Upload Validation (if applicable)

- [ ] Review file download/upload handling
  - [ ] Validate file types (if file uploads are added)
  - [ ] Validate file sizes
  - [ ] Validate file names
  - [ ] Check for malicious file content
  - [ ] Note: Current implementation downloads files from Telegram, doesn't accept uploads

### Request Size Limits

- [ ] Review Express body parser limits
  - [ ] Verify `express.json()` has appropriate `limit` option (Rails doesn't set explicit limits)
  - [ ] Verify `express.urlencoded()` has appropriate `limit` option (if used)
  - [ ] Set reasonable limits to prevent DoS attacks (e.g., 10MB for JSON, 1MB for URL-encoded)
  - [ ] Consider Telegram update size limits (Telegram API has its own limits)
  - [ ] Consider cursor-runner callback size limits (output/error fields can be large)
  - [ ] Document size limits in configuration
  - [ ] Handle 413 Payload Too Large errors gracefully

### Validation Gaps

- [ ] Identify endpoints missing validation
  - [ ] TelegramController `webhook` - no explicit permit, relies on JSON parsing
  - [ ] TelegramController `set_webhook` - no explicit permit for `url` and `secret_token`
  - [ ] AgentToolsController `create` - no explicit permit, only checks `tool` presence
- [ ] Identify fields missing type checking
  - [ ] `url` parameter in `set_webhook` - should validate URL format
  - [ ] `secret_token` parameter - should validate format/character restrictions
  - [ ] `args` parameter in agent tools - should validate structure if it's an object
  - [ ] `conversation_id` parameter - should validate format if it has a specific structure
- [ ] Identify missing sanitization steps
  - [ ] Telegram update data before processing (currently passed directly to job)
  - [ ] File paths when downloading from Telegram (check for directory traversal)
- [ ] Check for validation inconsistencies across endpoints
  - [ ] Some endpoints use `params.permit()`, others don't
  - [ ] Some endpoints validate required fields, others don't
  - [ ] Authentication patterns vary (header names, param names)
- [ ] Review error handling for validation failures
  - [ ] Ensure consistent error response format (400 Bad Request for validation errors)
  - [ ] Ensure error messages don't leak sensitive information

### Validation Strategy Documentation

- [ ] Document validation approach (validation library choice, if any)
- [ ] Document validation patterns used across endpoints
- [ ] Document field normalization strategies (camelCase/snake_case handling)
- [ ] Document error response format for validation failures
- [ ] Document request size limits
- [ ] Create or update validation guidelines
- [ ] Document any validation middleware patterns

### Implementation Recommendations

- [ ] Consider using validation library (Zod, Joi, or express-validator)
- [ ] Create reusable validation schemas/functions in `src/validators/` directory
- [ ] Implement validation middleware for common patterns
- [ ] Add TypeScript types for all request/response structures
- [ ] Ensure validation errors return appropriate HTTP status codes (400 Bad Request)

---

## Conclusion

The telegram-receiver codebase is in early development and input validation mechanisms are not yet implemented. This review provides a comprehensive analysis of the Rails reference implementation, identifies validation gaps and security concerns, and provides detailed recommendations for secure input validation in Node.js/TypeScript.

**Key Findings**:
- Rails implementation has validation gaps (no structure validation, no size limits, no type validation)
- Default Express body parser limits (100kb) are too small for cursor-runner callbacks
- No input sanitization for HTML entities, file paths, or URLs
- No runtime type validation (only compile-time TypeScript)
- Missing whitelisting (`params.permit()` equivalent) for most endpoints

**Critical Recommendations**:
1. Install and use Zod for schema validation
2. Configure request size limits (endpoint-specific)
3. Implement input sanitization (ANSI escape sequences, HTML entities, file paths)
4. Implement runtime type validation for all endpoints
5. Implement whitelisting (`params.permit()` equivalent) for all endpoints
6. Create validation middleware for common patterns
7. Standardize error response format for validation failures

This review should be used as a reference when implementing validation middleware, controllers, and sanitization utilities in the telegram-receiver codebase.
