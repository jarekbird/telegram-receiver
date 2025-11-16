# PHASE1-021: Create error handling middleware

**Section**: 6. Request/Response Middleware
**Subsection**: 6.5
**Task ID**: PHASE1-021

## Description

Create error handling middleware

## Checklist

- [ ] Create `src/middleware/error-handler.middleware.ts` file
- [ ] Create error handler function with 4 parameters (err, req, res, next)
- [ ] Log error details
- [ ] Return appropriate error response (status 500)
- [ ] Export error handler function
- [ ] Import and apply in `src/app.ts` (after all routes)

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 6. Request/Response Middleware
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE1-020
- Next: PHASE1-022
