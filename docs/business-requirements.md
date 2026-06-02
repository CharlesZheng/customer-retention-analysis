# Business Requirements Document

## Project

Northstar Commerce Customer Retention Performance Review

## Background

Northstar Commerce is a fictional e-commerce company. Leadership observed that
revenue growth slowed in Q4 despite continued customer acquisition. The company
needs a concise view of commercial and customer-experience performance to
identify a plausible root cause and prioritize follow-up actions.

## Objective

Build an interactive dashboard that helps business stakeholders evaluate the
relationship between revenue, repeat purchasing, delivery performance, and
customer support demand.

## Stakeholders

| Stakeholder | Primary question |
| --- | --- |
| General Manager | What is causing the slowdown in revenue growth? |
| Operations Lead | Is delivery performance contributing to customer churn? |
| CRM Marketing Lead | Which customers should receive retention outreach? |
| Growth Lead | Are acquisition channels bringing in customers with repeat value? |

## Core KPIs

| KPI | Definition | Business value |
| --- | --- | --- |
| Revenue | Total order value in USD | Measures commercial performance |
| Orders | Total completed orders | Separates transaction volume from order value |
| Repeat purchase rate | Weighted share of customers making a repeat purchase | Indicates retention health |
| Average delivery time | Weighted average number of days to delivery | Measures fulfillment experience |
| Support ticket rate | Support tickets per 100 orders | Indicates customer friction |

## Functional requirements

1. Users can filter the dashboard by region, acquisition channel, and customer
   segment.
2. KPI cards update when filters change.
3. The monthly trend view compares revenue with repeat purchase rate.
4. The support-ticket view ranks major issue categories.
5. The dashboard includes a concise analyst takeaway and prioritized action
   plan.
6. The dashboard works on desktop and small screens.

## Acceptance criteria

- All filters update the KPI cards and charts without a page reload.
- The reset button returns the dashboard to the full-company view.
- Recommendations connect to the observed business problem.
- The project clearly states that the dataset is simulated.
