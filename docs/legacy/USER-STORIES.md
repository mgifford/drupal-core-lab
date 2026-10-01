# Accessibility User Stories - 100 Validated Test Scenarios

This document provides a comprehensive framework for testing Drupal's accessibility. All stories follow WCAG 2.2 AA standards and are organized by functional area with cross-story workflow sequences for end-to-end validation.

**Document Status:** Validated for testing | **Last Updated:** May 2026 | **Framework:** WCAG 2.2 AA

---

## Overview: 10 Functional Areas × 10 Stories = 100 Test Scenarios

| Functional Area | Count | Priority | Key WCAG Criteria |
|---|---|---|---|
| **Authentication** | 10 | Tier 1 | 1.3.1, 2.1.1, 2.4.1, 3.3.1, 4.1.2 |
| **Content Creation** | 10 | Tier 1 | 1.1.1, 1.3.1, 2.1.1, 2.4.3, 3.3.1 |
| **Forms** | 10 | Tier 1 | 1.3.1, 2.1.1, 3.3.1, 3.3.3, 4.1.3 |
| **Navigation** | 10 | Tier 1 | 2.1.1, 2.4.1, 2.4.3, 2.4.8 |
| **Media & Files** | 10 | Tier 2 | 1.1.1, 1.2.1, 1.2.3, 2.5.1 |
| **Taxonomy** | 10 | Tier 2 | 1.3.1, 2.4.1, 3.3.4 |
| **Blocks & Layout** | 10 | Tier 2 | 1.3.1, 2.1.1, 2.4.1 |
| **Comments** | 10 | Tier 2 | 1.3.1, 2.4.1, 3.3.1 |
| **Views** | 10 | Tier 3 | 1.3.1, 2.1.1, 3.1.4 |
| **System & UI** | 10 | Tier 3 | 1.4.11, 2.1.1, 2.4.7, 4.1.2 |

**Total:** 100 stories | **Priority Distribution:** 30 Tier 1, 30 Tier 2, 40 Tier 3

---

## TIER 1: Critical Workflows (30 Stories)

These are essential user journeys that must work for all users. Tier 1 workflows are validated as cross-story sequences.

### 1. Authentication (10 Stories)

#### 1.1 Registration Form - Keyboard Navigation Only
- **User Type:** Motor disability (no mouse)
- **Workflow:** Tab through entire form → fill all fields keyboard-only → submit → verify success
- **WCAG:** 2.1.1 (Keyboard), 2.4.3 (Focus Visible), 4.1.2 (Name, Role, Value)
- **Test Path:** `/user/register`
- **Pass Criteria:** All form fields reach, focus indicators visible, error messages announced

#### 1.2 Registration Form - Screen Reader Access
- **User Type:** Vision disability (screen reader)
- **Workflow:** Navigate form with screen reader → verify all labels associated → fill fields → receive confirmation
- **WCAG:** 1.3.1 (Info & Relationships), 3.3.1 (Error Identification)
- **Test Path:** `/user/register`
- **Pass Criteria:** Form structure announced correctly, required fields marked, errors linked to fields

#### 1.3 Password Reset Flow
- **User Type:** Any (high-stress scenario)
- **Workflow:** Find password reset → enter email → receive link → reset password → login
- **WCAG:** 1.3.1, 2.4.1 (Landmarks), 3.3.1
- **Test Path:** `/user/password`
- **Pass Criteria:** Clear instructions, status messages announced, success confirmation clear

#### 1.4 Login with Username & Password
- **User Type:** Motor disability (keyboard-only)
- **Workflow:** Tab to username → enter → tab to password → enter → tab to login button → submit
- **WCAG:** 2.1.1, 2.4.3, 3.3.1
- **Test Path:** `/user/login`
- **Pass Criteria:** No keyboard trap, tab order logical, button activatable by Enter

#### 1.5 Login Error Messages - Visible & Announced
- **User Type:** Screen reader + visual attention
- **Workflow:** Submit invalid login → error message appears → error announced → message visible
- **WCAG:** 3.3.1 (Error Identification), 4.1.3 (Status Messages)
- **Test Path:** `/user/login` (with invalid credentials)
- **Pass Criteria:** Error announced immediately, error text color-independent, error persists

#### 1.6 Logout Confirmation
- **User Type:** Motor disability (accidental clicks)
- **Workflow:** Access logout → confirmation dialog → confirm logout → redirected
- **WCAG:** 2.4.1 (Landmarks), 3.3.4 (Error Prevention)
- **Test Path:** `/user/logout`
- **Pass Criteria:** Confirmation appears before action, action reversible or confirmed

#### 1.7 Two-Factor Authentication (if enabled)
- **User Type:** Motor + vision disability
- **Workflow:** Login → enter 2FA code field → receive code → enter code → verify
- **WCAG:** 1.3.1, 2.1.1, 3.3.1
- **Test Path:** `/user/login` (with 2FA enabled)
- **Pass Criteria:** Code entry accessible, time limit announced, field labeled clearly

#### 1.8 Account Verification Email (Receive & Verify)
- **User Type:** Vision disability
- **Workflow:** Register → receive email → click verification link → verify account
- **WCAG:** 1.1.1 (Alternative text in email), 3.3.1
- **Test Path:** Email → verification token
- **Pass Criteria:** Email readable with screen reader, link descriptive and clickable

#### 1.9 Login Timeout Warning
- **User Type:** Cognitive disability (needs time to react)
- **Workflow:** Session about to expire → warning displayed & announced → user takes action to stay logged in
- **WCAG:** 2.2.1 (Timing Adjustable), 4.1.3 (Status Messages)
- **Test Path:** `/admin` (or protected page with session timeout)
- **Pass Criteria:** Warning announced 5+ min before timeout, countdown available, extension possible

#### 1.10 Accessibility & Admin Permissions
- **User Type:** Vision disability + accessibility needs
- **Workflow:** Login as admin → navigate to accessibility settings → verify options present
- **WCAG:** 2.4.1 (Landmarks), 4.1.2 (States & Properties)
- **Test Path:** `/admin/config/system/site-information`
- **Pass Criteria:** Settings accessible, options labeled, changes persist

---

### 2. Content Creation (10 Stories)

#### 2.1 Create Node - Keyboard Navigation
- **User Type:** Motor disability (keyboard-only)
- **Workflow:** /node/add/article → fill title → fill body → tab through all fields → submit
- **WCAG:** 1.3.1, 2.1.1, 2.4.3
- **Test Path:** `/node/add/article`
- **Pass Criteria:** All fields reachable, tab order logical, submit button accessible

#### 2.2 Create Node - Form Validation Errors
- **User Type:** Vision + motor disability
- **Workflow:** Submit invalid content → validation errors appear → errors announced → user corrects
- **WCAG:** 3.3.1 (Error Identification), 3.3.4 (Error Prevention)
- **Test Path:** `/node/add/article` (with validation triggers)
- **Pass Criteria:** Errors identified, messages link to fields, user can correct & resubmit

#### 2.3 Rich Text Editor - CKEditor5 Accessibility
- **User Type:** Motor disability (keyboard navigation in editor)
- **Workflow:** Click CKEditor body field → navigate toolbar keyboard-only → apply formatting → verify applied
- **WCAG:** 2.1.1, 2.1.2 (No Keyboard Trap), 4.1.2
- **Test Path:** `/node/add/article` (in body field)
- **Pass Criteria:** Toolbar keyboard accessible, no keyboard trap, formatting keyboard shortcuts work

#### 2.4 Add Featured Image - File Upload with Alt Text
- **User Type:** Vision disability
- **Workflow:** Click upload field → select image → enter alt text → verify accessible
- **WCAG:** 1.1.1 (Alternative Text), 2.5.1 (Pointer Target Size)
- **Test Path:** `/node/add/article` (image field)
- **Pass Criteria:** Upload field accessible, alt text required, alt text verified on preview

#### 2.5 Schedule Publication - Accessible Date Picker
- **User Type:** Motor disability (no mouse)
- **Workflow:** Navigate to publish date/time → open picker → select date keyboard-only → confirm
- **WCAG:** 2.1.1, 2.1.2, 2.5.1
- **Test Path:** `/node/add/article` (publish date field)
- **Pass Criteria:** Date picker keyboard navigable, format clear, time settable without mouse

#### 2.6 Taxonomy Term Assignment - Multi-Select
- **User Type:** Motor disability (keyboard-only select)
- **Workflow:** Navigate to tags/categories field → add multiple terms keyboard-only → verify all added
- **WCAG:** 2.1.1, 3.3.1, 4.1.2
- **Test Path:** `/node/add/article` (taxonomy field)
- **Pass Criteria:** Select/checkbox accessible, terms announced, multiple selection works

#### 2.7 Content Preview - Accessible Preview
- **User Type:** Vision disability
- **Workflow:** Fill form → click "Preview" → content renders → back to edit
- **WCAG:** 2.4.1 (Landmarks), 4.1.2 (States)
- **Test Path:** `/node/add/article` → preview
- **Pass Criteria:** Preview announcement clear, navigation back accessible, focus managed

#### 2.8 Save as Draft - Status Message
- **User Type:** Cognitive disability (confirm action)
- **Workflow:** Fill content → click "Save as Draft" → status message appears → message announced
- **WCAG:** 4.1.3 (Status Messages), 3.3.4 (Error Prevention)
- **Test Path:** `/node/add/article` (save draft button)
- **Pass Criteria:** Status message announced immediately, message persists, user can confirm

#### 2.9 Publish Content - Success Confirmation
- **User Type:** Motor + vision disability
- **Workflow:** Complete form → submit → success page loads → verify content published
- **WCAG:** 3.3.4 (Error Prevention), 4.1.3 (Status Messages)
- **Test Path:** `/node/add/article` → submit
- **Pass Criteria:** Success announced, redirect accessible, link to published content provided

#### 2.10 Edit Published Content - Change History Awareness
- **User Type:** Cognitive disability
- **Workflow:** Edit existing node → make changes → be aware of revision history → save
- **WCAG:** 1.3.1 (Information & Relationships), 2.4.1 (Landmarks)
- **Test Path:** `/node/{nid}/edit`
- **Pass Criteria:** Revision history discoverable, current/published status clear, edits tracked

---

### 3. Forms (10 Stories)

#### 3.1 Contact Form - All Fields Required
- **User Type:** Screen reader user
- **Workflow:** Navigate form → identify required fields (mark/asterisk) → fill all → verify before submit
- **WCAG:** 1.3.1, 3.3.1, 3.3.2 (Labels & Instructions)
- **Test Path:** `/contact`
- **Pass Criteria:** Required fields marked with asterisk AND aria-required, labels associated, help text announced

#### 3.2 Contact Form - Error Recovery
- **User Type:** Motor disability
- **Workflow:** Submit incomplete form → errors shown → fix errors → resubmit successfully
- **WCAG:** 3.3.1, 3.3.4 (Error Prevention: Legal Commitments)
- **Test Path:** `/contact` (with validation)
- **Pass Criteria:** Errors listed with field references, form data retained, can resubmit

#### 3.3 Multi-Step Form - Progress Indicator
- **User Type:** Cognitive disability (needs orientation)
- **Workflow:** Start form → see progress (1/3) → navigate steps → complete all steps
- **WCAG:** 2.4.1 (Landmarks), 2.4.8 (Location & Wayfinding)
- **Test Path:** Multi-step form (if available)
- **Pass Criteria:** Step numbers announced, current step highlighted, progress clear, can return to previous

#### 3.4 Form Field Instructions - Visible & Programmatic
- **User Type:** Vision disability + hearing impairment
- **Workflow:** Enter field → hear instruction via screen reader → see instruction on screen → follow
- **WCAG:** 1.3.1 (Explicit Relationships), 3.3.2 (Labels & Instructions)
- **Test Path:** Any form with instructions (e.g., password requirements)
- **Pass Criteria:** Instructions programmatically associated, visually adjacent, format requirements listed

#### 3.5 Conditional Form Fields (Show/Hide)
- **User Type:** Motor disability (keyboard navigation)
- **Workflow:** Select option that triggers conditional fields → conditional fields appear → navigate to new fields
- **WCAG:** 4.1.3 (Status Messages), 2.1.1 (Keyboard)
- **Test Path:** Form with conditional logic
- **Pass Criteria:** Conditional show/hide announced, new fields are keyboard accessible, focus managed

#### 3.6 Form Submission - No Time Limit
- **User Type:** Motor disability (slow typist)
- **Workflow:** Start form → fill fields at own pace → form doesn't auto-submit or timeout
- **WCAG:** 2.2.1 (Timing Adjustable)
- **Test Path:** Any form submission
- **Pass Criteria:** No time limits, or time limits can be extended, or session extends automatically

#### 3.7 CAPTCHA Accessibility (if present)
- **User Type:** Vision disability
- **Workflow:** Reach CAPTCHA field → access audio alternative if available → complete challenge
- **WCAG:** 1.1.1 (Alternative Text), 2.1.1 (Keyboard)
- **Test Path:** Registration or contact form with CAPTCHA
- **Pass Criteria:** Audio CAPTCHA available, keyboard accessible, labeled "visual test alternative"

#### 3.8 Checkbox & Radio Groups - Grouped Labels
- **User Type:** Screen reader user
- **Workflow:** Reach group of checkboxes → hear group label → hear each option → select options
- **WCAG:** 1.3.1 (Grouping & Relationships), 3.3.2 (Labels)
- **Test Path:** Any form with checkbox/radio groups
- **Pass Criteria:** Fieldset & legend used, each input labeled, group purpose clear

#### 3.9 Form Field Focus - Focus Indicator Visible
- **User Type:** Motor disability (keyboard-only)
- **Workflow:** Tab through form → see focus indicator on every field → clear outline/color change
- **WCAG:** 2.4.7 (Focus Visible), 1.4.11 (Color Contrast non-text)
- **Test Path:** Any form
- **Pass Criteria:** 3:1 contrast on focus indicator, 4px minimum size/width, persistent during interaction

#### 3.10 Form Submission Success - Redirect & Announcement
- **User Type:** Cognitive + vision disability
- **Workflow:** Submit form → immediately redirected or status shown → page title changes → success announced
- **WCAG:** 4.1.3 (Status Messages), 2.4.3 (Focus Order)
- **Test Path:** `/contact` → submit valid form
- **Pass Criteria:** Status announced before redirect, heading on success page descriptive, focus moved appropriately

---

### 4. Navigation (10 Stories)

#### 4.1 Main Menu - Keyboard Navigation
- **User Type:** Motor disability (keyboard-only)
- **Workflow:** Tab into menu → use arrow keys to navigate → Enter to select → submenu expands keyboard-only
- **WCAG:** 2.1.1 (Keyboard), 2.1.2 (No Keyboard Trap)
- **Test Path:** Primary menu (header)
- **Pass Criteria:** All menu items keyboard accessible, arrow keys work, submenus open/close, no trap

#### 4.2 Main Menu - Screen Reader Announcements
- **User Type:** Vision disability (screen reader)
- **Workflow:** Access main menu → screen reader announces all items → navigate to item → activate
- **WCAG:** 4.1.2 (Name, Role, Value), 1.3.1 (Info & Relationships)
- **Test Path:** Primary menu
- **Pass Criteria:** Menu role present, items announced with level info, expanded state announced

#### 4.3 Breadcrumb Navigation - Accessible
- **User Type:** Motor + vision disability
- **Workflow:** See breadcrumb trail → access each link keyboard-only → click to navigate back
- **WCAG:** 2.4.8 (Location & Wayfinding), 1.3.1 (Current Page Indication)
- **Test Path:** Any content page (if breadcrumbs present)
- **Pass Criteria:** Breadcrumbs in nav landmark, current page marked (aria-current), all links keyboard accessible

#### 4.4 Skip Navigation Link - Functional
- **User Type:** Motor disability (keyboard-only)
- **Workflow:** Load page → immediately tab → "Skip to main content" appears → activate → focus on main
- **WCAG:** 2.4.1 (Bypass Blocks), 2.1.1 (Keyboard)
- **Test Path:** Any page
- **Pass Criteria:** Skip link visible on focus, functional, focus moves to main content

#### 4.5 Pagination - All States Clear
- **User Type:** Vision disability
- **Workflow:** See paginated list → identify current page → navigate to other pages → previous/next work
- **WCAG:** 2.4.8 (Location), 4.1.2 (Current state)
- **Test Path:** `/search` or any paginated list
- **Pass Criteria:** Current page marked (aria-current=page), all page numbers announced, links clear

#### 4.6 Sticky Navigation - Not Blocking Content
- **User Type:** Motor disability (needs zoom)
- **Workflow:** Zoom to 200% → scroll down → sticky nav present but not covering content
- **WCAG:** 1.4.10 (Reflow: no sticky nav blocking content at zoom)
- **Test Path:** Any page with sticky header
- **Pass Criteria:** Sticky nav doesn't trap content, reflow possible, can dismiss if present

#### 4.7 Footer Navigation - Complete
- **User Type:** Cognitive disability (orientation)
- **Workflow:** Tab to footer → access navigation → find links to all major sections → activate
- **WCAG:** 2.4.1 (Landmarks), 2.4.8 (Wayfinding)
- **Test Path:** Footer
- **Pass Criteria:** Footer navigation separate landmark, duplicate of header or substantial, all links present

#### 4.8 Active Page Indicator - Current Location Clear
- **User Type:** Vision disability
- **Workflow:** Navigate menu → current page item marked distinctly → indicator visible and programmatic
- **WCAG:** 4.1.2 (Current page state), 1.4.1 (Color not sole differentiator)
- **Test Path:** Any menu with active item
- **Pass Criteria:** aria-current=page set, visual indicator (not color-only), announcement clear

#### 4.9 Search Navigation - Find & Filter Results
- **User Type:** Motor disability (keyboard-only)
- **Workflow:** Use search → keyboard-only access results → activate filters → keyboard navigate filters
- **WCAG:** 2.1.1 (Keyboard), 2.4.3 (Focus Visible)
- **Test Path:** `/search`
- **Pass Criteria:** Search input keyboard accessible, results keyboard navigable, filters keyboard operable

#### 4.10 Mobile Menu (Hamburger) - Keyboard & Screen Reader
- **User Type:** Motor disability (mobile keyboard)
- **Workflow:** Focus hamburger button → activate with keyboard → menu expands → navigate items
- **WCAG:** 2.1.1, 2.5.1 (Target Size: 44x44px), 4.1.2
- **Test Path:** Mobile viewport (≤768px)
- **Pass Criteria:** Button has aria-expanded, menu keyboard accessible, focus trap managed, dismissible

---

## TIER 2: Important Workflows (30 Stories)

### 5. Media & Files (10 Stories)

#### 5.1 Upload Image - Alt Text Required
- **User Type:** Vision disability
- **Workflow:** Click upload field → select image → enter meaningful alt text → verify required
- **WCAG:** 1.1.1 (Alternative Text)
- **Test Path:** File upload field on content form
- **Pass Criteria:** Alt text field labeled, required indicator, validation prevents missing alt

#### 5.2 Audio File Upload - Caption/Transcript Available
- **User Type:** Hearing disability
- **Workflow:** Upload audio → transcript provided → verify accessibility
- **WCAG:** 1.2.1 (Audio-only content), 1.2.2 (Captions)
- **Test Path:** Media library upload
- **Pass Criteria:** Transcript link provided, audio file accessible via screen reader

#### 5.3 Video Embed - Captions & Transcripts
- **User Type:** Hearing disability + low bandwidth
- **Workflow:** Embedded video plays → captions visible → toggle on/off → transcript available
- **WCAG:** 1.2.1 (Captions), 1.2.2 (Transcripts)
- **Test Path:** Any page with embedded video
- **Pass Criteria:** CC button present, captions sync'd, transcript link, audio description available

#### 5.4 Document Download - Accessible Format Offered
- **User Type:** Vision disability
- **Workflow:** See PDF link → alternative format (HTML/TXT) offered → download both
- **WCAG:** 1.1.1 (Image & Format Alternatives)
- **Test Path:** Any downloadable document
- **Pass Criteria:** Alternative formats available, labeled clearly, equal information content

#### 5.5 Image Gallery - Keyboard Navigation & Descriptions
- **User Type:** Motor + vision disability
- **Workflow:** Navigate gallery keyboard-only → prev/next with arrow keys → alt text for each image
- **WCAG:** 1.1.1 (Alt Text), 2.1.1 (Keyboard)
- **Test Path:** Image gallery (if present)
- **Pass Criteria:** Gallery keyboard operable, arrows work, alt text substantial, descriptions outside images

#### 5.6 File List - Download Links Labeled
- **User Type:** Vision disability
- **Workflow:** See file list → identify file type → download link descriptive → file opens accessibly
- **WCAG:** 1.1.1 (Alternative Text), 4.1.2 (Link Purpose)
- **Test Path:** `/download` or media library
- **Pass Criteria:** File type identified (PDF, DOCX, etc.), file size listed, link text descriptive

#### 5.7 Lightbox/Modal Image Viewer - Keyboard Escape
- **User Type:** Motor disability (keyboard trap fear)
- **Workflow:** Open lightbox → close with Escape key → focus returns to trigger
- **WCAG:** 2.1.2 (No Keyboard Trap), 2.1.1 (Keyboard Accessible)
- **Test Path:** Any lightbox implementation
- **Pass Criteria:** Escape key closes, focus returns, focus trap prevented, modal role set

#### 5.8 Attachment Field - Multiple Files
- **User Type:** Motor disability (keyboard-only)
- **Workflow:** Add multiple attachments keyboard-only → each gets alt text → all appear in list
- **WCAG:** 2.1.1 (Keyboard), 1.1.1 (Alt Text)
- **Test Path:** Content form with attachments field
- **Pass Criteria:** Add/remove buttons keyboard accessible, alt text required for each, list complete

#### 5.9 Media Player Controls - Keyboard Accessible
- **User Type:** Motor disability (no mouse)
- **Workflow:** Play/pause with Space or Enter → volume with arrow keys → seekable with sliders
- **WCAG:** 2.1.1 (Keyboard), 2.5.1 (Pointer Target: 44px)
- **Test Path:** Media player
- **Pass Criteria:** All controls keyboard operable, play/pause single key, volume slider keyboard navigable

#### 5.10 File Preview - Accessible Format
- **User Type:** Vision disability
- **Workflow:** Click file preview → content readable with screen reader → formatting preserved
- **WCAG:** 1.4.5 (Images of Text), 1.1.1 (Alternative Text)
- **Test Path:** File preview modal
- **Pass Criteria:** Preview text-based when possible, images have alt text, no image-only format

---

### 6. Taxonomy (10 Stories)

#### 6.1 Term Browser - Hierarchical Labels
- **User Type:** Vision disability
- **Workflow:** Browse taxonomy → parent/child levels clear → drill down to child terms
- **WCAG:** 1.3.1 (Relationships), 2.4.8 (Location)
- **Test Path:** Taxonomy browser (if available)
- **Pass Criteria:** Hierarchy announced, parent items labeled, indentation or list structure clear

#### 6.2 Term Cloud - All Terms Accessible
- **User Type:** Motor disability (keyboard-only)
- **Workflow:** Tab through term cloud → each term a link → keyboard activate each
- **WCAG:** 2.1.1 (Keyboard), 1.3.1 (Visual order programmatic)
- **Test Path:** Term cloud widget
- **Pass Criteria:** All terms keyboard accessible, tab order logical, no skip links needed

#### 6.3 Faceted Search - Filter by Tags
- **User Type:** Motor disability
- **Workflow:** See facets → use checkboxes to filter → results update → results announced
- **WCAG:** 2.1.1 (Keyboard), 4.1.3 (Status Messages)
- **Test Path:** `/search` with filters
- **Pass Criteria:** Checkboxes keyboard operable, result count announced after filter, focus managed

#### 6.4 Tag Input - Auto-Complete Accessible
- **User Type:** Motor disability (keyboard-only)
- **Workflow:** Type in tag field → suggestions appear → navigate suggestions with arrow keys → select
- **WCAG:** 2.1.1 (Keyboard), 4.1.3 (Status Messages), 4.1.4 (Live Region)
- **Test Path:** Content form tag field
- **Pass Criteria:** Suggestions announced as appear, arrow keys navigate, Enter selects, escape closes

#### 6.5 Category Filter - Multiple Selections
- **User Type:** Motor disability
- **Workflow:** Select multiple categories (checkboxes) → all remain selected → apply filter
- **WCAG:** 2.1.1 (Keyboard), 3.3.1 (Required marked)
- **Test Path:** Filter form with category checkboxes
- **Pass Criteria:** Checkboxes keyboard selectable, state persists, none requires mouse

#### 6.6 Term Autocomplete - Keyboard Navigation
- **User Type:** Motor disability (keyboard-only)
- **Workflow:** Type first letter → suggestions appear → arrow down to select → Enter to confirm
- **WCAG:** 2.1.1 (Keyboard), 2.1.2 (No Keyboard Trap), 4.1.4 (Live Regions)
- **Test Path:** Tag input or autocomplete field
- **Pass Criteria:** Fully keyboard navigable, live region announces suggestions, enter confirms selection

#### 6.7 Taxonomy Navigation - Current Category Marked
- **User Type:** Vision disability
- **Workflow:** View taxonomy page → current category visually & programmatically marked
- **WCAG:** 4.1.2 (Current Page state), 1.4.1 (Color not sole means)
- **Test Path:** Category page URL
- **Pass Criteria:** aria-current set on current item, visual indicator (not color-only), breadcrumb updated

#### 6.8 Search by Tag - Results Labeled
- **User Type:** Vision disability
- **Workflow:** Click tag link → results filter by tag → page title/heading shows active tag
- **WCAG:** 2.4.2 (Page Titled), 1.3.1 (Info & Relationships)
- **Test Path:** Tag search results page
- **Pass Criteria:** Page title reflects tag, heading shows filter applied, tag value clear in UI

#### 6.9 Vocabulary Selection - Multiple Taxonomies
- **User Type:** Motor disability
- **Workflow:** Form with multiple taxonomy fields → each fieldset clear → select from each independently
- **WCAG:** 1.3.1 (Grouping), 3.3.2 (Labels)
- **Test Path:** Content form with multiple taxonomy fields
- **Pass Criteria:** Each taxonomy labeled, fieldsets distinct, no confusion between vocabularies

#### 6.10 Term Suggestions - Auto-Populated Field
- **User Type:** Cognitive disability (less clicking)
- **Workflow:** System suggests relevant terms → user accepts/rejects → terms added to content
- **WCAG:** 3.3.4 (Error Prevention: Suggestions), 4.1.2 (Name, Role, Value)
- **Test Path:** Auto-suggest taxonomy field
- **Pass Criteria:** Suggestions announced, accept/reject controls clear, applied terms listed

---

### 7. Blocks & Layout (10 Stories)

#### 7.1 Custom Block - Placed in Accessible Regions
- **User Type:** Vision disability
- **Workflow:** Custom block placed → read in document order → accessible in all breakpoints
- **WCAG:** 1.3.2 (Meaningful Sequence), 1.4.10 (Reflow)
- **Test Path:** Any page with custom blocks
- **Pass Criteria:** Blocks in logical order, heading structure consistent, responsive at all sizes

#### 7.2 Block Visibility Settings - Accessible Toggles
- **User Type:** Motor disability (keyboard-only)
- **Workflow:** Access block configuration → toggle visibility options keyboard-only → save changes
- **WCAG:** 2.1.1 (Keyboard), 3.3.2 (Labels)
- **Test Path:** `/admin/structure/block/manage/` (block configuration)
- **Pass Criteria:** Checkboxes/toggles keyboard operable, labels clear, form submittable with keyboard

#### 7.3 Hero Image Block - Alt Text Present
- **User Type:** Vision disability
- **Workflow:** See hero image block → image has meaningful alt text → alt text read by screen reader
- **WCAG:** 1.1.1 (Alternative Text)
- **Test Path:** Home page or landing page with hero
- **Pass Criteria:** Hero image has substantial alt text, decorative images have empty alt, purpose clear

#### 7.4 Card Layout - Multiple Columns Responsive
- **User Type:** Motor disability (at 200% zoom)
- **Workflow:** View card layout at zoom → columns reflow to single column → cards readable
- **WCAG:** 1.4.10 (Reflow)
- **Test Path:** Card grid layout
- **Pass Criteria:** At 2x zoom, single column layout, no horizontal scroll, card content readable

#### 7.5 Sidebar Layout - Order Programmatic
- **User Type:** Vision disability
- **Workflow:** Read sidebar content → order is meaningful → main content first (regardless of visual order)
- **WCAG:** 1.3.2 (Meaningful Sequence)
- **Test Path:** Two-column layout page
- **Pass Criteria:** Main content in first section of HTML, sidebar after, visual order via CSS only

#### 7.6 Layout Grid System - Semantic Structure
- **User Type:** Screen reader user
- **Workflow:** Navigate page → grid structure doesn't create artificial list/table nesting
- **WCAG:** 1.3.1 (Info & Relationships)
- **Test Path:** Any multi-column layout
- **Pass Criteria:** Grid divs have no role, content sections have proper headings, list markup used correctly

#### 7.7 Layout Mode Toggle (Full/Boxed/Sidebar)
- **User Type:** Motor disability (keyboard-only preferences)
- **Workflow:** Access layout settings → keyboard select layout mode → save preference → layout updates
- **WCAG:** 2.1.1 (Keyboard), 3.3.4 (Error Prevention: Preference Persistence)
- **Test Path:** User preferences or theme settings
- **Pass Criteria:** Layout options keyboard accessible, preference persists across sessions, all layouts equally accessible

#### 7.8 Floating Elements - Not Covering Content
- **User Type:** Motor disability (keyboard/zoom)
- **Workflow:** Zoom to 200% → floating elements (chat, ads) don't trap content → can dismiss
- **WCAG:** 2.5.5 (Target Size), 1.4.10 (Reflow)
- **Test Path:** Any page with floating elements
- **Pass Criteria:** Floating elements dismissible, content reachable, can reclaim space if present

#### 7.9 Block Margins & Spacing - Visual & Structural
- **User Type:** Motor disability (visual distinction)
- **Workflow:** See blocks → spacing between blocks clear → block boundaries distinct via structure
- **WCAG:** 1.3.1 (Visual grouping programmatic), 1.4.12 (Text Spacing)
- **Test Path:** Any page
- **Pass Criteria:** Margins from CSS only, heading structure defines sections, whitespace used, not border-only

#### 7.10 Parallax Scrolling - Can Be Disabled
- **User Type:** Vestibular disability (motion sensitivity)
- **Workflow:** Parallax enabled → user has setting to disable parallax → parallax disabled
- **WCAG:** 2.3.3 (Animation from Interactions)
- **Test Path:** Page with parallax effect
- **Pass Criteria:** prefers-reduced-motion respected, fallback to fixed background if animation disabled, no motion seizure risk

---

### 8. Comments (10 Stories)

#### 8.1 Add Comment - Accessible Form
- **User Type:** Motor disability (keyboard-only)
- **Workflow:** Tab to comment form → fill text area → tab to submit → enter submits
- **WCAG:** 2.1.1 (Keyboard), 3.3.1 (Error Identification)
- **Test Path:** Comment form on content page
- **Pass Criteria:** Form fully keyboard accessible, text area labeled, submit keyboard activatable

#### 8.2 Comment Status - Awaiting Moderation
- **User Type:** Vision disability
- **Workflow:** Submit comment → status message shown → message announced ("Awaiting moderation")
- **WCAG:** 4.1.3 (Status Messages)
- **Test Path:** Comment submission
- **Pass Criteria:** Status announced immediately, status persists, user knows to check later

#### 8.3 Reply to Comment - Threaded Comments
- **User Type:** Motor disability (keyboard navigation)
- **Workflow:** See parent comment → find reply button → activate keyboard-only → reply form appears
- **WCAG:** 2.1.1 (Keyboard), 2.4.1 (Landmarks)
- **Test Path:** Comment thread
- **Pass Criteria:** Reply button keyboard accessible, reply context clear, nesting levels announced

#### 8.4 Comment Moderation - Admin Interface
- **User Type:** Motor disability (keyboard-only admin)
- **Workflow:** Access comment moderation queue → tab through comments → approve/reject keyboard-only
- **WCAG:** 2.1.1 (Keyboard), 3.3.1 (Required fields marked)
- **Test Path:** `/admin/content/comment/approval`
- **Pass Criteria:** All actions keyboard accessible, status updates announced, bulk actions available

#### 8.5 Delete Comment - Confirmation
- **User Type:** Motor disability (prevent accidents)
- **Workflow:** Attempt to delete comment → confirmation dialog → confirm/cancel keyboard-only
- **WCAG:** 3.3.4 (Error Prevention: Reversible Actions)
- **Test Path:** Comment delete action
- **Pass Criteria:** Confirmation modal appears, dismissible via Escape, focus managed, message clear

#### 8.6 Comment Notifications - Email Accessible
- **User Type:** Vision disability
- **Workflow:** Comment notification email → readable by screen reader → link to comment
- **WCAG:** 1.1.1 (Alternative Text in email), 4.1.2 (Link Purpose)
- **Test Path:** Email notification
- **Pass Criteria:** Email text-based, link descriptive, formatting doesn't require CSS for structure

#### 8.7 Comment Count - Announcement
- **User Type:** Vision disability
- **Workflow:** See comment section → comment count announced → count is accurate
- **WCAG:** 1.3.1 (Info & Relationships), 4.1.2 (Name, Role, Value)
- **Test Path:** Comment section heading
- **Pass Criteria:** Heading structure includes count, count is programmatically associated, number accurate

#### 8.8 Comment Sorting - Order & Options
- **User Type:** Motor disability
- **Workflow:** See comment sort options → select sort via dropdown keyboard-only → comments reorder
- **WCAG:** 2.1.1 (Keyboard), 4.1.3 (Status Messages)
- **Test Path:** Comment sort dropdown
- **Pass Criteria:** Dropdown keyboard accessible, sort options announced, reorder announced

#### 8.9 Comment Preview - Editable
- **User Type:** Motor disability
- **Workflow:** Write comment → click "Preview" → formatted comment shown → "Edit" returns to form
- **WCAG:** 2.4.3 (Focus Order), 4.1.2 (States & Properties)
- **Test Path:** Comment form with preview
- **Pass Criteria:** Preview button accessible, formatted preview shows, edit link focuses on form

#### 8.10 Comment Username Link - Author Linkable
- **User Type:** Motor disability
- **Workflow:** Click comment author name → navigate to author profile keyboard-only
- **WCAG:** 2.1.1 (Keyboard), 4.1.2 (Link Purpose)
- **Test Path:** Comment author link
- **Pass Criteria:** Author link keyboard accessible, link text clear, profile page loads

---

## TIER 3: Extended Workflows (40 Stories)

### 9. Views & Displays (10 Stories)

#### 9.1 View Page - Accessible Table Display
- **User Type:** Vision disability (screen reader)
- **Workflow:** View displays content in table → table headers marked → relationships clear
- **WCAG:** 1.3.1 (Table Headers), 5.1.2 (Table Markup)
- **Test Path:** Any Views display as table
- **Pass Criteria:** scope="col/row" used, th elements for headers, table caption/summary present

#### 9.2 View Exposed Filters - Keyboard Navigation
- **User Type:** Motor disability (keyboard-only)
- **Workflow:** Tab to exposed filters → keyboard select filters → apply keyboard-only → results update
- **WCAG:** 2.1.1 (Keyboard), 4.1.3 (Status Messages)
- **Test Path:** View page with exposed filters
- **Pass Criteria:** All filters keyboard accessible, apply button keyboard activatable, results announced

#### 9.3 View Results - Empty State Message
- **User Type:** Vision disability
- **Workflow:** No search results → clear message states "No results found" → message programmatic
- **WCAG:** 3.3.5 (Help)
- **Test Path:** View with no results
- **Pass Criteria:** Message uses heading or aria-live, message suggests next actions, not generic

#### 9.4 Pager Links - Current Page Marked
- **User Type:** Vision disability
- **Workflow:** Navigate to view page 2 → current page (2) marked programmatically & visually
- **WCAG:** 4.1.2 (Current page state), 1.4.1 (Color not sole means)
- **Test Path:** View page with pager
- **Pass Criteria:** aria-current="page" on current page number, visual indicator present

#### 9.5 View Style Switcher - Teaser/Full/Grid Selectable
- **User Type:** Motor disability (keyboard-only)
- **Workflow:** Access view style switcher → select different view mode keyboard-only → content reflows
- **WCAG:** 2.1.1 (Keyboard), 1.3.2 (Meaningful Sequence)
- **Test Path:** View with multiple display modes
- **Pass Criteria:** Style buttons keyboard accessible, selected style marked, content switches, focus managed

#### 9.6 View Result Count - Announced
- **User Type:** Vision disability
- **Workflow:** Load view with filtered results → count announced ("Showing 10 of 45 results")
- **WCAG:** 4.1.3 (Status Messages)
- **Test Path:** View with filter applied
- **Pass Criteria:** Count announced at top of results, aria-live region used, count updates when filtered

#### 9.7 View - Sortable Columns
- **User Type:** Motor disability (keyboard-only)
- **Workflow:** Tab to sort link → activate with Enter → column sorts → ascending/descending toggle
- **WCAG:** 2.1.1 (Keyboard), 4.1.3 (Status Messages)
- **Test Path:** Table view with sortable headers
- **Pass Criteria:** Sort links keyboard accessible, current sort state indicated, direction announcedbefore/after click

#### 9.8 View JSON/CSV Export - Link Accessible
- **User Type:** Motor disability (keyboard-only)
- **Workflow:** Find export link → keyboard activate → file downloads
- **WCAG:** 2.1.1 (Keyboard), 4.1.2 (Link Purpose: File format)
- **Test Path:** View export options
- **Pass Criteria:** Export link keyboard accessible, link text includes file format (CSV/JSON), file downloads

#### 9.9 View Block Attachment - Visible Location
- **User Type:** Vision disability
- **Workflow:** View displays content as block in sidebar → heading & location clear
- **WCAG:** 2.4.1 (Landmarks), 2.4.8 (Location & Wayfinding)
- **Test Path:** View block in sidebar
- **Pass Criteria:** Block region identified, block title/heading present, content clearly associated with block

#### 9.10 View Facets - Multiple Selection & Reset
- **User Type:** Motor disability
- **Workflow:** Select multiple facets (checkboxes) → all remain checked → "Reset" clears all
- **WCAG:** 2.1.1 (Keyboard), 3.3.4 (Error Prevention: Reversible)
- **Test Path:** Faceted search view
- **Pass Criteria:** Facets keyboard operable, multiple selection works, reset button available & keyboard accessible

---

### 10. System & UI (10 Stories)

#### 10.1 Login Page - Color Contrast
- **User Type:** Low vision (color blindness, low acuity)
- **Workflow:** View login page → text on buttons/links readable → 4.5:1 contrast minimum
- **WCAG:** 1.4.3 (Contrast Minimum), 1.4.11 (Non-text Contrast: 3:1)
- **Test Path:** `/user/login`
- **Pass Criteria:** Text contrast 4.5:1, button/link background contrast 3:1, pass at 200% zoom

#### 10.2 Admin Toolbar - Keyboard Accessible
- **User Type:** Motor disability (keyboard-only)
- **Workflow:** Tab into admin toolbar → arrow keys navigate → Enter activates → no keyboard trap
- **WCAG:** 2.1.1 (Keyboard), 2.1.2 (No Keyboard Trap)
- **Test Path:** Admin toolbar (any admin page)
- **Pass Criteria:** Toolbar keyboard navigable, arrow keys work, submenu open/close, Escape closes, focus returns

#### 10.3 Status Messages - Announced & Persisting
- **User Type:** Vision disability (status confirmation)
- **Workflow:** Perform action → status message appears → announced by screen reader → persists for reading
- **WCAG:** 4.1.3 (Status Messages), 4.1.4 (Live Regions)
- **Test Path:** Any action that generates status (e.g., config save)
- **Pass Criteria:** Message in aria-live region, polite or assertive appropriate, message persists, user can dismiss

#### 10.4 Error Messages - Linked to Fields
- **User Type:** Screen reader user
- **Workflow:** Submit invalid form → error message shown → error associated with field
- **WCAG:** 3.3.1 (Error Identification)
- **Test Path:** Any form with validation
- **Pass Criteria:** aria-describedby links error to field, error text describes problem, error persists, field focused

#### 10.5 Breadcrumb Contrast - Links Underlined/Distinct
- **User Type:** Low vision + color blindness
- **Workflow:** Breadcrumb links visible → links underlined or distinct from text → color not sole differentiator
- **WCAG:** 1.4.1 (Use of Color), 1.4.11 (Non-text Contrast: 3:1)
- **Test Path:** Breadcrumb navigation
- **Pass Criteria:** Links underlined or bold, contrast 3:1 minimum, readable without color

#### 10.6 Link Identification - Purpose Clear Without Context
- **User Type:** Vision disability (links read aloud)
- **Workflow:** "Click here" link not acceptable → link text describes destination
- **WCAG:** 4.1.2 (Link Purpose from Context), 2.4.4 (Link Purpose)
- **Test Path:** Any page with links
- **Pass Criteria:** Link text descriptive standalone, "Click here" avoided, abbreviations expanded

#### 10.7 Form Focus - Tab Order Logical
- **User Type:** Motor disability (keyboard-only)
- **Workflow:** Tab through form → tab order follows visual order → backward tab works
- **WCAG:** 2.4.3 (Focus Order)
- **Test Path:** Any form
- **Pass Criteria:** Tab order matches reading order, backward tab (Shift+Tab) works, no skipped fields

#### 10.8 Page Loading - Loading Indicator Announced
- **User Type:** Vision disability (wait feedback)
- **Workflow:** Trigger page load/AJAX → loading indicator appears → "Loading..." announced
- **WCAG:** 4.1.3 (Status Messages), 4.1.4 (Live Regions)
- **Test Path:** Any AJAX action or slow page load
- **Pass Criteria:** Loading announced in aria-live, loading finishes announced, clear indication of progress

#### 10.9 Dialog/Modal - Keyboard Trap Intentional & Escapable
- **User Type:** Motor disability (keyboard-only)
- **Workflow:** Modal opens → Tab/Shift+Tab loops within modal → Escape closes → focus returns
- **WCAG:** 2.1.1 (Keyboard), 2.1.2 (No Keyboard Trap: Exception for modals)
- **Test Path:** Any modal/dialog
- **Pass Criteria:** Focus trap within modal intentional, Escape closes, focus returns to trigger

#### 10.10 System Site Settings - Accessible to Edit
- **User Type:** Motor disability (keyboard-only admin)
- **Workflow:** Access `/admin/config` → navigate settings keyboard-only → save changes keyboard-only
- **WCAG:** 2.1.1 (Keyboard), 3.3.2 (Labels)
- **Test Path:** `/admin/config/system/site-information`
- **Pass Criteria:** All fields keyboard accessible, labels present, save button keyboard activatable

---

## Cross-Story Workflow Sequences (End-to-End Validation)

Use these workflow sequences to validate complete user journeys:

### Sequence 1: User Onboarding (Tier 1)
1. **1.1** Registration Form - Keyboard Navigation Only
2. **1.2** Registration Form - Screen Reader Access
3. **1.8** Account Verification Email
4. **1.4** Login with Username & Password
5. **1.10** Accessibility & Admin Permissions (view user profile)

**Path:** `/user/register` → Email → `/user/login` → `/user/{uid}`

**Validation:** New user can complete entire registration → verification → login using keyboard-only AND screen reader. Account created successfully.

---

### Sequence 2: Content Publishing (Tier 1)
1. **2.1** Create Node - Keyboard Navigation
2. **2.3** Rich Text Editor - CKEditor5 Accessibility
3. **2.4** Add Featured Image - File Upload with Alt Text
4. **2.6** Taxonomy Term Assignment - Multi-Select
5. **2.9** Publish Content - Success Confirmation

**Path:** `/node/add/article` → Save → `/node/{nid}`

**Validation:** Author can create, format, add media, categorize, and publish content using keyboard-only. No mouse required.

---

### Sequence 3: Form Completion & Correction (Tier 1)
1. **3.1** Contact Form - All Fields Required
2. **3.2** Contact Form - Error Recovery
3. **3.8** Checkbox & Radio Groups - Grouped Labels
4. **3.9** Form Field Focus - Focus Indicator Visible
5. **3.10** Form Submission Success - Redirect & Announcement

**Path:** `/contact` → Submit → Validation → `/contact` → Success

**Validation:** User can complete form, receive errors, correct, and resubmit successfully. All interactions keyboard-only. Errors clearly identified and corrected.

---

### Sequence 4: Content Discovery & Navigation (Tier 1)
1. **4.1** Main Menu - Keyboard Navigation
2. **4.3** Breadcrumb Navigation - Accessible
3. **4.5** Pagination - All States Clear
4. **4.9** Search Navigation - Find & Filter Results
5. **9.2** View Exposed Filters - Keyboard Navigation

**Path:** Menu → Content → Breadcrumb back → Search → Filter results

**Validation:** User can navigate entire site structure using keyboard-only. All discovery paths work. Current location always clear.

---

### Sequence 5: Media Access (Tier 2)
1. **5.1** Upload Image - Alt Text Required
2. **5.2** Audio File Upload - Caption/Transcript Available
3. **5.3** Video Embed - Captions & Transcripts
4. **5.5** Image Gallery - Keyboard Navigation & Descriptions
5. **5.9** Media Player Controls - Keyboard Accessible

**Path:** Upload → Play → Navigate gallery → Experience full media accessibility

**Validation:** All media types accessible. Images have alt text. Audio/video have captions and transcripts. Media controls keyboard operable.

---

### Sequence 6: Administrative Tasks (Tier 2)
1. **10.2** Admin Toolbar - Keyboard Accessible
2. **10.8** Dialog/Modal - Keyboard Trap Intentional & Escapable
3. **8.4** Comment Moderation - Admin Interface
4. **7.2** Block Visibility Settings - Accessible Toggles
5. **10.10** System Site Settings - Accessible to Edit

**Path:** Admin area → Perform multiple admin tasks using keyboard-only

**Validation:** Admin tasks completable via keyboard. Modals/dialogs manageable. Settings manageable. No accessibility shortcuts bypass admin tasks.

---

## Testing Recommendations

### Manual Testing Priority
1. **Keyboard-Only Navigation** - Test all Tier 1 stories keyboard-only
2. **Screen Reader Testing** - Test Tier 1 stories with NVDA/JAWS
3. **Zoom & Reflow** - Test at 200% zoom, all breakpoints
4. **Color & Contrast** - Check 4.5:1 text, 3:1 UI elements
5. **Mobile/Touch** - Test at least Tier 1 on mobile, 44×44px targets

### Automated Testing (axe-core)
- Run on every page type
- Check all Tier 1 workflows
- Flag color contrast issues
- Verify ARIA attributes
- Test at multiple viewports

### Browser & Assistive Technology Coverage
- **Browsers:** Chrome, Firefox, Safari
- **Screen Readers:** NVDA (Windows), JAWS (Windows), VoiceOver (macOS/iOS)
- **Keyboards:** Standard keyboard, sticky keys enabled, keyboard-only testing

### Test Execution Cadence
- **Pre-release:** All 100 stories tested (Tier 1 mandatory)
- **Patch releases:** Tier 1 stories affected by patch
- **Routine:** Tier 1 monthly, Tier 2/3 quarterly

---

## Success Criteria

All stories passing means:
- ✅ Users with disabilities can complete core workflows
- ✅ No functionality blocked by physical/sensory disability
- ✅ Information conveyed through multiple modalities
- ✅ Keyboard-only users can access all features
- ✅ Screen reader users receive complete information
- ✅ Low vision users at 200% zoom can use site
- ✅ Color not used as sole differentiator
- ✅ All interactive elements keyboard operable
- ✅ Focus management clear throughout
- ✅ Status messages announced in real-time

---

## References & Standards

- **WCAG 2.2 Level AA:** Web Content Accessibility Guidelines
- **ARIA 1.2:** Accessible Rich Internet Applications
- **Mobile Accessibility:** Touch target 44×44 CSS pixels
- **Cognitive Accessibility:** Plain language, clear instructions
- **Motor Accessibility:** Keyboard-only operation, no click/drag-only
- **Sensory Accessibility:** Alt text, captions, transcripts

