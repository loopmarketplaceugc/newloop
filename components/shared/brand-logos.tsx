/* Real brand image files (used when available) */
const BRAND_IMAGE_MAP: Record<string, string> = {
  Nike: "/logos/nike.png",
  Chipotle: "/logos/chipotle.png",
  Notion: "/logos/notion.png",
  Duolingo: "/logos/duolingo.png",
  Gymshark: "/logos/gymshark.png",
};

/** Real platform marks (inline SVG, currentColor). */
export function TikTokLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

export function InstagramLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85 0 3.2-.01 3.58-.07 4.85-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07-3.2 0-3.58-.01-4.85-.07-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85 0-3.2.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.18 8.8 2.16 12 2.16zm0 1.8c-3.15 0-3.52.01-4.76.07-2.42.11-3.56 1.26-3.67 3.67-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.11 2.41 1.24 3.56 3.67 3.67 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c2.42-.11 3.56-1.26 3.67-3.67.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.11-2.41-1.25-3.56-3.67-3.67-1.24-.06-1.61-.07-4.76-.07zm0 3.06a5.98 5.98 0 1 1 0 11.96 5.98 5.98 0 0 1 0-11.96zm0 1.8a4.18 4.18 0 1 0 0 8.36 4.18 4.18 0 0 0 0-8.36zm6.18-3.2a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8z" />
    </svg>
  );
}

export function YouTubeLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M23.5 6.51a3.02 3.02 0 0 0-2.12-2.14C19.5 3.86 12 3.86 12 3.86s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.51 31.5 31.5 0 0 0 0 12.01c0 1.86.17 3.7.5 5.5a3.02 3.02 0 0 0 2.12 2.13c1.88.52 9.38.52 9.38.52s7.5 0 9.38-.52a3.02 3.02 0 0 0 2.12-2.13c.33-1.8.5-3.64.5-5.5 0-1.85-.17-3.69-.5-5.49zM9.6 15.6V8.4l6.27 3.61L9.6 15.6z" />
    </svg>
  );
}

/* ─── Opportunity brand logos ─── */

function NikeLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 30" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 24 C14 16 28 4 46 3 C60 2 72 10 77 7 L77 9 C71 13 59 7 45 9 C28 11 14 23 3 26 Z"
      />
    </svg>
  );
}

function GlossierLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="currentColor" />
      <path
        fill="white"
        d="M20 10 C14.5 10 10 14.5 10 20 C10 25.5 14.5 30 20 30 C22.8 30 25 29 26.5 27.5 L24.5 25.5 C23.5 26.5 21.8 27 20 27 C16.1 27 13 23.9 13 20 C13 16.1 16.1 13 20 13 C23.5 13 26.3 15.4 26.9 18.5 L21 18.5 L21 21 L29.9 21 C30 20.7 30 20.3 30 20 C30 14.5 25.5 10 20 10 Z"
      />
    </svg>
  );
}

function ChipotleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="8" fill="currentColor" />
      <path
        fill="white"
        d="M20 7 C13 7 8 12.5 8 20 C8 27.5 13 33 20 33 C24.5 33 28.5 30.5 30.5 27 L27.5 25.5 C26 28 23.2 30 20 30 C14.7 30 11 25.8 11 20 C11 14.2 14.7 10 20 10 C22.8 10 25.3 11.3 27 13.3 L27 10 C25 8.2 22.6 7 20 7 Z M28 15 C28 15 31.5 15.5 32 20 C32.5 24.5 28 27 28 27 C28 27 31 24 31 20 C31 16.5 28 15 28 15 Z"
      />
    </svg>
  );
}

function DuolingoLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="currentColor" />
      <ellipse cx="16" cy="17" rx="3" ry="3.5" fill="white" />
      <ellipse cx="24" cy="17" rx="3" ry="3.5" fill="white" />
      <circle cx="16" cy="17" r="1.5" fill="#3d9c47" />
      <circle cx="24" cy="17" r="1.5" fill="#3d9c47" />
      <path stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" d="M14 24 Q20 29 26 24" />
      <path stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" d="M12 13 Q14 9 16 11" />
      <path stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" d="M28 13 Q26 9 24 11" />
    </svg>
  );
}

function NotionLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="8" fill="currentColor" />
      <path
        fill="white"
        d="M11 9 L11 31 L15 31 L15 17 L25 31 L29 31 L29 9 L25 9 L25 23 L15 9 Z"
      />
    </svg>
  );
}

function SephoraLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 30" className={className} aria-hidden="true">
      <rect width="80" height="30" rx="4" fill="currentColor" />
      <text
        x="40"
        y="21"
        textAnchor="middle"
        fill="white"
        fontSize="11"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
        letterSpacing="2"
      >
        SEPHORA
      </text>
    </svg>
  );
}

function StarbucksLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="currentColor" />
      <path
        fill="white"
        d="M20 8 C15 8 12 11 11 14 L14 14 C15 12 17 11 20 11 C23 11 25 12 26 14 L29 14 C28 11 25 8 20 8 Z M11 16 L11 22 C11 27 15 32 20 32 C25 32 29 27 29 22 L29 16 Z M14 18 L26 18 L26 22 C26 25.3 23.3 28 20 28 C16.7 28 14 25.3 14 22 Z M18 20 L18 26 C18.6 26.2 19.3 26.3 20 26.3 C20.7 26.3 21.4 26.2 22 26 L22 20 Z"
      />
    </svg>
  );
}

function GymsharkLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="currentColor" />
      <path
        fill="white"
        d="M20 8 C20 8 13 12 11 20 C9 28 15 33 15 33 C15 33 13 27 16 23 C18 20 20 21 20 21 C20 21 22 20 24 23 C27 27 25 33 25 33 C25 33 31 28 29 20 C27 12 20 8 20 8 Z"
      />
    </svg>
  );
}

const BRAND_LOGO_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Nike: NikeLogo,
  Glossier: GlossierLogo,
  Chipotle: ChipotleLogo,
  Duolingo: DuolingoLogo,
  Notion: NotionLogo,
  Sephora: SephoraLogo,
  Starbucks: StarbucksLogo,
  Gymshark: GymsharkLogo,
};

const BRAND_COLORS: Record<string, { bg: string; fg: string }> = {
  Nike: { bg: "#111111", fg: "#ffffff" },
  Glossier: { bg: "#f4c2c2", fg: "#111111" },
  Chipotle: { bg: "#441700", fg: "#ffffff" },
  Duolingo: { bg: "#58cc02", fg: "#ffffff" },
  Notion: { bg: "#ffffff", fg: "#111111" },
  Sephora: { bg: "#111111", fg: "#ffffff" },
  Starbucks: { bg: "#00704a", fg: "#ffffff" },
  Gymshark: { bg: "#0d0d0d", fg: "#ffffff" },
};

export function BrandLogo({
  brand,
  size = 48,
  className,
}: {
  brand: string;
  size?: number;
  className?: string;
}) {
  const imageSrc = BRAND_IMAGE_MAP[brand];
  const Logo = BRAND_LOGO_MAP[brand];
  const colors = BRAND_COLORS[brand];

  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: 10,
    flexShrink: 0,
    overflow: "hidden",
  };

  if (imageSrc) {
    return (
      <div
        className={className}
        style={{ ...baseStyle, background: colors?.bg ?? "#111" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={brand}
          draggable={false}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    );
  }

  if (!Logo || !colors) {
    return (
      <div
        className={className}
        style={{
          ...baseStyle,
          background: "#e5e0d9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.4,
          fontWeight: 800,
          color: "#101805",
          fontFamily: "serif",
        }}
      >
        {brand[0]}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        ...baseStyle,
        background: colors.bg,
        color: colors.fg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: size * 0.15,
      }}
    >
      <Logo className="h-full w-full" />
    </div>
  );
}
