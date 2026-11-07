# devguard Done Gate (`.devguard/checks`) & Verification Receipt Reference

## 1. Setting Up `.devguard/checks` in Any Repository
Create a committed `.devguard/checks` file at the root of your repository listing the real verification commands for commit and push gates:

```txt
commit typecheck: npx tsc --noEmit
commit test:      npm test
push   build:     npm run build
```

## 2. Standard One-Line Verification Receipt Format
Every completed task must end with a compact, verifiable receipt:

```txt
- Test Suite: `npm test` → `exit=0` (6/6 passed; log: `.verify/test-pass.log`) (`(read .verify/test-pass.log:1-23)`)
- Mutation Check: `npm test` → `exit=1` (1 failed as expected when guard removed; log: `.verify/mutation-fail.log`) (`(read .verify/mutation-fail.log:1-44)`)
```
