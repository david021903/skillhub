import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "./ui/button";

type CookieConsentMode = "essential" | "all";

type StoredCookieConsent = {
  mode: CookieConsentMode;
  updatedAt: string;
};

const COOKIE_CONSENT_STORAGE_KEY = "tc_cookie_preferences";

function readCookieConsent(): StoredCookieConsent | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<StoredCookieConsent>;

    if (parsedValue.mode === "essential" || parsedValue.mode === "all") {
      return {
        mode: parsedValue.mode,
        updatedAt:
          typeof parsedValue.updatedAt === "string"
            ? parsedValue.updatedAt
            : new Date().toISOString(),
      };
    }
  } catch {
    return null;
  }

  return null;
}

function persistCookieConsent(mode: CookieConsentMode) {
  if (typeof window === "undefined") {
    return;
  }

  const nextValue: StoredCookieConsent = {
    mode,
    updatedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(nextValue));
    window.dispatchEvent(
      new CustomEvent("traderclaw:cookie-consent", {
        detail: nextValue,
      }),
    );
  } catch {
    return;
  }
}

export function CookieConsent() {
  const [consent, setConsent] = useState<StoredCookieConsent | null | undefined>(undefined);

  useEffect(() => {
    setConsent(readCookieConsent());
  }, []);

  if (consent !== null) {
    return null;
  }

  const handleChoice = (mode: CookieConsentMode) => {
    persistCookieConsent(mode);
    setConsent({
      mode,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <section
      aria-describedby="cookie-consent-description"
      aria-labelledby="cookie-consent-title"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[90] sm:inset-x-auto sm:right-5 sm:w-[25rem] lg:right-6 lg:bottom-6 lg:w-[27rem]"
      role="dialog"
    >
      <div className="pointer-events-auto tc-card-motion border border-primary/18 bg-background/96 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-5">
        <div className="min-w-0">
          <h2 id="cookie-consent-title" className="text-base font-semibold text-foreground">
            Cookie Preferences
          </h2>

          <p id="cookie-consent-description" className="mt-2 text-sm leading-6 text-muted-foreground">
            We use essential cookies for sign-in and security, plus optional analytics to improve the product.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm">
            <Link
              href="/privacy"
              className="text-[10px] uppercase tracking-[0.18em] text-primary underline decoration-primary/60 underline-offset-4 transition-colors hover:text-foreground sm:text-[11px]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-[10px] uppercase tracking-[0.18em] text-primary underline decoration-primary/60 underline-offset-4 transition-colors hover:text-foreground sm:text-[11px]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Terms
            </Link>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => handleChoice("essential")}
          >
            Essential Only
          </Button>
          <Button className="w-full sm:w-auto" onClick={() => handleChoice("all")}>
            Accept All
          </Button>
        </div>
      </div>
    </section>
  );
}

export { COOKIE_CONSENT_STORAGE_KEY, readCookieConsent };
