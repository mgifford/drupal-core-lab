# #3619154 / MR !16911 evaluate — 3619154-pinned

Generated 2026-10-14T15:27:30.618Z.
Before: `baseline-3619154` @ 6868135a  ·  After: `issue-3619154` @ 6868135a
Page: /node/1/edit (Default Admin). Logged in as user 1. Viewport 1280×900.

## Sidebar toggle control
| Element | `<a role=button>` | `<button>` |
| aria-controls | default_admin_sidebar | default_admin_sidebar |
| aria-expanded (initial) | true | true |

## Does it toggle? (aria-expanded, and sidebar visibility)
| Mouse click — aria-expanded | true → false | true → false |
| Mouse click — sidebar shown | false → false | false → false |
| Keyboard Enter — aria-expanded | true → false | true → false |
| Keyboard **Space** — aria-expanded | true → true | true → false |

## Focus order
| Close control | `<a role=button>` | `<button>` |
| First focusable in sidebar | form-checkbox | meta-sidebar__close |

## Screenshots
- {before,after}-1-initial.png — sidebar in its initial state
- {before,after}-2-after-click.png — after activating the toggle

## Notes
- The telling keyboard row is **Space**: a native `<button>` activates on Space, an `<a role="button">` does not. Compare the Before/After Space rows.
- aria-expanded absent in Before means assistive tech cannot tell whether the sidebar is open.
