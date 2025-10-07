# E2E Testing with Playwright

## Overview

This directory contains End-to-End (E2E) tests for the Chat System application using Playwright.

## Test Files

1. **login.spec.ts** - Tests authentication flows
   - Login with valid credentials
   - Login with invalid credentials
   - Logout functionality

2. **groups-channels.spec.ts** - Tests group and channel management
   - Creating new groups
   - Creating new channels
   - Viewing existing groups

3. **chat.spec.ts** - Tests real-time messaging
   - Sending chat messages
   - Viewing chat history
   - Joining channels

4. **images.spec.ts** - Tests image upload functionality
   - Uploading avatar images
   - Uploading chat images
   - Displaying uploaded images

## Running E2E Tests

### Prerequisites

Make sure both the server and client are running:

```bash
# Terminal 1: Start the server
cd server
npm start

# Terminal 2: Start the client (or let Playwright start it automatically)
npm run client
```

### Run Tests

```bash
# Run all E2E tests (headless mode)
npm run test:e2e

# Run tests with UI (interactive mode)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed
```

### View Test Results

After running tests, open the HTML report:

```bash
npx playwright show-report
```

## Test Coverage

These E2E tests cover the main user journeys:
- ✅ User authentication
- ✅ Group and channel creation
- ✅ Real-time messaging
- ✅ Image uploads

## Configuration

Test configuration is in `playwright.config.ts` at the project root.
