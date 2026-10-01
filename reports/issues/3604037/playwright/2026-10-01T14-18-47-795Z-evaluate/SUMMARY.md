# #3604037 evaluation (3604037-latest)

Run 2026-10-01T14:18:47.798Z. Before `baseline-3604037-latest`, After `issue-3604037-latest` (the MR on current core). Automated measurements are a DRAFT: they do not replace a person's look in each mode.

## Mode: farsi

- **before-details**: no "contains an error" marker found (expected on Before: the change is not there)
- **before-tabs**: no "contains an error" marker found (expected on Before: the change is not there)
- **before-accordion**: no "contains an error" marker found (expected on Before: the change is not there)
- **before-tabsnarrow**: no "contains an error" marker found (expected on Before: the change is not there)

**after-details**: {"dataChildErrorCount":"2","open":false,"summaryBackground":"rgba(0, 0, 0, 0)","summaryColor":"rgb(204, 61, 61)","iconMask":"present","barWidth":"6px","afterBorderLeft":"none","dir":"rtl","darkClass":false,"forced":false}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| summary text (error colour) on its background | #cc3d3d | #ffffff | 4.88:1 | 4.5:1 | ✓ pass |
| left error bar vs background | #cc3d3d | #ffffff | 4.88:1 | 3:1 | ✓ pass |
| error icon vs background | #cc3d3d | #ffffff | 4.88:1 | 3:1 | ✓ pass |


**after-tabs**: {"menuItemColor":"rgb(204, 61, 61)","barWidth":"6px","iconMask":"present","dir":"rtl","darkClass":false,"forced":false}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| tab label (error colour) on its background | #cc3d3d | #ffffff | 4.88:1 | 4.5:1 | ✓ pass |
| tab error bar vs background | #cc3d3d | #ffffff | 4.88:1 | 3:1 | ✓ pass |
| tab error icon vs background | #cc3d3d | #ffffff | 4.88:1 | 3:1 | ✓ pass |


**after-accordion**: {"dataChildErrorCount":"1","open":true,"summaryBackground":"rgba(0, 0, 0, 0)","summaryColor":"rgb(204, 61, 61)","iconMask":"present","barWidth":"6px","afterBorderLeft":"none","dir":"rtl","darkClass":false,"forced":false}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| summary text (error colour) on its background | #cc3d3d | #ffffff | 4.88:1 | 4.5:1 | ✓ pass |
| left error bar vs background | #cc3d3d | #ffffff | 4.88:1 | 3:1 | ✓ pass |
| error icon vs background | #cc3d3d | #ffffff | 4.88:1 | 3:1 | ✓ pass |


**after-tabsnarrow**: {"dataChildErrorCount":"1","open":true,"summaryBackground":"rgba(0, 0, 0, 0)","summaryColor":"rgb(204, 61, 61)","iconMask":"present","barWidth":"6px","afterBorderLeft":"none","dir":"rtl","darkClass":false,"forced":false}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| summary text (error colour) on its background | #cc3d3d | #ffffff | 4.88:1 | 4.5:1 | ✓ pass |
| left error bar vs background | #cc3d3d | #ffffff | 4.88:1 | 3:1 | ✓ pass |
| error icon vs background | #cc3d3d | #ffffff | 4.88:1 | 3:1 | ✓ pass |

Images: `compare-farsi-details*.png`, `compare-farsi-tabs*.png` (`-hover` and `-focus` are the hover and keyboard-focus states)

