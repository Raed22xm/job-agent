# Project Post-Mortem: Job Agent Dashboard Refactor (2025)

## Overview
Led the complete refactor of the legacy React application to Next.js 14 App Router.

## Key Metrics & Achievements
- Reduced First Contentful Paint (FCP) from 3.2s to 0.8s.
- Migrated 45 legacy REST endpoints to tRPC for end-to-end type safety.
- Implemented a custom caching strategy using Redis that reduced database load by 40%.
- Led a team of 3 junior developers, conducting weekly pair programming and PR reviews.

## Challenges Overcome
We faced massive memory leaks when dealing with the real-time WebSocket dashboard. I utilized Chrome DevTools to trace the leak to unmounted EventListeners in a custom hook. I refactored the hook to properly clean up subscriptions, stabilizing the application memory footprint.
