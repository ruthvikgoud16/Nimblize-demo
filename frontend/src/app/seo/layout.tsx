import Link from "next/link";

const links = [
  { href: "/seo", label: "Opportunity queue" },
  { href: "/seo/experiments", label: "Experiments" },
  { href: "/seo/model", label: "Model" },
];

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 md:px-6">
      <header className="mb-6 flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Nimblize SEO intelligence</p>
          <h1 className="text-xl font-semibold tracking-tight">Phase 7 rebuild</h1>
        </div>
        <nav className="flex gap-4 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}
