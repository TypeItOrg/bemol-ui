"use client";

import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";

import { ClockIcon, EyeIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import { DialogFooter } from "@common/components/ui/dialog";
import { cn } from "@common/utils/cn.util";

const expirationFormatter = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Argentina/Cordoba",
});

type PlatformTemporaryCodeBannerProps = {
  code: string;
  expiresAt?: string;
  cancelPending: boolean;
};

export function PlatformTemporaryCodeBanner({ code, expiresAt, cancelPending }: PlatformTemporaryCodeBannerProps): ReactElement {
  const [copied, setCopied] = useState(false);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);

      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }

      timerRef.current = window.setTimeout(() => {
        setCopied(false);
        timerRef.current = null;
      }, 2000);
    } catch {
      setCopied(false);
    }
  }

  const expiresMs = useMemo(() => parseExpiry(expiresAt), [expiresAt]);

  const expiryLabel = useMemo(() => (expiresMs === null ? null : expirationFormatter.format(expiresMs)), [expiresMs]);

  const [remainingMs, setRemainingMs] = useState<number | null>(() => (expiresMs === null ? null : Math.max(0, expiresMs - Date.now())));

  const expired = remainingMs === 0;

  useEffect(() => {
    if (expiresMs === null) {
      return;
    }

    const interval = window.setInterval(() => {
      const remaining = Math.max(0, expiresMs - Date.now());

      setRemainingMs(remaining);

      if (remaining === 0) {
        window.clearInterval(interval);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [expiresMs]);

  return (
    <>
      <div className="bg-muted/50 overflow-hidden rounded-xl border">
        <p
          className={cn(
            "px-4 py-5 text-center font-mono text-3xl font-semibold tracking-widest break-all",
            expired ? "text-muted-foreground/60 line-through select-none" : "select-all",
          )}
        >
          {code}
        </p>
        <div className="text-muted-foreground bg-background/60 flex items-center justify-between gap-3 border-t px-4 py-2 text-xs">
          <span className="flex items-center gap-1.5">
            <EyeIcon className="size-3.5" aria-hidden="true" />
            Vista y uso único
          </span>
          {expired ? (
            <span className="text-destructive flex items-center gap-1.5 font-medium">
              <ClockIcon className="size-3.5" aria-hidden="true" />
              Vencido
            </span>
          ) : null}
          {!expired && remainingMs !== null && expiresMs !== null ? (
            <span className="flex items-center gap-1.5 tabular-nums">
              <ClockIcon className="size-3.5" aria-hidden="true" />
              {`${formatCountdown(remainingMs)} (${expiryLabel})`}
            </span>
          ) : null}
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" size="lg" type="submit" disabled={cancelPending || expired}>
          {cancelPending ? "Revocando…" : "Revocar código"}
        </Button>
        <Button size="lg" type="button" onClick={handleCopy} disabled={cancelPending || expired}>
          {copied ? "Copiado" : "Copiar código"}
        </Button>
      </DialogFooter>
    </>
  );
}

function parseExpiry(expiresAt?: string): number | null {
  if (!expiresAt) {
    return null;
  }

  const expiresMs = new Date(expiresAt).getTime();

  return Number.isNaN(expiresMs) ? null : expiresMs;
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);

  const minutes = Math.floor(totalSeconds / 60);

  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
