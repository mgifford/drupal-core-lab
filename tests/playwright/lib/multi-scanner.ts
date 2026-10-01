/**
 * Multi-scanner accessibility helper for Drupal crawls.
 *
 * Runs three independent scanners on each page:
 *   1. axe-core — structural/CSS/ARIA violations
 *   2. IBM Equal Access — WCAG rule-based scanning
 *   3. Virtual Screen Reader — semantic/accessibility tree validation
 *
 * Cross-validation across all three tools:
 *   - 2+ tools flag  → CONFIRMED barrier (high confidence)
 *   - 1 tool flags   → INVESTIGATE (may be false positive)
 *   - 0 tools flag   → likely OK
 *
 * Usage:
 *   import { runAllScanners, crossReferenceAll } from '../lib/multi-scanner';
 *   const results = await runAllScanners(page);
 *   const xref = crossReferenceAll(results);
 */
import { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as aChecker from 'accessibility-checker';
import {
  auditPageWithVirtualSR,
  VirtualSRFinding,
  VirtualSRResult,
} from './virtual-sr';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AxeViolation {
  id: string;
  impact: string;
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary: string;
  }>;
}

export interface AxeResult {
  violations: AxeViolation[];
  incomplete: AxeViolation[];
  passes: number;
  timestamp: string;
}

export interface IBMEAViolation {
  ruleId: string;
  message: string;
  level: string;
  value: string[];
  path: { dom: string };
  context: string;
  screenshot?: string;
}

export interface IBMEAResult {
  violations: IBMEAViolation[];
  potentialViolations: IBMEAViolation[];
  recommendations: IBMEAViolation[];
  timestamp: string;
}

export interface MultiScannerResult {
  url: string;
  theme: string;
  viewport: string;
  axe: AxeResult;
  ibmEA: IBMEAResult;
  virtualSR: VirtualSRResult;
  timestamp: string;
}

export interface CrossRefEntry {
  rule: string;
  description: string;
  tools: string[];
  confidence: 'confirmed' | 'investigate' | 'low';
  details: {
    axe?: { rule: string; description: string };
    ibmEA?: { rule: string; description: string };
    virtualSR?: { rule: string; description: string };
  };
}

export interface CrossRefResult {
  confirmed: CrossRefEntry[];
  investigate: CrossRefEntry[];
  axeOnly: Array<{ rule: string; description: string }>;
  ibmEAOnly: Array<{ rule: string; description: string }>;
  virtualSROnly: VirtualSRFinding[];
}

// ── Individual Scanners ──────────────────────────────────────────────────────

/**
 * Run axe-core scan on the current page.
 */
export async function runAxeScan(page: Page): Promise<AxeResult> {
  const axeBuilder = await new AxeBuilder({ page })
    .withTags([
      'wcag2a',
      'wcag2aa',
      'wcag21a',
      'wcag21aa',
      'wcag22aa',
      'best-practice',
    ])
    .analyze();

  return {
    violations: axeBuilder.violations as AxeViolation[],
    incomplete: axeBuilder.incomplete as AxeViolation[],
    passes: axeBuilder.passes.length,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Run IBM Equal Access scan on the current page.
 *
 * Uses accessibility-checker which injects the ACE engine into the page
 * and runs WCAG rule checks.
 */
export async function runIBMEAScan(page: Page): Promise<IBMEAResult> {
  try {
    const result = await aChecker.getCompliance(page, `scan-${Date.now()}`);
    const report = result.report;

    if (!report || !report.results) {
      return {
        violations: [],
        potentialViolations: [],
        recommendations: [],
        timestamp: new Date().toISOString(),
      };
    }

    const violations = report.results.filter(
      (r: IBMEAViolation) => r.level === 'violation'
    );
    const potentialViolations = report.results.filter(
      (r: IBMEAViolation) => r.level === 'potentialviolation'
    );
    const recommendations = report.results.filter(
      (r: IBMEAViolation) => r.level === 'recommendation'
    );

    return {
      violations,
      potentialViolations,
      recommendations,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('[multi-scanner] IBM EA scan failed:', err);
    return {
      violations: [],
      potentialViolations: [],
      recommendations: [],
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Run all three scanners on the current page.
 *
 * Order: axe → IBM EA → Virtual SR (axe is fastest, virtual SR is slowest).
 * If virtual SR times out, we still return axe and IBM EA results.
 */
export async function runAllScanners(
  page: Page,
  _url?: string,
  _theme?: string,
  _viewport?: string,
): Promise<MultiScannerResult> {
  const url = _url || '';
  const theme = _theme || '';
  const viewport = _viewport || '';

  const [axe, ibmEA, virtualSR] = await Promise.all([
    runAxeScan(page),
    runIBMEAScan(page),
    auditPageWithVirtualSR(page).catch((err) => {
      console.warn(`[multi-scanner] Virtual SR failed: ${err.message}`);
      return {
        log: [],
        findings: [],
        timestamp: new Date().toISOString(),
      };
    }),
  ]);

  return {
    url,
    theme,
    viewport,
    axe,
    ibmEA,
    virtualSR,
    timestamp: new Date().toISOString(),
  };
}

// ── Cross-Reference Across All Three Tools ────────────────────────────────────

/**
 * Map axe rule IDs to virtual SR rule IDs for matching.
 */
const AXE_TO_VIRTUAL_MAP: Record<string, string[]> = {
  'image-alt': ['image-no-alt'],
  'button-name': ['empty-button'],
  'link-name': ['empty-link'],
  'heading-order': ['heading-skip'],
  'region': ['missing-main', 'missing-nav'],
  'label': ['input-no-label'],
};

/**
 * Map IBM EA rule IDs to virtual SR rule IDs for matching.
 */
const IBM_EA_TO_VIRTUAL_MAP: Record<string, string[]> = {
  'WCAG20_Input_HasLabel': ['input-no-label'],
  'WCAG20_A_HasText': ['empty-link'],
  'WCAG20_Body_HasBanner': ['missing-nav'],
  'WCAG20_Body_HasMain': ['missing-main'],
  'RPT_Html_Semantics': ['heading-skip'],
  'WCAG21_Label_ErrorMsg': ['input-no-label'],
};

/**
 * Normalize a string for fuzzy comparison — lowercase, strip punctuation, take first 20 chars.
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .slice(0, 20)
    .trim();
}

/**
 * Cross-reference results from all three scanners.
 *
 * A finding is "confirmed" if 2+ tools flag the same issue.
 * A finding is "investigate" if only 1 tool flags it.
 */
export function crossReferenceAll(result: MultiScannerResult): CrossRefResult {
  const confirmed: CrossRefEntry[] = [];
  const investigate: CrossRefEntry[] = [];
  const axeOnly: Array<{ rule: string; description: string }> = [];
  const ibmEAOnly: Array<{ rule: string; description: string }> = [];
  const virtualSROnly: VirtualSRFinding[] = [];

  // Build lookup maps for each tool
  const axeRules = new Map<string, AxeViolation>();
  for (const v of result.axe.violations) {
    axeRules.set(v.id, v);
  }

  const ibmEARules = new Map<string, IBMEAViolation>();
  for (const v of result.ibmEA.violations) {
    ibmEARules.set(v.ruleId, v);
  }

  const virtualRules = new Map<string, VirtualSRFinding>();
  for (const f of result.virtualSR.findings) {
    virtualRules.set(f.rule, f);
  }

  // Check each virtual SR finding against other tools
  for (const [vRule, vFinding] of virtualRules) {
    const tools = ['virtualSR'];
    const details: CrossRefEntry['details'] = { virtualSR: { rule: vRule, description: vFinding.description } };

    // Check axe
    for (const [aRule, aViolation] of axeRules) {
      const mappedVirtual = AXE_TO_VIRTUAL_MAP[aRule] || [];
      if (mappedVirtual.includes(vRule) || aRule === vRule) {
        tools.push('axe');
        details.axe = { rule: aRule, description: aViolation.description };
        break;
      }
      if (
        normalize(aViolation.description).includes(normalize(vFinding.description).slice(0, 12))
      ) {
        tools.push('axe');
        details.axe = { rule: aRule, description: aViolation.description };
        break;
      }
    }

    // Check IBM EA
    for (const [iRule, iViolation] of ibmEARules) {
      const mappedVirtual = IBM_EA_TO_VIRTUAL_MAP[iRule] || [];
      if (mappedVirtual.includes(vRule) || iRule === vRule) {
        tools.push('ibmEA');
        details.ibmEA = { rule: iRule, description: iViolation.message };
        break;
      }
      if (
        normalize(iViolation.message).includes(normalize(vFinding.description).slice(0, 12))
      ) {
        tools.push('ibmEA');
        details.ibmEA = { rule: iRule, description: iViolation.message };
        break;
      }
    }

    const confidence = tools.length >= 3 ? 'confirmed' : tools.length === 2 ? 'confirmed' : 'investigate';

    if (tools.length >= 2) {
      confirmed.push({
        rule: vRule,
        description: vFinding.description,
        tools,
        confidence,
        details,
      });
    } else {
      investigate.push({
        rule: vRule,
        description: vFinding.description,
        tools,
        confidence: 'investigate',
        details,
      });
    }
  }

  // Check axe rules not matched to virtual SR
  for (const [aRule, aViolation] of axeRules) {
    let matched = false;
    for (const [vRule] of virtualRules) {
      const mappedVirtual = AXE_TO_VIRTUAL_MAP[aRule] || [];
      if (mappedVirtual.includes(vRule) || aRule === vRule) {
        matched = true;
        break;
      }
      if (normalize(aViolation.description).includes(normalize(virtualRules.get(vRule)?.description || '').slice(0, 12))) {
        matched = true;
        break;
      }
    }
    // Also check IBM EA
    for (const [iRule] of ibmEARules) {
      if (iRule === aRule || normalize(aRule) === normalize(iRule)) {
        matched = true;
        break;
      }
    }
    if (!matched) {
      axeOnly.push({ rule: aRule, description: aViolation.description });
    }
  }

  // Check IBM EA rules not matched to others
  for (const [iRule, iViolation] of ibmEARules) {
    let matched = false;
    for (const [aRule] of axeRules) {
      if (aRule === iRule || normalize(aRule) === normalize(iRule)) {
        matched = true;
        break;
      }
    }
    for (const [vRule] of virtualRules) {
      const mappedVirtual = IBM_EA_TO_VIRTUAL_MAP[iRule] || [];
      if (mappedVirtual.includes(vRule) || iRule === vRule) {
        matched = true;
        break;
      }
    }
    if (!matched) {
      ibmEAOnly.push({ rule: iRule, description: iViolation.message });
    }
  }

  return { confirmed, investigate, axeOnly, ibmEAOnly, virtualSROnly: virtualSROnly };
}
