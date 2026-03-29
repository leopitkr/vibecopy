"use client";

import { useCallback, useState } from "react";
import type { GenerateOutput } from "@/lib/ui/generateClient";

type CopyPackageViewProps = {
  output: GenerateOutput;
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

export function CopyPackageView({ output }: CopyPackageViewProps) {
  // Build full text for copy all
  const fullText = [
    "## 후킹 헤드라인",
    ...output.hook_headlines.map((h, i) => `${i + 1}. ${h}`),
    "",
    "## 핵심 베네핏",
    ...output.benefits.map((b, i) => `${i + 1}. ${b}`),
    "",
    "## DM 유도 멘트",
    ...output.dm_messages.map((d, i) => `${i + 1}. ${d}`),
    "",
    "## 댓글 유도 멘트",
    ...output.comment_triggers.map((c, i) => `${i + 1}. ${c}`),
    "",
    "## 마감/희소성 문구",
    ...output.scarcity_lines.map((s, i) => `${i + 1}. ${s}`),
    "",
    "## 숏폼 스크립트",
    ...output.shortform_scripts.map(
      (s, i) => `[${i + 1}]\n훅: ${s.hook}\n본문: ${s.body}`
    ),
  ].join("\n");

  return (
    <div className="output-container">
      {/* Header */}
      <div className="output-header">
        <div>
          <h2 className="output-main-title">생성 결과</h2>
          <p className="output-main-desc">복사해서 판매글에 바로 사용하세요</p>
        </div>
        <CopyButton
          text={fullText}
          label="전체 복사"
          variant="primary"
          size="large"
        />
      </div>

      {/* Sections Container */}
      <div className="output-sections">
        {/* Hooking Headlines */}
        <OutputSection
          title="후킹 헤드라인"
          badge={`${output.hook_headlines.length}개`}
          copyText={output.hook_headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}
        >
          <ul className="output-list">
            {output.hook_headlines.map((h, i) => (
              <ListItem key={i} index={i + 1} text={h} />
            ))}
          </ul>
        </OutputSection>

        {/* Core Benefits */}
        <OutputSection
          title="핵심 베네핏"
          badge={`${output.benefits.length}개`}
          copyText={output.benefits.map((b, i) => `${i + 1}. ${b}`).join("\n")}
        >
          <ul className="output-list">
            {output.benefits.map((b, i) => (
              <ListItem key={i} index={i + 1} text={b} />
            ))}
          </ul>
        </OutputSection>

        {/* DM Messages */}
        <OutputSection
          title="DM 유도 멘트"
          badge={`${output.dm_messages.length}개`}
          copyText={output.dm_messages.map((d, i) => `${i + 1}. ${d}`).join("\n")}
        >
          <ul className="output-list">
            {output.dm_messages.map((d, i) => (
              <ListItem key={i} index={i + 1} text={d} />
            ))}
          </ul>
        </OutputSection>

        {/* Comment Triggers */}
        <OutputSection
          title="댓글 유도 멘트"
          badge={`${output.comment_triggers.length}개`}
          copyText={output.comment_triggers.map((c, i) => `${i + 1}. ${c}`).join("\n")}
        >
          <ul className="output-list">
            {output.comment_triggers.map((c, i) => (
              <ListItem key={i} index={i + 1} text={c} />
            ))}
          </ul>
        </OutputSection>

        {/* Scarcity Lines */}
        <OutputSection
          title="마감/희소성 문구"
          badge={`${output.scarcity_lines.length}개`}
          copyText={output.scarcity_lines.map((s, i) => `${i + 1}. ${s}`).join("\n")}
        >
          <ul className="output-list">
            {output.scarcity_lines.map((s, i) => (
              <ListItem key={i} index={i + 1} text={s} />
            ))}
          </ul>
        </OutputSection>

        {/* Shortform Scripts */}
        <OutputSection
          title="숏폼 스크립트"
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
                    <p className="shortform-hook-text">"{s.hook}"</p>
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
      </div>
    </div>
  );
}
