import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({
  number,
  title,
  description,
  href,
  linkLabel = "View all",
}: {
  number?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="border-t border-[#1d1b1a] pt-4">
      <div className="flex min-h-11 items-baseline justify-between gap-4">
        {number ? <p className="text-xs tracking-[0.28em] text-[#c2185b]">N&deg; {number}</p> : <span />}
        {href ? (
          <Link
            href={href}
            className="inline-flex min-h-11 items-center gap-2 text-xs tracking-[0.22em] text-[#1d1b1a] uppercase underline-offset-4 hover:underline"
          >
            {linkLabel} <ArrowRight className="size-4" />
          </Link>
        ) : null}
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-end lg:gap-10">
        <h2 className="font-heading text-[clamp(3rem,8.5vw,7.5rem)] leading-[0.92] font-medium tracking-[-0.02em] text-[#1d1b1a]">
          {title}
        </h2>
        {description ? <p className="text-sm leading-relaxed text-[#5f5954] sm:text-base lg:pb-2">{description}</p> : null}
      </div>
    </div>
  );
}
