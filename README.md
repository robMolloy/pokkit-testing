# Pokkit Testing

A testing framework for PocketBase database functionality. This project provides a structured environment for writing and executing tests against a PocketBase instance, including authentication flows and collection-level permissions.

## Features

- Isolated test database environment separate from production
- Automated test setup and database reset between test runs
- Authentication testing support
- Database collection rule validation

## Getting Started

To run the repo successfully, open 5 separate terminals and run each of these commands concurrently:

1. **Terminal 1 - Run tests:**

   ```bash
   npm run dev1
   ```

2. **Terminal 2 - Type-check with watch mode:**

   ```bash
   npm run dev2
   ```

3. **Terminal 3 - Start app database:**

   ```bash
   npm run dev3
   ```

4. **Terminal 4 - Start test database:**

   ```bash
   npm run dev4
   ```

5. **Terminal 5 - Watch for migration/hook changes and sync test database:**
   ```bash
   npm run dev5
   ```

These commands enable you to develop and test PocketBase functionality seamlessly. The test database automatically clones from the app database seed whenever migrations or hooks change.
