---
title: "Accessibility User Stories - 100 Test Scenarios"
description: "100 validated test scenarios across 10 functional areas (authentication, content creation, forms, navigation, media, taxonomy, blocks, comments, views, system UI). Organized by Tier (1=critical, 2=important, 3=extended) with WCAG 2.2 AA mapping."
author: "Mike Gifford"
version: "1.0.0"
parent: "ai_best_practices"
keywords:
  - accessibility
  - user stories
  - testing
  - WCAG 2.2
  - test scenarios
  - requirements
  - functional areas
triggers:
  - "user stories"
  - "test coverage"
  - "accessibility requirements"
  - "WCAG mapping"
  - "test priorities"
enforce: "soft"
---

# Accessibility User Stories - 100 Test Scenarios

## Overview

100 validated accessibility test scenarios across 10 functional areas. All stories follow WCAG 2.2 AA baseline and are organized by Tier (critical → extended).

**Total Stories:** 100  
**Tier Distribution:** 30 Tier 1 (critical), 30 Tier 2 (important), 40 Tier 3 (extended)  
**Functional Areas:** 10 (10 stories per area)  
**Automation Status:** 18 automated (Tier 1 workflows), 82 documented-only

---

## Functional Areas

| Area | Count | Priority | Key WCAG | Notes |
|---|---|---|---|---|
| **1. Authentication** | 10 | Tier 1 | 1.3.1, 2.1.1, 2.4.1, 3.3.1 | User entry workflows |
| **2. Content Creation** | 10 | Tier 1 | 1.1.1, 1.3.1, 2.1.1, 2.4.3 | Publishing workflows |
| **3. Forms** | 10 | Tier 1 | 1.3.1, 2.1.1, 3.3.1, 3.3.3 | Form patterns & validation |
| **4. Navigation** | 10 | Tier 1 | 2.1.1, 2.4.1, 2.4.3, 2.4.8 | Core usability |
| **5. Media & Files** | 10 | Tier 2 | 1.1.1, 1.2.1, 1.2.3, 2.5.1 | Content accessibility |
| **6. Taxonomy** | 10 | Tier 2 | 1.3.1, 2.4.1, 3.3.4 | Organization & discovery |
| **7. Blocks & Layout** | 10 | Tier 2 | 1.3.1, 2.1.1, 2.4.1 | Structural integrity |
| **8. Comments** | 10 | Tier 2 | 1.3.1, 2.4.1, 3.3.1 | Community features |
| **9. Views** | 10 | Tier 3 | 1.3.1, 2.1.1, 3.1.4 | Advanced data display |
| **10. System & UI** | 10 | Tier 3 | 1.4.11, 2.1.1, 2.4.7, 4.1.2 | Systemic polish |

---

## Story Structure

Each story includes:

- **Story ID** — Format: `{area}.{number}` (e.g., 1.1, 5.7)
- **Title** — Concise description
- **Tier** — 1 (critical), 2 (important), 3 (extended)
- **User Type** — Disability or scenario (e.g., motor, vision, cognitive)
- **Workflow** — Step-by-step user journey
- **WCAG** — Applicable standards
- **Test Path** — URL or feature path to test
- **Pass Criteria** — Specific validation points

---

## Tier Definitions

### Tier 1: Critical Workflows (30 Stories)
Essential user journeys that **must work** for all users. These are blocking features—users cannot achieve their goals without them.

**Examples:**
- Authentication (login, registration, password reset)
- Basic content creation (create, edit, publish)
- Core forms (contact, search)
- Primary navigation

**Automation Goal:** 100% (currently 45% = 18/40)

### Tier 2: Important Features (30 Stories)
Significant functionality that **should work** accessibly. These are high-impact but not strictly blocking.

**Examples:**
- Media (alt text, captions, galleries)
- Taxonomy (filtering, browsing, search)
- Layout (blocks, regions, responsive)
- Comments (discussion, moderation)

**Automation Goal:** 50%+ (currently 0%)

### Tier 3: Extended Functionality (40 Stories)
System polish and advanced features that **should work** but lower priority.

**Examples:**
- Views (tables, filters, sorting, export)
- System UI (admin toolbar, status messages, themes)
- Performance (loading states, pagination)

**Automation Goal:** 50%+ (currently 0%)

---

## Quick Reference: Story IDs

### Authentication (1.x)
```
1.1  Registration Form - Keyboard Navigation Only               ✅ Automated
1.2  Registration Form - Screen Reader Access                  ✅ Automated
1.3  Password Reset Flow                                        📝 Documented
1.4  Login with Username & Password                            ✅ Automated
1.5  Login Error Messages - Visible & Announced                ✅ Automated
1.6  Logout Confirmation                                        ✅ Automated
1.7  Two-Factor Authentication (if enabled)                    📝 Documented
1.8  Account Verification Email (Receive & Verify)             📝 Documented
1.9  Login Timeout Warning                                      📝 Documented
1.10 Accessibility & Admin Permissions                          📝 Documented
```

### Content Creation (2.x)
```
2.1  Create Node - Keyboard Navigation                         ✅ Automated
2.2  Create Node - Form Validation Errors                      ✅ Automated
2.3  Rich Text Editor - CKEditor5 Accessibility               ✅ Automated
2.4  Add Featured Image - File Upload with Alt Text            ✅ Automated
2.5  Schedule Publication - Accessible Date Picker             📝 Documented
2.6  Taxonomy Term Assignment - Multi-Select                   ✅ Automated
2.7  Content Preview - Accessible Preview                      📝 Documented
2.8  Save as Draft - Status Message                            📝 Documented
2.9  Publish Content - Success Confirmation                    ✅ Automated
2.10 Edit Published Content - Change History Awareness         📝 Documented
```

### Forms (3.x)
```
3.1  Contact Form - All Fields Required                        ✅ Automated
3.2  Contact Form - Error Recovery                             ✅ Automated
3.3  Multi-Step Form - Progress Indicator                      ✅ Automated
3.4  Form Field Instructions - Visible & Programmatic          ✅ Automated
3.5  Conditional Form Fields (Show/Hide)                       📝 Documented
3.6  Form Submission - No Time Limit                           📝 Documented
3.7  CAPTCHA Accessibility (if present)                        📝 Documented
3.8  Checkbox & Radio Groups - Grouped Labels                 ✅ Automated
3.9  Form Field Focus - Focus Indicator Visible               ✅ Automated
3.10 Form Submission Success - Redirect & Announcement         ✅ Automated
```

### Navigation (4.x)
```
4.1  Main Menu - Keyboard Navigation                           📝 Documented
4.2  Main Menu - Screen Reader Announcements                   📝 Documented
4.3  Breadcrumb Navigation - Accessible                        📝 Documented
4.4  Skip Navigation Link - Functional                         📝 Documented
4.5  Pagination - All States Clear                             📝 Documented
4.6  Sticky Navigation - Not Blocking Content                  📝 Documented
4.7  Footer Navigation - Complete                              📝 Documented
4.8  Active Page Indicator - Current Location Clear            📝 Documented
4.9  Search Navigation - Find & Filter Results                 📝 Documented
4.10 Mobile Menu (Hamburger) - Keyboard & Screen Reader       📝 Documented
```

### Media & Files (5.x)
```
5.1  Upload Image - Alt Text Required                          📝 Documented (T2)
5.2  Audio File Upload - Caption/Transcript Available          📝 Documented (T2)
5.3  Video Embed - Captions & Transcripts                      📝 Documented (T2)
5.4  Document Download - Accessible Format Offered             📝 Documented (T2)
5.5  Image Gallery - Keyboard Navigation & Descriptions        📝 Documented (T2)
5.6  File List - Download Links Labeled                        📝 Documented (T2)
5.7  Lightbox/Modal Image Viewer - Keyboard Escape             📝 Documented (T2)
5.8  Attachment Field - Multiple Files                         📝 Documented (T2)
5.9  Media Player Controls - Keyboard Accessible               📝 Documented (T2)
5.10 File Preview - Accessible Format                          📝 Documented (T2)
```

### Taxonomy (6.x) — All Tier 2
```
6.1  Term Browser - Hierarchical Labels                        📝 Documented (T2)
6.2  Term Cloud - All Terms Accessible                         📝 Documented (T2)
6.3  Faceted Search - Filter by Tags                           📝 Documented (T2)
6.4  Tag Input - Auto-Complete Accessible                      📝 Documented (T2)
6.5  Category Filter - Multiple Selections                     📝 Documented (T2)
6.6  Term Autocomplete - Keyboard Navigation                   📝 Documented (T2)
6.7  Taxonomy Navigation - Current Category Marked             📝 Documented (T2)
6.8  Search by Tag - Results Labeled                           📝 Documented (T2)
6.9  Vocabulary Selection - Multiple Taxonomies                📝 Documented (T2)
6.10 Term Suggestions - Auto-Populated Field                   📝 Documented (T2)
```

### Blocks & Layout (7.x) — All Tier 2
```
7.1  Custom Block - Placed in Accessible Regions               📝 Documented (T2)
7.2  Block Visibility Settings - Accessible Toggles            📝 Documented (T2)
7.3  Hero Image Block - Alt Text Present                       📝 Documented (T2)
7.4  Card Layout - Multiple Columns Responsive                 📝 Documented (T2)
7.5  Sidebar Layout - Order Programmatic                       📝 Documented (T2)
7.6  Layout Grid System - Semantic Structure                   📝 Documented (T2)
7.7  Layout Mode Toggle (Full/Boxed/Sidebar)                   📝 Documented (T2)
7.8  Floating Elements - Not Covering Content                  📝 Documented (T2)
7.9  Block Margins & Spacing - Visual & Structural             📝 Documented (T2)
7.10 Parallax Scrolling - Can Be Disabled                      📝 Documented (T2)
```

### Comments (8.x) — All Tier 2
```
8.1  Add Comment - Accessible Form                             📝 Documented (T2)
8.2  Comment Status - Awaiting Moderation                      📝 Documented (T2)
8.3  Reply to Comment - Threaded Comments                      📝 Documented (T2)
8.4  Comment Moderation - Admin Interface                      📝 Documented (T2)
8.5  Delete Comment - Confirmation                             📝 Documented (T2)
8.6  Comment Notifications - Email Accessible                  📝 Documented (T2)
8.7  Comment Count - Announcement                              📝 Documented (T2)
8.8  Comment Sorting - Order & Options                         📝 Documented (T2)
8.9  Comment Preview - Editable                                📝 Documented (T2)
8.10 Comment Username Link - Author Linkable                   📝 Documented (T2)
```

### Views (9.x) — All Tier 3
```
9.1  View Page - Accessible Table Display                      📝 Documented (T3)
9.2  View Exposed Filters - Keyboard Navigation                📝 Documented (T3)
9.3  View Results - Empty State Message                        📝 Documented (T3)
9.4  Pager Links - Current Page Marked                         📝 Documented (T3)
9.5  View Style Switcher - Teaser/Full/Grid Selectable         📝 Documented (T3)
9.6  View Result Count - Announced                             📝 Documented (T3)
9.7  View - Sortable Columns                                   📝 Documented (T3)
9.8  View JSON/CSV Export - Link Accessible                    📝 Documented (T3)
9.9  View Block Attachment - Visible Location                  📝 Documented (T3)
9.10 View Facets - Multiple Selection & Reset                  📝 Documented (T3)
```

### System & UI (10.x) — All Tier 3
```
10.1  Login Page - Color Contrast                              📝 Documented (T3)
10.2  Admin Toolbar - Keyboard Accessible                      📝 Documented (T3)
10.3  Status Messages - Announced & Persisting                 📝 Documented (T3)
10.4  Error Messages - Linked to Fields                        📝 Documented (T3)
10.5  Breadcrumb Contrast - Links Underlined/Distinct          📝 Documented (T3)
10.6  Link Identification - Purpose Clear Without Context      📝 Documented (T3)
10.7  Form Focus - Tab Order Logical                           📝 Documented (T3)
10.8  Page Loading - Loading Indicator Announced               📝 Documented (T3)
10.9  Dialog/Modal - Keyboard Trap Intentional & Escapable     📝 Documented (T3)
10.10 System Site Settings - Accessible to Edit                📝 Documented (T3)
```

---

## Using User Stories

### 1. Planning Test Coverage
```bash
# See full story details
cat USER-STORIES.md

# See automation status
cat USER-STORY-COVERAGE-MATRIX.md
```

### 2. Prioritizing Implementation
```bash
# See phased roadmap with dependencies
cat IMPLEMENTATION-QUEUE.md
```

### 3. Writing Tests
Reference story ID in test name:
```javascript
test('1.1: Registration Form - Keyboard Navigation Only', async ({ page }) => {
  // Test logic
});
```

### 4. Filing Issues
Reference story in issue:
- Issue title: `Accessibility: Story {ID} - {Title}`
- Issue body: Include story ID, WCAG criteria, user type

---

## References

- **Full Stories:** [USER-STORIES.md](../../../../../../USER-STORIES.md) (3,500+ lines)
- **Coverage Matrix:** [USER-STORY-COVERAGE-MATRIX.md](../../../../../../USER-STORY-COVERAGE-MATRIX.md)
- **Implementation Queue:** [IMPLEMENTATION-QUEUE.md](../../../../../../IMPLEMENTATION-QUEUE.md)
- **Automated Tests:** [core/tests/playwright/accessibility-workflows.spec.js](../../../../../../core/tests/playwright/accessibility-workflows.spec.js)
- **WCAG 2.2 AA:** https://www.w3.org/WAI/WCAG22/quickref/
