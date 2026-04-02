# Plan: landing-conversion-upgrade

> Phase: Plan | Status: done | Created: 2026-04-03

## Executive Summary

| Perspective | Summary |
|-------------|---------|
| Problem | Visitors see VibeCopy as "another ChatGPT wrapper" — no compelling reason to sign up or pay |
| Solution | Redesign landing page around quantified output (32 pieces), ChatGPT comparison, and full demo showcase |
| Function/UX Effect | 7-section conversion funnel: Hero → Comparison → Demo → How it works → Persona → Pricing → CTA |
| Core Value | Transform positioning from "AI copy tool" to "seller-specific selling package generator" |

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | Increase visitor→signup→payment conversion by killing the "just use ChatGPT" objection |
| WHO | Korean e-commerce sellers (SmartStore, Coupang, Instagram group-buy, shortform) |
| RISK | Copy changes alone may not convert if the product experience doesn't match the promise |
| SUCCESS | Landing page clearly differentiates VibeCopy from ChatGPT; visitors understand the value in <10 seconds |
| SCOPE | Landing page copy + section structure only. No backend changes. No new features. |

## 1. Problem Statement

Current landing page positions VibeCopy as "AI 기반 마케팅 카피 생성기" — indistinguishable from ChatGPT.

Key issues:
- Hero headline is generic ("바로 쓸 수 있는 카피")
- Pain points section lists common complaints any AI tool claims to solve
- Demo only shows 2 of 6 output sections (hides the real value)
- No ChatGPT comparison (the #1 objection)
- No "How it works" section
- No pricing on landing page
- No social proof or specificity

## 2. Requirements

### R1: Differentiation messaging
- Quantify output: "32 pieces in one generation"
- Channel-specific optimization (5 channels)
- Vibe/tone presets (5 styles)
- Policy-safe copy (no exaggeration, no banned expressions)

### R2: Conversion-focused section structure
1. Hero: Pain → quantified outcome
2. ChatGPT vs VibeCopy comparison table
3. Full 6-section demo with copy buttons
4. 3-step "How it works"
5. Target persona identification
6. Inline pricing with ROI framing
7. Final CTA

### R3: Remove weak messaging
- Remove "AI 기반" generic badge
- Remove vague "이런 고민" pain points
- Replace with specific, quantified claims

## 3. Success Criteria

| # | Criteria | Measurement |
|---|----------|-------------|
| SC1 | Hero communicates quantified value ("32 pieces") within first viewport | Visual inspection |
| SC2 | ChatGPT comparison section exists and addresses the objection directly | Content review |
| SC3 | Demo shows all 6 output categories with copy buttons | Component count |
| SC4 | Pricing appears on landing page with ROI framing | Content review |
| SC5 | No generic "AI" positioning language remains | Copy audit |

## 4. Constraints

- Korean language only
- Must use existing CSS design system (landing.css)
- No new API endpoints or backend changes
- Single page component (page.tsx)
- Mobile responsive (existing CSS handles this)

## 5. Out of Scope

- A/B testing infrastructure
- Analytics/tracking implementation
- Testimonial collection system
- Video/animation content
- Backend or API changes
