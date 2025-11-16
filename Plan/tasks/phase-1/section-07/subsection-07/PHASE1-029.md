# PHASE1-029: Add environment validation

**Section**: 7. Environment Variables Management
**Subsection**: 7.7
**Task ID**: PHASE1-029

## Description

Add environment validation

## Checklist

- [ ] Create `src/config/validate-env.ts` file
- [ ] Create function to validate required environment variables
- [ ] Check for required variables (PORT, NODE_ENV)
- [ ] Throw error if required variables missing
- [ ] Export validation function
- [ ] Call validation function in `src/index.ts` before starting server

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 7. Environment Variables Management
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE1-028
- Next: PHASE1-030
