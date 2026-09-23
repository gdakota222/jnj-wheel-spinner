/**
 * Design-principles audit.
 *
 * Paste this into the browser console with the app open, then call `audit(label)`
 * on each screen and panel. It checks the three things that can be measured:
 *
 *   1. Touch targets  — every interactive element at least 44px tall.
 *   2. Labels         — every interactive element has an accessible name.
 *   3. Contrast       — every run of text meets WCAG AA against its real
 *                       background (4.5:1, or 3:1 for large text).
 *   4. Edges          — every bordered box, field and button has an edge that
 *                       meets 3:1 against what it sits on (WCAG 1.4.11), unless
 *                       its own fill already does. Added after two testers said
 *                       boxes were hard to see and the numbers proved them
 *                       right: every edge in the app measured about 1.5:1, and
 *                       checks 1–3 had passed it for months.
 *
 * It cannot check the principle that matters most — whether a screen explains
 * itself to someone who just picked up the tablet. That part is read, not
 * measured. See docs/intent.md § Design principles.
 *
 * Run it again whenever screens are added; v1.1 brings several.
 */
window.audit = function audit(label = 'screen') {
  const px = (s) => parseFloat(s) || 0;
  const parse = (s) => {
    const m = s && s.match(/[\d.]+/g);
    return m ? m.map(Number) : null;
  };

  const luminance = ([r, g, b]) => {
    const f = (c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };

  const ratio = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  /** Walk up until something actually paints a background. */
  const effectiveBackground = (el) => {
    let node = el;
    while (node && node !== document.documentElement) {
      const c = parse(getComputedStyle(node).backgroundColor);
      if (c && (c.length < 4 || c[3] > 0.5)) return c.slice(0, 3);
      node = node.parentElement;
    }
    return [26, 20, 44]; // --bg
  };

  const touch = [];
  const unlabelled = [];
  const contrast = [];
  const edges = [];

  document.querySelectorAll('button, a, input, select, textarea').forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.height === 0) return;
    const name = (
      el.getAttribute('aria-label') ||
      el.innerText ||
      el.getAttribute('placeholder') ||
      el.id ||
      ''
    ).trim();
    if (rect.height < 44) {
      touch.push({ name: name.split('\n')[0] || el.className, height: Math.round(rect.height) });
    }
    if (!name) unlabelled.push({ tag: el.tagName, className: el.className });
  });

  document.querySelectorAll('body *').forEach((el) => {
    const hasOwnText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!hasOwnText) return;

    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.1) return;
    if (el.closest('.visually-hidden')) return;

    const fg = parse(cs.color);
    if (!fg) return;

    const size = px(cs.fontSize);
    const isLarge = size >= 24 || (size >= 18.66 && +cs.fontWeight >= 700);
    const required = isLarge ? 3 : 4.5;
    const actual = ratio(fg.slice(0, 3), effectiveBackground(el));

    if (actual < required) {
      contrast.push({
        text: (el.innerText || '').trim().slice(0, 40),
        className: el.className.split(' ')[0],
        actual: +actual.toFixed(2),
        required,
      });
    }
  });

  // 4. Edges. A box needs a boundary you can see: either its border, or its fill
  // standing apart from whatever it sits on. Disabled controls are exempt, as
  // WCAG allows, and so is anything the reader cannot see.
  document.querySelectorAll('body *').forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    if (el.closest('.visually-hidden') || el.closest('.curtain')) return;
    if (el.disabled) return;
    const width = px(cs.borderTopWidth);
    if (width === 0 || cs.borderTopStyle === 'none') return;
    const border = parse(cs.borderTopColor);
    if (!border || (border.length > 3 && border[3] < 0.5)) return;

    const behind = effectiveBackground(el.parentElement || el);
    const fill = parse(cs.backgroundColor);
    const ownFill = fill && (fill.length < 4 || fill[3] > 0.5) ? fill.slice(0, 3) : null;
    if (ownFill && ratio(ownFill, behind) >= 3) return; // the fill is the edge

    const actual = ratio(border.slice(0, 3), behind);
    if (actual < 3) {
      edges.push({
        className: String(el.className).split(' ')[0] || el.tagName,
        actual: +actual.toFixed(2),
        required: 3,
      });
    }
  });

  const failures = touch.length + unlabelled.length + contrast.length + edges.length;
  console.log(`${failures === 0 ? 'PASS' : 'FAIL'} — ${label} (${failures} issues)`);
  if (failures) console.table([...touch, ...unlabelled, ...contrast, ...edges]);
  return { label, touch, unlabelled, contrast, edges };
};

/**
 * SVG text is filled, not coloured, so the sweep above skips the wheel. These are
 * the numbers for dark ink on each segment colour, checked at 0.7.0:
 *
 *   pink 5.53 · orange 8.01 · yellow 11.72 · green 8.12
 *   cyan 7.05 · indigo 4.62 · violet 5.22 · rose 6.99
 *
 * The worst case is indigo at 4.62:1, so every name on the wheel clears AA.
 * Re-check these if the palette changes, and again when the colour-blind
 * palettes land in v1.1.
 *
 * The curtain is the same kind of blind spot: its text sits on a gradient panel
 * the sweep walks straight past, landing on the page background instead. Measured
 * by hand at 0.10.0, against the lightest end of the panel:
 *
 *   "And the winner is…"  gold on rose   3.61:1  (large text, needs 3:1)  ✓
 *   countdown digits      gold on rose   3.61:1  (very large)             ✓
 *   "Not yet — go back"   white on rose  4.63:1  → backed to ~9:1         ✓
 *
 * Against the deep end of the gradient every one of these roughly doubles. The
 * lightest end is the case that matters, so that is what is recorded.
 */
