// Unified Content Script for Flavored GitHub with Debug Logging
console.log("[Flavored GitHub] content.js loaded!");

// --- NOTIFICATIONS PAGE FEATURE ---
function injectSelectDisposables() {
  const checkbox = document.querySelector('.js-notifications-mark-all-prompt');
  if (!checkbox) return;

  const header = checkbox.closest('.Box-header');
  if (!header) return;

  const label = checkbox.closest('label');
  if (!label) return;

  const details = header.querySelector('details');
  let btn = header.querySelector('#select-disposables-btn');
  let dot = header.querySelector('#select-disposables-dot');

  if (btn) {
    // If the button exists, check if we need to reposition it after details (Refined GitHub race condition)
    if (details) {
      let isAfter = false;
      let next = details.nextSibling;
      while (next) {
        if (next === btn) {
          isAfter = true;
          break;
        }
        next = next.nextSibling;
      }
      if (!isAfter) {
        details.parentNode.insertBefore(dot, details.nextSibling);
        details.parentNode.insertBefore(btn, dot.nextSibling);
      }
    }
    return;
  }

  dot = document.createElement('span');
  dot.className = 'mx-2 tmp-mx-2 h6';
  dot.id = 'select-disposables-dot';
  dot.textContent = '·';

  btn = document.createElement('button');
  btn.id = 'select-disposables-btn';
  btn.type = 'button';
  btn.className = 'btn-link h6 text-bold no-underline mr-3';
  btn.style.cursor = 'pointer';
  btn.style.border = 'none';
  btn.style.background = 'none';
  btn.style.padding = '0';
  btn.style.fontFamily = 'inherit';
  btn.style.fontWeight = '600';
  btn.style.color = 'var(--fgColor-muted, var(--color-fg-muted))';
  btn.innerHTML = 'Select disposables <span class="dropdown-caret ml-1"></span>';

  btn.addEventListener('click', handleSelectDisposables);

  if (details) {
    details.parentNode.insertBefore(dot, details.nextSibling);
    details.parentNode.insertBefore(btn, dot.nextSibling);
  } else {
    label.parentNode.insertBefore(dot, label.nextSibling);
    label.parentNode.insertBefore(btn, dot.nextSibling);
  }
}

function handleSelectDisposables() {
  const rows = document.querySelectorAll('.js-notifications-list-item');
  rows.forEach(row => {
    const isPR = row.querySelector('.octicon-git-pull-request') !== null;
    const isOpen = row.querySelector('.color-fg-open') !== null;
    const isOpenPR = isPR && isOpen;

    const reasonSpan = row.querySelector('.flex-self-center');
    const reason = reasonSpan ? reasonSpan.textContent.trim().toLowerCase() : '';

    const checkbox = row.querySelector('.js-notification-bulk-action-check-item');
    if (!checkbox) return;

    let shouldSelect = true;

    if (isOpenPR) {
      if (reason === 'subscribed' || reason === 'ci activity') {
        shouldSelect = true;
      } else {
        shouldSelect = false;
      }
    } else {
      shouldSelect = true;
    }

    if (checkbox.checked !== shouldSelect) {
      checkbox.click();
    }
  });
}

// --- FILES CHANGED PAGE FEATURE ---
function getFilesState() {
  const headers = document.querySelectorAll('div[class*="diff-file-header"]');
  const files = [];
  headers.forEach(header => {
    const isCollapsed = header.className.includes('collapsed');
    let button = header.querySelector('button');
    const buttons = header.querySelectorAll('button');
    for (const b of buttons) {
      if (b.querySelector('svg[class*="chevron"]')) {
        button = b;
        break;
      }
    }
    files.push({ header, isCollapsed, button });
  });
  return files;
}

// Retrieve viewed checkboxes
function getViewedButtonsState() {
  const buttons = document.querySelectorAll('button[class*="MarkAsViewedButton"]');
  const list = [];
  buttons.forEach(btn => {
    const isViewed = btn.getAttribute('aria-pressed') === 'true';
    list.push({ btn, isViewed });
  });
  return list;
}

const CHEVRON_RIGHT_SVG = `<svg class="v-align-text-bottom mr-1" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="display: inline-block; vertical-align: text-bottom;"><path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"></path></svg>`;
const CHEVRON_DOWN_SVG = `<svg class="v-align-text-bottom mr-1" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="display: inline-block; vertical-align: text-bottom;"><path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z"></path></svg>`;

const UNCHECKED_SVG = `<svg class="v-align-text-bottom mr-1" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="display: inline-block; vertical-align: text-bottom; color: var(--fgColor-muted, var(--color-fg-muted));"><rect x="2" y="2" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"></rect></svg>`;
const CHECKED_SVG = `<svg class="v-align-text-bottom mr-1" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="display: inline-block; vertical-align: text-bottom; color: var(--fgColor-accent, var(--color-accent-emphasis));"><rect x="2" y="2" width="12" height="12" rx="2" fill="currentColor"></rect><path d="M5.72 7.28a.75.75 0 0 0-1.06 1.06l1.5 1.5a.75.75 0 0 0 1.06 0l3-3a.75.75 0 1 0-1.06-1.06L7 7.94l-.97-.97A.75.75 0 0 0 5.72 7.28Z" fill="white"></path></svg>`;

function updateButtonsState() {
  const collapseBtn = document.getElementById('collapse-all-btn');
  const viewedBtn = document.getElementById('mark-all-viewed-btn');

  if (collapseBtn) {
    const files = getFilesState();
    if (files.length === 0) {
      collapseBtn.style.display = 'none';
    } else {
      collapseBtn.style.display = '';
      const hasCollapsed = files.some(f => f.isCollapsed);
      if (hasCollapsed) {
        collapseBtn.innerHTML = `${CHEVRON_RIGHT_SVG} Expand all`;
      } else {
        collapseBtn.innerHTML = `${CHEVRON_DOWN_SVG} Collapse all`;
      }
    }
  }

  if (viewedBtn) {
    const items = getViewedButtonsState();
    if (items.length === 0) {
      viewedBtn.style.display = 'none';
    } else {
      viewedBtn.style.display = '';
      const hasUnviewed = items.some(item => !item.isViewed);
      if (hasUnviewed) {
        viewedBtn.innerHTML = `${UNCHECKED_SVG} Mark all as viewed`;
        // Reset styles to default button state
        viewedBtn.style.color = '';
        viewedBtn.style.backgroundColor = '';
        viewedBtn.style.borderColor = '';
      } else {
        viewedBtn.innerHTML = `${CHECKED_SVG} Unmark all as viewed`;
        // Apply Viewed button style matching native Viewed
        viewedBtn.style.color = 'var(--fgColor-accent, var(--color-accent-fg))';
        viewedBtn.style.backgroundColor = 'var(--control-bgColor-rest, var(--color-btn-bg))';
        viewedBtn.style.borderColor = 'var(--borderColor-default, var(--color-btn-border))';
      }
    }
  }
}

function handleCollapseToggle() {
  const files = getFilesState();
  const hasCollapsed = files.some(f => f.isCollapsed);

  files.forEach(f => {
    if (hasCollapsed && f.isCollapsed) {
      if (f.button) f.button.click();
    } else if (!hasCollapsed && !f.isCollapsed) {
      if (f.button) f.button.click();
    }
  });

  // Force scroll back to top of page
  window.scrollTo(0, 0);

  setTimeout(() => {
    window.scrollTo(0, 0);
    updateButtonsState();
  }, 100);
}

function handleMarkAllViewed() {
  const items = getViewedButtonsState();
  const hasUnviewed = items.some(item => !item.isViewed);

  items.forEach(item => {
    // If some are unviewed -> Mark all as viewed (click all unviewed)
    // If all are viewed -> Unmark all as viewed (click all viewed)
    if (hasUnviewed && !item.isViewed) {
      item.btn.click();
    } else if (!hasUnviewed && item.isViewed) {
      item.btn.click();
    }
  });

  // Force scroll back to top of page
  window.scrollTo(0, 0);

  setTimeout(() => {
    window.scrollTo(0, 0);
    updateButtonsState();
  }, 100);
}

function injectQuickActions() {
  console.log("[Flavored GitHub] injectQuickActions() started");

  if (document.getElementById('collapse-all-btn')) {
    console.log("[Flavored GitHub] Quick action buttons already exist.");
    return;
  }

  const progressContainer = document.querySelector('div[class*="hide-viewed-progress-on-small"]');
  if (!progressContainer) {
    console.log("[Flavored GitHub] Viewed progress container not found. Selector used: div[class*='hide-viewed-progress-on-small']");
    return;
  }
  console.log("[Flavored GitHub] Progress container found:", progressContainer);

  const parent = progressContainer.parentNode;
  if (!parent) {
    console.log("[Flavored GitHub] Parent node of progress container not found.");
    return;
  }
  console.log("[Flavored GitHub] Parent container found:", parent);

  const collapseBtn = document.createElement('button');
  collapseBtn.id = 'collapse-all-btn';
  collapseBtn.type = 'button';
  collapseBtn.className = 'btn btn-sm mr-2 d-inline-flex flex-items-center';
  collapseBtn.style.cursor = 'pointer';
  collapseBtn.innerHTML = `${CHEVRON_RIGHT_SVG} Expand all`;
  collapseBtn.addEventListener('click', handleCollapseToggle);

  const viewedBtn = document.createElement('button');
  viewedBtn.id = 'mark-all-viewed-btn';
  viewedBtn.type = 'button';
  viewedBtn.className = 'btn btn-sm mr-2 d-inline-flex flex-items-center';
  viewedBtn.style.cursor = 'pointer';
  viewedBtn.innerHTML = `${UNCHECKED_SVG} Mark all as viewed`;
  viewedBtn.addEventListener('click', handleMarkAllViewed);

  parent.insertBefore(collapseBtn, progressContainer);
  parent.insertBefore(viewedBtn, progressContainer);
  console.log("[Flavored GitHub] Quick action buttons injected successfully.");

  updateButtonsState();
}

// --- GLOBAL RUN & MONITORING ---
function run() {
  const url = window.location.href;

  if (url.includes('/notifications')) {
    injectSelectDisposables();
  } else if (url.includes('/pull/') && (url.includes('/files') || url.includes('/changes'))) {
    injectQuickActions();
    updateButtonsState();
  }
}

// Safe observer registration (ensures document.body exists)
function startObserver() {
  if (!document.body) {
    document.addEventListener('DOMContentLoaded', () => {
      startObserver();
    });
    return;
  }

  run();

  const observer = new MutationObserver(() => {
    observer.disconnect();
    run();
    observer.observe(document.body, { childList: true, subtree: true });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

startObserver();

// Sync buttons state on individual file interactions
document.addEventListener('click', (e) => {
  const target = e.target.closest('button');
  if (target) {
    const isViewedBtn = target.className.includes('MarkAsViewedButton');
    const isCollapseBtn = target.querySelector('svg[class*="chevron"]') || target.className.includes('DiffFileHeader');
    if (isViewedBtn || isCollapseBtn) {
      setTimeout(updateButtonsState, 150);
    }
  }
});
