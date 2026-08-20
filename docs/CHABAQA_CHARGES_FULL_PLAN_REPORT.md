# Chabaqa Charges Full Plan Report

## Source
- Document: `chage shabaqa` (Google Sheet HTML view)
- Extracted sheet: `feuille 1`
- Currency: `TND`
- Billing shown in sheet: monthly and yearly display values

## Executive Summary
Chabaqa currently defines 3 plans with strong gross subscription margins even before transaction-fee revenue:

- `Starter`: 39 TND/month, 31 TND/year (as written in source), transaction fee 7.9%
- `Growth`: 99 TND/month, 79 TND/year (as written in source), transaction fee 4.9%
- `Pro`: 159 TND/month, 127 TND/year (as written in source), transaction fee 2.9%

The internal cost model in the sheet indicates:
- Very high margin on Starter
- Strong margin on Growth
- Healthy margin on Pro

## 1. Plans and Core Charges

| Plan | Monthly Price | Yearly Price (as listed) | Platform Transaction Fee |
|---|---:|---:|---:|
| Starter | 39 TND | 31 TND/year | 7.9% |
| Growth | 99 TND | 79 TND/year | 4.9% |
| Pro | 159 TND | 127 TND/year | 2.9% |

## 2. Included Limits by Plan

### 2.1 Creator / Platform Limits
| Limit | Starter | Growth | Pro |
|---|---|---|---|
| Total members | 100 | 500 | Unlimited |
| Team/Admin seats | 1 | 2 | 3 |
| Custom domain | No | Not clearly specified | Included |
| Verified badge | No | Yes | Priority support SLA = Yes |
| Free trial | Not explicit | 7 days noted in sheet (`freeTrialDays`) | Not explicit |

### 2.2 Content Limits
| Limit | Starter | Growth | Pro |
|---|---|---|---|
| Active courses/products/challenges/events | Not explicitly visible | Unlimited | Unlimited |
| Session bookings received | Not explicitly visible | 300/month | 1,000/month |
| Storage included | 5 GB | 50 GB | 300 GB |

### 2.3 Growth / Automation Limits
| Limit | Starter | Growth | Pro |
|---|---|---|---|
| Email campaigns | Not clearly visible | 1,000/month | 15,000/month |
| AI credits | To calculate | To calculate | To calculate/month |
| WhatsApp included | To calculate | 250 utility/auth messages/month | 1,000 utility/auth messages/month |

### 2.4 Analytics Limits
| Limit | Starter | Growth | Pro |
|---|---|---|---|
| Analytics tier | Basic | Advanced | Advanced + Exports |
| Modules | Overview only | Overview + communities/courses/challenges/sessions/events/products/posts | All creator analytics modules |
| Lookback window | 30 days | 180 days | 365 days |
| Refresh frequency | Daily | Daily (auto) + refresh button | Daily + immediate refresh |
| CSV export | No | No | Yes |

## 3. Variable Cost Assumptions in Sheet

| Cost Driver | Value from Sheet |
|---|---|
| Storage cost | 0.0435 TND per GB/month |
| WhatsApp vendor cost | 0.02436 TND per message |
| R2 Class A request formula | (requests / 1,000,000) x 4.50 USD x 2.9 |
| R2 Class B request formula | (requests / 1,000,000) x 0.36 USD x 2.9 |

## 4. Included Usage Cost per Plan (from Sheet)

### Starter included cost
- Storage: `5 GB x 0.0435 = 0.22 TND`
- R2 Class A: `0.20 TND`
- R2 Class B: `0.16 TND`
- WhatsApp: `0`
- Total included usage cost: `0.57 TND`

### Growth included cost
- Storage: `100 GB x 0.0435 = 4.35 TND`
- R2 Class A: `1.04 TND`
- R2 Class B: `0.84 TND`
- WhatsApp: `250 x 0.02436 = 6.09 TND`
- Total included usage cost: `12.32 TND`

### Pro included cost
- Storage: `300 GB x 0.0435 = 13.05 TND`
- R2 Class A: `3.26 TND`
- R2 Class B: `2.61 TND`
- WhatsApp: `1,000 x 0.02436 = 24.36 TND`
- Total included usage cost: `37.41 TND`

## 5. Subscription-Only Profitability (from Sheet)

| Plan | Price Basis Used in Sheet | Included Cost | Gross Margin Value | Gross Margin % |
|---|---:|---:|---:|---:|
| Starter | 31 TND | 0.57 TND | 30.43 TND | 98.16% |
| Growth | 79 TND | 12.32 TND | 66.68 TND | 84.41% |
| Pro | 127 TND | 37.41 TND | 89.59 TND | 70.54% |

Note: These profitability percentages are explicitly labeled in sheet as "Without Transaction Fees (subscription-only margin)".

## 6. Add-on Charges

### 6.1 Team seat add-on
- `+1 admin seat = 15 TND/month`

### 6.2 Additional storage add-on
| Plan | +100 GB Price | Internal 100 GB Cost | Gross Profit | Margin |
|---|---:|---:|---:|---:|
| Starter | 12 TND/month | 4.35 TND | 7.65 TND | ~64% |
| Growth | 10 TND/month | 4.35 TND | 5.65 TND | ~56.5% |
| Pro | 9 TND/month | 4.35 TND | 4.65 TND | ~51.7% |

## 7. Gaps to Finalize Before Public Pricing Release

The following fields are still marked as `to calculate` and should be finalized:

1. AI credits per plan
2. Starter WhatsApp included quota (if any)
3. Fixed + percentage breakdown for transaction fees note (`Frais de transaction**`)
4. Clarify yearly pricing format (currently shown as `31/year`, `79/year`, `127/year`)
5. Confirm Growth custom domain entitlement (not explicit in extracted rows)
6. Confirm Starter content/session caps where not visible in extracted rows

## 8. Recommended Final Pricing Policy Structure

### 8.1 Public pricing presentation
- Show monthly and yearly prices with a clear annual billing discount line.
- Show plan transaction fees in a separate monetization section.
- Show included quotas for: members, storage, campaigns, WhatsApp, analytics.

### 8.2 Internal finance controls
- Track per-plan realized variable cost monthly:
  - storage
  - messaging (WhatsApp)
  - object storage request cost
- Alert when plan gross margin drops below target thresholds:
  - Starter: 80%
  - Growth: 65%
  - Pro: 50%

### 8.3 Suggested target guardrails
- Keep add-on storage margin above 45%.
- Keep blended margin (subscription + transaction fees - variable cost) above 55% for all tiers.
- Revisit WhatsApp bundled quotas quarterly based on usage behavior.

## 9. Action Plan (Execution)

1. Finalize all `to calculate` charge fields in source sheet.
2. Lock annual pricing semantics (per month billed yearly vs full yearly amount).
3. Publish canonical pricing JSON/config in backend.
4. Wire pricing config into frontend pricing page and checkout.
5. Add automated unit tests for fee computation and quota enforcement.
6. Add monthly finance report that compares projected vs actual unit economics by plan.

## 10. Data Confidence Notes

- This report is generated from the available HTML-rendered sheet extraction.
- Some cells in the source were sparse/blank in the extracted output.
- Re-run report once all sheets are finalized and all calculation fields are populated.
