# Drupal Core Sustainability Report

> **Generated:** 2026-07-06T02:16:02.110Z
> **CO2 model:** CO2.js Sustainable Web Design v4 (per byte, global grid average)
> **Method:** Resource Timing API on cold-cache page loads (fresh browser context per page), desktop viewport, light mode, LTR, default accent. Same-origin DDEV site, so transfer sizes are complete.
> **Standard:** [W3C Web Sustainability Guidelines (draft)](https://www.w3.org/TR/web-sustainability-guidelines/)

## Summary

| Metric | Value |
| :--- | :--- |
| Pages measured (theme × page) | 95 |
| Themes | admin, claro, olivero |
| Median page weight (transfer) | 720.2 KB |
| Average page weight (transfer) | 694.0 KB |
| Average requests per page | 13.2 |
| Average DOM nodes per page | 932 |
| Estimated CO2, one view of every page | 10.006 g |
| Accessibility violations on measured pages | 69 (0 critical, 35 serious) |

## Trend

First recorded run — trends appear from the second scan onward.

## Per-Theme Baseline

| Theme | Pages | Median weight | Avg requests | Avg DOM nodes | CO2 (all pages) |
| :--- | ---: | ---: | ---: | ---: | ---: |
| admin | 47 | 757.2 KB | 14.3 | 948 | 5.904 g |
| claro | 47 | 502.5 KB | 12.3 | 933 | 4.086 g |
| olivero | 1 | 107.2 KB | 8.0 | 111 | 0.016 g |

## Heaviest Pages (top 10 by transfer size)

| Theme | Page | Transfer | Requests | DOM nodes | CO2/view |
| :--- | :--- | ---: | ---: | ---: | ---: |
| admin | `/node/add/article` | 1330.4 KB | 15 | 900 | 0.202 g |
| admin | `/admin/form_style` | 1330.2 KB | 15 | 1115 | 0.202 g |
| admin | `/contact/presuf_formatted` | 1329.6 KB | 17 | 1864 | 0.202 g |
| admin | `/node/add/cd` | 1321.3 KB | 15 | 854 | 0.201 g |
| admin | `/node/add/page` | 1321.1 KB | 15 | 840 | 0.200 g |
| admin | `/contact/textarea` | 1313.6 KB | 17 | 1220 | 0.199 g |
| admin | `/admin/appearance` | 1205.3 KB | 19 | 732 | 0.183 g |
| claro | `/admin/form_style` | 1076.2 KB | 13 | 1111 | 0.163 g |
| claro | `/node/add/article` | 1073.4 KB | 13 | 882 | 0.163 g |
| claro | `/contact/presuf_formatted` | 1071.3 KB | 15 | 1814 | 0.163 g |

## Image Formats

WSG favours efficient media formats (AVIF/WebP/SVG) over legacy raster formats.

| Format | Requests | Transfer | Modern? |
| :--- | ---: | ---: | :--- |
| png | 8 | 962.3 KB | ⚠️ legacy |
| avif | 2 | 4.6 KB | ✅ |
| svg | 3 | 2.3 KB | ✅ |

### Expected & beneficial files

| File | Kind | Status |
| :--- | :--- | :--- |
| `/robots.txt` | expected | ✅ 200 |
| `/favicon.ico` | expected | ⚠️ missing (404) |
| `/sitemap.xml` | expected | ⚠️ missing (404) |
| `/humans.txt` | beneficial | ⚠️ missing (404) |
| `/.well-known/security.txt` | beneficial | ⚠️ missing (404) |
| `/carbon.txt` | beneficial | ⚠️ missing (404) |

## Data

- Full per-page history: [`sustainability/history.json`](sustainability/history.json) — 1 run(s) recorded, append-only, one entry per scan date.
- Query examples:

```bash
# Page weight of /admin/content in Claro over time
jq -r '.runs[] | [.date, (.pages[] | select(.theme=="claro" and .path=="/admin/content") | .transferBytes)] | @tsv' reports/sustainability/history.json

# CO2 trend for the whole crawl
jq -r '.runs[] | [.date, .summary.totalCo2Grams] | @tsv' reports/sustainability/history.json
```
