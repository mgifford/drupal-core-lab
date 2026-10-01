---
name: ai_best_practices
description: Comprehensive AI-assisted accessibility practices for Drupal Core, including 100 validated user stories, automated workflows, module testing, and patch evaluation frameworks. Use when implementing, testing, or evaluating accessibility in Drupal — covers keyboard navigation, screen reader compatibility, WCAG 2.2 AA workflows, Playwright test suites, axe-core scanning, and patch evaluation.
---

# AI Best Practices for Drupal Accessibility

## Overview

This skill system provides comprehensive AI-assisted guidance for implementing, testing, and maintaining accessible Drupal Core. It combines 100 validated user stories, automated Playwright workflows, module-level accessibility testing, and patch evaluation frameworks.

**Framework:** WCAG 2.2 AA baseline  
**Automation Coverage:** 18% (100 stories total, 18 automated Playwright tests)  
**Generated:** 2026-05-06

## Sub-Skills

### 1. [Accessibility Workflows](./skills/accessibility-workflows/SKILL.md)
Automated Playwright test suite for core accessibility workflows (registration, content creation, forms, navigation).

**Use when:**
- Testing keyboard-only navigation
- Verifying screen reader compatibility
- Validating form error handling
- Testing focus management
- Checking ARIA implementation

**Coverage:** 18/100 stories automated (Tier 1 critical path)

---

### 2. [Accessibility User Stories](./skills/accessibility-user-stories/SKILL.md)
100 validated test scenarios across 10 functional areas (authentication, content creation, forms, navigation, media, taxonomy, blocks, comments, views, system UI).

**Use when:**
- Planning accessibility test coverage
- Understanding test scope and priorities
- Mapping workflows to WCAG criteria
- Prioritizing implementation
- Documenting accessibility requirements

**Structure:** 30 Tier 1, 30 Tier 2, 40 Tier 3 | 10 functional areas

---

### 3. [Module Testing](./skills/module-testing/SKILL.md)
Framework for testing accessibility impact of individual Drupal Core modules with enable/disable orchestration and impact analysis.

**Use when:**
- Testing experimental modules
- Detecting accessibility regressions from module interactions
- Measuring accessibility improvements
- Tracking module dependencies
- Filing accessibility issues per module

**Scope:** 100+ modules categorized by impact (test_only, experimental, optional, core)

---

### 4. [Patch Evaluation](./skills/patch-evaluation/SKILL.md)
Evaluate accessibility patches with stable instance_id/pattern_id tracking per bug-reporting standards.

**Use when:**
- Automating patch evaluation
- Tracking violation fixes across pages
- Detecting regression patterns
- Generating patch evaluation reports
- Validating before/after accessibility metrics

**Output:** Markdown reports, JSON evaluation data, HTML views with instance/pattern tracking

---

### 5. [Bug Reporting](./skills/bug-reporting/SKILL.md)
File accessibility bugs with stable IDs, WCAG criteria, and reproducibility steps per mgifford/ACCESSIBILITY.md schema.

**Use when:**
- Reporting accessibility violations
- Filing Drupal core issues
- Documenting reproducible bugs
- Tracking pattern-level regressions
- Creating issue templates

**Schema:** instance_id (single violation), pattern_id (recurring pattern), stable tracking across runs

---

## Quick Start

### 1. Validate User Story Coverage
```bash
# Check what's automated vs. documented
grep "| Automated\|| Documented" USER-STORY-COVERAGE-MATRIX.md

# See prioritized implementation queue
cat IMPLEMENTATION-QUEUE.md
```

### 2. Run Automated Workflows
```bash
# Test Tier 1 accessibility workflows
npm run test:accessibility-workflows

# Evaluate a specific patch
npm run a11y:evaluate-patch <patch-name>
```

### 3. Discover & Test Modules
```bash
# Generate module config
npm run a11y:discover-modules

# Analyze module impact (when scripts complete)
npm run a11y:analyze-module-impact
```

### 4. File Accessibility Issues
- Use [Bug Reporting](./skills/bug-reporting/SKILL.md) schema
- Include instance_id or pattern_id
- Reference USER-STORIES.md story ID
- Link to mgifford/ACCESSIBILITY.md requirements

---

## Key Metrics

| Metric | Value | Target |
|---|---|---|
| User Stories Defined | 100 | 100 |
| Automated Tests (Playwright) | 18 | 40+ Tier 1 |
| Tier 1 Coverage | 45% | 100% |
| Tier 2 Coverage | 0% | 50%+ |
| Tier 3 Coverage | 0% | 50%+ |
| Modules Tracked | 100+ | All |
| Patches Evaluated | 10 | All submitted |

---

## Architecture

```
ai_best_practices/
├── SKILL.md (parent skill — this file)
├── README.md
├── skills/
│   ├── accessibility-workflows/
│   │   └── SKILL.md
│   ├── accessibility-user-stories/
│   │   └── SKILL.md
│   ├── module-testing/
│   │   └── SKILL.md
│   ├── patch-evaluation/
│   │   └── SKILL.md
│   └── bug-reporting/
│       └── SKILL.md
└── references/
    ├── USER-STORIES.md (100 stories)
    ├── USER-STORY-COVERAGE-MATRIX.md (automation tracking)
    ├── IMPLEMENTATION-QUEUE.md (prioritized roadmap)
    ├── TESTING-ACCESSIBILITY-WORKFLOWS.md (test guide)
    ├── EXPERIMENTAL-MODULE-A11Y-TESTING.md (module framework)
    └── patches/ (10 evaluated patches + reports)
```

---

## Contributing

To add accessibility code to this skill:

1. **File Issue** on [drupal.org/project/ai_best_practices](https://www.drupal.org/project/ai_best_practices) with reference to issue [#3581685](https://www.drupal.org/project/ai_best_practices/issues/3581685)
2. **Create Patch** following drupal.org patch workflow
3. **Reference Skills** in MR description (e.g., "Adds accessibility-workflows sub-skill")
4. **Include Evidence:** USER-STORY-COVERAGE-MATRIX.md, test results, WCAG mapping

---

## Standards & References

- **WCAG 2.2 AA** — Baseline accessibility standard
- **mgifford/ACCESSIBILITY.md** — Bug reporting schema, sustainability policy
- **drupal.org/project/ai_best_practices** — Skill project (MR 25)
- **axe-core 4.x** — Automated accessibility scanning
- **Playwright 1.x** — Browser automation for user workflows

---

## Status

✅ **Completed:**
- 100 user stories defined and validated
- 18 Playwright tests automated (Tier 1 critical path)
- Module discovery & categorization (100+ modules)
- Patch evaluation framework with instance_id/pattern_id schema
- Bug-reporting schema implemented

⏳ **In Progress:**
- Complete remaining Tier 1 tests (22 stories)
- Tier 2 workflow automation (media, taxonomy, layout, comments)
- Module orchestration scripts (test-module-accessibility, analyze-module-impact)
- Patch file repairs (corrupt headers, path updates)

❌ **Not Started:**
- Tier 3 automation (views, system UI)
- Module × Theme matrix testing
- Module × RTL language testing
- Full CI/CD pipeline

---

## Questions?

See [drupal.org/project/ai_best_practices](https://www.drupal.org/project/ai_best_practices) or file an issue referencing this skill.
