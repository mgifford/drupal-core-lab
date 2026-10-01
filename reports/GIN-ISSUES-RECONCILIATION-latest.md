# Gin Issues Reconciliation

Date: 2026-05-05

Workbook: reports/Gin-issues.xlsx

This compares manual workbook ratios against recalculation using the current report WCAG contrast math.

| Sheet | Row | Combo | Metric | Workbook | Recalc | Delta |
|---|---:|---|---|---:|---:|---:|
| Components | 9 | Gin Blue | H (F vs E) | 1.300 | 1.250 | -0.050 |
| Components | 19 | Neutral | I (B vs D) | 1.300 | 1.250 | -0.050 |
| Focus | 76 | Orange | N (focus vs D) | 2.800 | 2.849 | +0.049 |
| Focus | 20 | Gin Blue | K (border vs D) | 3.400 | 3.353 | -0.047 |
| Focus | 110 | Dark Purple | N (focus vs D) | 2.600 | 2.553 | -0.047 |
| Components | 11 | Dark Purple | H (F vs E) | 1.300 | 1.346 | +0.046 |
| Components | 12 | Purple | G (B vs F) | 7.500 | 7.455 | -0.045 |
| Components | 10 | Light Blue | I (B vs D) | 2.000 | 2.042 | +0.042 |
| Components | 16 | Red | G (B vs F) | 6.300 | 6.258 | -0.042 |
| Components | 19 | Neutral | G (B vs F) | 13.200 | 13.242 | +0.042 |
| Components | 16 | Red | H (F vs E) | 1.200 | 1.241 | +0.041 |
| Focus | 98 | Dark Purple | N (focus vs D) | 5.800 | 5.765 | -0.035 |
| Components | 13 | Teal | G (B vs F) | 5.600 | 5.635 | +0.035 |
| Components | 11 | Dark Purple | I (B vs D) | 1.100 | 1.134 | +0.034 |
| Components | 9 | Gin Blue | G (B vs F) | 7.100 | 7.132 | +0.032 |
| Components | 9 | Gin Blue | I (B vs D) | 1.700 | 1.669 | -0.031 |
| Focus | 98 | Dark Purple | K (border vs D) | 1.100 | 1.130 | +0.030 |
| Components | 12 | Purple | H (F vs E) | 1.300 | 1.330 | +0.030 |
| Focus | 20 | Gin Blue | N (focus vs D) | 2.200 | 2.171 | -0.029 |
| Focus | 52 | Orange | K (border vs D) | 2.900 | 2.929 | +0.029 |
| Components | 14 | Green | G (B vs F) | 5.700 | 5.728 | +0.028 |
| Components | 15 | Pink | I (B vs D) | 2.100 | 2.074 | -0.026 |
| Focus | 64 | Orange | K (border vs D) | 2.800 | 2.775 | -0.025 |
| Focus | 134 | Dark Purple | K (border vs D) | 1.300 | 1.275 | -0.025 |

## Interpretation

- The spreadsheet is manually generated (snapshot values and manually color-picked chips), not formula-driven.
- Recalculated values are usually close; larger deltas indicate manual picking/rounding drift or different sampled UI context.
- The current report evaluates runtime CSS values across multiple states/modes and reports worst-case outcomes, so direct one-row equivalence is not always expected.
