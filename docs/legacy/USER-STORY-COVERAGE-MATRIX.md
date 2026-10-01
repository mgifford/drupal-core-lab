# User Story Coverage Matrix

<!-- GENERATED FILE — DO NOT EDIT. -->
<!-- Regenerate with: npm run a11y:coverage -->

Generated: 2026-07-05T02:24:56.175Z

## Coverage Summary

- Total stories: 100
- Automated in Playwright: 18
- Documented only (not automated yet): 82
- Automation coverage: 18.0%

| Tier | Automated | Total | Coverage |
|---|---:|---:|---:|
| Tier 1 | 18 | 40 | 45.0% |
| Tier 2 | 0 | 40 | 0.0% |
| Tier 3 | 0 | 20 | 0.0% |

## Story-by-Story Matrix

### Authentication

| Story ID | Story Title | Tier | Status | Evidence |
|---|---|---|---|---|
| 1.1 | Registration Form - Keyboard Navigation Only | 1 | ✅ Automated | `core/tests/playwright/accessibility-workflows.spec.js` — Registration Form - Keyboard Navigation Only |
| 1.2 | Registration Form - Screen Reader Access | 1 | ✅ Automated | `core/tests/playwright/accessibility-workflows.spec.js` — Registration Form - Screen Reader Compliance |
| 1.3 | Password Reset Flow | 1 | 📄 Documented | — |
| 1.4 | Login with Username & Password | 1 | ✅ Automated | `core/tests/playwright/accessibility-workflows.spec.js` — Login Form - Keyboard Navigation |
| 1.5 | Login Error Messages - Visible & Announced | 1 | ✅ Automated | `core/tests/playwright/accessibility-workflows.spec.js` — Login Error Messages - Visible & Announced |
| 1.6 | Logout Confirmation | 1 | ✅ Automated | `core/tests/playwright/accessibility-workflows.spec.js` — Logout - Keyboard Navigation |
| 1.7 | Two-Factor Authentication (if enabled) | 1 | 📄 Documented | — |
| 1.8 | Account Verification Email (Receive & Verify) | 1 | 📄 Documented | — |
| 1.9 | Login Timeout Warning | 1 | 📄 Documented | — |
| 1.10 | Accessibility & Admin Permissions | 1 | 📄 Documented | — |

### Content Creation

| Story ID | Story Title | Tier | Status | Evidence |
|---|---|---|---|---|
| 2.1 | Create Node - Keyboard Navigation | 1 | ✅ Automated | `core/tests/playwright/accessibility-workflows.spec.js` — Create Node - Keyboard Navigation |
| 2.2 | Create Node - Form Validation Errors | 1 | ✅ Automated | `core/tests/playwright/accessibility-workflows.spec.js` — Form Validation Errors - Identified & Correctable |
| 2.3 | Rich Text Editor - CKEditor5 Accessibility | 1 | ✅ Automated | `core/tests/playwright/accessibility-workflows.spec.js` — Rich Text Editor - Keyboard Navigation |
| 2.4 | Add Featured Image - File Upload with Alt Text | 1 | ✅ Automated | `core/tests/playwright/accessibility-workflows.spec.js` — Add Featured Image - Alt Text Accessible |
| 2.5 | Schedule Publication - Accessible Date Picker | 1 | 📄 Documented | — |
| 2.6 | Taxonomy Term Assignment - Multi-Select | 1 | ✅ Automated | `core/tests/playwright/accessibility-workflows.spec.js` — Taxonomy Term Assignment - Keyboard Navigation |
| 2.7 | Content Preview - Accessible Preview | 1 | 📄 Documented | — |
| 2.8 | Save as Draft - Status Message | 1 | 📄 Documented | — |
| 2.9 | Publish Content - Success Confirmation | 1 | ✅ Automated | `core/tests/playwright/accessibility-workflows.spec.js` — Publish Content - Success Confirmation Announced |
| 2.10 | Edit Published Content - Change History Awareness | 1 | 📄 Documented | — |

### Forms

| Story ID | Story Title | Tier | Status | Evidence |
|---|---|---|---|---|
| 3.1 | Contact Form - All Fields Required | 1 | ✅ Automated | `core/tests/playwright/accessibility-workflows.spec.js` — Contact Form - Required Fields Marked |
| 3.2 | Contact Form - Error Recovery | 1 | ✅ Automated | `core/tests/playwright/accessibility-workflows.spec.js` — Contact Form - Error Recovery |
| 3.3 | Multi-Step Form - Progress Indicator | 1 | ✅ Automated | `core/tests/playwright/accessibility-workflows.spec.js` — Form Fields - Focus Indicator Visible on Tab |
| 3.4 | Form Field Instructions - Visible & Programmatic | 1 | ✅ Automated | `core/tests/playwright/accessibility-workflows.spec.js` — Form Field Instructions - Associated & Visible |
| 3.5 | Conditional Form Fields (Show/Hide) | 1 | 📄 Documented | — |
| 3.6 | Form Submission - No Time Limit | 1 | 📄 Documented | — |
| 3.7 | CAPTCHA Accessibility (if present) | 1 | 📄 Documented | — |
| 3.8 | Checkbox & Radio Groups - Grouped Labels | 1 | ✅ Automated | `core/tests/playwright/accessibility-workflows.spec.js` — Checkbox Groups - Grouped Labels Present |
| 3.9 | Form Field Focus - Focus Indicator Visible | 1 | ✅ Automated | `core/tests/playwright/accessibility-workflows.spec.js` — Form Submission - Status Message Clear |
| 3.10 | Form Submission Success - Redirect & Announcement | 1 | ✅ Automated | `core/tests/playwright/accessibility-workflows.spec.js` — Form No Time Limit - Submission Doesn\ |

### Navigation

| Story ID | Story Title | Tier | Status | Evidence |
|---|---|---|---|---|
| 4.1 | Main Menu - Keyboard Navigation | 1 | 📄 Documented | — |
| 4.2 | Main Menu - Screen Reader Announcements | 1 | 📄 Documented | — |
| 4.3 | Breadcrumb Navigation - Accessible | 1 | 📄 Documented | — |
| 4.4 | Skip Navigation Link - Functional | 1 | 📄 Documented | — |
| 4.5 | Pagination - All States Clear | 1 | 📄 Documented | — |
| 4.6 | Sticky Navigation - Not Blocking Content | 1 | 📄 Documented | — |
| 4.7 | Footer Navigation - Complete | 1 | 📄 Documented | — |
| 4.8 | Active Page Indicator - Current Location Clear | 1 | 📄 Documented | — |
| 4.9 | Search Navigation - Find & Filter Results | 1 | 📄 Documented | — |
| 4.10 | Mobile Menu (Hamburger) - Keyboard & Screen Reader | 1 | 📄 Documented | — |

### Media & Files

| Story ID | Story Title | Tier | Status | Evidence |
|---|---|---|---|---|
| 5.1 | Upload Image - Alt Text Required | 2 | 📄 Documented | — |
| 5.2 | Audio File Upload - Caption/Transcript Available | 2 | 📄 Documented | — |
| 5.3 | Video Embed - Captions & Transcripts | 2 | 📄 Documented | — |
| 5.4 | Document Download - Accessible Format Offered | 2 | 📄 Documented | — |
| 5.5 | Image Gallery - Keyboard Navigation & Descriptions | 2 | 📄 Documented | — |
| 5.6 | File List - Download Links Labeled | 2 | 📄 Documented | — |
| 5.7 | Lightbox/Modal Image Viewer - Keyboard Escape | 2 | 📄 Documented | — |
| 5.8 | Attachment Field - Multiple Files | 2 | 📄 Documented | — |
| 5.9 | Media Player Controls - Keyboard Accessible | 2 | 📄 Documented | — |
| 5.10 | File Preview - Accessible Format | 2 | 📄 Documented | — |

### Taxonomy

| Story ID | Story Title | Tier | Status | Evidence |
|---|---|---|---|---|
| 6.1 | Term Browser - Hierarchical Labels | 2 | 📄 Documented | — |
| 6.2 | Term Cloud - All Terms Accessible | 2 | 📄 Documented | — |
| 6.3 | Faceted Search - Filter by Tags | 2 | 📄 Documented | — |
| 6.4 | Tag Input - Auto-Complete Accessible | 2 | 📄 Documented | — |
| 6.5 | Category Filter - Multiple Selections | 2 | 📄 Documented | — |
| 6.6 | Term Autocomplete - Keyboard Navigation | 2 | 📄 Documented | — |
| 6.7 | Taxonomy Navigation - Current Category Marked | 2 | 📄 Documented | — |
| 6.8 | Search by Tag - Results Labeled | 2 | 📄 Documented | — |
| 6.9 | Vocabulary Selection - Multiple Taxonomies | 2 | 📄 Documented | — |
| 6.10 | Term Suggestions - Auto-Populated Field | 2 | 📄 Documented | — |

### Blocks & Layout

| Story ID | Story Title | Tier | Status | Evidence |
|---|---|---|---|---|
| 7.1 | Custom Block - Placed in Accessible Regions | 2 | 📄 Documented | — |
| 7.2 | Block Visibility Settings - Accessible Toggles | 2 | 📄 Documented | — |
| 7.3 | Hero Image Block - Alt Text Present | 2 | 📄 Documented | — |
| 7.4 | Card Layout - Multiple Columns Responsive | 2 | 📄 Documented | — |
| 7.5 | Sidebar Layout - Order Programmatic | 2 | 📄 Documented | — |
| 7.6 | Layout Grid System - Semantic Structure | 2 | 📄 Documented | — |
| 7.7 | Layout Mode Toggle (Full/Boxed/Sidebar) | 2 | 📄 Documented | — |
| 7.8 | Floating Elements - Not Covering Content | 2 | 📄 Documented | — |
| 7.9 | Block Margins & Spacing - Visual & Structural | 2 | 📄 Documented | — |
| 7.10 | Parallax Scrolling - Can Be Disabled | 2 | 📄 Documented | — |

### Comments

| Story ID | Story Title | Tier | Status | Evidence |
|---|---|---|---|---|
| 8.1 | Add Comment - Accessible Form | 2 | 📄 Documented | — |
| 8.2 | Comment Status - Awaiting Moderation | 2 | 📄 Documented | — |
| 8.3 | Reply to Comment - Threaded Comments | 2 | 📄 Documented | — |
| 8.4 | Comment Moderation - Admin Interface | 2 | 📄 Documented | — |
| 8.5 | Delete Comment - Confirmation | 2 | 📄 Documented | — |
| 8.6 | Comment Notifications - Email Accessible | 2 | 📄 Documented | — |
| 8.7 | Comment Count - Announcement | 2 | 📄 Documented | — |
| 8.8 | Comment Sorting - Order & Options | 2 | 📄 Documented | — |
| 8.9 | Comment Preview - Editable | 2 | 📄 Documented | — |
| 8.10 | Comment Username Link - Author Linkable | 2 | 📄 Documented | — |

### Views & Displays

| Story ID | Story Title | Tier | Status | Evidence |
|---|---|---|---|---|
| 9.1 | View Page - Accessible Table Display | 3 | 📄 Documented | — |
| 9.2 | View Exposed Filters - Keyboard Navigation | 3 | 📄 Documented | — |
| 9.3 | View Results - Empty State Message | 3 | 📄 Documented | — |
| 9.4 | Pager Links - Current Page Marked | 3 | 📄 Documented | — |
| 9.5 | View Style Switcher - Teaser/Full/Grid Selectable | 3 | 📄 Documented | — |
| 9.6 | View Result Count - Announced | 3 | 📄 Documented | — |
| 9.7 | View - Sortable Columns | 3 | 📄 Documented | — |
| 9.8 | View JSON/CSV Export - Link Accessible | 3 | 📄 Documented | — |
| 9.9 | View Block Attachment - Visible Location | 3 | 📄 Documented | — |
| 9.10 | View Facets - Multiple Selection & Reset | 3 | 📄 Documented | — |

### System & UI

| Story ID | Story Title | Tier | Status | Evidence |
|---|---|---|---|---|
| 10.1 | Login Page - Color Contrast | 3 | 📄 Documented | — |
| 10.2 | Admin Toolbar - Keyboard Accessible | 3 | 📄 Documented | — |
| 10.3 | Status Messages - Announced & Persisting | 3 | 📄 Documented | — |
| 10.4 | Error Messages - Linked to Fields | 3 | 📄 Documented | — |
| 10.5 | Breadcrumb Contrast - Links Underlined/Distinct | 3 | 📄 Documented | — |
| 10.6 | Link Identification - Purpose Clear Without Context | 3 | 📄 Documented | — |
| 10.7 | Form Focus - Tab Order Logical | 3 | 📄 Documented | — |
| 10.8 | Page Loading - Loading Indicator Announced | 3 | 📄 Documented | — |
| 10.9 | Dialog/Modal - Keyboard Trap Intentional & Escapable | 3 | 📄 Documented | — |
| 10.10 | System Site Settings - Accessible to Edit | 3 | 📄 Documented | — |
