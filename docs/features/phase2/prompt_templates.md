# Feature: Prompt templates (vibe presets and channel constraints)

## Milestone Item
- Milestone: Phase 2 / API 구현
- Checkbox: 프롬프트 템플릿 작성 (바이브 프리셋 포함)

## Summary
Updated the prompt module so each request gets channel-specific constraints and vibe-specific tone/length/taboo/CTA instructions. Added `VIBE_PRESETS` (trust, review, impulse, premium, groupbuy) and `CHANNEL_CONSTRAINTS` (smartstore, coupang, affiliate, social, shortform) as typed constants. System prompt now includes role, response schema, channel rules, vibe preset, and risk_check policy. Output schema is unchanged.

## Files Changed
- lib/prompts/generateCopy.ts
- docs/features/phase2/prompt_templates.md

## How to Test

### Prompt unit test (manual)
1. Start the app and ensure you have a valid session and `OPENAI_API_KEY`.
2. Call `POST /api/generate` with each sample below (one per vibe).
3. Check that the response has `ok: true` and `data` with 10 headlines, 5 benefits, 2 shortform_scripts, 5 ctas, and `risk_check` with `level`, `flags`, `notes`.
4. For each vibe, confirm expected characteristics (see table).

| Vibe     | Sample input (input_value)                    | Expected output characteristics |
|----------|------------------------------------------------|----------------------------------|
| trust    | `건강한 수면을 위한 메모리폼 베개`             | Factual tone; soft CTAs (자세히 보기, 검토해 보세요); no 최고/완벽; risk_check flags any exaggeration. |
| review   | `무선 이어폰 블루투스 5.0 노이즈캔슬링`        | Social-proof tone; CTAs like 후기 확인하기, 리뷰 보기; no fake review language. |
| impulse  | `한정 수량 겨울 패딩 50% 할인`                 | Urgent, short lines; CTAs like 지금 보기, 바로 가기; no false scarcity. |
| premium  | `핸드메이드 가죽 크로스백`                     | Refined, quality-focused; CTAs like 경험하기, 만나보기; no 가성비/저가 emphasis. |
| groupbuy | `공동구매 올리브영 스킨케어 3종 세트`         | Deal/community tone; CTAs like 참여하기, 특가 보기; no 무조건/무한. |

Optional: Run the same `input_value` with different `channel` (e.g. smartstore vs shortform) and confirm headline length / format differ (e.g. shortform hook in first line of scripts).

## Sample inputs (one per vibe)

Use these as request bodies (with your auth cookie). `channel` fixed to `smartstore` for comparability; change to test channel constraints.

**1. trust**
```json
{"input_type":"text","input_value":"건강한 수면을 위한 메모리폼 베개","channel":"smartstore","vibe":"trust"}
```

**2. review**
```json
{"input_type":"text","input_value":"무선 이어폰 블루투스 5.0 노이즈캔슬링","channel":"smartstore","vibe":"review"}
```

**3. impulse**
```json
{"input_type":"text","input_value":"한정 수량 겨울 패딩 50% 할인","channel":"smartstore","vibe":"impulse"}
```

**4. premium**
```json
{"input_type":"text","input_value":"핸드메이드 가죽 크로스백","channel":"smartstore","vibe":"premium"}
```

**5. groupbuy**
```json
{"input_type":"text","input_value":"공동구매 올리브영 스킨케어 3종 세트","channel":"smartstore","vibe":"groupbuy"}
```

## Edge Cases / Known Limits
- Unknown `channel` or `vibe` (e.g. typo): preset/constraint falls back to short generic line; schema and JSON output unchanged.
- Model may occasionally ignore a constraint; manual rubric (see generate_api.md or below) helps spot-check.
- Prohibited phrase list is embedded in natural language in the prompt; no separate blocklist lookup yet.

## Sanity-check quality (quick rubric)
1. **Schema:** 10 headlines, 5 benefits, 2 shortform_scripts (hook+script), 5 ctas, risk_check present.
2. **Vibe:** Tone and CTAs match selected vibe (trust → soft, impulse → urgent, etc.).
3. **Channel:** Headline/script length and style fit channel (e.g. shortform = short hook).
4. **Korean:** Natural Korean; no obvious mistranslation or awkward phrasing.
5. **Risk:** risk_check.level and flags align with copy (e.g. no “최고” in copy if level is low; if present, flagged).

## Follow-ups
- Add optional blocklist for prohibited phrases (config or DB).
- A/B test prompt variants for conversion-oriented metrics.
