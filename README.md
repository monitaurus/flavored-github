# Flavored GitHub

> [!NOTE]
> This tool is purely vibe coded because why not.

Chrome extension optimizing GitHub workflows for notifications and code review.

## Features

### Notifications
"Select disposables" bulk-selects merged, closed, and draft PRs, along with failed CIs, while retaining Open PRs requiring active participation.

<img src="assets/select_disposables.png" alt="Select Disposables Button" width="400" />

### Files Changed
Single-click toggles expand/collapse all file diffs and mark all files as viewed.

<img src="assets/collapse_viewed.png" alt="Collapse and Mark All as Viewed Buttons" width="400" />

## Directory Structure
- `manifest.json`: Directs the browser to load `content.js` across all `github.com` subpages.
- `content.js`: Dynamically injects buttons and manages page-specific events on `/notifications` and `/*/files`.
- `test.js`: Unit tests the selection algorithm natively without third-party frameworks.

## Installation
1. Navigate to `chrome://extensions/` in Chrome.
2. Enable **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select this project directory.

## Testing
Run the logic assertions:
```bash
node test.js
```
