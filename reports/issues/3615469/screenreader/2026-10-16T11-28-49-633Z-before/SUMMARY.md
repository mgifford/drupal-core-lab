# #3615469 link text, before (DRAFT)

2026-10-16T11:28:50.504Z, http://127.0.0.1:8891/admin/config/development/maintenance, Chromium 141.0.7390.37. Synthetic: Guidepup virtual screen reader over jsdom, not a real screen reader.

Checkbox description (aria-describedby `edit-maintenance-mode--description`):

```html
Visitors will only see the maintenance mode message. Only users with the "Use the site in maintenance mode" <a href="/admin/people/permissions">permission</a> will be able to access the site. Authorized users can log in directly via the <a href="/user/login">user login</a> page.
```

| Link text (accessible name) | Target | Text right after the link |
|---|---|---|
| "permission" | `/admin/people/permissions` | `" will be able to access "` (starts with a space) |
| "user login" | `/user/login` | `" page. "` (starts with a space) |

Virtual screen reader, reading the description:

- Visitors will only see the maintenance mode message. Only users with the "Use the site in maintenance mode"
- link, permission
- will be able to access the site. Authorized users can log in directly via the
- link, user login
- page.

All link names on the page, out of context, as a screen reader's links list offers them (43):

"Skip to main content", "Home page", "Create", "Blocks", "Content", "Files", "Welcome", "Structure", "Block layout", "Block types", "Content types", "Menus", "Taxonomy", "Views", "Appearance", "Extend", "Configuration", "Performance", "Development settings", "Logging and errors", "Maintenance mode", "Configuration synchronization", "People", "Reports", "Status report", "Available updates", "Recent log messages", "Field list", "Top 'access denied' errors", "Top 'page not found' errors", "Views plugins", "Announcements", "Help", "admin", "View profile", "Edit profile", "Log out", "Back to site", "Administration", "Configuration", "Development", "permission", "user login"
