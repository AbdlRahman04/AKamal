import type { ReactNode } from "react";

type PortfolioSectionProps = {
  id: string;
  index: string;
  title: ReactNode;
  intro: string;
  children: ReactNode;
  className?: string;
  headingClassName?: string;
};

/**
 * The public developer page's shared structural module.
 *
 * New sections receive a stable anchor, heading relationship, editorial
 * spacing, and reveal hook without repeating the same markup at each caller.
 */
export default function PortfolioSection({
  id,
  index,
  title,
  intro,
  children,
  className = "",
  headingClassName = "",
}: PortfolioSectionProps) {
  const headingId = `${id}-title`;
  const sectionClasses = ["ds-section", className].filter(Boolean).join(" ");
  const headingClasses = ["ds-section-heading", headingClassName].filter(Boolean).join(" ");

  return (
    <section className={sectionClasses} id={id} aria-labelledby={headingId}>
      <div className={headingClasses} data-reveal>
        <p className="ds-index">{index}</p>
        <div>
          <h2 id={headingId}>{title}</h2>
          <p>{intro}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
