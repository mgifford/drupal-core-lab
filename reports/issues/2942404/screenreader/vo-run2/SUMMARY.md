# #2942404 screen reader evidence (2942404-latest)

DRAFT, AI-assisted; a person has not reviewed it. Before: core `92e5c3a304 2026-11-18`. After: core `92e5c3a304 2026-11-18` plus `2942404-main-region-option.patch` (a lab option, not an upstream MR). Pages: `/lab/status-messages`, `/admin/lab/status-messages`, each with two server-rendered status messages, a warning, an error and a button that adds one JavaScript message of each type.

## Guidepup virtual screen reader (jsdom snapshot)

Not run in this invocation.

## Guidepup with real VoiceOver (macOS, Safari)

### before

**front** (https://repro-baseline-2942404-latest.ddev.site/lab/status-messages): reached the button: true.

Read in order:

    - heading level 2 Administrative sidebar
    - heading level 3 Content
    - heading level 3 Administration
    - heading level 3 Help
    - heading level 3 User
    - heading level 2 Breadcrumb
    - heading level 1 Status messages
    - end of banner
    - main
    - Status message application status
    - heading level 2 Status message
    - The configuration options have been saved.
    - Your changes are published.
    - link Review the configuration
    - .
    - Hide button
    - end of Status message application status
    - Warning message alert
    - heading level 2 Warning message
    - Cron has not run recently.
    - Hide button
    - end of Warning message alert
    - Error message alert
    - heading level 2 Error message
    - The Username field is required.
    - Hide button
    - end of Error message alert
    - The messages above were added by the server. The button adds one of each type with Drupal.Message, as AJAX and JavaScript code does.
    - Add messages with JavaScript button

Spoken by itself after activating the button:

    - Error message

Read afterwards:

    - end of main
    - JavaScript status: the item was saved. JavaScript warning: the connection is slow. JavaScript error: the upload failed.
    - 
    - JavaScript status: the item was saved. JavaScript warning: the connection is slow. JavaScript error: the upload failed.
    - 
    - JavaScript status: the item was saved. JavaScript warning: the connection is slow. JavaScript error: the upload failed.
    - 
    - JavaScript status: the item was saved. JavaScript warning: the connection is slow. JavaScript error: the upload failed.
    - 
    - JavaScript status: the item was saved. JavaScript warning: the connection is slow. JavaScript error: the upload failed.
    - 
    - JavaScript status: the item was saved. JavaScript warning: the connection is slow. JavaScript error: the upload failed.

**admin** (https://repro-baseline-2942404-latest.ddev.site/admin/lab/status-messages): reached the button: true.

Read in order:

    - heading level 2 Administrative sidebar
    - heading level 3 Content
    - heading level 3 Administration
    - heading level 3 Help
    - heading level 3 User
    - Last heading heading level 3 User
    - heading level 2 Breadcrumb
    - heading level 1 Status messages (administration theme)
    - end of banner
    - main
    - Status message application status
    - heading level 2 Status message
    - The configuration options have been saved.
    - Your changes are published.
    - link Review the configuration
    - .
    - Hide button
    - end of Status message application status
    - Warning message alert
    - heading level 2 Warning message
    - Cron has not run recently.
    - Hide button
    - end of Warning message alert
    - Error message alert
    - heading level 2 Error message
    - The Username field is required.
    - Hide button
    - end of Error message alert
    - The messages above were added by the server. The button adds one of each type with Drupal.Message, as AJAX and JavaScript code does.
    - Add messages with JavaScript button

Spoken by itself after activating the button:

    - Error message

Read afterwards:

    - end of main
    - JavaScript status: the item was saved. JavaScript warning: the connection is slow. JavaScript error: the upload failed.
    - 
    - JavaScript status: the item was saved. JavaScript warning: the connection is slow. JavaScript error: the upload failed.
    - 
    - JavaScript status: the item was saved. JavaScript warning: the connection is slow. JavaScript error: the upload failed.
    - 
    - JavaScript status: the item was saved. JavaScript warning: the connection is slow. JavaScript error: the upload failed.
    - 
    - JavaScript status: the item was saved. JavaScript warning: the connection is slow. JavaScript error: the upload failed.
    - 
    - JavaScript status: the item was saved. JavaScript warning: the connection is slow. JavaScript error: the upload failed.

### after

**Not completed:** VoiceOver cannot be started <- VoiceOver cannot be started <- spawnSync /usr/bin/osascript ETIMEDOUT

## Limits

- The virtual reader works on a DOM snapshot with no CSS or layout, so visually hidden or display:none text is not distinguished, and it does not speak live-region changes.
- VoiceOver output depends on the macOS version, Safari, VoiceOver settings and verbosity; one run on one machine. NVDA, JAWS, TalkBack and other browsers were not used.
- Phrases are what the tool recorded; read them against the markup in the other evidence before drawing conclusions.
