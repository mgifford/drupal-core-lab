# #2942404 screen reader evidence (2942404-consolidated)

DRAFT, AI-assisted; a person has not reviewed it. Before: core `0387fb94 2026-11-25`. After: core `0387fb94 2026-11-25` plus `2942404-consolidated-region.patch, 2942404-consolidated-message-landmark.patch` (a lab option, not an upstream MR). Pages: `/lab/status-messages`, `/admin/lab/status-messages`, each with two server-rendered status messages, a warning, an error and a button that adds one JavaScript message of each type.

## Guidepup virtual screen reader (jsdom snapshot)

### before

**front** (https://repro-baseline-2942404-latest.ddev.site/lab/status-messages) after load:

    - region, Administrative top bar
    - navigation, Breadcrumb
    - heading, Breadcrumb, level 2
    - list
    - listitem, level 1, position 1, set size 1
    - link, Back to site, Return to site content
    - end of listitem, level 1, position 1, set size 1
    - end of list
    - end of navigation, Breadcrumb
    - end of region, Administrative top bar
    - banner
    - heading, Status messages, level 1
    - end of banner
    - main
    - status, Status message
    - heading, Status message, level 2
    - list
    - listitem, level 1, position 1, set size 2
    - The configuration options have been saved.
    - end of listitem, level 1, position 1, set size 2
    - listitem, level 1, position 2, set size 2
    - Your changes are published.
    - link, Review the configuration
    - .
    - end of listitem, level 1, position 2, set size 2
    - end of list
    - button, Hide
    - end of status, Status message
    - alert, Warning message
    - heading, Warning message, level 2
    - Cron has not run recently.
    - button, Hide
    - end of alert, Warning message
    - alert, Error message
    - heading, Error message, level 2
    - The Username field is required.
    - button, Hide
    - end of alert, Error message
    - paragraph
    - The messages above were added by the server. The button adds one of each type with Drupal.Message, as AJAX and JavaScript code does.
    - end of paragraph
    - button, Add messages with JavaScript

After the button (virtual reader; live-region changes are not spoken by it). Groups: status; alert; alert; status "Status message"; alert "Warning message"; alert "Error message". `#drupal-live-announce` text: "JavaScript status: the item was saved.
JavaScript warning: the connection is slow.
JavaScript error: the upload failed.".

    - region, Administrative top bar
    - navigation, Breadcrumb
    - heading, Breadcrumb, level 2
    - list
    - listitem, level 1, position 1, set size 1
    - link, Back to site, Return to site content
    - end of listitem, level 1, position 1, set size 1
    - end of list
    - end of navigation, Breadcrumb
    - end of region, Administrative top bar
    - banner
    - heading, Status messages, level 1
    - end of banner
    - main
    - status, Status message
    - heading, Status message, level 2
    - list
    - listitem, level 1, position 1, set size 2
    - The configuration options have been saved.
    - end of listitem, level 1, position 1, set size 2
    - listitem, level 1, position 2, set size 2
    - Your changes are published.
    - link, Review the configuration
    - .
    - end of listitem, level 1, position 2, set size 2
    - end of list
    - button, Hide
    - end of status, Status message
    - alert, Warning message
    - heading, Warning message, level 2
    - Cron has not run recently.
    - button, Hide
    - end of alert, Warning message
    - alert, Error message
    - heading, Error message, level 2
    - The Username field is required.
    - button, Hide
    - end of alert, Error message
    - status, Status message
    - heading, Status message, level 2
    - JavaScript status: the item was saved.
    - button, Hide
    - end of status, Status message
    - alert, Warning message
    - heading, Warning message, level 2
    - JavaScript warning: the connection is slow.
    - button, Hide
    - end of alert, Warning message
    - alert, Error message
    - heading, Error message, level 2
    - JavaScript error: the upload failed.
    - button, Hide
    - end of alert, Error message
    - paragraph
    - The messages above were added by the server. The button adds one of each type with Drupal.Message, as AJAX and JavaScript code does.
    - end of paragraph
    - button, Add messages with JavaScript

**admin** (https://repro-baseline-2942404-latest.ddev.site/admin/lab/status-messages) after load:

    - region, Administrative top bar
    - navigation, Breadcrumb
    - heading, Breadcrumb, level 2
    - list
    - listitem, level 1, position 1, set size 2
    - link, Back to site, Return to site content
    - end of listitem, level 1, position 1, set size 2
    - listitem, level 1, position 2, set size 2
    - link, Administration
    - end of listitem, level 1, position 2, set size 2
    - end of list
    - end of navigation, Breadcrumb
    - end of region, Administrative top bar
    - banner
    - heading, Status messages (administration theme), level 1
    - end of banner
    - main
    - status, Status message
    - heading, Status message, level 2
    - list
    - listitem, level 1, position 1, set size 2
    - The configuration options have been saved.
    - end of listitem, level 1, position 1, set size 2
    - listitem, level 1, position 2, set size 2
    - Your changes are published.
    - link, Review the configuration
    - .
    - end of listitem, level 1, position 2, set size 2
    - end of list
    - button, Hide
    - end of status, Status message
    - alert, Warning message
    - heading, Warning message, level 2
    - Cron has not run recently.
    - button, Hide
    - end of alert, Warning message
    - alert, Error message
    - heading, Error message, level 2
    - The Username field is required.
    - button, Hide
    - end of alert, Error message
    - paragraph
    - The messages above were added by the server. The button adds one of each type with Drupal.Message, as AJAX and JavaScript code does.
    - end of paragraph
    - button, Add messages with JavaScript

After the button (virtual reader; live-region changes are not spoken by it). Groups: status; alert; alert; status "Status message"; alert "Warning message"; alert "Error message". `#drupal-live-announce` text: "JavaScript status: the item was saved.
JavaScript warning: the connection is slow.
JavaScript error: the upload failed.".

    - region, Administrative top bar
    - navigation, Breadcrumb
    - heading, Breadcrumb, level 2
    - list
    - listitem, level 1, position 1, set size 2
    - link, Back to site, Return to site content
    - end of listitem, level 1, position 1, set size 2
    - listitem, level 1, position 2, set size 2
    - link, Administration
    - end of listitem, level 1, position 2, set size 2
    - end of list
    - end of navigation, Breadcrumb
    - end of region, Administrative top bar
    - banner
    - heading, Status messages (administration theme), level 1
    - end of banner
    - main
    - status, Status message
    - heading, Status message, level 2
    - list
    - listitem, level 1, position 1, set size 2
    - The configuration options have been saved.
    - end of listitem, level 1, position 1, set size 2
    - listitem, level 1, position 2, set size 2
    - Your changes are published.
    - link, Review the configuration
    - .
    - end of listitem, level 1, position 2, set size 2
    - end of list
    - button, Hide
    - end of status, Status message
    - alert, Warning message
    - heading, Warning message, level 2
    - Cron has not run recently.
    - button, Hide
    - end of alert, Warning message
    - alert, Error message
    - heading, Error message, level 2
    - The Username field is required.
    - button, Hide
    - end of alert, Error message
    - status, Status message
    - heading, Status message, level 2
    - JavaScript status: the item was saved.
    - button, Hide
    - end of status, Status message
    - alert, Warning message
    - heading, Warning message, level 2
    - JavaScript warning: the connection is slow.
    - button, Hide
    - end of alert, Warning message
    - alert, Error message
    - heading, Error message, level 2
    - JavaScript error: the upload failed.
    - button, Hide
    - end of alert, Error message
    - paragraph
    - The messages above were added by the server. The button adds one of each type with Drupal.Message, as AJAX and JavaScript code does.
    - end of paragraph
    - button, Add messages with JavaScript

### after

**front** (https://repro-issue-2942404-consolidated.ddev.site/lab/status-messages) after load:

    - region, Administrative top bar
    - navigation, Breadcrumb
    - heading, Breadcrumb, level 2
    - list
    - listitem, level 1, position 1, set size 1
    - link, Back to site, Return to site content
    - end of listitem, level 1, position 1, set size 1
    - end of list
    - end of navigation, Breadcrumb
    - end of region, Administrative top bar
    - banner
    - heading, Status messages, level 1
    - end of banner
    - main
    - region, System messages
    - status, Status message
    - heading, Status message, level 2
    - list
    - listitem, level 1, position 1, set size 2
    - The configuration options have been saved.
    - end of listitem, level 1, position 1, set size 2
    - listitem, level 1, position 2, set size 2
    - Your changes are published.
    - link, Review the configuration
    - .
    - end of listitem, level 1, position 2, set size 2
    - end of list
    - button, Hide
    - end of status, Status message
    - alert, Warning message
    - heading, Warning message, level 2
    - Cron has not run recently.
    - button, Hide
    - end of alert, Warning message
    - alert, Error message
    - heading, Error message, level 2
    - The Username field is required.
    - button, Hide
    - end of alert, Error message
    - end of region, System messages
    - paragraph
    - The messages above were added by the server. The button adds one of each type with Drupal.Message, as AJAX and JavaScript code does.
    - end of paragraph
    - button, Add messages with JavaScript

After the button (virtual reader; live-region changes are not spoken by it). Groups: status; alert; alert; status "Status message"; alert "Warning message"; alert "Error message". `#drupal-live-announce` text: "JavaScript status: the item was saved.
JavaScript warning: the connection is slow.
JavaScript error: the upload failed.".

    - region, Administrative top bar
    - navigation, Breadcrumb
    - heading, Breadcrumb, level 2
    - list
    - listitem, level 1, position 1, set size 1
    - link, Back to site, Return to site content
    - end of listitem, level 1, position 1, set size 1
    - end of list
    - end of navigation, Breadcrumb
    - end of region, Administrative top bar
    - banner
    - heading, Status messages, level 1
    - end of banner
    - main
    - region, System messages
    - status, Status message
    - heading, Status message, level 2
    - list
    - listitem, level 1, position 1, set size 2
    - The configuration options have been saved.
    - end of listitem, level 1, position 1, set size 2
    - listitem, level 1, position 2, set size 2
    - Your changes are published.
    - link, Review the configuration
    - .
    - end of listitem, level 1, position 2, set size 2
    - end of list
    - button, Hide
    - end of status, Status message
    - alert, Warning message
    - heading, Warning message, level 2
    - Cron has not run recently.
    - button, Hide
    - end of alert, Warning message
    - alert, Error message
    - heading, Error message, level 2
    - The Username field is required.
    - button, Hide
    - end of alert, Error message
    - status, Status message
    - heading, Status message, level 2
    - JavaScript status: the item was saved.
    - button, Hide
    - end of status, Status message
    - alert, Warning message
    - heading, Warning message, level 2
    - JavaScript warning: the connection is slow.
    - button, Hide
    - end of alert, Warning message
    - alert, Error message
    - heading, Error message, level 2
    - JavaScript error: the upload failed.
    - button, Hide
    - end of alert, Error message
    - end of region, System messages
    - paragraph
    - The messages above were added by the server. The button adds one of each type with Drupal.Message, as AJAX and JavaScript code does.
    - end of paragraph
    - button, Add messages with JavaScript

**admin** (https://repro-issue-2942404-consolidated.ddev.site/admin/lab/status-messages) after load:

    - region, Administrative top bar
    - navigation, Breadcrumb
    - heading, Breadcrumb, level 2
    - list
    - listitem, level 1, position 1, set size 2
    - link, Back to site, Return to site content
    - end of listitem, level 1, position 1, set size 2
    - listitem, level 1, position 2, set size 2
    - link, Administration
    - end of listitem, level 1, position 2, set size 2
    - end of list
    - end of navigation, Breadcrumb
    - end of region, Administrative top bar
    - banner
    - heading, Status messages (administration theme), level 1
    - end of banner
    - main
    - region, System messages
    - status, Status message
    - heading, Status message, level 2
    - list
    - listitem, level 1, position 1, set size 2
    - The configuration options have been saved.
    - end of listitem, level 1, position 1, set size 2
    - listitem, level 1, position 2, set size 2
    - Your changes are published.
    - link, Review the configuration
    - .
    - end of listitem, level 1, position 2, set size 2
    - end of list
    - button, Hide
    - end of status, Status message
    - alert, Warning message
    - heading, Warning message, level 2
    - Cron has not run recently.
    - button, Hide
    - end of alert, Warning message
    - alert, Error message
    - heading, Error message, level 2
    - The Username field is required.
    - button, Hide
    - end of alert, Error message
    - end of region, System messages
    - paragraph
    - The messages above were added by the server. The button adds one of each type with Drupal.Message, as AJAX and JavaScript code does.
    - end of paragraph
    - button, Add messages with JavaScript

After the button (virtual reader; live-region changes are not spoken by it). Groups: status; alert; alert; status "Status message"; alert "Warning message"; alert "Error message". `#drupal-live-announce` text: "JavaScript status: the item was saved.
JavaScript warning: the connection is slow.
JavaScript error: the upload failed.".

    - region, Administrative top bar
    - navigation, Breadcrumb
    - heading, Breadcrumb, level 2
    - list
    - listitem, level 1, position 1, set size 2
    - link, Back to site, Return to site content
    - end of listitem, level 1, position 1, set size 2
    - listitem, level 1, position 2, set size 2
    - link, Administration
    - end of listitem, level 1, position 2, set size 2
    - end of list
    - end of navigation, Breadcrumb
    - end of region, Administrative top bar
    - banner
    - heading, Status messages (administration theme), level 1
    - end of banner
    - main
    - region, System messages
    - status, Status message
    - heading, Status message, level 2
    - list
    - listitem, level 1, position 1, set size 2
    - The configuration options have been saved.
    - end of listitem, level 1, position 1, set size 2
    - listitem, level 1, position 2, set size 2
    - Your changes are published.
    - link, Review the configuration
    - .
    - end of listitem, level 1, position 2, set size 2
    - end of list
    - button, Hide
    - end of status, Status message
    - alert, Warning message
    - heading, Warning message, level 2
    - Cron has not run recently.
    - button, Hide
    - end of alert, Warning message
    - alert, Error message
    - heading, Error message, level 2
    - The Username field is required.
    - button, Hide
    - end of alert, Error message
    - status, Status message
    - heading, Status message, level 2
    - JavaScript status: the item was saved.
    - button, Hide
    - end of status, Status message
    - alert, Warning message
    - heading, Warning message, level 2
    - JavaScript warning: the connection is slow.
    - button, Hide
    - end of alert, Warning message
    - alert, Error message
    - heading, Error message, level 2
    - JavaScript error: the upload failed.
    - button, Hide
    - end of alert, Error message
    - end of region, System messages
    - paragraph
    - The messages above were added by the server. The button adds one of each type with Drupal.Message, as AJAX and JavaScript code does.
    - end of paragraph
    - button, Add messages with JavaScript

## Guidepup with real VoiceOver (macOS, Safari)

Not run in this invocation.

## Limits

- The virtual reader works on a DOM snapshot with no CSS or layout, so visually hidden or display:none text is not distinguished, and it does not speak live-region changes.
- VoiceOver output depends on the macOS version, Safari, VoiceOver settings and verbosity; one run on one machine. NVDA, JAWS, TalkBack and other browsers were not used.
- Phrases are what the tool recorded; read them against the markup in the other evidence before drawing conclusions.
