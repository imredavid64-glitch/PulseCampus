'use client';

import * as Sentry from "@sentry/nextjs";
import { ReactNode, ReactElement } from "react";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
    debug: false,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    enabled: process.env.NODE_ENV === "production",
  });
}

export function SentryProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function SentryErrorBoundary({ children, fallback }: { children: ReactNode; fallback: ReactElement }) {
  return (
    <Sentry.ErrorBoundary fallback={fallback}>
      {children}
    </Sentry.ErrorBoundary>
  );
}