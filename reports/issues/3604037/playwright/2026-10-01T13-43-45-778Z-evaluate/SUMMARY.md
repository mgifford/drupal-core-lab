# #3604037 evaluation (3604037-latest)

Run 2026-10-01T13:43:45.781Z. Before `baseline-3604037-latest`, After `issue-3604037-latest` (the MR on current core). Automated measurements are a DRAFT: they do not replace a person's look in each mode.

## Mode: light

- **before-details**: no "contains an error" marker found (expected on Before: the change is not there)
- **before-details-hover**: no "contains an error" marker found (expected on Before: the change is not there)
- **before-details-focus**: no "contains an error" marker found (expected on Before: the change is not there)
- **before-tabs**: no "contains an error" marker found (expected on Before: the change is not there)
- **before-tabs-hover**: no "contains an error" marker found (expected on Before: the change is not there)
- **before-tabs-focus**: no "contains an error" marker found (expected on Before: the change is not there)

**after-details**: {"dataChildErrorCount":"2","open":false,"summaryBackground":"rgba(0, 0, 0, 0)","summaryColor":"rgb(204, 61, 61)","iconMask":"present","barWidth":"6px","afterBorderLeft":"none","dir":"ltr","darkClass":false,"forced":false}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| summary text (error colour) on its background | #cc3d3d | #ffffff | 4.88:1 | 4.5:1 | ✓ pass |
| left error bar vs background | #cc3d3d | #ffffff | 4.88:1 | 3:1 | ✓ pass |
| error icon vs background | #cc3d3d | #ffffff | 4.88:1 | 3:1 | ✓ pass |


**after-details-hover**: {"dataChildErrorCount":"2","open":false,"summaryBackground":"lch(44.287 91.6142 288.155 / 0.15)","summaryColor":"lch(40.7441 84.2851 288.155)","iconMask":"present","barWidth":"6px","afterBorderLeft":"none","dir":"ltr","darkClass":false,"forced":false}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| summary text (error colour) on its background | #1256e7 | #d9e7ff | 4.79:1 | 4.5:1 | ✓ pass |
| left error bar vs background | #cc3d3d | #ffffff | 4.88:1 | 3:1 | ✓ pass |
| error icon vs background | #cc3d3d | #d9e7ff | 3.91:1 | 3:1 | ✓ pass |


**after-details-focus**: {"dataChildErrorCount":"2","open":false,"summaryBackground":"rgba(0, 0, 0, 0)","summaryColor":"rgb(204, 61, 61)","iconMask":"present","barWidth":"6px","afterBorderLeft":"none","focusOutline":"solid 4px rgb(0, 125, 250)","dir":"ltr","darkClass":false,"forced":false}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| summary text (error colour) on its background | #cc3d3d | #ffffff | 4.88:1 | 4.5:1 | ✓ pass |
| left error bar vs background | #cc3d3d | #ffffff | 4.88:1 | 3:1 | ✓ pass |
| error icon vs background | #cc3d3d | #ffffff | 4.88:1 | 3:1 | ✓ pass |
| focus outline vs background | #007dfa | #ffffff | 3.95:1 | 3:1 | ✓ pass |


**after-tabs**: {"menuItemColor":"rgb(204, 61, 61)","barWidth":"6px","iconMask":"present","dir":"ltr","darkClass":false,"forced":false}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| tab label (error colour) on its background | #cc3d3d | #ffffff | 4.88:1 | 4.5:1 | ✓ pass |
| tab error bar vs background | #cc3d3d | #ffffff | 4.88:1 | 3:1 | ✓ pass |
| tab error icon vs background | #cc3d3d | #ffffff | 4.88:1 | 3:1 | ✓ pass |


**after-tabs-hover**: {"menuItemColor":"rgb(1, 94, 254)","barWidth":"6px","iconMask":"present","dir":"ltr","darkClass":false,"forced":false}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| tab label (error colour) on its background | #015efe | #d9e7ff | 4.17:1 | 4.5:1 | ✗ FAIL |
| tab error bar vs background | #cc3d3d | #d9e7ff | 3.91:1 | 3:1 | ✓ pass |
| tab error icon vs background | #cc3d3d | #d9e7ff | 3.91:1 | 3:1 | ✓ pass |


**after-tabs-focus**: {"menuItemColor":"rgb(204, 61, 61)","barWidth":"6px","iconMask":"present","focusOutline":"solid 4px rgb(0, 125, 250)","dir":"ltr","darkClass":false,"forced":false}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| tab label (error colour) on its background | #cc3d3d | #ffffff | 4.88:1 | 4.5:1 | ✓ pass |
| tab error bar vs background | #cc3d3d | #ffffff | 4.88:1 | 3:1 | ✓ pass |
| tab error icon vs background | #cc3d3d | #ffffff | 4.88:1 | 3:1 | ✓ pass |
| focus outline vs background | #007dfa | #ffffff | 3.95:1 | 3:1 | ✓ pass |

Images: `compare-light-details*.png`, `compare-light-tabs*.png` (`-hover` and `-focus` are the hover and keyboard-focus states)

## Mode: dark

- **before-details**: no "contains an error" marker found (expected on Before: the change is not there)
- **before-details-hover**: no "contains an error" marker found (expected on Before: the change is not there)
- **before-details-focus**: no "contains an error" marker found (expected on Before: the change is not there)
- **before-tabs**: no "contains an error" marker found (expected on Before: the change is not there)
- **before-tabs-hover**: no "contains an error" marker found (expected on Before: the change is not there)
- **before-tabs-focus**: no "contains an error" marker found (expected on Before: the change is not there)

**after-details**: {"dataChildErrorCount":"2","open":false,"summaryBackground":"rgba(0, 0, 0, 0)","summaryColor":"rgb(206, 96, 96)","iconMask":"present","barWidth":"6px","afterBorderLeft":"none","dir":"ltr","darkClass":true,"forced":false}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| summary text (error colour) on its background | #ce6060 | #2a2a2d | 3.72:1 | 4.5:1 | ✗ FAIL |
| left error bar vs background | #ce6060 | #2a2a2d | 3.72:1 | 3:1 | ✓ pass |
| error icon vs background | #ce6060 | #2a2a2d | 3.72:1 | 3:1 | ✓ pass |


**after-details-hover**: {"dataChildErrorCount":"2","open":false,"summaryBackground":"lch(88 80.6205 288.155 / 0.15)","summaryColor":"lch(88.9599 74.1724 288.155)","iconMask":"present","barWidth":"6px","afterBorderLeft":"none","dir":"ltr","darkClass":true,"forced":false}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| summary text (error colour) on its background | #cbd5ff | #41434c | 6.8:1 | 4.5:1 | ✓ pass |
| left error bar vs background | #ce6060 | #2a2a2d | 3.72:1 | 3:1 | ✓ pass |
| error icon vs background | #ce6060 | #41434c | 2.56:1 | 3:1 | ✗ FAIL |


**after-details-focus**: {"dataChildErrorCount":"2","open":false,"summaryBackground":"rgba(0, 0, 0, 0)","summaryColor":"rgb(206, 96, 96)","iconMask":"present","barWidth":"6px","afterBorderLeft":"none","focusOutline":"solid 4px rgb(81, 168, 255)","dir":"ltr","darkClass":true,"forced":false}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| summary text (error colour) on its background | #ce6060 | #2a2a2d | 3.72:1 | 4.5:1 | ✗ FAIL |
| left error bar vs background | #ce6060 | #2a2a2d | 3.72:1 | 3:1 | ✓ pass |
| error icon vs background | #ce6060 | #2a2a2d | 3.72:1 | 3:1 | ✓ pass |
| focus outline vs background | #51a8ff | #2a2a2d | 5.72:1 | 3:1 | ✓ pass |


**after-tabs**: {"menuItemColor":"rgb(206, 96, 96)","barWidth":"6px","iconMask":"present","dir":"ltr","darkClass":true,"forced":false}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| tab label (error colour) on its background | #ce6060 | #1b1b1d | 4.48:1 | 4.5:1 | ✗ FAIL |
| tab error bar vs background | #ce6060 | #1b1b1d | 4.48:1 | 3:1 | ✓ pass |
| tab error icon vs background | #ce6060 | #1b1b1d | 4.48:1 | 3:1 | ✓ pass |


**after-tabs-hover**: {"menuItemColor":"lch(88 80.6205 288.155)","barWidth":"6px","iconMask":"present","dir":"ltr","darkClass":true,"forced":false}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| tab label (error colour) on its background | #c4d1ff | #1b1b1d | 11.39:1 | 4.5:1 | ✓ pass |
| tab error bar vs background | #ce6060 | #1b1b1d | 4.48:1 | 3:1 | ✓ pass |
| tab error icon vs background | #ce6060 | #1b1b1d | 4.48:1 | 3:1 | ✓ pass |


**after-tabs-focus**: {"menuItemColor":"rgb(206, 96, 96)","barWidth":"6px","iconMask":"present","focusOutline":"solid 4px rgb(81, 168, 255)","dir":"ltr","darkClass":true,"forced":false}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| tab label (error colour) on its background | #ce6060 | #1b1b1d | 4.48:1 | 4.5:1 | ✗ FAIL |
| tab error bar vs background | #ce6060 | #1b1b1d | 4.48:1 | 3:1 | ✓ pass |
| tab error icon vs background | #ce6060 | #1b1b1d | 4.48:1 | 3:1 | ✓ pass |
| focus outline vs background | #51a8ff | #1b1b1d | 6.87:1 | 3:1 | ✓ pass |

Images: `compare-dark-details*.png`, `compare-dark-tabs*.png` (`-hover` and `-focus` are the hover and keyboard-focus states)

## Mode: forced

- **before-details**: no "contains an error" marker found (expected on Before: the change is not there)
- **before-details-hover**: no "contains an error" marker found (expected on Before: the change is not there)
- **before-details-focus**: no "contains an error" marker found (expected on Before: the change is not there)
- **before-tabs**: no "contains an error" marker found (expected on Before: the change is not there)
- **before-tabs-hover**: no "contains an error" marker found (expected on Before: the change is not there)
- **before-tabs-focus**: no "contains an error" marker found (expected on Before: the change is not there)

**after-details**: {"dataChildErrorCount":"2","open":false,"summaryBackground":"rgba(255, 255, 255, 0)","summaryColor":"rgb(0, 0, 159)","iconMask":"present","barWidth":"6px","afterBorderLeft":"none","dir":"ltr","darkClass":false,"forced":true}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| summary text (error colour) on its background | #00009f | #ffffff | 13.99:1 | 4.5:1 | ✓ pass |
| left error bar vs background | #000000 | #ffffff | 21:1 | 3:1 | ✓ pass |
| error icon vs background | #000000 | #ffffff | 21:1 | 3:1 | ✓ pass |


**after-details-hover**: {"dataChildErrorCount":"2","open":false,"summaryBackground":"rgba(255, 255, 255, 0.15)","summaryColor":"rgb(0, 0, 159)","iconMask":"present","barWidth":"6px","afterBorderLeft":"none","dir":"ltr","darkClass":false,"forced":true}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| summary text (error colour) on its background | #00009f | #ffffff | 13.99:1 | 4.5:1 | ✓ pass |
| left error bar vs background | #000000 | #ffffff | 21:1 | 3:1 | ✓ pass |
| error icon vs background | #000000 | #ffffff | 21:1 | 3:1 | ✓ pass |


**after-details-focus**: {"dataChildErrorCount":"2","open":false,"summaryBackground":"rgba(255, 255, 255, 0)","summaryColor":"rgb(0, 0, 159)","iconMask":"present","barWidth":"6px","afterBorderLeft":"none","focusOutline":"solid 4px rgba(5, 0, 73, 0.8)","dir":"ltr","darkClass":false,"forced":true}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| summary text (error colour) on its background | #00009f | #ffffff | 13.99:1 | 4.5:1 | ✓ pass |
| left error bar vs background | #000000 | #ffffff | 21:1 | 3:1 | ✓ pass |
| error icon vs background | #000000 | #ffffff | 21:1 | 3:1 | ✓ pass |
| focus outline vs background | #050048 | #ffffff | 19.09:1 | 3:1 | ✓ pass |


**after-tabs**: {"menuItemColor":"rgb(0, 0, 159)","barWidth":"6px","iconMask":"present","dir":"ltr","darkClass":false,"forced":true}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| tab label (error colour) on its background | #00009f | #ffffff | 13.99:1 | 4.5:1 | ✓ pass |
| tab error bar vs background | #00009f | #ffffff | 13.99:1 | 3:1 | ✓ pass |
| tab error icon vs background | #000000 | #ffffff | 21:1 | 3:1 | ✓ pass |


**after-tabs-hover**: {"menuItemColor":"rgb(0, 0, 159)","barWidth":"6px","iconMask":"present","dir":"ltr","darkClass":false,"forced":true}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| tab label (error colour) on its background | #00009f | #ffffff | 13.99:1 | 4.5:1 | ✓ pass |
| tab error bar vs background | #00009f | #ffffff | 13.99:1 | 3:1 | ✓ pass |
| tab error icon vs background | #000000 | #ffffff | 21:1 | 3:1 | ✓ pass |


**after-tabs-focus**: {"menuItemColor":"rgb(0, 0, 159)","barWidth":"6px","iconMask":"present","focusOutline":"solid 4px rgba(5, 0, 73, 0.8)","dir":"ltr","darkClass":false,"forced":true}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| tab label (error colour) on its background | #00009f | #ffffff | 13.99:1 | 4.5:1 | ✓ pass |
| tab error bar vs background | #00009f | #ffffff | 13.99:1 | 3:1 | ✓ pass |
| tab error icon vs background | #000000 | #ffffff | 21:1 | 3:1 | ✓ pass |
| focus outline vs background | #050048 | #ffffff | 19.09:1 | 3:1 | ✓ pass |

Images: `compare-forced-details*.png`, `compare-forced-tabs*.png` (`-hover` and `-focus` are the hover and keyboard-focus states)

## Mode: forced-currentcolor


**after-details**: {"dataChildErrorCount":"2","open":false,"summaryBackground":"rgba(255, 255, 255, 0)","summaryColor":"rgb(0, 0, 159)","iconMask":"present","barWidth":"6px","afterBorderLeft":"none","dir":"ltr","darkClass":false,"forced":true}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| summary text (error colour) on its background | #00009f | #ffffff | 13.99:1 | 4.5:1 | ✓ pass |
| left error bar vs background | #000000 | #ffffff | 21:1 | 3:1 | ✓ pass |
| error icon vs background | #ffffff | #ffffff | 1:1 | 3:1 | ✗ FAIL |


**after-tabs**: {"menuItemColor":"rgb(0, 0, 159)","barWidth":"6px","iconMask":"present","dir":"ltr","darkClass":false,"forced":true}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| tab label (error colour) on its background | #00009f | #ffffff | 13.99:1 | 4.5:1 | ✓ pass |
| tab error bar vs background | #00009f | #ffffff | 13.99:1 | 3:1 | ✓ pass |
| tab error icon vs background | #ffffff | #ffffff | 1:1 | 3:1 | ✗ FAIL |

Images: `compare-forced-currentcolor-details*.png`, `compare-forced-currentcolor-tabs*.png` (`-hover` and `-focus` are the hover and keyboard-focus states)

## Mode: rtl

- **before-details**: no "contains an error" marker found (expected on Before: the change is not there)
- **before-tabs**: no "contains an error" marker found (expected on Before: the change is not there)

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

Images: `compare-rtl-details*.png`, `compare-rtl-tabs*.png` (`-hover` and `-focus` are the hover and keyboard-focus states)

## Mode: nojs

- **before-details** (JavaScript off): {"detailsError":0,"childErrorCount":0,"errorSummary":true}
- **before-tabs** (JavaScript off): {"detailsError":0,"childErrorCount":0,"errorSummary":false}
- **after-details** (JavaScript off): {"detailsError":3,"childErrorCount":3,"errorSummary":true}
- **after-tabs** (JavaScript off): {"detailsError":0,"childErrorCount":0,"errorSummary":false}
Images: `compare-nojs-details*.png`, `compare-nojs-tabs*.png` (`-hover` and `-focus` are the hover and keyboard-focus states)

