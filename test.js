const assert = require('assert');

// Mock DOM elements and methods
class MockElement {
  constructor(tagName, classes = [], attributes = {}) {
    this.tagName = tagName;
    this.classList = {
      classes: new Set(classes),
      add(c) { this.classes.add(c); },
      remove(c) { this.classes.delete(c); },
      contains(c) { return this.classes.has(c); },
      toString() { return Array.from(this.classes).join(' '); }
    };
    this.attributes = attributes;
    this.children = [];
    this.textContent = '';
    this.checked = false;
    this.clicked = false;
  }

  get className() {
    return Array.from(this.classList.classes).join(' ');
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  getAttribute(name) {
    return this.attributes[name] || null;
  }

  appendChild(child) {
    this.children.push(child);
  }

  querySelector(selector) {
    // Basic mock selector matching
    if (selector.startsWith('.')) {
      const cls = selector.slice(1);
      if (this.classList.contains(cls)) return this;
      for (const child of this.children) {
        if (child.className.includes(cls)) return child;
        const found = child.querySelector(selector);
        if (found) return found;
      }
    }
    if (selector.startsWith('button')) {
      if (this.tagName === 'button') return this;
      for (const child of this.children) {
        if (child.tagName === 'button') return child;
        const found = child.querySelector(selector);
        if (found) return found;
      }
    }
    return null;
  }

  querySelectorAll(selector) {
    const results = [];
    if (selector === 'button') {
      if (this.tagName === 'button') results.push(this);
      this.children.forEach(c => {
        results.push(...c.querySelectorAll(selector));
      });
    }
    return results;
  }

  click() {
    this.clicked = true;
    if (this.tagName === 'input' && this.attributes.type === 'checkbox') {
      this.checked = !this.checked;
    }
  }
}

// 1. Test Notifications Logic
function testNotificationsLogic() {
  console.log('Running Notifications Logic Tests...');

  // Mock handleSelectDisposables behavior
  function simulateSelectDisposables(rows) {
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

  // Case 1: Open PR with "subscribed" reason -> should select
  const row1 = new MockElement('li', ['js-notifications-list-item']);
  const check1 = new MockElement('input', ['js-notification-bulk-action-check-item'], { type: 'checkbox' });
  const icon1 = new MockElement('svg', ['octicon-git-pull-request', 'color-fg-open']);
  const reason1 = new MockElement('span', ['flex-self-center']);
  reason1.textContent = 'subscribed';
  row1.appendChild(check1);
  row1.appendChild(icon1);
  row1.appendChild(reason1);

  simulateSelectDisposables([row1]);
  assert.strictEqual(check1.checked, true, 'Subscribed Open PR should be selected');

  // Case 2: Open PR with "review requested" reason -> should NOT select
  const row2 = new MockElement('li', ['js-notifications-list-item']);
  const check2 = new MockElement('input', ['js-notification-bulk-action-check-item'], { type: 'checkbox' });
  const icon2 = new MockElement('svg', ['octicon-git-pull-request', 'color-fg-open']);
  const reason2 = new MockElement('span', ['flex-self-center']);
  reason2.textContent = 'review requested';
  row2.appendChild(check2);
  row2.appendChild(icon2);
  row2.appendChild(reason2);

  simulateSelectDisposables([row2]);
  assert.strictEqual(check2.checked, false, 'Review requested Open PR should NOT be selected');

  // Case 3: Merged PR with any reason -> should select
  const row3 = new MockElement('li', ['js-notifications-list-item']);
  const check3 = new MockElement('input', ['js-notification-bulk-action-check-item'], { type: 'checkbox' });
  const icon3 = new MockElement('svg', ['octicon-git-pull-request', 'color-fg-merged']);
  const reason3 = new MockElement('span', ['flex-self-center']);
  reason3.textContent = 'subscribed';
  row3.appendChild(check3);
  row3.appendChild(icon3);
  row3.appendChild(reason3);

  simulateSelectDisposables([row3]);
  assert.strictEqual(check3.checked, true, 'Merged PR should be selected');

  // Case 4: Failed CI notification -> should select
  const row4 = new MockElement('li', ['js-notifications-list-item']);
  const check4 = new MockElement('input', ['js-notification-bulk-action-check-item'], { type: 'checkbox' });
  const icon4 = new MockElement('svg', ['octicon-x']);
  const reason4 = new MockElement('span', ['flex-self-center']);
  reason4.textContent = 'ci activity';
  row4.appendChild(check4);
  row4.appendChild(icon4);
  row4.appendChild(reason4);

  simulateSelectDisposables([row4]);
  assert.strictEqual(check4.checked, true, 'Failed CI should be selected');

  console.log('Notifications Logic Tests Passed!');
}

// Run all tests
try {
  testNotificationsLogic();
  console.log('\nAll Tests Passed Successfully!');
} catch (err) {
  console.error('Test Verification Failed:', err);
  process.exit(1);
}
