/*
 * frametopress Visual Builder 3.2
 * Publish always snapshots the visible form, not a possibly stale dirty flag.
 * Published CSS is written by PHP to style.css; JavaScript styles are previews ONLY.
 */
(() => {
  'use strict';
  const cfg = window.FrameToPressVisualBuilder;
  if (!cfg || !document.body || !cfg.key) return;
  // The parent editor owns selections and saves; the same-origin preview
  // iframe must not load a second, competing builder instance.
  if (cfg.isPreview || (window !== window.top && new URLSearchParams(location.search).get('frametopress_vb_preview') === '1')) return;
  const copy = value => JSON.parse(JSON.stringify(value));
  // Critical: PHP's empty array serializes to JS [] rather than {}. Numeric arrays
  // discard named element IDs during JSON.stringify. NEVER hold edits in an array.
  function asEdits(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const result = copy(value);
    for (const record of Object.values(result)) {
      if (!record || typeof record !== 'object') continue;
      if (!record.style || Array.isArray(record.style)) record.style = {};
      if (Array.isArray(record.responsive)) record.responsive = {};
      if (record.responsive) {
        for (const key of ['tablet', 'mobile']) {
          if (Array.isArray(record.responsive[key])) record.responsive[key] = {};
        }
      }
    }
    return result;
  }
  const normalize = v => Array.isArray(v) ? v.map(normalize) : (v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, normalize(v[k])])) : v);
  const same = (a, b) => JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
  let published = asEdits(cfg.saved);
  let revision = cfg.revision || '';
  const pending = new Map(); // path => complete record; null => reset record
  const originalStyles = new Map(); // nodes that have been previewed
  let active = false;
  let selection = null;
  let formBase = null;
  let loadingVersion = 0;
  let mediaFrame = null;
  let publishing = false;
  let device = 'desktop';
  let previewFrame = null;
  let frameReady = false;
  const devices = {
    desktop: { width: 1280, label: 'Desktop', note: '1025px and wider' },
    tablet: { width: 820, label: 'Tablet', note: '768px–1024px' },
    mobile: { width: 390, label: 'Mobile', note: '767px and narrower' }
  };
  const canvasDoc = () => active && frameReady && previewFrame?.contentDocument ? previewFrame.contentDocument : document;


  const excluded = '.abv-editor,.age-gate,.woocommerce,.woocommerce-cart-form,.woocommerce-checkout,.wc-block-components-main,.wc-block-components-sidebar,.wp-block-woocommerce-cart,.wp-block-woocommerce-checkout,.wp-block-button,.product-price,.product-cta-panel,.shop-product,.frametopress-header-cart,.cursor-glow,#wpadminbar,script,style,noscript,svg,input,textarea,select,option,[contenteditable],.woocommerce-notices-wrapper';
  const denied = element => !element || !!element.closest(excluded) || !!element.closest('form');
  const buttonSelector = 'a.button,a.location-pill,a.back-top,a.text-link,a.circle-link,a.round-arrow,a.shop-tab,button:not([type=submit])';
  const textSelector = 'h1,h2,h3,h4,h5,h6,p,li,small,strong,em,span,label,a,summary';
  const bgSelector = '[style*="background-image"],[style*="--statement-image"],.feature-background';
  function typeOf(node) {
    if (!node || denied(node)) return null;
    if (node.matches('img')) return 'image';
    if (node.matches(buttonSelector)) return 'button';
    if (node.matches(bgSelector)) return 'background';
    if (node.matches(textSelector)) return 'text';
    return null;
  }
  function nearest(node) {
    while (node && node !== document.body) {
      if (typeOf(node)) return node;
      if (denied(node)) return null;
      node = node.parentElement;
    }
    return null;
  }
  function sameTagChildren(parent, tag) {
    return Array.from(parent.children).filter(item => item.tagName.toLowerCase() === tag && item.id !== 'wpadminbar' && !item.classList.contains('abv-editor'));
  }
  function pathFor(node) {
    const chunks = [];
    while (node && node !== node.ownerDocument.body && node.nodeType === 1) {
      const parent = node.parentElement;
      if (!parent) return '';
      const tag = node.tagName.toLowerCase();
      const position = sameTagChildren(parent, tag).indexOf(node);
      if (position < 0) return '';
      chunks.unshift(tag + '.' + (position + 1));
      node = parent;
    }
    return chunks.length ? 'avb:' + chunks.join('/') : '';
  }
  function resolvePath(path, scopeDocument = canvasDoc()) {
    if (typeof path !== 'string') return null;
    if (path.startsWith('avb:')) {
      let node = scopeDocument.body;
      for (const part of path.slice(4).split('/')) {
        const match = /^([a-z][a-z0-9-]*)\.([1-9][0-9]*)$/i.exec(part);
        if (!match) return null;
        node = sameTagChildren(node, match[1].toLowerCase())[Number(match[2]) - 1];
        if (!node) return null;
      }
      return node;
    }
    try { return scopeDocument.querySelector(path); } catch (error) { return null; }
  }
  function editableText(node) {
    return Array.from(node.childNodes).filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent).join('').trim();
  }
  function setEditableText(node, text) {
    const nodes = Array.from(node.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
    if (nodes.length) { nodes[0].textContent = text; nodes.slice(1).forEach(n => { n.textContent = ''; }); }
    else if (!node.children.length) node.textContent = text;
  }
  function applyContent(path, record, scopeDocument = canvasDoc()) {
    const node = resolvePath(path, scopeDocument);
    if (!node || denied(node) || !record) return;
    if ((record.type === 'text' || record.type === 'button') && typeof record.text === 'string') setEditableText(node, record.text);
    if (record.type === 'image' && node.tagName === 'IMG') {
      if (record.url) { node.src = record.url; node.removeAttribute('srcset'); node.removeAttribute('sizes'); }
      if (typeof record.alt === 'string') node.alt = record.alt;
    }
    if (record.type === 'background' && record.url) node.style.setProperty('background-image', `url("${record.url.replace(/["\\\n\r]/g, '')}")`, 'important');
  }
  function applyPublishedContent(scopeDocument = document) {
    for (const [path, record] of Object.entries(published)) applyContent(path, record, scopeDocument);
  }
  function previewStyles(node, style) {
    if (!style) return;
    if (!originalStyles.has(node)) originalStyles.set(node, node.getAttribute('style'));
    const names = {
      fontSize: ['font-size', 'px'], fontWeight: ['font-weight', ''], color: ['color', ''],
      backgroundColor: ['background-color', ''], borderColor: ['border-color', ''],
      fontStyle: ['font-style', ''], textAlign: ['text-align', ''], letterSpacing: ['letter-spacing', 'px'],
      width: ['width', 'px'], height: ['height', 'px'], borderRadius: ['border-radius', 'px'],
      objectFit: ['object-fit', '']
    };
    const families = { inherit:'inherit', Syne:'"Syne",sans-serif', 'DM Sans':'"DM Sans",sans-serif', 'Space Grotesk':'"Space Grotesk",sans-serif', Arial:'Arial,sans-serif', Georgia:'Georgia,serif', 'system-ui':'system-ui,sans-serif' };
    for (const [key, value] of Object.entries(style)) {
      if (names[key] && value !== '' && value !== null && value !== undefined) {
        node.style.setProperty(names[key][0], String(value) + names[key][1], 'important');
      } else if (key === 'fontFamily' && families[value]) {
        node.style.setProperty('font-family', families[value], 'important');
      } else if (key === 'paddingX') {
        node.style.setProperty('padding-left', value + 'px', 'important');
        node.style.setProperty('padding-right', value + 'px', 'important');
      } else if (key === 'paddingY') {
        node.style.setProperty('padding-top', value + 'px', 'important');
        node.style.setProperty('padding-bottom', value + 'px', 'important');
      }
    }
  }
  function effectiveStyle(record, currentDevice = device) {
    const desktop = record?.style || {};
    if (currentDevice === 'desktop') return desktop;
    const tablet = record?.responsive?.tablet || {};
    if (currentDevice === 'tablet') return { ...desktop, ...tablet };
    return { ...desktop, ...tablet, ...(record?.responsive?.mobile || {}) };
  }
  function previewRecord(path, record) {
    const node = resolvePath(path);
    if (!node || !record) return;
    if (!originalStyles.has(node)) originalStyles.set(node, node.getAttribute('style'));
    applyContent(path, record);
    previewStyles(node, effectiveStyle(record));
  }
  function applyPendingToFrame() {
    if (!frameReady) return;
    const doc = canvasDoc();
    applyPublishedContent(doc);
    for (const [path, record] of pending) {
      if (record) previewRecord(path, record);
    }
  }
  function restorePreviewStyles() {
    for (const [node, original] of originalStyles) {
      if (!node.isConnected) continue;
      if (original === null) node.removeAttribute('style');
      else node.setAttribute('style', original);
    }
    originalStyles.clear();
  }
  async function fetchPublished() {
    const qs = new URLSearchParams({ action: 'frametopress_vb_load', key: cfg.key, cache: String(Date.now()) });
    const response = await fetch(cfg.ajax + (cfg.ajax.includes('?') ? '&' : '?') + qs, { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
    const data = await response.json();
    if (!response.ok || !data.success || !data.data || typeof data.data.edits !== 'object' || !data.data.edits) throw new Error(data?.data?.message || 'Could not read saved edits.');
    return data.data;
  }
  function loadInitial() {
    applyPublishedContent();
    const token = ++loadingVersion;
    fetchPublished().then(latest => {
      if (token !== loadingVersion || pending.size || active || publishing) return;
      published = asEdits(latest.edits);
      revision = latest.revision || revision;
      applyPublishedContent();
    }).catch(() => {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadInitial, { once: true });
  else loadInitial();
  if (!cfg.isAdmin) return;

  function element(tag, attrs = {}, parent) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'text') node.textContent = value;
      else if (key === 'class') node.className = value;
      else if (value !== undefined && value !== null) node.setAttribute(key, value);
    }
    if (parent) parent.appendChild(node);
    return node;
  }
  const launcher = element('div', { class: 'abv-editor abv-launcher' }, document.body);
  const editButton = element('button', { class: 'abv-start', type: 'button', text: '✳ Edit Page' }, launcher);
  // A real-width iframe is required here. A CSS-transformed container does
  // not change @media viewport queries; a real iframe viewport does.
  const workspace = element('div', { class: 'abv-editor abv-workspace', 'aria-label': 'Responsive visual preview' }, document.body);
  workspace.innerHTML = `<div class="abv-workspace-header">
    <span class="abv-workspace-brand">✳ FRAMETOPRESS <small>RESPONSIVE DESIGN</small></span>
    <div class="abv-device-options" role="toolbar" aria-label="Device preview">
      <button type="button" data-avb-device="desktop" aria-pressed="true" title="Desktop preview — 1280px">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg><span>Desktop</span></button>
      <button type="button" data-avb-device="tablet" aria-pressed="false" title="Tablet preview — 820px">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M11 19h2"/></svg><span>Tablet</span></button>
      <button type="button" data-avb-device="mobile" aria-pressed="false" title="Mobile preview — 390px">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 19h2"/></svg><span>Mobile</span></button>
    </div>
    <span class="abv-viewport-label">1280px · Desktop</span>
  </div><div class="abv-stage"><div class="abv-preview-shell"><iframe class="abv-preview-frame" title="frametopress live page preview" referrerpolicy="same-origin"></iframe></div></div>`;
  const frameShell = workspace.querySelector('.abv-preview-shell');
  const stage = workspace.querySelector('.abv-stage');
  previewFrame = workspace.querySelector('.abv-preview-frame');
  const viewportLabel = workspace.querySelector('.abv-viewport-label');
  const panel = element('aside', { class: 'abv-editor abv-panel', role: 'dialog', 'aria-label': 'frametopress visual editor' }, document.body);
  panel.innerHTML = `<div class="abv-head"><div><strong>✳ FRAMETOPRESS</strong><small>VISUAL EDITOR · V3.2</small></div><button type="button" class="abv-close" aria-label="Close editor">×</button></div>
  <div class="abv-instruction">Select an element in the device preview. Typography, image dimensions and button styles save separately per device. Text content and image replacements are shared.</div>
  <div class="abv-device-context">Editing <strong>Desktop</strong> styles <small>1025px and wider</small></div>
  <div class="abv-selected">No element selected</div><div class="abv-fields"></div>
  <div class="abv-bottom"><button type="button" class="abv-reset-device" title="Remove styling only for the current screen size">Reset device</button><button type="button" class="abv-reset">Reset element</button><button type="button" class="abv-check">Verify saved</button><button type="button" class="abv-save">Publish changes</button></div>
  <div class="abv-message" role="status" aria-live="polite"></div>`;
  const fields = panel.querySelector('.abv-fields');
  const selectedLabel = panel.querySelector('.abv-selected');
  const message = panel.querySelector('.abv-message');
  const publishButton = panel.querySelector('.abv-save');
  const deviceContext = panel.querySelector('.abv-device-context');
  const labelToStyle = {
    fontSize: true, fontWeight: true, fontFamily: true, color: true, textAlign: true,
    fontStyle: true, letterSpacing: true, backgroundColor: true, borderColor: true,
    borderRadius: true, paddingX: true, paddingY: true, objectFit: true, width: true, height: true
  };
  const numericKeys = new Set(['fontSize', 'fontWeight', 'letterSpacing', 'borderRadius', 'paddingX', 'paddingY', 'width', 'height']);
  function status(text, isError = false) { message.textContent = text; message.classList.toggle('is-error', isError); }
  function field(label, key, inputType, initial, choices, extra = {}) {
    const wrap = element('label', { class: 'abv-field' }, fields);
    element('span', { text: label }, wrap);
    let control;
    if (inputType === 'select') {
      control = element('select', { 'data-avb-field': key }, wrap);
      for (const [value, title] of choices) element('option', { value, text: title }, control);
    } else if (inputType === 'textarea') {
      control = element('textarea', { 'data-avb-field': key, rows: '4' }, wrap);
    } else {
      control = element('input', { type: inputType, 'data-avb-field': key, ...extra }, wrap);
    }
    control.value = initial == null ? '' : String(initial);
    control.addEventListener('input', syncSelected);
    control.addEventListener('change', syncSelected);
    return control;
  }
  function toHex(color) {
    if (/^#[0-9a-f]{6}$/i.test(color)) return color;
    const numbers = String(color).match(/\d+/g);
    return numbers && numbers.length >= 3 ? '#' + numbers.slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('') : '#222222';
  }
  function currentDraft(path) {
    if (pending.has(path)) return pending.get(path);
    return Object.prototype.hasOwnProperty.call(published, path) ? published[path] : null;
  }
  function buildEditor(node, path, kind) {
    const previously = currentDraft(path);
    const record = previously || { type: kind, style: {} };
    const deviceStyle = device === 'desktop' ? (record.style || {}) : (record.responsive?.[device] || {});
    const computed = node.ownerDocument.defaultView.getComputedStyle(node);
    fields.replaceChildren();
    const base = {};
    const put = (label, key, inputType, initial, choices, extra) => {
      const control = field(label, key, inputType, initial, choices, extra);
      base[key] = control.value;
      return control;
    };
    if (kind === 'text' || kind === 'button') {
      put('Text content', 'text', 'textarea', record.text ?? editableText(node));
      put('Font size (px)', 'fontSize', 'number', deviceStyle.fontSize ?? parseFloat(computed.fontSize), null, { min: 1, max: 400, step: 1 });
      put('Weight', 'fontWeight', 'select', deviceStyle.fontWeight ?? computed.fontWeight, [['100','Thin'],['200','Extra light'],['300','Light'],['400','Regular'],['500','Medium'],['600','Semi bold'],['700','Bold'],['800','Extra bold'],['900','Black']]);
      put('Font family', 'fontFamily', 'select', deviceStyle.fontFamily ?? 'inherit', [['inherit','Theme default'],['Syne','Syne'],['DM Sans','DM Sans'],['Space Grotesk','Space Grotesk'],['Arial','Arial'],['Georgia','Georgia'],['system-ui','System']]);
      put('Text color', 'color', 'color', deviceStyle.color ?? toHex(computed.color));
      put('Align', 'textAlign', 'select', deviceStyle.textAlign ?? computed.textAlign, [['left','Left'],['center','Center'],['right','Right']]);
      put('Font style', 'fontStyle', 'select', deviceStyle.fontStyle ?? computed.fontStyle, [['normal','Normal'],['italic','Italic']]);
      put('Letter spacing (px)', 'letterSpacing', 'number', deviceStyle.letterSpacing ?? '', null, { min: -20, max: 50, step: 0.1 });
      if (kind === 'button') {
        put('Button background', 'backgroundColor', 'color', deviceStyle.backgroundColor ?? toHex(computed.backgroundColor));
        put('Border color', 'borderColor', 'color', deviceStyle.borderColor ?? toHex(computed.borderColor));
        put('Corner radius (px)', 'borderRadius', 'number', deviceStyle.borderRadius ?? (parseFloat(computed.borderRadius) || 0), null, { min: 0, max: 500 });
        put('Horizontal padding (px)', 'paddingX', 'number', deviceStyle.paddingX ?? '', null, { min: 0, max: 150 });
        put('Vertical padding (px)', 'paddingY', 'number', deviceStyle.paddingY ?? '', null, { min: 0, max: 150 });
      }
    } else if (kind === 'image' || kind === 'background') {
      const image = put('Image URL', 'url', 'text', record.url ?? (kind === 'image' ? node.currentSrc || node.src : ''));
      const media = element('button', { type: 'button', class: 'abv-media', text: 'Choose from Media Library' }, fields);
      media.addEventListener('click', () => {
        if (!window.wp || !wp.media) { status('WordPress Media Library unavailable.', true); return; }
        mediaFrame = wp.media({ title: 'Select image', button: { text: 'Use this image' }, multiple: false, library: { type: 'image' } });
        mediaFrame.on('select', () => {
          const chosen = mediaFrame.state().get('selection').first().toJSON();
          image.value = chosen.url;
          const alt = fields.querySelector('[data-avb-field="alt"]');
          if (alt && chosen.alt) alt.value = chosen.alt;
          syncSelected();
        });
        mediaFrame.open();
      });
      if (kind === 'image') {
        put('Alt text', 'alt', 'text', record.alt ?? node.alt);
        put('Image fit', 'objectFit', 'select', deviceStyle.objectFit ?? computed.objectFit, [['cover','Cover'],['contain','Contain'],['fill','Fill'],['none','None'],['scale-down','Scale down']]);
        put('Width (px)', 'width', 'number', deviceStyle.width ?? '', null, { min: 1, max: 2500 });
        put('Height (px)', 'height', 'number', deviceStyle.height ?? '', null, { min: 1, max: 2500 });
        put('Radius (px)', 'borderRadius', 'number', deviceStyle.borderRadius ?? '', null, { min: 0, max: 500 });
      }
    }
    formBase = { values: base, record: copy(record) };
  }
  function readControls() {
    const values = {};
    fields.querySelectorAll('[data-avb-field]').forEach(control => { values[control.dataset.avbField] = control.value; });
    return values;
  }
  function computeSelectedRecord() {
    if (!selection || !formBase) return null;
    const values = readControls();
    const record = copy(formBase.record);
    record.type = selection.kind;
    record.style = record.style || {};
    let changed = 0;
    for (const [key, value] of Object.entries(values)) {
      if (String(value) === String(formBase.values[key] ?? '')) continue;
      changed++;
      if (labelToStyle[key]) {
        let styling = record.style;
        if (device !== 'desktop') {
          if (!record.responsive || typeof record.responsive !== 'object') record.responsive = {};
          if (!record.responsive[device]) record.responsive[device] = {};
          styling = record.responsive[device];
        }
        if (value === '') delete styling[key];
        else if (numericKeys.has(key)) {
          const number = Number(value);
          if (Number.isFinite(number)) styling[key] = number;
        } else styling[key] = value;
      } else if (key === 'text' || key === 'url' || key === 'alt') record[key] = value;
    }
    return { record, changed, values };
  }
  function syncSelected() {
    if (!selection) return;
    const snapshot = computeSelectedRecord();
    if (!snapshot) return;
    // An explicit reset must survive the last-second form snapshot.
    if (pending.has(selection.path) && pending.get(selection.path) === null && snapshot.changed === 0) return;
    // A record remains dirty whenever it differs from the last PUBLISHED record.
    const previous = published[selection.path] || null;
    if (same(snapshot.record, previous) || (snapshot.changed === 0 && !pending.has(selection.path) && !previous)) {
      pending.delete(selection.path);
    } else {
      pending.set(selection.path, snapshot.record);
      previewRecord(selection.path, snapshot.record);
    }
    updateProgress();
  }
  function updateProgress() {
    const n = pending.size;
    status(n ? `${n} element${n === 1 ? '' : 's'} with unpublished changes. Click Publish to save.` : 'No unpublished changes.');
  }
  function choose(node) {
    if (selection) selection.node.classList.remove('abv-target');
    const path = pathFor(node);
    const kind = typeOf(node);
    if (!path || !kind) { status('Could not identify this element. Select another.', true); return; }
    selection = { node, path, kind };
    selection.node.classList.add('abv-target');
    selectedLabel.textContent = kind.toUpperCase() + ' · ' + node.tagName.toLowerCase() + ' · ' + path;
    buildEditor(node, path, kind);
    updateProgress();
  }
  function onPageClick(event) {
    if (!active || !frameReady || event.target.closest('.abv-editor,#wpadminbar')) return;
    const node = nearest(event.target);
    // Never let links or WooCommerce controls navigate away from editing mode.
    if (!node && !event.target.closest('a,button')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (node) choose(node);
  }
  function onPageMouseOver(event) {
    if (!active || !frameReady || event.target.closest('.abv-editor')) return;
    const doc = event.target.ownerDocument;
    doc.querySelectorAll('.abv-hover').forEach(n => n.classList.remove('abv-hover'));
    const hovered = nearest(event.target);
    if (hovered) hovered.classList.add('abv-hover');
  }
  function activateCanvas() {
    const doc = previewFrame.contentDocument;
    if (!doc?.body) { status('Preview page could not load.', true); return; }
    frameReady = true;
    // WordPress's frontend admin bar must not reduce the simulated viewport.
    const hideAdminBar = doc.createElement('style');
    hideAdminBar.textContent = '#wpadminbar{display:none!important} html{margin-top:0!important}';
    doc.head.appendChild(hideAdminBar);
    doc.body.classList.add('abv-active');
    doc.addEventListener('click', onPageClick, true);
    doc.addEventListener('mouseover', onPageMouseOver, true);
    applyPendingToFrame();
    workspace.classList.add('abv-ready');
    status(pending.size ? `${pending.size} unpublished element(s) ready.` : 'Choose an element inside the preview to edit.');
  }
  previewFrame.addEventListener('load', activateCanvas);
  function setDevice(next) {
    if (!devices[next] || publishing) return;
    if (selection) syncSelected();
    const oldPath = selection?.path || '';
    if (selection) selection.node.classList.remove('abv-target');
    restorePreviewStyles();
    selection = null; formBase = null;
    device = next;
    workspace.dataset.device = next;
    frameShell.style.width = devices[next].width + 'px';
    viewportLabel.textContent = devices[next].width + 'px · ' + devices[next].label;
    deviceContext.innerHTML = `Editing <strong>${devices[next].label}</strong> styles <small>${devices[next].note}</small>`;
    workspace.querySelectorAll('[data-avb-device]').forEach(btn => {
      const selected = btn.dataset.avbDevice === next;
      btn.setAttribute('aria-pressed', String(selected));
      btn.classList.toggle('is-active', selected);
    });
    if (!frameReady) return;
    // Resizing the *iframe viewport* triggers real media queries immediately.
    requestAnimationFrame(() => {
      applyPendingToFrame();
      const target = oldPath && resolvePath(oldPath);
      if (target && typeOf(target)) choose(target);
      else { selectedLabel.textContent = `No element selected · ${devices[next].label}`; fields.replaceChildren(); }
      updateProgress();
    });
  }
  workspace.querySelectorAll('[data-avb-device]').forEach(btn => btn.addEventListener('click', () => setDevice(btn.dataset.avbDevice)));
  setDevice('desktop');
  editButton.addEventListener('click', () => {
    const adminBar = document.getElementById('wpadminbar');
    const topInset = adminBar && getComputedStyle(adminBar).display !== 'none' ? Math.round(adminBar.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty('--abv-workspace-inset', topInset + 'px');
    active = true;
    document.documentElement.classList.add('abv-editing');
    document.body.classList.add('abv-editor-open');
    workspace.classList.add('abv-visible');
    panel.classList.add('abv-visible');
    launcher.hidden = true;
    if (!previewFrame.getAttribute('src')) {
      const url = new URL(location.href);
      url.searchParams.set('frametopress_vb_preview', '1');
      previewFrame.src = url.toString();
    } else if (frameReady) applyPendingToFrame();
    updateProgress();
  });
  panel.querySelector('.abv-close').addEventListener('click', () => {
    if (pending.size && !confirm('Close editor? Your unpublished changes will remain in the editor until you reopen it or reload.')) return;
    if (selection) selection.node.classList.remove('abv-target');
    restorePreviewStyles();
    active = false;
    document.documentElement.classList.remove('abv-editing');
    document.body.classList.remove('abv-editor-open');
    workspace.classList.remove('abv-visible');
    panel.classList.remove('abv-visible');
    launcher.hidden = false;
    selection = null; formBase = null;
  });
  panel.querySelector('.abv-reset-device').addEventListener('click', () => {
    if (!selection) { status('Choose an element before resetting this device.', true); return; }
    syncSelected();
    const record = copy(currentDraft(selection.path) || published[selection.path] || { type: selection.kind, style: {} });
    if (device === 'desktop') record.style = {};
    else {
      if (record.responsive) delete record.responsive[device];
      if (record.responsive && !Object.keys(record.responsive).length) delete record.responsive;
    }
    if (same(record, published[selection.path] || null)) pending.delete(selection.path);
    else pending.set(selection.path, record);
    restorePreviewStyles();
    applyPendingToFrame();
    if (selection?.node?.isConnected) buildEditor(selection.node, selection.path, selection.kind);
    updateProgress();
  });
  panel.querySelector('.abv-reset').addEventListener('click', () => {
    if (!selection) { status('Select an element to reset.', true); return; }
    if (Object.prototype.hasOwnProperty.call(published, selection.path)) pending.set(selection.path, null);
    else pending.delete(selection.path);
    status('Reset queued. Publish, then reload to show the original theme appearance.');
  });
  panel.querySelector('.abv-check').addEventListener('click', async () => {
    if (pending.size) { status('Publish or discard your changes before verifying the server.', true); return; }
    try {
      const latest = await fetchPublished();
      published = asEdits(latest.edits); revision = latest.revision || revision;
      status(`Server verified: ${latest.count} published elements. Revision ${revision.slice(0, 8)}.`);
    } catch (error) { status('Could not verify saved edits: ' + error.message, true); }
  });
  function composePayload() {
    // Mandatory last-second snapshot, even if onchange/input events have been lost.
    if (selection) syncSelected();
    const complete = asEdits(published);
    for (const [path, entry] of pending) {
      if (entry === null) delete complete[path];
      else complete[path] = copy(entry);
    }
    return complete;
  }
  function loadFreshCSS(version) {
    const link = canvasDoc().getElementById('frametopress-vb-runtime-css');
    if (!link) return Promise.reject(new Error('WordPress did not render the builder stylesheet link.'));
    const url = new URL(link.href, location.href);
    url.searchParams.set('revision', version || Date.now().toString());
    url.searchParams.set('fresh', String(Date.now()));
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { cleanup(); reject(new Error('Timed out loading the updated stylesheet.')); }, 12000);
      const onLoad = () => { cleanup(); resolve(); };
      const onError = () => { cleanup(); reject(new Error('Failed to load the updated stylesheet.')); };
      const cleanup = () => { clearTimeout(timeout); link.removeEventListener('load', onLoad); link.removeEventListener('error', onError); };
      link.addEventListener('load', onLoad); link.addEventListener('error', onError);
      link.href = url.toString();
    });
  }
  function verifySelectedAppearance(requested) {
    if (!selection || !selection.node.isConnected || !requested[selection.path]) return '';
    const actual = selection.node.ownerDocument.defaultView.getComputedStyle(selection.node);
    const wanted = effectiveStyle(requested[selection.path]);
    if (wanted.fontSize != null && Math.abs(parseFloat(actual.fontSize) - Number(wanted.fontSize)) > 0.75) return `CSS mismatch: expected ${wanted.fontSize}px, browser shows ${actual.fontSize}.`;
    return '';
  }
  publishButton.addEventListener('click', async () => {
    if (publishing) return;
    const payload = composePayload();
    if (!pending.size) { status('No modified elements to publish. Select an element and change a field.', true); return; }
    const changedCount = pending.size;
    const fullCount = Object.keys(payload).length;
    publishing = true;
    publishButton.disabled = true;
    publishButton.textContent = 'Publishing…';
    const localRevision = revision;
    status(`Publishing ${changedCount} changed element${changedCount === 1 ? '' : 's'}…`);
    try {
      const data = new URLSearchParams({ action: 'frametopress_vb_save', nonce: cfg.nonce, key: cfg.key, base_revision: localRevision, edits: JSON.stringify(payload), allow_empty: fullCount === 0 ? '1' : '0' });
      const response = await fetch(cfg.ajax, { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body: data });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) throw new Error(result?.data?.message || `WordPress rejected the save (HTTP ${response.status}).`);
      const returned = result.data;
      if (!returned || !returned.cssWritten || !returned.edits || typeof returned.edits !== 'object') throw new Error('The server did not confirm CSS and edit storage.');
      if (returned.count !== fullCount || !same(returned.edits, payload)) throw new Error(`Server readback does not match the submitted edit data (${fullCount} sent, ${returned.count} returned).`);
      // New GET is independent of the POST response: verify actual database state.
      const verified = await fetchPublished();
      if (!same(verified.edits, returned.edits)) throw new Error('WordPress saved a different value than the independent readback.');
      await loadFreshCSS(returned.cssVersion || returned.revision);
      // The published CSS, not inline JavaScript, becomes the only style source.
      restorePreviewStyles();
      const mismatch = verifySelectedAppearance(payload);
      published = asEdits(verified.edits);
      revision = verified.revision || returned.revision || revision;
      pending.clear();
      if (mismatch) {
        // The save succeeded, but do not falsely claim the browser rendered it.
        const record = selection && published[selection.path];
        if (record) previewRecord(selection.path, record);
        status(`Saved in WordPress and style.css, but ${mismatch} Preview restored.`, true);
      } else {
        if (selection && selection.node.isConnected) buildEditor(selection.node, selection.path, selection.kind);
        status(`✓ Published and independently verified: ${changedCount} changed element${changedCount === 1 ? '' : 's'}. Refresh to confirm.`);
      }
    } catch (error) {
      status('NOT PUBLISHED: ' + (error.message || 'Unknown error') + '. Your preview has not been discarded.', true);
    } finally {
      publishing = false;
      publishButton.disabled = false;
      publishButton.textContent = 'Publish changes';
    }
  });
  window.addEventListener('beforeunload', event => { if (pending.size) { event.preventDefault(); event.returnValue = ''; } });
})();
