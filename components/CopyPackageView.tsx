"use client";

import { useCallback, useState } from "react";
import type { GenerateOutput } from "@/lib/ui/generateClient";

type CopyPackageViewProps = {
  output: GenerateOutput;
};

function CopyButton({
  text,
  label,
}: {
  text: string;
  label: string;
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
      className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      aria-label={label}
    >
      {copied ? "복사됨" : "복사"}
    </button>
  );
}

function Section({
  title,
  children,
  copyText,
}: {
  title: string;
  children: React.ReactNode;
  copyText?: string;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {title}
        </h3>
        {copyText !== undefined && (
          <CopyButton text={copyText} label={`${title} 복사`} />
        )}
      </div>
      <div className="text-sm text-gray-700 dark:text-gray-300">{children}</div>
    </section>
  );
}

export function CopyPackageView({ output }: CopyPackageViewProps) {
  const [fullCopied, setFullCopied] = useState(false);
  const fullText = [
    "## 헤드라인",
    ...output.headlines,
    "",
    "## 베네핏",
    ...output.benefits,
    "",
    "## 숏폼 대본",
    ...output.shortform_scripts.map(
      (s, i) => `[${i + 1}] 훅: ${s.hook}\n스크립트: ${s.script}`
    ),
    "",
    "## CTA",
    ...output.ctas,
    "",
    "## 리스크 체크",
    `수준: ${output.risk_check.level}`,
    ...output.risk_check.flags,
    ...output.risk_check.notes,
  ].join("\n");

  const copyFull = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setFullCopied(true);
      setTimeout(() => setFullCopied(false), 2000);
    } catch {
      // ignore
    }
  }, [fullText]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          생성 결과
        </h2>
        <button
          type="button"
          onClick={copyFull}
          className="rounded-lg border border-blue-600 bg-blue-600 px-3 py-2 text-sm font-medium text-white transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700"
          aria-label="전체 패키지 복사"
        >
          {fullCopied ? "전체 복사됨" : "전체 복사"}
        </button>
      </div>

      <Section
        title="헤드라인 (10개)"
        copyText={output.headlines.join("\n")}
      >
        <ul className="list-inside list-decimal space-y-1">
          {output.headlines.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      </Section>

      <Section
        title="베네핏 (5개)"
        copyText={output.benefits.join("\n")}
      >
        <ul className="list-inside list-decimal space-y-1">
          {output.benefits.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </Section>

      <Section
        title="숏폼 대본 (2종)"
        copyText={output.shortform_scripts
          .map((s, i) => `[${i + 1}] 훅: ${s.hook}\n스크립트: ${s.script}`)
          .join("\n\n")}
      >
        <div className="space-y-4">
          {output.shortform_scripts.map((s, i) => (
            <div key={i} className="rounded border border-gray-200 p-2 dark:border-gray-600">
              <p className="font-medium">훅: {s.hook}</p>
              <p className="mt-1 whitespace-pre-wrap">{s.script}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="CTA (5개)" copyText={output.ctas.join("\n")}>
        <ul className="list-inside list-decimal space-y-1">
          {output.ctas.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </Section>

      <Section
        title="리스크 체크"
        copyText={[
          `수준: ${output.risk_check.level}`,
          ...output.risk_check.flags,
          ...output.risk_check.notes,
        ].join("\n")}
      >
        <p className="font-medium">수준: {output.risk_check.level}</p>
        {output.risk_check.flags.length > 0 && (
          <ul className="mt-2 list-inside list-disc text-amber-700 dark:text-amber-300">
            {output.risk_check.flags.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        )}
        {output.risk_check.notes.length > 0 && (
          <ul className="mt-2 list-inside list-disc">
            {output.risk_check.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
