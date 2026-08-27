/* Responsive Capitol hero. Assets live in /public/hero (see scripts/gen-hero.mjs).
   Sizing + crop come from the parent's CSS (.hero / .lp-hero__media). */
export function HeroPicture({
  className,
  sizes = "100vw",
  eager = false,
  alt = "",
}: {
  className?: string;
  sizes?: string;
  eager?: boolean;
  alt?: string;
}) {
  return (
    <picture>
      <source
        type="image/avif"
        srcSet="/hero/capitol-960.avif 960w, /hero/capitol-1600.avif 1600w"
        sizes={sizes}
      />
      <source
        type="image/webp"
        srcSet="/hero/capitol-960.webp 960w, /hero/capitol-1600.webp 1600w"
        sizes={sizes}
      />
      <img
        className={className}
        src="/hero/capitol-1600.jpg"
        srcSet="/hero/capitol-960.jpg 960w, /hero/capitol-1600.jpg 1600w"
        sizes={sizes}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={eager ? "high" : "auto"}
      />
    </picture>
  );
}
