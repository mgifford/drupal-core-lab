<!-- DRAFT for a human to review and post. Do not post automatically. -->
**AI-assisted:** yes. Tool: Claude Code. External code copied: no.

### What I tested
MR !16777 against current core `main` (`a19dfee86688`, 2026-10-01) in a Standard install with an Attachment file field (1 KB limit, txt) added to Article, using a scripted headless Chromium. Before is `main`, After is `main` plus the MR patch.

### Result
After an oversized upload (2 KB), Before shows the error inline in a role="alert" item with no wrapper element. After adds a `div.file-upload-messages` wrapper that holds the error. One scripted run, not reviewed by a person.

### Steps to reproduce
Open /node/add/article, choose a .txt file over 1 KB in the Attachment field, and look at where the error appears.

### Not verified
Pinned core, the Default Admin theme question in comment #10 (theme not recorded), keyboard and screen-reader behavior, the error wording, any run by a person.
