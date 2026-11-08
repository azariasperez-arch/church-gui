import { useEffect, useState } from "react";
import { t, type Locale } from "@church-screen/core";

type Payload = {
  presenting: boolean;
  title: string;
  subtitle?: string;
  lines: string[];
  index: number;
  total: number;
};

export function StageView({ locale }: { locale: Locale }) {
  const [payload, setPayload] = useState<Payload | null>(null);

  useEffect(() => {
    const api = window.churchScreen;
    if (!api) return;
    return api.onStageUpdate((next) => setPayload(next));
  }, []);

  if (!payload?.presenting) {
    return (
      <div className="stage-root">
        <div className="idle">{t(locale, "appName")}</div>
      </div>
    );
  }

  return (
    <div className="stage-root">
      <div className="frame">
        <h1>{payload.title}</h1>
        {payload.subtitle ? <div className="subtitle">{payload.subtitle}</div> : null}
        <div className="lines">
          {payload.lines.map((line, i) => (
            <p key={`${payload.index}-${i}`} style={{ animationDelay: `${i * 40}ms` }}>
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
