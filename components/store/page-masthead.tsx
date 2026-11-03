export function PageMasthead({
  kicker,
  title,
  description,
  children,
}: {
  kicker?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="border-b border-[#1d1b1a] pb-6 sm:pb-8">
      {kicker ? <p className="mb-3 text-xs tracking-[0.28em] text-[#c2185b] uppercase">{kicker}</p> : null}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="min-w-0 space-y-5">
          <h1 className="font-heading text-[clamp(3.25rem,9vw,8rem)] leading-[0.95] font-medium tracking-[-0.02em] break-words text-[#1d1b1a]">
            {title}
          </h1>
          {description ? <p className="max-w-xl text-sm leading-relaxed text-[#5f5954] sm:text-base">{description}</p> : null}
        </div>
        {children ? <div className="shrink-0">{children}</div> : null}
      </div>
    </section>
  );
}
