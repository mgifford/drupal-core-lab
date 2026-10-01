# Prioritized Implementation Queue

Generated: 2026-05-06  
Coverage Status: 18/100 automated (18%), 82/100 remaining  
**Goal:** 100% automated Tier 1 (currently 45%), then high-impact Tier 2, then Tier 3

---

## Phase 1: Complete Tier 1 Workflows (22 Stories Remaining)

**Current Status:** 18/40 Tier 1 automated (45%) | **Target:** 40/40 (100%)  
**Estimated Effort:** 8–12 weeks (2–3 stories/week with thorough QA)  
**Blocking:** None—can proceed immediately

### Phase 1A: Authentication Gap (6 Stories)
Completes critical user-entry workflows.

| Priority | Story ID | Title | Complexity | Impact | Notes |
|---|---|---|---|---|---|
| 1 | 1.3 | Password Reset Flow | Medium | High | Stress scenario; affects user retention |
| 2 | 1.7 | Two-Factor Authentication | High | High | Conditional on 2FA module; security-critical |
| 3 | 1.8 | Account Verification Email | Medium | Medium | Email rendering variable; test in multiple clients |
| 4 | 1.9 | Login Timeout Warning | Medium | Medium | Requires session fixture; timing-sensitive |
| 5 | 1.10 | Accessibility & Admin Permissions | Low | Low | Admin UI; non-blocking for public workflows |

**Workflow Sequence:**
```
1.1 (keyboard-only) → 1.2 (screen reader) → 1.4 (login) → 1.5 (errors)
                                                    ↓
                                            1.6 (logout)
                                                    ↓
                          1.3 (password reset) ← (forgot password)
                          1.7 (2FA) ← (optional; after 1.4)
                          1.8 (email verify) ← (during 1.1)
                          1.9 (timeout) ← (session guard)
                          1.10 (admin access) ← (permissions check)
```

**Test Hooks:**
- 1.3: Requires password reset email interception (fake SMTP)
- 1.7: Enable 2FA module conditionally; mock OTP generation
- 1.8: Parse verification link from email; simulate email client rendering
- 1.9: Simulate session expiration; measure announcement timing
- 1.10: Verify accessibility settings appear in admin UI

---

### Phase 1B: Content Creation Gap (4 Stories)
Covers publishing workflow edge cases.

| Priority | Story ID | Title | Complexity | Impact | Notes |
|---|---|---|---|---|---|
| 6 | 2.5 | Schedule Publication - Accessible Date Picker | Medium | Medium | Date picker UX varies by browser/OS |
| 7 | 2.7 | Content Preview - Accessible Preview | Low | Medium | Read-only mode; focus management critical |
| 8 | 2.8 | Save as Draft - Status Message | Low | Low | Live region announcement; simple to test |
| 9 | 2.10 | Edit Published Content - Change History Awareness | Medium | Low | Revision UI; optional for MVP |

**Workflow Sequence:**
```
2.1 (create) → 2.2 (errors) → 2.3 (editor) → 2.4 (image) → 2.6 (taxonomy)
                                                 ↓
                        2.5 (schedule) ← (timing control)
                        2.7 (preview) ← (before publish)
                        2.8 (draft) ← (interim state)
                        2.9 (publish) → 2.10 (edit) ← (revisions)
```

**Test Hooks:**
- 2.5: Test date picker with keyboard only + screen reader; verify value announced
- 2.7: Verify focus returns to publish button after closing preview
- 2.8: Confirm status message (e.g., "Draft saved") announced via live region
- 2.10: Render revision list; ensure current version highlighted

---

### Phase 1C: Complex Form Patterns (3 Stories)
Covers conditional logic and multi-step workflows.

| Priority | Story ID | Title | Complexity | Impact | Notes |
|---|---|---|---|---|---|
| 10 | 3.5 | Conditional Form Fields (Show/Hide) | High | High | JavaScript-heavy; ARIA state tracking critical |
| 11 | 3.6 | Form Submission - No Time Limit | Low | Medium | Async validation; timer optional |
| 12 | 3.7 | CAPTCHA Accessibility | High | High | Third-party widget; fallback required |

**Workflow Sequence:**
```
3.1 (required) → 3.2 (errors) → 3.3 (progress) → 3.4 (instructions)
                                      ↓
                        3.5 (conditional) ← (field reveal)
                        3.6 (no time limit) ← (async save)
                        3.7 (CAPTCHA) ← (bot prevention)
                        3.8 (checkboxes) ← (grouped inputs)
                        3.9 (focus) ← (navigation)
                        3.10 (success) ← (confirmation)
```

**Test Hooks:**
- 3.5: Show/hide field with keyboard; verify ARIA-hidden toggled; test with screen reader
- 3.6: Measure time allowed for form completion; confirm no automatic submission
- 3.7: Test reCAPTCHA accessible alternative (text-based, audio, etc.); document fallback

---

### Phase 1D: Navigation Foundation (10 Stories)
Core usability; impacts ALL pages. Recommend splitting into 2 sub-phases.

| Priority | Story ID | Title | Complexity | Impact | Notes |
|---|---|---|---|---|---|
| **Phase 1D-i** | | **Primary Navigation** | | | |
| 13 | 4.1 | Main Menu - Keyboard Navigation | High | Critical | Every page depends on this |
| 14 | 4.2 | Main Menu - Screen Reader Announcements | High | Critical | Submenu depth & structure |
| 15 | 4.4 | Skip Navigation Link - Functional | Low | Critical | Must work before 4.1/4.2 |
| 16 | 4.8 | Active Page Indicator - Current Location Clear | Medium | High | Enhances 4.1 |
| | | | | | |
| **Phase 1D-ii** | | **Secondary Navigation** | | | |
| 17 | 4.3 | Breadcrumb Navigation - Accessible | Medium | High | Wayfinding; independent of 4.1 |
| 18 | 4.5 | Pagination - All States Clear | Medium | Medium | Page traversal; varies by context |
| 19 | 4.6 | Sticky Navigation - Not Blocking Content | Low | Medium | CSS-driven; layout-dependent |
| 20 | 4.7 | Footer Navigation - Complete | Low | Medium | Link structure; simple |
| 21 | 4.9 | Search Navigation - Find & Filter Results | High | High | Complex interaction; filters |
| 22 | 4.10 | Mobile Menu (Hamburger) - Keyboard & Screen Reader | High | Critical | Separate from 4.1; mobile-specific |

**Workflow Sequence:**
```
4.4 (skip) → 4.1 (main menu) → 4.2 (announcements) → 4.8 (active)
                  ↓
          4.3 (breadcrumb) → (wayfinding)
          4.5 (pagination) → (traversal)
          4.6 (sticky) → (viewport safety)
          4.7 (footer) → (exit navigation)
          4.9 (search) → (discovery)
          4.10 (mobile menu) → (responsive parity to 4.1)
```

**Test Hooks:**
- 4.1: Tab through; test Escape key; verify focus trap on submenu
- 4.2: Screen reader announces depth ("Main menu, level 1"); submenu regions labeled
- 4.4: Skip link functional; must receive focus; not hidden by default
- 4.8: Use aria-current="page"; test with Olivero + Claro themes
- 4.10: Test on 375px viewport; hamburger menu states (open/close); keyboard trap check

---

## Phase 2: High-Impact Tier 2 Workflows (15 Stories)

**Current Status:** 0/40 Tier 2 automated (0%)  
**Target:** 15/40 by end of Phase 2 (focus on content-creator & editor workflows)  
**Estimated Effort:** 6–8 weeks  
**Rationale:** Phase 2 stories are dependencies for content management and community engagement

### Phase 2A: Media & Files (5 Stories - Content Creator Critical)

| Priority | Story ID | Title | Complexity | Impact | Notes |
|---|---|---|---|---|---|
| 23 | 5.1 | Upload Image - Alt Text Required | Medium | Critical | Alt-text entry; validation; WCAG 1.1.1 |
| 24 | 5.3 | Video Embed - Captions & Transcripts | High | High | Relies on media library plugin (e.g., YouTube) |
| 25 | 5.2 | Audio File Upload - Caption/Transcript Available | High | High | Audio player accessibility; captions file format |
| 26 | 5.5 | Image Gallery - Keyboard Navigation & Descriptions | High | Medium | Carousel/lightbox; complex keyboard behavior |
| 27 | 5.9 | Media Player Controls - Keyboard Accessible | Medium | Medium | HTML5 video/audio; native controls or custom JS |

**Workflow Sequence:**
```
2.4 (upload image) → 5.1 (alt text required) ← (content creation foundation)
                  ↓
                5.5 (gallery nav) → (layout integration)
                5.9 (player controls) → (embedded media)
                5.2 (audio) → (podcast-like content)
                5.3 (video + captions) → (high-engagement media)
```

**Test Hooks:**
- 5.1: Verify alt-text field visible, required, and persists; test upload form
- 5.3: Confirm captions display on video; subtitle track selectable with keyboard
- 5.2: Audio player buttons keyboard-operable; transcript linked or inline
- 5.5: Tab through gallery items; Escape exits; descriptions announced
- 5.9: Play/pause/volume keyboard-operable; current time/duration announced

---

### Phase 2B: Taxonomy & Discovery (5 Stories - Navigation Companion)

| Priority | Story ID | Title | Complexity | Impact | Notes |
|---|---|---|---|---|---|
| 28 | 6.1 | Term Browser - Hierarchical Labels | Medium | Medium | Tree structure; nesting complexity |
| 29 | 6.3 | Faceted Search - Filter by Tags | High | High | Real-time filter updates; live region |
| 30 | 6.4 | Tag Input - Auto-Complete Accessible | High | High | Combobox pattern; keyboard nav to options |
| 31 | 6.6 | Term Autocomplete - Keyboard Navigation | Medium | Medium | Dropdown selection; list navigation |
| 32 | 6.7 | Taxonomy Navigation - Current Category Marked | Low | Medium | aria-current="page" for taxonomy view |

**Workflow Sequence:**
```
2.6 (assign taxonomy) → 6.1 (term browser) ← (content classification)
                    ↓
            6.3 (faceted search) → (discovery via filters)
            6.4 (tag input) → (tagging UI)
            6.6 (autocomplete) → (predictive input)
            6.7 (current category) → (wayfinding in taxonomy view)
```

**Test Hooks:**
- 6.1: Navigate tree with arrow keys; Enter expands; Escape collapses
- 6.3: Select filter; verify live region announces result count; Escape clears
- 6.4: Type in field; options appear; arrow keys navigate; Enter selects
- 6.6: Same as 6.4; test with multiple vocabulary vocabs
- 6.7: View taxonomy term page; verify aria-current="page" on breadcrumb/term link

---

### Phase 2C: Layout & Blocks (3 Stories - Structural Impact)

| Priority | Story ID | Title | Complexity | Impact | Notes |
|---|---|---|---|---|---|
| 33 | 7.1 | Custom Block - Placed in Accessible Regions | Low | Medium | Region naming; landmark roles |
| 34 | 7.3 | Hero Image Block - Alt Text Present | Low | Medium | Image block; alt-text field |
| 35 | 7.5 | Sidebar Layout - Order Programmatic | Medium | Medium | Source order vs. visual order (CSS Grid) |

**Workflow Sequence:**
```
7.1 (block placement) → (foundation)
        ↓
7.3 (hero image) → (content block)
7.5 (sidebar order) → (layout stability)
```

**Test Hooks:**
- 7.1: Verify blocks placed in landmark regions (main, complementary, etc.); test with screen reader
- 7.3: Block admin form includes alt-text field; content page displays image with alt
- 7.5: Tab through content; verify reading order matches visual layout; test with Claro theme

---

### Phase 2D: Comments & Community (2 Stories - Engagement Foundation)

| Priority | Story ID | Title | Complexity | Impact | Notes |
|---|---|---|---|---|---|
| 36 | 8.1 | Add Comment - Accessible Form | Medium | Medium | Reuses form patterns from Phase 1C |
| 37 | 8.7 | Comment Count - Announcement | Low | Low | Live region; simple announcement |

**Workflow Sequence:**
```
8.1 (comment form) → (engagement entry point)
        ↓
8.7 (count announcement) → (feedback loop)
```

**Test Hooks:**
- 8.1: Submit comment form; verify success message announced; new comment appears in list
- 8.7: Page loads with comment count; count updates when new comment posted; live region announces

---

## Phase 3: Extended Tier 2 (10 Stories Remaining)

**Status:** 0/10 automated  
**Target:** 10/10 (optional before Phase 3)  
**Estimated Effort:** 4–6 weeks (parallel with Tier 3)

| Priority | Story ID | Title | Complexity | Tier | Notes |
|---|---|---|---|---|---|
| 38 | 5.4 | Document Download - Accessible Format Offered | High | T2 | PDF/alt formats; link labeling |
| 39 | 5.6 | File List - Download Links Labeled | Low | T2 | Link context; file type/size announced |
| 40 | 5.7 | Lightbox/Modal Image Viewer - Keyboard Escape | High | T2 | Modal focus management; Esc key |
| 41 | 5.8 | Attachment Field - Multiple Files | Medium | T2 | File field UI; bulk upload |
| 42 | 5.10 | File Preview - Accessible Format | Medium | T2 | Inline preview; fallback text |
| 43 | 6.2 | Term Cloud - All Terms Accessible | Medium | T2 | Visual weighting (font size); alt markup |
| 44 | 6.5 | Category Filter - Multiple Selections | Medium | T2 | Checkbox/radio list; live region |
| 45 | 6.8 | Search by Tag - Results Labeled | Low | T2 | Result set context; filter feedback |
| 46 | 6.9 | Vocabulary Selection - Multiple Taxonomies | Low | T2 | Tab switching; current vocab marked |
| 47 | 6.10 | Term Suggestions - Auto-Populated Field | Medium | T2 | Autocomplete feedback; announcement |

---

## Phase 4: Tier 3 (20 Stories - Extended Functionality)

**Status:** 0/20 automated  
**Target:** 10–15/20 (focus on high-visibility UI patterns)  
**Estimated Effort:** 6–8 weeks  
**Rationale:** System polish; lower blocking power than Tier 1/2

### Phase 4A: Views Module (5 Stories)

| Priority | Story ID | Title | Complexity |
|---|---|---|---|
| 48 | 9.1 | View Page - Accessible Table Display | High |
| 49 | 9.2 | View Exposed Filters - Keyboard Navigation | High |
| 50 | 9.3 | View Results - Empty State Message | Low |
| 51 | 9.4 | Pager Links - Current Page Marked | Low |
| 52 | 9.5 | View Style Switcher - Teaser/Full/Grid Selectable | Medium |

---

### Phase 4B: System & UI (15 Stories)

| Priority | Story ID | Title | Complexity |
|---|---|---|---|
| 53 | 10.1 | Login Page - Color Contrast | Low |
| 54 | 10.2 | Admin Toolbar - Keyboard Accessible | Medium |
| 55 | 10.3 | Status Messages - Announced & Persisting | Low |
| 56 | 10.4 | Error Messages - Linked to Fields | Low |
| 57 | 10.5 | Breadcrumb Contrast - Links Underlined/Distinct | Low |
| 58 | 10.6 | Link Identification - Purpose Clear Without Context | Medium |
| 59 | 10.7 | Form Focus - Tab Order Logical | Low |
| 60 | 10.8 | Page Loading - Loading Indicator Announced | Low |
| 61 | 10.9 | Dialog/Modal - Keyboard Trap Intentional & Escapable | Medium |
| 62 | 10.10 | System Site Settings - Accessible to Edit | Low |
| 63 | 9.6 | View Result Count - Announced | Low |
| 64 | 9.7 | View - Sortable Columns | Medium |
| 65 | 9.8 | View JSON/CSV Export - Link Accessible | Low |
| 66 | 9.9 | View Block Attachment - Visible Location | Low |
| 67 | 9.10 | View Facets - Multiple Selection & Reset | Medium |

---

## Summary: 4-Phase Roadmap

| Phase | Tier | Stories | Target | Duration | Status |
|---|---|---|---|---|---|
| **1A** | T1 | 6 auth | 6/6 | 2 weeks | Not started |
| **1B** | T1 | 4 content | 4/4 | 1.5 weeks | Not started |
| **1C** | T1 | 3 forms | 3/3 | 1.5 weeks | Not started |
| **1D-i** | T1 | 5 nav (primary) | 5/5 | 2 weeks | Not started |
| **1D-ii** | T1 | 5 nav (secondary) | 5/5 | 2 weeks | Not started |
| | | **Phase 1 Total** | **22/22** | **~9 weeks** | **22% → 100% T1** |
| | | | | | |
| **2A** | T2 | 5 media | 5/5 | 2.5 weeks | Not started |
| **2B** | T2 | 5 taxonomy | 5/5 | 2.5 weeks | Not started |
| **2C** | T2 | 3 layout | 3/3 | 1 week | Not started |
| **2D** | T2 | 2 comments | 2/2 | 0.5 weeks | Not started |
| | | **Phase 2 Total** | **15/15** | **~7 weeks** | **37.5% → 75% priority T2** |
| | | | | | |
| **3** | T2 | 10 remaining T2 | 10/10 | 4–6 weeks | Not started |
| **4** | T3 | 20 system/views | 10–15/20 | 6–8 weeks | Not started |
| | | | | | |
| | | **GRAND TOTAL** | **57–62/100** | **~30–36 weeks** | **57–62% total automation** |

---

## Execution Notes

### Parallelization Opportunities
- **Phase 1A & 1B:** Can run in parallel (auth vs. content workflows don't block)
- **Phase 2A, 2B, 2C:** Can run in parallel (media, taxonomy, layout independent)
- **Phase 4A & 4B:** Run in parallel; use test runners to shard

### Weekly Cadence Suggestion
- **Week 1–2:** Phase 1A (6 stories) with quality-gate + done-gate review
- **Week 3–4:** Phase 1B + 1C (7 stories) in parallel
- **Week 5–6:** Phase 1D-i (5 stories; critical path)
- **Week 7–8:** Phase 1D-ii (5 stories; depends on 1D-i passing)
- **Weeks 9–15:** Phase 2A + 2B + 2C in parallel (15 stories)
- **Weeks 16–20:** Phase 3 (10 stories)
- **Weeks 21+:** Phase 4 (20 stories; lower priority)

### Risk Factors
- **1.7 (2FA):** Requires conditional module enablement; skip if 2FA not standard
- **1.8 (email):** Email interception fragile; may need test-only account
- **3.7 (CAPTCHA):** Third-party widget; accessibility depends on provider
- **4.10 (mobile menu):** Requires responsive design; test breakpoints carefully
- **5.3, 5.2 (video/audio):** Media player accessibility varies by player library
- **6.3 (faceted search):** Real-time filtering; live region timing critical

### Definition of Done (Per Story)
1. ✅ Playwright test written (keyboard + screen reader paths)
2. ✅ Test passes on Olivero + Claro themes, light + dark modes
3. ✅ Multiple viewports tested (1280×1024, 768×1024, 375×812)
4. ✅ Test passes with axe-core 4.x (no violations)
5. ✅ quality-gate agent review passed
6. ✅ done-gate agent verification passed
7. ✅ Commit to main branch with cross-reference to USER-STORIES.md
8. ✅ USER-STORY-COVERAGE-MATRIX.md updated

---

## Contingency: MVP Fast-Track (16 Stories in 8 Weeks)

If timeline is compressed, prioritize:

1. **Tier 1 Critical Path (12 stories):**
   - 1.1, 1.2, 1.4, 1.5, 1.6 (auth core)
   - 2.1, 2.2, 2.3, 2.4, 2.6, 2.9 (content core; already done)
   - 3.1, 3.2, 3.3, 3.4, 3.8, 3.9, 3.10 (forms core; already done)
   - 4.1, 4.2, 4.4, 4.8, 4.10 (nav core)

2. **Tier 2 High-Impact (4 stories):**
   - 5.1 (alt text; content creator blocker)
   - 6.3 (faceted search; discovery)
   - 8.1 (comments; engagement)
   - 7.1 (blocks; structural)

**MVP Result:** 16/100 (16%) → 28/100 (28%) automated | Coverage visibility for prioritized workflows

---

## References

- [USER-STORIES.md](USER-STORIES.md) — Full story definitions, WCAG criteria, test paths
- [USER-STORY-COVERAGE-MATRIX.md](USER-STORY-COVERAGE-MATRIX.md) — Current automation status
- [core/tests/playwright/accessibility-workflows.spec.js](core/tests/playwright/accessibility-workflows.spec.js) — Test implementation reference
- [TESTING-ACCESSIBILITY-WORKFLOWS.md](TESTING-ACCESSIBILITY-WORKFLOWS.md) — Test execution guide
