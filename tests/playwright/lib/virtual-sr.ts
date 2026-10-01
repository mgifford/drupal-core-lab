/**
 * Virtual Screen Reader helpers for Drupal accessibility crawls.
 *
 * Uses @guidepup/virtual-screen-reader to simulate what a screen reader
 * would announce based on W3C accessibility specs (ACCNAME, CORE-AAM,
 * HTML-AAM). The virtual SR validates that Drupal's markup produces the
 * correct accessibility tree — something axe-core cannot verify.
 *
 * Cross-validation with axe-core:
 *   - Both axe + virtual SR flag  → CONFIRMED barrier
 *   - Only axe flags              → VISUAL issue (CSS/HTML)
 *   - Only virtual SR flags       → SEMANTIC issue (tree gap)
 *
 * Usage:
 *   import { injectVirtualSR, getSpokenPhraseLog, analyzeVirtualSR } from '../lib/virtual-sr';
 *
 *   await injectVirtualSR(page);
 *   const log = await getSpokenPhraseLog(page);
 *   const findings = analyzeVirtualSR(log);
 */
import { Page } from '@playwright/test';

// ── Types ────────────────────────────────────────────────────────────────────

export interface VirtualSRFinding {
  /** Pattern identifier for grouping (e.g. 'empty-link', 'heading-skip'). */
  rule: string;
  /** Severity level. */
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  /** Human-readable description. */
  description: string;
  /** Position in the spoken phrase log. */
  position: number;
  /** The spoken phrase that triggered the finding. */
  phrase: string;
}

export interface VirtualSRResult {
  /** Full spoken phrase log from the virtual screen reader. */
  log: string[];
  /** Findings detected by pattern analysis. */
  findings: VirtualSRFinding[];
  /** Timestamp of the scan. */
  timestamp: string;
}

// ── Injection ────────────────────────────────────────────────────────────────

/**
 * Inject the virtual screen reader script into the page.
 *
 * Must be called before getSpokenPhraseLog(). The script loads from
 * unpkg CDN — no local install needed for browser injection.
 */
export async function injectVirtualSR(page: Page): Promise<void> {
  await page.addScriptTag({
    url: 'https://unpkg.com/@guidepup/virtual-screen-reader/lib/esm/index.browser.js',
    type: 'module',
  });
  await page.addScriptTag({
    content: `
      import { virtual } from "https://unpkg.com/@guidepup/virtual-screen-reader/lib/esm/index.browser.js";
      window.virtual = virtual;
    `,
    type: 'module',
  });
}

// ── Audit ────────────────────────────────────────────────────────────────────

/**
 * Navigate through the entire accessibility tree and collect the spoken
 * phrase log — exactly what a screen reader would announce at each step.
 *
 * The virtual SR walks the tree from document root to "end of document",
 * calling virtual.next() at each step. This mirrors how a screen reader
 * user would navigate with arrow keys.
 */
export async function getSpokenPhraseLog(page: Page): Promise<string[]> {
  await page.evaluate(async () => {
    // @ts-ignore — virtual is injected globally
    await window.virtual.start({ container: document.body });
  });

  await page.evaluate(async () => {
    // @ts-ignore
    while ((await window.virtual.lastSpokenPhrase()) !== 'end of document') {
      // @ts-ignore
      await window.virtual.next();
    }
  });

  const log: string[] = await page.evaluate(async () => {
    // @ts-ignore
    return await window.virtual.spokenPhraseLog();
  });

  await page.evaluate(async () => {
    // @ts-ignore
    await window.virtual.stop();
  });

  return log;
}

/**
 * Run a full virtual SR audit on the current page.
 *
 * Injects the SR, navigates the tree, collects findings, and returns
 * a complete result record ready for cross-referencing with axe.
 */
export async function auditPageWithVirtualSR(page: Page): Promise<VirtualSRResult> {
  await injectVirtualSR(page);
  // Small delay for script evaluation in the browser.
  await page.waitForTimeout(1500);

  // Timeout after 30 seconds to prevent hanging on complex pages.
  const timeoutMs = 30000;
  const log = await Promise.race([
    getSpokenPhraseLog(page),
    new Promise<string[]>((_, reject) =>
      setTimeout(() => reject(new Error(`Virtual SR timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);

  const findings = analyzeVirtualSR(log);

  return {
    log,
    findings,
    timestamp: new Date().toISOString(),
  };
}

// ── Pattern Analysis ─────────────────────────────────────────────────────────

/**
 * Analyze the spoken phrase log for common accessibility issues.
 *
 * These patterns are derived from W3C ACCNAME and CORE-AAM specs.
 * Each pattern checks a specific accessibility tree structure that
 * indicates a barrier.
 */
export function analyzeVirtualSR(log: string[]): VirtualSRFinding[] {
  const findings: VirtualSRFinding[] = [];

  for (let i = 0; i < log.length; i++) {
    const phrase = log[i];

    // ── Empty link (no accessible name) ──────────────────────────────────
    // Pattern: "link" immediately followed by "end of link" with no text.
    if (phrase === 'link' && (i + 1 >= log.length || log[i + 1]?.startsWith('end of'))) {
      findings.push({
        rule: 'empty-link',
        severity: 'serious',
        description: 'Link has no accessible name — screen readers announce only "link"',
        position: i,
        phrase,
      });
    }

    // ── Empty button (no accessible name) ────────────────────────────────
    if (phrase === 'button' && (i + 1 >= log.length || log[i + 1]?.startsWith('end of'))) {
      findings.push({
        rule: 'empty-button',
        severity: 'serious',
        description: 'Button has no accessible name — screen readers announce only "button"',
        position: i,
        phrase,
      });
    }

    // ── Image with no alt text ───────────────────────────────────────────
    // Pattern: "image" without a comma (comma indicates alt text follows).
    if (phrase === 'image') {
      const nextPhrase = log[i + 1] || '';
      if (nextPhrase.startsWith('end of') || nextPhrase === 'image') {
        findings.push({
          rule: 'image-no-alt',
          severity: 'critical',
          description: 'Image has no accessible name (alt text)',
          position: i,
          phrase,
        });
      }
    }

    // ── Heading level skip ───────────────────────────────────────────────
    // WCAG 1.3.1: Heading levels should not skip (e.g. h1 → h3).
    const headingMatch = phrase.match(/heading, .+, level (\d+)/);
    if (headingMatch) {
      const level = parseInt(headingMatch[1]);
      // Look backward for the previous heading.
      for (let j = i - 1; j >= 0; j--) {
        const prevMatch = log[j].match(/heading, .+, level (\d+)/);
        if (prevMatch) {
          const prevLevel = parseInt(prevMatch[1]);
          if (level > prevLevel + 1) {
            findings.push({
              rule: 'heading-skip',
              severity: 'moderate',
              description: `Heading level ${level} follows level ${prevLevel} (skipped ${level - prevLevel - 1} level(s))`,
              position: i,
              phrase,
            });
          }
          break;
        }
      }
    }

    // ── Missing main landmark ────────────────────────────────────────────
    // Checked once at end of log — only add if not found anywhere.
    if (i === log.length - 1 && !log.includes('main')) {
      findings.push({
        rule: 'missing-main',
        severity: 'moderate',
        description: 'No main landmark found — screen reader users cannot jump to main content',
        position: i,
        phrase: '(end of document)',
      });
    }

    // ── Missing navigation landmark ──────────────────────────────────────
    if (i === log.length - 1 && !log.some((p) => p.startsWith('navigation'))) {
      findings.push({
        rule: 'missing-nav',
        severity: 'moderate',
        description: 'No navigation landmark found',
        position: i,
        phrase: '(end of document)',
      });
    }

    // ── Textbox without visible label ────────────────────────────────────
    // Check if a textbox appears without preceding label text.
    if (phrase.includes('textbox')) {
      const preceding = log.slice(Math.max(0, i - 3), i);
      const hasLabel = preceding.some(
        (p) =>
          p.length > 2 &&
          !p.startsWith('end of') &&
          !p.startsWith('textbox') &&
          !p.startsWith('form') &&
          !p.startsWith('paragraph'),
      );
      if (!hasLabel) {
        findings.push({
          rule: 'input-no-label',
          severity: 'serious',
          description: 'Text input may not have an associated label',
          position: i,
          phrase,
        });
      }
    }
  }

  return findings;
}

// ── Cross-Reference ──────────────────────────────────────────────────────────

export interface CrossRefResult {
  /** Issues flagged by both axe and virtual SR — confirmed barriers. */
  confirmed: Array<{ rule: string; description: string; axeRule?: string; virtualFinding?: VirtualSRFinding }>;
  /** Issues only axe detected — visual/structural, tree is correct. */
  axeOnly: Array<{ rule: string; description: string }>;
  /** Issues only virtual SR detected — semantic, axe misses these. */
  virtualSROnly: VirtualSRFinding[];
}

/**
 * Cross-reference axe violations with virtual SR findings.
 *
 * This is the key value-add: distinguishing real barriers from false
 * positives by comparing what two independent tools detect.
 */
export function crossReference(
  virtualFindings: VirtualSRFinding[],
  axeViolations: Array<{ id: string; description: string; nodes?: Array<{ html: string }> }>,
): CrossRefResult {
  const confirmed: CrossRefResult['confirmed'] = [];
  const axeOnly: CrossRefResult['axeOnly'] = [];
  const virtualSROnly: VirtualSRFinding[] = [];

  // Check which virtual findings are confirmed by axe.
  for (const vf of virtualFindings) {
    const match = axeViolations.find(
      (av) =>
        av.id === vf.rule ||
        av.description.toLowerCase().includes(vf.description.toLowerCase().slice(0, 20)),
    );
    if (match) {
      confirmed.push({
        rule: vf.rule,
        description: vf.description,
        axeRule: match.id,
        virtualFinding: vf,
      });
    } else {
      virtualSROnly.push(vf);
    }
  }

  // Check which axe findings have no virtual SR equivalent.
  for (const av of axeViolations) {
    const match = virtualFindings.find(
      (vf) =>
        vf.rule === av.id ||
        vf.description.toLowerCase().includes(av.description.toLowerCase().slice(0, 20)),
    );
    if (!match) {
      axeOnly.push({
        rule: av.id,
        description: av.description,
      });
    }
  }

  return { confirmed, axeOnly, virtualSROnly };
}
