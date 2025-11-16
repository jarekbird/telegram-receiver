# PHASE1-036: Create Dockerfile

**Section**: 9. Docker Configuration
**Subsection**: 9.1
**Task ID**: PHASE1-036

## Description

Create Dockerfile

## Checklist

- [ ] Create `Dockerfile` in project root
- [ ] Use Node.js base image (e.g., `node:18-alpine`)
- [ ] Set WORKDIR to `/app`
- [ ] Copy `package.json` and `package-lock.json`
- [ ] Run `npm ci --only=production`
- [ ] Copy source files
- [ ] Run `npm run build`
- [ ] Expose port (use ARG for flexibility)
- [ ] Set CMD to start production server

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 9. Docker Configuration
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE1-035
- Next: PHASE1-037
