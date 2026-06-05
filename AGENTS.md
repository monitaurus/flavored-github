# Agent Contribution Guide

These guidelines assist subsequent AI agents in modifying and testing this codebase.

## Engineering Standards

- **Unified Content Script**: Place all UI injection code inside `content.js`. GitHub implements dynamic Turbo navigation, meaning page-scoped script files will not load during internal navigation.
- **Infinite Loop Protection**: Disconnect the `MutationObserver` before modifying DOM elements, then immediately reconnect it. This avoids recursive mutation triggers.
- **Race Condition Prevention**: Locate injected buttons inside their specific parent headers (`header.querySelector('#id')`) instead of checking the global `document`.
- **Dynamic Repositioning**: Reposition our elements if other extensions (e.g., Refined GitHub) load asynchronously and wipe out or shift the header nodes.

## Selector Reference

- Notification Row: `.js-notifications-list-item`
- Notification Checkbox: `.js-notification-bulk-action-check-item`
- Top Header Container: `.Box-header`
- File Changed Header: `div[class*="diff-file-header"]`
- Viewed Button: `button[class*="MarkAsViewedButton"]`
