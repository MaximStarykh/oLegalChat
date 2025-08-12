# Checks

## npm install
- `npm install`

## Type Check
- `npm run type-check`

## Lint
- `npm run lint` *(fails: unused vars, unexpected any, etc.)*
- `npx eslint app/api/chat/route.ts app/api/chat/utils.ts app/api/search/route.ts app/api/user-preferences/route.ts`

## Tests
- `npm run test` *(fails: ESM file cannot be loaded)*
- `npm run test:e2e` *(missing script)*

## Build
- `npm run build`
