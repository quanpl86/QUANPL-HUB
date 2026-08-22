type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className = '' }: BrandLogoProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center overflow-hidden font-orbitron text-lg font-bold tracking-tighter cyber-cut-sm ${className}`}
      role="img"
      aria-label="King Dragon Hub"
    >
      <span className="bg-foreground px-3 py-1.5 uppercase text-background transition-colors duration-300">
        KING-DRAGON
      </span>
      <span className="bg-brand-orange px-3 py-1.5 uppercase text-white">
        HUB
      </span>
    </span>
  );
}
