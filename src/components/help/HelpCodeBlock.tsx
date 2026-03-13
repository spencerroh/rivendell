"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Lang = "curl" | "js" | "python";

interface HelpCodeBlockProps {
  curl: string;
  js: string;
  python: string;
}

export function HelpCodeBlock({ curl, js, python }: HelpCodeBlockProps) {
  const [lang, setLang] = useState<Lang>("curl");
  const [copied, setCopied] = useState(false);

  const code = lang === "curl" ? curl : lang === "js" ? js : python;

  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(["curl", "js", "python"] as Lang[]).map((l) => (
            <Button
              key={l}
              size="sm"
              variant={lang === l ? "default" : "outline"}
              onClick={() => setLang(l)}
              className="text-xs h-7 px-3"
            >
              {l === "curl" ? "cURL" : l === "js" ? "JavaScript" : "Python"}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="ghost" className="text-xs h-7 px-3" onClick={copy}>
          {copied ? "복사됨!" : "복사"}
        </Button>
      </div>
      <pre className="bg-zinc-950 text-zinc-100 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre leading-relaxed">
        {code}
      </pre>
    </div>
  );
}
