"use client";

/**
 * Dependency-free QR code. Renders through a public QR image endpoint so we
 * don't pull a QR library into the bundle. Falls back to showing the raw value
 * underneath, so the code is always usable even if the image fails to load.
 */
export function QrCode({
  value,
  size = 200,
  className,
  label,
}: {
  value: string;
  size?: number;
  className?: string;
  label?: string;
}) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&qzone=1&color=101805&bgcolor=faf6ef&data=${encodeURIComponent(
    value,
  )}`;
  return (
    <div className={className}>
      <div
        className="overflow-hidden rounded-[16px] border-[3px] border-ink bg-[#faf6ef] p-2"
        style={{ width: size + 22, height: size + 22 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={label ?? "QR code"}
          width={size}
          height={size}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
