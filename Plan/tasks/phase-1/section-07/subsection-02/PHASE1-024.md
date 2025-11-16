# PHASE1-024: Create environment configuration module

**Section**: 7. Environment Variables Management
**Subsection**: 7.2
**Task ID**: PHASE1-024

## Description

Create environment configuration module

## Checklist

- [ ] Create `src/config/environment.ts` file
- [ ] Import `dotenv` module
- [ ] Call `dotenv.config()` with appropriate path based on NODE_ENV
- [ ] Create `config` object
- [ ] Add `env` property from `process.env.NODE_ENV` or default to "development"
- [ ] Add `port` property from `process.env.PORT` or default to 3000
- [ ] Export `config` object

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 7. Environment Variables Management
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE1-023
- Next: PHASE1-025
