import Link from "next/link";

type Crumb = { label: string; href?: string };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((c, i) => {
            const last = i === items.length - 1;
            return (
              <li key={i} className="flex items-center gap-1.5">
                {c.href && !last ? (
                  <Link href={c.href} className="hover:text-accent transition-colors">
                    {c.label}
                  </Link>
                ) : (
                  <span className={last ? "text-foreground font-medium" : ""}>{c.label}</span>
                )}
                {!last && <span className="text-muted-foreground/50">/</span>}
              </li>
            );
          })}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: items.map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: c.label,
              ...(c.href ? { item: `https://dbakompas.nl${c.href}` } : {}),
            })),
          }),
        }}
      />
    </>
  );
}
