"use client";

import { useCallback, useState } from "react";
import type { Channel, GenerateOutput } from "@/lib/ui/generateClient";

type SectionKey = "hook_headlines" | "benefits" | "dm_messages" | "comment_triggers" | "scarcity_lines" | "shortform_scripts";

type ChannelLabelMap = Record<SectionKey, string>;
type ChannelVisibility = Record<SectionKey, boolean>;

const CHANNEL_LABELS: Record<Channel, ChannelLabelMap> = {
  smartstore: {
    hook_headlines: "상품명/헤드라인",
    benefits: "상세페이지 핵심 문구",
    dm_messages: "구매 유도 문구",
    comment_triggers: "리뷰 유도 문구",
    scarcity_lines: "검색 키워드 제안",
    shortform_scripts: "숏폼 스크립트",
  },
  coupang: {
    hook_headlines: "상품 타이틀 후보",
    benefits: "핵심 불릿포인트",
    dm_messages: "구매 이유",
    comment_triggers: "상세설명 문구",
    scarcity_lines: "검색 키워드 제안",
    shortform_scripts: "숏폼 스크립트",
  },
  social: {
    hook_headlines: "피드 캡션",
    benefits: "스토리 문구",
    dm_messages: "DM 유도 멘트",
    comment_triggers: "댓글 유도 문구",
    scarcity_lines: "마감/희소성 문구",
    shortform_scripts: "숏폼 스크립트",
  },
  shortform: {
    hook_headlines: "후킹 라인 (첫 3초)",
    benefits: "영상 본문 포인트",
    dm_messages: "CTA 문구",
    comment_triggers: "댓글 유도 문구",
    scarcity_lines: "마감/희소성 문구",
    shortform_scripts: "풀 스크립트",
  },
  affiliate: {
    hook_headlines: "블로그 제목",
    benefits: "본문 도입부",
    dm_messages: "추천 문구",
    comment_triggers: "마무리 CTA",
    scarcity_lines: "마감/희소성 문구",
    shortform_scripts: "숏폼 스크립트",
  },
};

const CHANNEL_VISIBLE_SECTIONS: Record<Channel, ChannelVisibility> = {
  smartstore: {
    hook_headlines: true,
    benefits: true,
    dm_messages: true,
    comment_triggers: true,
    scarcity_lines: true,
    shortform_scripts: false,
  },
  coupang: {
    hook_headlines: true,
    benefits: true,
    dm_messages: true,
    comment_triggers: true,
    scarcity_lines: true,
    shortform_scripts: false,
  },
  social: {
    hook_headlines: true,
    benefits: true,
    dm_messages: true,
    comment_triggers: true,
    scarcity_lines: true,
    shortform_scripts: true,
  },
  shortform: {
    hook_headlines: true,
    benefits: true,
    dm_messages: true,
    comment_triggers: true,
    scarcity_lines: false,
    shortform_scripts: true,
  },
  affiliate: {
    hook_headlines: true,
    benefits: true,
    dm_messages: true,
    comment_triggers: true,
    scarcity_lines: true,
    shortform_scripts: false,
  },
};

type CopyPackageViewProps = {
  output: GenerateOutput;
  channel: Channel;
};

function CopyButton({
  text,
  label,
  variant = "default",
  size = "default",
}: {
  text: string;
  label: string;
  variant?: "default" | "primary";
  size?: "default" | "large";
}) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={copy}
      className={`copy-btn ${variant === "primary" ? "copy-btn-primary" : ""} ${size === "large" ? "copy-btn-large" : ""} ${copied ? "copied" : ""}`}
      aria-label={label}
    >
      {copied ? (
        <>
          <svg className="copy-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          복사됨
        </>
      ) : (
        <>
          <svg className="copy-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          복사
        </>
      )}
    </button>
  );
}

function OutputSection({
  title,
  badge,
  children,
  copyText,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
  copyText?: string;
}) {
  return (
    <section className="output-section">
      <div className="output-section-header">
        <div className="output-section-title-row">
          <h3 className="output-section-title">{title}</h3>
          {badge && <span className="output-section-badge">{badge}</span>}
        </div>
        {copyText !== undefined && (
          <CopyButton text={copyText} label={`${title} 복사`} />
        )}
      </div>
      <div className="output-section-content">{children}</div>
    </section>
  );
}

function ListItem({ index, text }: { index: number; text: string }) {
  return (
    <li className="output-list-item">
      <span className="output-list-num">{index}</span>
      <span className="output-list-text">{text}</span>
    </li>
  );
}

export function CopyPackageView({ output, channel }: CopyPackageViewProps) {
  const labels = CHANNEL_LABELS[channel] ?? CHANNEL_LABELS.smartstore;
  const visibleSections = CHANNEL_VISIBLE_SECTIONS[channel] ?? CHANNEL_VISIBLE_SECTIONS.smartstore;

  // Build full text for copy all (markdown)
  const fullText = [
    ...(visibleSections.hook_headlines ? [
      `## ${labels.hook_headlines}`,
      ...output.hook_headlines.map((h, i) => `${i + 1}. ${h}`),
      "",
    ] : []),
    ...(visibleSections.benefits ? [
      `## ${labels.benefits}`,
      ...output.benefits.map((b, i) => `${i + 1}. ${b}`),
      "",
    ] : []),
    ...(visibleSections.dm_messages ? [
      `## ${labels.dm_messages}`,
      ...output.dm_messages.map((d, i) => `${i + 1}. ${d}`),
      "",
    ] : []),
    ...(visibleSections.comment_triggers ? [
      `## ${labels.comment_triggers}`,
      ...output.comment_triggers.map((c, i) => `${i + 1}. ${c}`),
      "",
    ] : []),
    ...(visibleSections.scarcity_lines ? [
      `## ${labels.scarcity_lines}`,
      ...output.scarcity_lines.map((s, i) => `${i + 1}. ${s}`),
      "",
    ] : []),
    ...(visibleSections.shortform_scripts ? [
      `## ${labels.shortform_scripts}`,
      ...output.shortform_scripts.map(
        (s, i) => `[${i + 1}]\n훅: ${s.hook}\n본문: ${s.body}`
      ),
    ] : []),
  ].join("\n");

  // Build plain text (no markdown headers)
  const plainText = [
    ...(visibleSections.hook_headlines ? [
      `[${labels.hook_headlines}]`,
      ...output.hook_headlines.map((h, i) => `${i + 1}. ${h}`),
      "",
    ] : []),
    ...(visibleSections.benefits ? [
      `[${labels.benefits}]`,
      ...output.benefits.map((b, i) => `${i + 1}. ${b}`),
      "",
    ] : []),
    ...(visibleSections.dm_messages ? [
      `[${labels.dm_messages}]`,
      ...output.dm_messages.map((d, i) => `${i + 1}. ${d}`),
      "",
    ] : []),
    ...(visibleSections.comment_triggers ? [
      `[${labels.comment_triggers}]`,
      ...output.comment_triggers.map((c, i) => `${i + 1}. ${c}`),
      "",
    ] : []),
    ...(visibleSections.scarcity_lines ? [
      `[${labels.scarcity_lines}]`,
      ...output.scarcity_lines.map((s, i) => `${i + 1}. ${s}`),
      "",
    ] : []),
    ...(visibleSections.shortform_scripts ? [
      `[${labels.shortform_scripts}]`,
      ...output.shortform_scripts.map(
        (s, i) => `[${i + 1}] ${s.hook}\n${s.body}`
      ),
    ] : []),
  ].join("\n");

  return (
    <div className="output-container">
      {/* Header */}
      <div className="output-header">
        <div>
          <h2 className="output-main-title">생성 결과</h2>
          <p className="output-main-desc">복사해서 판매글에 바로 사용하세요</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <CopyButton
            text={plainText}
            label="텍스트로 복사"
            size="large"
          />
          <CopyButton
            text={fullText}
            label="전체 복사"
            variant="primary"
            size="large"
          />
        </div>
      </div>

      {/* Sections Container */}
      <div className="output-sections">
        {/* Hooking Headlines */}
        {visibleSections.hook_headlines && (
          <OutputSection
            title={labels.hook_headlines}
            badge={`${output.hook_headlines.length}개`}
            copyText={output.hook_headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}
          >
            <ul className="output-list">
              {output.hook_headlines.map((h, i) => (
                <ListItem key={i} index={i + 1} text={h} />
              ))}
            </ul>
          </OutputSection>
        )}

        {/* Core Benefits */}
        {visibleSections.benefits && (
          <OutputSection
            title={labels.benefits}
            badge={`${output.benefits.length}개`}
            copyText={output.benefits.map((b, i) => `${i + 1}. ${b}`).join("\n")}
          >
            <ul className="output-list">
              {output.benefits.map((b, i) => (
                <ListItem key={i} index={i + 1} text={b} />
              ))}
            </ul>
          </OutputSection>
        )}

        {/* DM Messages */}
        {visibleSections.dm_messages && (
          <OutputSection
            title={labels.dm_messages}
            badge={`${output.dm_messages.length}개`}
            copyText={output.dm_messages.map((d, i) => `${i + 1}. ${d}`).join("\n")}
          >
            <ul className="output-list">
              {output.dm_messages.map((d, i) => (
                <ListItem key={i} index={i + 1} text={d} />
              ))}
            </ul>
          </OutputSection>
        )}

        {/* Comment Triggers */}
        {visibleSections.comment_triggers && (
          <OutputSection
            title={labels.comment_triggers}
            badge={`${output.comment_triggers.length}개`}
            copyText={output.comment_triggers.map((c, i) => `${i + 1}. ${c}`).join("\n")}
          >
            <ul className="output-list">
              {output.comment_triggers.map((c, i) => (
                <ListItem key={i} index={i + 1} text={c} />
              ))}
            </ul>
          </OutputSection>
        )}

        {/* Scarcity Lines */}
        {visibleSections.scarcity_lines && (
          <OutputSection
            title={labels.scarcity_lines}
            badge={`${output.scarcity_lines.length}개`}
            copyText={output.scarcity_lines.map((s, i) => `${i + 1}. ${s}`).join("\n")}
          >
            <ul className="output-list">
              {output.scarcity_lines.map((s, i) => (
                <ListItem key={i} index={i + 1} text={s} />
              ))}
            </ul>
          </OutputSection>
        )}

        {/* Shortform Scripts */}
        {visibleSections.shortform_scripts && (
          <OutputSection
            title={labels.shortform_scripts}
            badge={`${output.shortform_scripts.length}종`}
            copyText={output.shortform_scripts
              .map((s, i) => `[${i + 1}]\n훅: ${s.hook}\n본문: ${s.body}`)
              .join("\n\n")}
          >
            <div className="shortform-scripts">
              {output.shortform_scripts.map((s, i) => (
                <div key={i} className="shortform-script-card">
                  <div className="shortform-script-badge">
                    <span>스크립트 {i + 1}</span>
                  </div>
                  <div className="shortform-script-content">
                    <div className="shortform-hook">
                      <span className="shortform-hook-label">훅 (첫 3초)</span>
                      <p className="shortform-hook-text">&ldquo;{s.hook}&rdquo;</p>
                    </div>
                    <div className="shortform-body">
                      <span className="shortform-body-label">본문</span>
                      <p className="shortform-body-text">{s.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </OutputSection>
        )}
      </div>
    </div>
  );
}
