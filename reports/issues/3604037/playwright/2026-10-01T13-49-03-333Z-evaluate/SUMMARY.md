# #3604037 evaluation (3604037-latest)

Run 2026-10-01T13:49:03.334Z. Before `baseline-3604037-latest`, After `issue-3604037-latest` (the MR on current core). Automated measurements are a DRAFT: they do not replace a person's look in each mode.

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

## Mode: forced-preserve


**after-details**: {"dataChildErrorCount":"2","open":false,"summaryBackground":"rgba(255, 255, 255, 0)","summaryColor":"rgb(0, 0, 159)","iconMask":"present","barWidth":"6px","afterBorderLeft":"none","dir":"ltr","darkClass":false,"forced":true}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| summary text (error colour) on its background | #00009f | #ffffff | 13.99:1 | 4.5:1 | ✓ pass |
| left error bar vs background | #000000 | #ffffff | 21:1 | 3:1 | ✓ pass |
| error icon vs background | #00009f | #ffffff | 13.99:1 | 3:1 | ✓ pass |


**after-tabs**: {"menuItemColor":"rgb(0, 0, 159)","barWidth":"6px","iconMask":"present","dir":"ltr","darkClass":false,"forced":true}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| tab label (error colour) on its background | #00009f | #ffffff | 13.99:1 | 4.5:1 | ✓ pass |
| tab error bar vs background | #00009f | #ffffff | 13.99:1 | 3:1 | ✓ pass |
| tab error icon vs background | #00009f | #ffffff | 13.99:1 | 3:1 | ✓ pass |

Images: `compare-forced-preserve-details*.png`, `compare-forced-preserve-tabs*.png` (`-hover` and `-focus` are the hover and keyboard-focus states)

## Mode: forced-linktext


**after-details**: {"dataChildErrorCount":"2","open":false,"summaryBackground":"rgba(255, 255, 255, 0)","summaryColor":"rgb(0, 0, 159)","iconMask":"present","barWidth":"6px","afterBorderLeft":"none","dir":"ltr","darkClass":false,"forced":true}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| summary text (error colour) on its background | #00009f | #ffffff | 13.99:1 | 4.5:1 | ✓ pass |
| left error bar vs background | #000000 | #ffffff | 21:1 | 3:1 | ✓ pass |
| error icon vs background | #00009f | #ffffff | 13.99:1 | 3:1 | ✓ pass |


**after-tabs**: {"menuItemColor":"rgb(0, 0, 159)","barWidth":"6px","iconMask":"present","dir":"ltr","darkClass":false,"forced":true}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| tab label (error colour) on its background | #00009f | #ffffff | 13.99:1 | 4.5:1 | ✓ pass |
| tab error bar vs background | #00009f | #ffffff | 13.99:1 | 3:1 | ✓ pass |
| tab error icon vs background | #00009f | #ffffff | 13.99:1 | 3:1 | ✓ pass |

Images: `compare-forced-linktext-details*.png`, `compare-forced-linktext-tabs*.png` (`-hover` and `-focus` are the hover and keyboard-focus states)

## Mode: forced-dark

- **before-details**: no "contains an error" marker found (expected on Before: the change is not there)
- **before-details-hover**: no "contains an error" marker found (expected on Before: the change is not there)
- **before-details-focus**: no "contains an error" marker found (expected on Before: the change is not there)
- **before-tabs**: no "contains an error" marker found (expected on Before: the change is not there)
- **before-tabs-hover**: no "contains an error" marker found (expected on Before: the change is not there)
- **before-tabs-focus**: no "contains an error" marker found (expected on Before: the change is not there)

**after-details**: {"dataChildErrorCount":"2","open":false,"summaryBackground":"rgba(0, 0, 0, 0)","summaryColor":"rgb(255, 255, 0)","iconMask":"present","barWidth":"6px","afterBorderLeft":"none","dir":"ltr","darkClass":true,"forced":true}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| summary text (error colour) on its background | #ffff00 | #000000 | 19.56:1 | 4.5:1 | ✓ pass |
| left error bar vs background | #ffffff | #000000 | 21:1 | 3:1 | ✓ pass |
| error icon vs background | #ffffff | #000000 | 21:1 | 3:1 | ✓ pass |


**after-details-hover**: {"dataChildErrorCount":"2","open":false,"summaryBackground":"rgba(0, 0, 0, 0.15)","summaryColor":"rgb(255, 255, 0)","iconMask":"present","barWidth":"6px","afterBorderLeft":"none","dir":"ltr","darkClass":true,"forced":true}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| summary text (error colour) on its background | #ffff00 | #000000 | 19.56:1 | 4.5:1 | ✓ pass |
| left error bar vs background | #ffffff | #000000 | 21:1 | 3:1 | ✓ pass |
| error icon vs background | #ffffff | #000000 | 21:1 | 3:1 | ✓ pass |


**after-details-focus**: {"dataChildErrorCount":"2","open":false,"summaryBackground":"rgba(0, 0, 0, 0)","summaryColor":"rgb(255, 255, 0)","iconMask":"present","barWidth":"6px","afterBorderLeft":"none","focusOutline":"solid 4px rgba(26, 235, 255, 0.8)","dir":"ltr","darkClass":true,"forced":true}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| summary text (error colour) on its background | #ffff00 | #000000 | 19.56:1 | 4.5:1 | ✓ pass |
| left error bar vs background | #ffffff | #000000 | 21:1 | 3:1 | ✓ pass |
| error icon vs background | #ffffff | #000000 | 21:1 | 3:1 | ✓ pass |
| focus outline vs background | #1aebff | #000000 | 14.37:1 | 3:1 | ✓ pass |


**after-tabs**: {"menuItemColor":"rgb(255, 255, 0)","barWidth":"6px","iconMask":"present","dir":"ltr","darkClass":true,"forced":true}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| tab label (error colour) on its background | #ffff00 | #000000 | 19.56:1 | 4.5:1 | ✓ pass |
| tab error bar vs background | #ffff00 | #000000 | 19.56:1 | 3:1 | ✓ pass |
| tab error icon vs background | #ffffff | #000000 | 21:1 | 3:1 | ✓ pass |


**after-tabs-hover**: {"menuItemColor":"rgb(255, 255, 0)","barWidth":"6px","iconMask":"present","dir":"ltr","darkClass":true,"forced":true}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| tab label (error colour) on its background | #ffff00 | #000000 | 19.56:1 | 4.5:1 | ✓ pass |
| tab error bar vs background | #ffff00 | #000000 | 19.56:1 | 3:1 | ✓ pass |
| tab error icon vs background | #ffffff | #000000 | 21:1 | 3:1 | ✓ pass |


**after-tabs-focus**: {"menuItemColor":"rgb(255, 255, 0)","barWidth":"6px","iconMask":"present","focusOutline":"solid 4px rgba(26, 235, 255, 0.8)","dir":"ltr","darkClass":true,"forced":true}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| tab label (error colour) on its background | #ffff00 | #000000 | 19.56:1 | 4.5:1 | ✓ pass |
| tab error bar vs background | #ffff00 | #000000 | 19.56:1 | 3:1 | ✓ pass |
| tab error icon vs background | #ffffff | #000000 | 21:1 | 3:1 | ✓ pass |
| focus outline vs background | #1aebff | #000000 | 14.37:1 | 3:1 | ✓ pass |

Images: `compare-forced-dark-details*.png`, `compare-forced-dark-tabs*.png` (`-hover` and `-focus` are the hover and keyboard-focus states)

## Mode: forced-dark-preserve


**after-details**: {"dataChildErrorCount":"2","open":false,"summaryBackground":"rgba(0, 0, 0, 0)","summaryColor":"rgb(255, 255, 0)","iconMask":"present","barWidth":"6px","afterBorderLeft":"none","dir":"ltr","darkClass":true,"forced":true}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| summary text (error colour) on its background | #ffff00 | #000000 | 19.56:1 | 4.5:1 | ✓ pass |
| left error bar vs background | #ffffff | #000000 | 21:1 | 3:1 | ✓ pass |
| error icon vs background | #ffff00 | #000000 | 19.56:1 | 3:1 | ✓ pass |


**after-tabs**: {"menuItemColor":"rgb(255, 255, 0)","barWidth":"6px","iconMask":"present","dir":"ltr","darkClass":true,"forced":true}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| tab label (error colour) on its background | #ffff00 | #000000 | 19.56:1 | 4.5:1 | ✓ pass |
| tab error bar vs background | #ffff00 | #000000 | 19.56:1 | 3:1 | ✓ pass |
| tab error icon vs background | #ffff00 | #000000 | 19.56:1 | 3:1 | ✓ pass |

Images: `compare-forced-dark-preserve-details*.png`, `compare-forced-dark-preserve-tabs*.png` (`-hover` and `-focus` are the hover and keyboard-focus states)

## Mode: forced-dark-linktext


**after-details**: {"dataChildErrorCount":"2","open":false,"summaryBackground":"rgba(0, 0, 0, 0)","summaryColor":"rgb(255, 255, 0)","iconMask":"present","barWidth":"6px","afterBorderLeft":"none","dir":"ltr","darkClass":true,"forced":true}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| summary text (error colour) on its background | #ffff00 | #000000 | 19.56:1 | 4.5:1 | ✓ pass |
| left error bar vs background | #ffffff | #000000 | 21:1 | 3:1 | ✓ pass |
| error icon vs background | #ffff00 | #000000 | 19.56:1 | 3:1 | ✓ pass |


**after-tabs**: {"menuItemColor":"rgb(255, 255, 0)","barWidth":"6px","iconMask":"present","dir":"ltr","darkClass":true,"forced":true}

| Check | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|
| tab label (error colour) on its background | #ffff00 | #000000 | 19.56:1 | 4.5:1 | ✓ pass |
| tab error bar vs background | #ffff00 | #000000 | 19.56:1 | 3:1 | ✓ pass |
| tab error icon vs background | #ffff00 | #000000 | 19.56:1 | 3:1 | ✓ pass |

Images: `compare-forced-dark-linktext-details*.png`, `compare-forced-dark-linktext-tabs*.png` (`-hover` and `-focus` are the hover and keyboard-focus states)

