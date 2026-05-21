const SELECTORS = {
  modalOpen: '[data-ui-modal-target]',
  modalClose: '[data-ui-modal-close]',
  drawerOpen: '[data-ui-drawer-target]',
  drawerClose: '[data-ui-drawer-close]',
  tabs: '[data-ui-tabs]',
  dropdown: '[data-ui-dropdown]',
  upload: '[data-ui-upload]',
};

function getTarget(selector) {
  if (!selector) return null;
  try { return document.querySelector(selector); } catch (_) { return null; }
}

function openLayer(layer) {
  if (!layer) return;
  layer.classList.add('is-open');
  layer.setAttribute('aria-hidden', 'false');
  const focusable = layer.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  focusable?.focus?.();
}

function closeLayer(layer) {
  if (!layer) return;
  layer.classList.remove('is-open');
  layer.setAttribute('aria-hidden', 'true');
}

function bindOnce(element, key, handler) {
  if (!element || element.dataset[key] === '1') return;
  element.dataset[key] = '1';
  handler(element);
}

export function initUiKit(root = document) {
  root.querySelectorAll(SELECTORS.modalOpen).forEach(button => bindOnce(button, 'uiModalBound', el => {
    el.addEventListener('click', () => openLayer(getTarget(el.dataset.uiModalTarget)));
  }));

  root.querySelectorAll(SELECTORS.modalClose).forEach(button => bindOnce(button, 'uiModalCloseBound', el => {
    el.addEventListener('click', () => closeLayer(el.closest('.ui-modal')));
  }));

  root.querySelectorAll(SELECTORS.drawerOpen).forEach(button => bindOnce(button, 'uiDrawerBound', el => {
    el.addEventListener('click', () => openLayer(getTarget(el.dataset.uiDrawerTarget)));
  }));

  root.querySelectorAll(SELECTORS.drawerClose).forEach(button => bindOnce(button, 'uiDrawerCloseBound', el => {
    el.addEventListener('click', () => closeLayer(el.closest('.ui-drawer')));
  }));

  root.querySelectorAll('.ui-modal, .ui-drawer').forEach(layer => bindOnce(layer, 'uiLayerBound', el => {
    el.addEventListener('click', event => {
      if (event.target === el) closeLayer(el);
    });
  }));

  root.querySelectorAll(SELECTORS.tabs).forEach(tabs => bindOnce(tabs, 'uiTabsBound', el => {
    const buttons = [...el.querySelectorAll('[role="tab"]')];
    const panels = [...el.querySelectorAll('[role="tabpanel"]')];
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const targetId = button.getAttribute('aria-controls');
        buttons.forEach(item => item.setAttribute('aria-selected', item === button ? 'true' : 'false'));
        panels.forEach(panel => { panel.hidden = panel.id !== targetId; });
      });
    });
  }));

  root.querySelectorAll(SELECTORS.dropdown).forEach(dropdown => bindOnce(dropdown, 'uiDropdownBound', el => {
    const trigger = el.querySelector('.ui-dropdown-trigger');
    trigger?.addEventListener('click', event => {
      event.stopPropagation();
      el.classList.toggle('is-open');
    });
  }));

  root.querySelectorAll(SELECTORS.upload).forEach(upload => bindOnce(upload, 'uiUploadBound', el => {
    ['dragenter', 'dragover'].forEach(name => el.addEventListener(name, event => {
      event.preventDefault();
      el.classList.add('is-dragover');
    }));
    ['dragleave', 'drop'].forEach(name => el.addEventListener(name, event => {
      event.preventDefault();
      el.classList.remove('is-dragover');
    }));
  }));
}

export function showUiToast(message, { tone = 'brand', timeout = 3600 } = {}) {
  let host = document.querySelector('.ui-toast');
  if (!host) {
    host = document.createElement('div');
    host.className = 'ui-toast';
    host.setAttribute('aria-live', 'polite');
    document.body.appendChild(host);
  }

  const item = document.createElement('div');
  item.className = `ui-toast-item ui-toast-${tone}`;
  item.textContent = String(message || '');
  host.appendChild(item);
  window.setTimeout(() => item.remove(), timeout);
  return item;
}

document.addEventListener('click', event => {
  document.querySelectorAll('.ui-dropdown.is-open').forEach(dropdown => {
    if (!dropdown.contains(event.target)) dropdown.classList.remove('is-open');
  });
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  document.querySelectorAll('.ui-modal.is-open, .ui-drawer.is-open').forEach(closeLayer);
  document.querySelectorAll('.ui-dropdown.is-open').forEach(dropdown => dropdown.classList.remove('is-open'));
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initUiKit());
} else {
  initUiKit();
}
