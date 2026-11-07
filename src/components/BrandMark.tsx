type BrandMarkProps = {
  className?: string;
  size?: number;
  showWordmark?: boolean;
};

export function BrandMark({
  className = "brand",
  size = 28,
  showWordmark = true,
}: BrandMarkProps) {
  return (
    <span className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.svg"
        alt=""
        width={size}
        height={size}
        className="brand-mark"
        decoding="async"
      />
      {showWordmark ? (
        <span className="brand-wordmark">PayWhenDone</span>
      ) : null}
    </span>
  );
}
