/**
 * @file
 * Diagnostics for the #states / managed_file reproduction form (issue #2847425).
 *
 * Detects whether MR !7305 appears to be applied and whether each scenario
 * behaves as expected, then reports PASS/FAIL in an accessible live region.
 * Detection is behavioural: it drives the real triggers (select, checkboxes)
 * the way a user would, lets core/drupal.states react, and inspects the DOM.
 * It restores every control to its default afterwards.
 *
 * The Scenario 3 fieldset-collapse check is tracked separately: MR !7305 fixes
 * the element-level cases but NOT the fieldset-nesting case (#74/#75), so a FAIL
 * there is expected on the patched build and does not count against the
 * "applied?" verdict — it is called out as the remaining accessibility gap.
 */
(function (Drupal, once) {
  'use strict';

  var wait = function (ms) {
    return new Promise(function (resolve) { window.setTimeout(resolve, ms); });
  };

  function byName(name) {
    return document.querySelector('[name="' + name + '"]');
  }

  function wrapperOf(el) {
    if (!el) { return null; }
    return el.closest('.js-form-item, .js-form-submit, .js-form-wrapper') || el.parentElement;
  }

  function isVisible(el) {
    if (!el) { return false; }
    return el.offsetParent !== null && window.getComputedStyle(el).visibility !== 'hidden';
  }

  function fileWrapperVisible(fileKey) {
    return isVisible(wrapperOf(byName('files[' + fileKey + ']')));
  }

  function fileMarkedRequired(fileKey) {
    var input = byName('files[' + fileKey + ']');
    var wrap = wrapperOf(input);
    var label = wrap ? wrap.querySelector('label') : null;
    var byLabel = !!label && (label.classList.contains('form-required') || label.classList.contains('js-form-required'));
    var byAttr = !!input && input.hasAttribute('required');
    return byLabel || byAttr;
  }

  function setChecked(name, value) {
    var el = byName(name);
    if (!el) { return; }
    if (el.checked !== value) {
      el.checked = value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function setSelect(name, value) {
    var el = byName(name);
    if (!el) { return; }
    el.value = value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Structural signal: after MR !7305, managed_file markup carries
  // data-drupal-states (on the ajax wrapper and/or the upload input).
  function hasManagedFileStatesAttribute() {
    return !!document.querySelector(
      '#file-managed-states-test-form input[type="file"][data-drupal-states],' +
      '#file-managed-states-test-form [id$="ajax-wrapper"][data-drupal-states]'
    );
  }

  function resetControls() {
    setSelect('type', '');
    setChecked('toggle', false);
    setChecked('show_details', false);
  }

  var SETTLE = 60;

  async function runChecks() {
    var results = [];
    // category: 'core' counts toward the applied? verdict; 'fieldset' is the
    // known #74/#75 gap and is reported separately.
    function record(pass, label, detail, category) {
      results.push({ pass: pass, label: label, detail: detail, category: category || 'core' });
    }

    resetControls();
    await wait(SETTLE);

    // 1. Structural: does the fix's data-drupal-states attribute appear?
    record(
      hasManagedFileStatesAttribute(),
      Drupal.t('managed_file markup carries data-drupal-states'),
      Drupal.t('Added by MR !7305 so states.js can attach the element. Absent on unpatched core.')
    );

    // 2. Initial visibility (nothing toggled).
    record(
      fileWrapperVisible('managed_file_initially_visible'),
      Drupal.t('Scenario 2: "initially visible" file is visible on load'),
      Drupal.t('Should be visible while the toggle is unchecked.')
    );
    record(
      !fileWrapperVisible('managed_file_initially_hidden'),
      Drupal.t('Scenario 2: "initially hidden" file is hidden on load'),
      Drupal.t('The clearest bug tell: on unpatched core this file is wrongly visible on load.')
    );
    record(
      !fileWrapperVisible('audio'),
      Drupal.t('Scenario 1: audio file is hidden until "Audio" is chosen'),
      Drupal.t('On unpatched core it is wrongly visible with no selection.')
    );

    // 3. Interactive Scenario 2.
    setChecked('toggle', true);
    await wait(SETTLE);
    record(
      !fileWrapperVisible('managed_file_initially_visible'),
      Drupal.t('Scenario 2: "initially visible" file hides when toggled'),
      ''
    );
    record(
      fileWrapperVisible('managed_file_initially_hidden'),
      Drupal.t('Scenario 2: "initially hidden" file shows when toggled'),
      ''
    );
    record(
      fileMarkedRequired('managed_file_initially_optional'),
      Drupal.t('Scenario 2: "initially optional" file gains the required marker'),
      Drupal.t('Marker only — #states required does not enforce server-side validation (#3513308).')
    );
    setChecked('toggle', false);
    await wait(SETTLE);

    // 4. Scenario 3: the fieldset/accessibility regression (tracked separately).
    setChecked('show_details', true);
    await wait(SETTLE);
    record(
      isVisible(wrapperOf(byName('always_here'))),
      Drupal.t('Scenario 3: the details fieldset does NOT collapse (accessibility)'),
      Drupal.t('Expected to FAIL even with MR !7305: hiding a managed_file inside a details/fieldset still collapses the whole wrapper with display:none, removing content from the accessibility tree (WCAG 3.3.1, #74/#75). This is the remaining gap to raise on the issue.'),
      'fieldset'
    );
    setChecked('show_details', false);
    await wait(SETTLE);

    // 5. Scenario 1: choose Audio.
    setSelect('type', 'audio');
    await wait(SETTLE);
    record(
      fileWrapperVisible('audio'),
      Drupal.t('Scenario 1: audio file shows when "Audio" is chosen'),
      ''
    );
    record(
      fileMarkedRequired('audio'),
      Drupal.t('Scenario 1: audio file is marked required when "Audio" is chosen'),
      ''
    );
    resetControls();
    await wait(SETTLE);

    return results;
  }

  function render(results) {
    var list = document.getElementById('diag-results');
    var summary = document.getElementById('diag-summary');
    if (!list || !summary) { return; }
    list.textContent = '';

    results.forEach(function (r) {
      var li = document.createElement('li');
      li.className = 'diag-result ' + (r.pass ? 'diag-pass' : 'diag-fail');
      var badge = document.createElement('span');
      badge.className = 'diag-badge';
      badge.textContent = r.pass ? Drupal.t('PASS') : Drupal.t('FAIL');
      var text = document.createElement('span');
      text.className = 'diag-text';
      text.textContent = ' ' + r.label + (r.detail ? ' — ' + r.detail : '');
      li.appendChild(badge);
      li.appendChild(text);
      list.appendChild(li);
    });

    var core = results.filter(function (r) { return r.category === 'core'; });
    var coreFail = core.filter(function (r) { return !r.pass; }).length;
    var corePass = core.length - coreFail;
    var fieldsetFail = results.some(function (r) { return r.category === 'fieldset' && !r.pass; });

    summary.classList.remove('diag-verdict-ok', 'diag-verdict-bug', 'diag-verdict-mixed');
    if (coreFail === 0 && !fieldsetFail) {
      summary.classList.add('diag-verdict-ok');
      summary.textContent = Drupal.t('Verdict: MR !7305 appears APPLIED and complete — all @n checks passed, including the fieldset case.', { '@n': results.length });
    }
    else if (coreFail === 0) {
      summary.classList.add('diag-verdict-mixed');
      summary.textContent = Drupal.t('Verdict: MR !7305 appears APPLIED for the element-level cases (@p/@t functional checks passed), but the fieldset-nesting case (#74/#75) is still NOT fixed — see the FAIL below. That is the accessibility gap to raise on the issue.', { '@p': corePass, '@t': core.length });
    }
    else if (corePass <= 1) {
      summary.classList.add('diag-verdict-bug');
      summary.textContent = Drupal.t('Verdict: the fix does NOT appear applied — the #2847425 bug is present. @f of @t functional checks failed.', { '@f': coreFail, '@t': core.length });
    }
    else {
      summary.classList.add('diag-verdict-mixed');
      summary.textContent = Drupal.t('Verdict: mixed — @f of @t functional checks failed. Review the list below.', { '@f': coreFail, '@t': core.length });
    }
  }

  async function go() {
    var summary = document.getElementById('diag-summary');
    if (summary) { summary.textContent = Drupal.t('Running checks…'); }
    try {
      render(await runChecks());
    }
    catch (e) {
      if (summary) {
        summary.textContent = Drupal.t('Diagnostics could not complete: @msg', { '@msg': String(e && e.message ? e.message : e) });
      }
      if (window.console) { window.console.error(e); }
    }
  }

  Drupal.behaviors.fileManagedStatesDiagnostics = {
    attach: function (context) {
      once('fms-diagnostics', '#state-diagnostics', context).forEach(function () {
        var btn = document.getElementById('diag-run');
        if (btn) {
          btn.addEventListener('click', function (e) { e.preventDefault(); go(); });
        }
        window.setTimeout(go, 150);
      });
    }
  };
})(Drupal, once);
