# PHASE1-008: Create test tsconfig.json

**Section**: 3. TypeScript Configuration
**Subsection**: 3.2
**Task ID**: PHASE1-008

## Description

Create test tsconfig.json

## Checklist

- [ ] Create `tsconfig.test.json` file
- [ ] Extend base `tsconfig.json`
- [ ] Override `compilerOptions.outDir` to "./dist-test"
- [ ] Override `compilerOptions.rootDir` to "./tests"
- [ ] Add `compilerOptions.types` array with ["jest", "node"]
- [ ] Set `include` array to ["tests/**/*", "src/**/*"]

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 3. TypeScript Configuration
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE1-007
- Next: PHASE1-009
