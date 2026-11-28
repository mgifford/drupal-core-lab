// The human-readable views of a checkpoint session (tools/playwright/lib/a11y/report.mjs). The report is generated from
// the canonical checkpoint JSON only, and the HTML must itself be accessible: semantic headings and tables, a caption on
// every table, column header scopes, no script, no colour-only meaning, and an honest DRAFT / AI-assisted disclosure.
//   node --test tests/lab/a11y-report.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCheckpoint, checkpointProblems } from '../../tools/playwright/lib/a11y/checkpoint.mjs';
import { normaliseFinding, mergeCheckpointFindings, manualChecks, findingTotals } from '../../tools/playwright/lib/a11y/findings.mjs';
import { loadRecords, compareSides, renderSession } from '../../tools/playwright/lib/a11y/report.mjs';
import { SessionStore } from '../../tools/playwright/lib/a11y/store.mjs';

const labRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const iso = '2026-11-27T10:00:00.000Z';

// A canonical finding pair: one shared defect observed at both checkpoints, one that only appears in After.
function finding(ruleId, side, checkpointId, html = '<a href="/x">Read more</a>') {
  return normaliseFinding({
    engine: { id: 'axe-core', version: '4.14.0' },
    outcome: 'violation',
    ruleId,
    ruleLabel: ruleId === 'color-contrast' ? 'Elements must meet minimum colour contrast' : 'Links must have discernible text',
    impact: ruleId === 'color-contrast' ? 'serious' : 'critical',
    wcag: ruleId === 'color-contrast' ? ['1.4.3'] : ['2.4.4'],
    actRuleIds: ruleId === 'color-contrast' ? ['2779a5'] : [],
    target: { targetTree: ['#main a'], html },
    html,
    message: `${ruleId} observed`,
  }, { side, checkpointId, scenarioId: 'dialog-open', pagePath: '/node/1' });
}

function record({ id = 'dialog-open', side, sequence, findings, manual }) {
  return createCheckpoint({
    id,
    sequence,
    label: 'Dialog open',
    status: 'captured',
    when: iso,
    provenance: {
      source: 'scenario', mcp: null, scenario: { id }, variant: 'a11y-report-test',
      issue: '3534229', side, core: { commit: 'abcdef12' }, patchState: null,
      page: { origin: 'http://127.0.0.1:8123', host: '127.0.0.1', path: '/node/1', queryNames: [] },
    },
    scenario: { id, label: 'Dialog open' },
    environment: {
      browser: 'chromium', browserVersion: '140.0.0', os: process.platform,
      viewport: { width: 1280, height: 720 }, colorScheme: 'light', forcedColors: 'none',
      reducedMotion: 'no-preference', contrast: 'no-preference', theme: 'olivero', lang: 'en', dir: 'ltr',
    },
    page: { origin: 'http://127.0.0.1:8123', host: '127.0.0.1', path: '/node/1', queryNames: [] },
    interaction: { history: [] },
    focus: { active: { role: 'button', name: 'Confirm' } },
    state: {
      readiness: { kind: 'selector', selector: '[role="dialog"]', state: 'visible', timeoutMs: 10000, satisfied: true },
      application: { dialogs: [{ open: true, role: 'dialog', name: 'Confirm' }], expanded: [], aria: { brokenRefs: [] }, visibleText: 'Are you sure?' },
    },
    evidence: { engines: [{ engine: 'axe-core', version: '4.14.0', status: 'executed', counts: { distinct: findings.length } }] },
    findings,
    manual,
    limits: ['Chromium only: no real screen reader was involved.'],
    resources: { scanMs: 42, screenshots: 0 },
  });
}

test('renderSession: Markdown and HTML from the same canonical records, with accessible report basics', () => {
  const dir = path.join(labRoot, '.lab-cache', `a11y-test-${process.pid}`);
  try {
    fs.mkdirSync(dir, { recursive: true });

    // ---- canonical records: one Before, one After, written to disk and then read back by the report
    const beforeFindings = [finding('color-contrast', 'before', 'dialog-open')];
    const afterFindings = [
      finding('color-contrast', 'after', 'dialog-open'),
      finding('link-name', 'after', 'dialog-open', '<button>Go</button>'),
    ];
    const manual = manualChecks({ dialogs: [{ open: true }] })
      .map((m) => ({ ...m, checkpointId: 'dialog-open', side: 'after', when: iso }));
    const before = record({ side: 'before', sequence: 1, findings: beforeFindings, manual: [] });
    const after = record({ side: 'after', sequence: 2, findings: afterFindings, manual });
    assert.deepEqual(checkpointProblems(before), []);
    assert.deepEqual(checkpointProblems(after), []);

    const beforeFile = path.join(dir, '001-dialog-open.json');
    const afterFile = path.join(dir, '002-dialog-open.json');
    fs.writeFileSync(beforeFile, JSON.stringify(before, null, 2) + '\n');
    fs.writeFileSync(afterFile, JSON.stringify(after, null, 2) + '\n');
    const relative = (file) => path.relative(labRoot, file);

    // The session's finding list is the deduplicated union: one shared defect plus one After-only defect.
    const running = mergeCheckpointFindings(new Map(), beforeFindings, {
      checkpointId: 'dialog-open', side: 'before', scenarioId: 'dialog-open', when: iso, pagePath: '/node/1', sequence: 1,
    });
    mergeCheckpointFindings(running, afterFindings, {
      checkpointId: 'dialog-open', side: 'after', scenarioId: 'dialog-open', when: iso, pagePath: '/node/1', sequence: 2,
    });
    const sessionFindings = [...running.values()];
    const totals = findingTotals(sessionFindings);
    assert.deepEqual([totals.distinct, totals.observations], [2, 3]);

    const session = {
      schema: 'lab-a11y-session/1',
      id: 'a11y-report-test',
      started: iso,
      updated: iso,
      issue: '3534229',
      variants: ['a11y-report-test'],
      kinds: ['local-fixture'],
      tool: { name: 'playwright', integration: 'test' },
      mcp: null,
      configuredProfile: 'quick',
      pages: [],
      checkpoints: [{ file: relative(beforeFile) }, { file: relative(afterFile) }],
      findings: sessionFindings,
      manual,
      resources: { checkpoints: 2, engineRuns: 2, scanMs: 84, evidenceBytes: 4096, screenshots: 0, browserLaunches: 0, energy: null },
      limits: ['This is a synthetic session built by the unit tests; no browser was used.'],
      engineCapabilities: [{
        id: 'axe-core', label: 'axe-core', version: '4.14.0', license: 'MPL-2.0',
        livePage: true, requiresInjectedJavaScript: true, requiresNavigation: false, iframes: true,
        shadowDom: true, computedStyles: true, preservesState: true, componentScope: true,
      }],
    };

    // The records load back from disk, and the pair is comparable (same state, same conditions).
    const records = loadRecords(session);
    assert.equal(records.length, 2);
    assert.deepEqual(records.map((r) => r.side), ['before', 'after']);
    const pairs = compareSides(records);
    assert.equal(pairs.length, 1);
    assert.equal(pairs[0].comparable, true);
    assert.equal(pairs[0].reason, null);
    assert.deepEqual(pairs[0].classifications.map((c) => c.change).sort(), ['existing-failure', 'manual-review-required', 'new-regression']);

    const { markdown, html } = renderSession(session);

    // ---- Markdown: same facts as the canonical records
    assert.match(markdown, /^# Accessibility checkpoints: issue #3534229/m);
    assert.match(markdown, /\*\*2 checkpoint\(s\)\*\*, \*\*(\d+) distinct finding\(s\)\*\*/, 'the deduplicated finding count is stated');
    assert.match(markdown, /\*\*2 distinct finding\(s\)\*\*/, 'two distinct findings, three observations');
    assert.match(markdown, /`dialog-open`/, 'the checkpoint id is named');
    assert.match(markdown, /## Before \/ After at equivalent states/);
    assert.match(markdown, /\| Checkpoint \| Equivalent\? \| Checks \| Classifications \|/);
    assert.match(markdown, /existing-failure/);
    assert.match(markdown, /new-regression/);
    assert.match(markdown, /## Findings \(one row per distinct finding\)/);
    assert.match(markdown, /## Manual review required/);
    assert.match(markdown, /dialog-context/);
    assert.match(markdown, /## Resource consumption \(measured, not estimated\)/);
    assert.match(markdown, /## Limits/);
    assert.match(markdown, /synthetic session built by the unit tests/);
    assert.match(markdown, /DRAFT/);
    assert.match(markdown, /AI-assisted|LLM/);
    const mdCount = Number(/ \*\*(\d+) distinct finding\(s\)\*\*/.exec(markdown)[1]);

    // ---- HTML: the same facts, and the report itself is accessible
    assert.match(html, /<html lang="en">/);
    assert.match(html, /<title>Accessibility checkpoints: issue #3534229<\/title>/);
    assert.match(html, /<h1>Accessibility checkpoints: issue #3534229<\/h1>/);
    assert.match(html, /<strong>(\d+) distinct finding\(s\)<\/strong>/);
    const htmlCount = Number(/<strong>(\d+) distinct finding\(s\)<\/strong>/.exec(html)[1]);
    assert.equal(htmlCount, mdCount, 'Markdown and HTML must describe the same number of distinct findings');
    assert.equal(htmlCount, totals.distinct);
    assert.match(html, /dialog-open/);
    assert.match(html, /existing-failure/);
    assert.match(html, /new-regression/);
    assert.match(html, /id="manual"/);
    assert.match(html, /dialog-context/);
    assert.match(html, /id="resources"/);
    assert.match(html, /id="limits"/);
    assert.match(html, /synthetic session built by the unit tests/);

    // Every table has a caption; every header cell is scoped; no script at all.
    const tables = html.match(/<table\b[\s\S]*?<\/table>/g) || [];
    assert.ok(tables.length >= 5, `expected several tables, got ${tables.length}`);
    for (const [i, table] of tables.entries()) {
      assert.match(table, /<caption>[^<]+<\/caption>/, `table ${i + 1} must have a non-empty caption`);
      const headers = table.match(/<th\b[^>]*>/g) || [];
      assert.ok(headers.length > 0, `table ${i + 1} must have header cells`);
      for (const th of headers) assert.match(th, /\bscope="(col|row)"/, `header cell ${th} must be scoped`);
      // Column headers exist wherever thead is used, and they say they are column headers.
      if (/<thead>/.test(table)) assert.match(table, /<th scope="col"/);
    }
    assert.doesNotMatch(html, /<script/i, 'the report must not run script');
    // The disclosure is visible, not only in a comment.
    assert.match(html, /DRAFT/);
    assert.match(html, /AI-assisted|LLM/);
    assert.match(html, /not performed by a person/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('SessionStore: one session persists both checkpoints and deduplicates the finding seen at each', async () => {
  const dir = path.join(labRoot, '.lab-cache', `a11y-test-${process.pid}-store`);
  try {
    const store = new SessionStore({
      context: { kind: 'local-fixture', issue: null, variant: null, page: { origin: 'http://127.0.0.1:8123' } },
      hint: { out: path.relative(labRoot, dir) },
      profile: 'quick',
      now: new Date(iso),
    });
    assert.equal(store.dir, dir);
    assert.equal(store.key(), `a11y-test-${process.pid}-store`);

    store.saveCheckpoint(record({
      id: 'home', side: 'before', sequence: 1,
      findings: [finding('color-contrast', 'before', 'home')], manual: [],
    }));
    store.saveCheckpoint(record({
      id: 'dialog-open', side: 'after', sequence: 2,
      findings: [
        finding('color-contrast', 'after', 'dialog-open'),
        finding('link-name', 'after', 'dialog-open', '<button>Go</button>'),
      ],
      manual: manualChecks({ dialogs: [{ open: true }] }).map((m) => ({ ...m, checkpointId: 'dialog-open', side: 'after', when: iso })),
    }));

    assert.deepEqual(store.session.checkpoints.map((c) => [c.sequence, c.id, c.findings]), [[1, 'home', 1], [2, 'dialog-open', 2]]);
    // One entry per fingerprint: the shared defect has two observations, the After-only one has one.
    const totals = findingTotals(store.session.findings);
    assert.equal(totals.distinct, 2);
    assert.equal(totals.observations, 3);

    await store.refreshReports();
    assert.equal(store.session.limits.some((l) => l.startsWith('Report generation failed')), false);
    const summary = fs.readFileSync(path.join(dir, 'SUMMARY.md'), 'utf8');
    const reportHtml = fs.readFileSync(path.join(dir, 'report.html'), 'utf8');
    assert.match(summary, /\*\*2 distinct finding\(s\)\*\*/);
    assert.match(reportHtml, /<html lang="en">/);
    assert.match(reportHtml, /<strong>2 distinct finding\(s\)<\/strong>/);
    assert.doesNotMatch(reportHtml, /<script/i);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
