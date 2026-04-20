const footerLinks = [
  { label: "Skills Docs", href: "/docs" },
  { label: "Official Website", href: "https://www.traderclaw.ai" },
  { label: "Builder Website", href: "https://build.traderclaw.ai" },
];

const legalLinks = [
  { label: "Terms & Conditions", href: "/terms", external: false },
  { label: "Privacy Policy", href: "/privacy", external: false },
];

const socialLinks = [
  { label: "X / Twitter", href: "https://x.com/traderclawai" },
  { label: "Telegram", href: "https://t.me/traderclaw_ai" },
  { label: "Discord", href: "https://discord.com/invite/CeBhxtkGMa" },
  { label: "YouTube", href: "https://www.youtube.com/@traderclaw" },
];

export function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-border/80 bg-card/30 py-10">
      <div className="container max-w-[1480px] px-4">
        <div className="grid gap-8 md:grid-cols-[1.2fr_.8fr_.8fr_.8fr]">
          <div className="max-w-sm">
            <img
              src="/traderclaw-logo-icon.svg"
              alt="TraderClaw"
              className="h-16 w-16 object-contain"
            />
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Official skill registry surface of TraderClaw.
            </p>
          </div>

          <div>
            <div
              className="text-[10px] uppercase tracking-[0.22em] text-primary"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Links
            </div>
            <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
              {footerLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <div
              className="text-[10px] uppercase tracking-[0.22em] text-primary"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Socials
            </div>
            <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <div
              className="text-[10px] uppercase tracking-[0.22em] text-primary"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Legal
            </div>
            <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
              {legalLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className="transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border/80 pt-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true">©</span>
            <a
              href="https://www.traderclaw.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              TraderClaw
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
