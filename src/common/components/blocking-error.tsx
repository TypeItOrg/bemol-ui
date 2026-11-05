"use client";

import type { ReactElement } from "react";

import { HouseIcon, RefreshCwIcon, ServerCrashIcon, TimerIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import { Card } from "@common/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@common/components/ui/empty";
import { COMMON_ERROR_MESSAGES } from "@common/constants/error-messages.constants";
import { RATE_LIMIT_ERROR_MESSAGE } from "@common/constants/rate-limit.constants";
import { useApiUnavailableRedirect } from "@common/hooks/use-api-unavailable-redirect";
import { cn } from "@common/utils/cn.util";
import { isRateLimitError } from "@common/utils/rate-limit-error.util";

type BlockingErrorProps = {
  error?: Error & { digest?: string };
  retry: () => void;
  className?: string;
  title?: string;
  description?: string;
  homeHref?: string;
};

export function BlockingError({
  error,
  retry,
  className,
  title = COMMON_ERROR_MESSAGES.BLOCKING_PAGE_TITLE,
  description = COMMON_ERROR_MESSAGES.BLOCKING_PAGE_DESCRIPTION,
  homeHref = "/",
}: BlockingErrorProps): ReactElement {
  const rateLimited = isRateLimitError(error);

  useApiUnavailableRedirect(!rateLimited);

  return (
    <main className={cn("bg-muted flex min-h-full flex-1 items-center justify-center p-6", className)}>
      <Card className="bg-background w-full max-w-lg p-6 md:p-8">
        <Empty className="border-0 p-0">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive mb-4 size-16 rounded-full">
              {rateLimited ? <TimerIcon className="size-8" /> : <ServerCrashIcon className="size-8" />}
            </EmptyMedia>
            <EmptyTitle className="text-lg">{rateLimited ? "Demasiadas solicitudes" : title}</EmptyTitle>
            <EmptyDescription>{rateLimited ? RATE_LIMIT_ERROR_MESSAGE : description}</EmptyDescription>
          </EmptyHeader>

          <EmptyContent className="flex-row justify-center">
            <Button type="button" size="lg" onClick={retry}>
              <RefreshCwIcon data-icon="inline-start" />
              Reintentar
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href={homeHref}>
                <HouseIcon data-icon="inline-start" />
                Ir al inicio
              </a>
            </Button>
          </EmptyContent>
        </Empty>
      </Card>
    </main>
  );
}
