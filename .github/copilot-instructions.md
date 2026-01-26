# Pokkit Testing - AI Instructions

## Architecture

**Dual-Database System**: Two PocketBase instances for isolated testing:

- **app-db** (port 8090): Source of truth - schema, migrations, hooks, seed data
- **test-db** (port 8091): Ephemeral clone, reset before each test run

## Development Workflow

Run 5 terminals concurrently:

1. `npm run dev1` - Vitest (watch mode, `fileParallelism: false` - PocketBase limitation)
2. `npm run dev2` - TypeScript type-checking
3. `npm run dev3` - app-db
4. `npm run dev4` - test-db (uses app-db migrations/hooks)
5. `npm run dev5` - Auto-sync test-db on migration/hook changes

## Testing Patterns

**Test Naming**: `<outcome> <operation>: <scenario>`

- Examples: `allow create: user with valid credentials`, `deny read: unauthenticated user`
- Multiple cases: `deny read: when not authenticated; allow read: when authenticated`

**Key Helpers** ([pocketbaseTestHelpers.ts](src/tests/helpers/pocketbaseTestHelpers.ts)):

- `clearDatabase()` - Authenticates as admin, truncates collections, clears auth
- `createUserEmailPasswordData()` - Random email/password generator

**Clients** ([pocketbaseConfig.ts](src/config/pocketbaseConfig.ts)):

- `testPb` - Primary (port 8091)
- `appPb` - Rarely used (port 8090)

**Collection Names** ([pocketbaseMetadata.ts](src/tests/helpers/pocketbaseMetadata.ts)):

```typescript
export const usersCollectionName = "users";
export const globalUserPermissionsCollectionName = "globalUserPermissions";
```

## Critical Rules

- **No parallel tests** - Shared database state
- **Always clear auth**: `testPb.authStore.clear()` after tests
- **Superuser**: `admin@admin.com` / `admin@admin.com`
- **Hook example**: First user → auto-create admin `globalUserPermissions` ([main.pb.js](pocketbase/app-db/pb_hooks/main.pb.js))
