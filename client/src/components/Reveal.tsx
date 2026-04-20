import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface RevealProps extends HTMLAttributes<HTMLDivElement> {
  delay?: number;
  once?: boolean;
  threshold?: number;
  rootMargin?: string;
}

export function Reveal({
  children,
  className,
  delay = 0,
  once = true,
  threshold = 0.2,
  rootMargin = "0px 0px -10% 0px",
  style,
  ...props
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean };
    }).connection;

    if (prefersReducedMotion || connection?.saveData || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          requestAnimationFrame(() => setVisible(true));
          if (once) {
            observer.unobserve(entry.target);
          }
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once, rootMargin, threshold]);

  return (
    <div
      ref={ref}
      data-visible={visible ? "true" : "false"}
      className={cn("tc-reveal", className)}
      style={{
        ...(style || {}),
        "--tc-reveal-delay": `${delay}ms`,
      } as CSSProperties}
      {...props}
    >
      {children}
    </div>
  );
}
