import { Mail } from "lucide-react";

/**
 * The storefront footer, reproduced for the admin shell (the Figma frames show
 * the same 4-column footer beneath every admin screen).
 * Figma: 328px tall, bg #fefdfb, 1px top border #c4bcb0, container 1280 pad 32/16,
 * four 288px columns on a 320px pitch.
 */
const companyLinks = [
  { label: "About Us", href: "https://packaginggeneral.com/about" },
  { label: "Contact", href: "https://packaginggeneral.com/contact" },
];

const legalLinks = [
  { label: "Terms & Conditions", href: "https://packaginggeneral.com/terms" },
  { label: "Privacy Policy", href: "https://packaginggeneral.com/privacy" },
];

function Heading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-brand">{children}</h3>;
}

function LinkList({ links }: { links: { label: string; href: string }[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {links.map((l) => (
        <li key={l.href}>
          <a
            href={l.href}
            className="text-xs text-muted transition-colors hover:text-brand"
          >
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function AdminFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-3">
            <Heading>Packaging General</Heading>
            <p className="max-w-xs text-xs leading-relaxed text-muted">
              West Africa&apos;s digital-first packaging platform for SMEs and
              growing brands.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Heading>Company</Heading>
            <LinkList links={companyLinks} />
          </div>

          <div className="flex flex-col gap-3">
            <Heading>Legal</Heading>
            <LinkList links={legalLinks} />
          </div>

          <div className="flex flex-col gap-3">
            <Heading>Community</Heading>
            <p className="text-xs text-muted">
              Join packaging professionals across West Africa
            </p>
            <a
              href="mailto:support@packaginggeneral.com"
              className="inline-flex h-8 items-center justify-center gap-2 rounded-button bg-brand px-3 text-xs font-medium text-brand-foreground transition-colors hover:bg-brand/90"
            >
              <Mail className="size-4" aria-hidden />
              Contact Support
            </a>
            <div className="mt-2 flex flex-col gap-1 border-t border-line pt-4">
              <p className="text-sm font-semibold text-brand">Business Hours</p>
              <p className="text-xs text-muted">
                Mon - Fri: 8:00 AM - 6:00 PM (GMT)
              </p>
              <p className="text-xs text-muted">Sat: 9:00 AM - 2:00 PM (GMT)</p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-line pt-6 text-center">
          <p className="text-sm text-muted">
            © 2026 Packaging General. Built for Africa.
          </p>
        </div>
      </div>
    </footer>
  );
}
