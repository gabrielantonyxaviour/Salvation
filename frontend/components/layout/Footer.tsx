import Link from "next/link";
import Image from "next/image";
import { Twitter, Github } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = {
    brand: {
      title: "Salvation",
      description:
        "Yield-generating African infrastructure bonds. Invest in verified projects, earn real returns, and track outcomes with prediction markets.",
    },
    platform: {
      title: "Platform",
      links: [
        { href: "/", label: "Home" },
        { href: "/projects", label: "Projects" },
        { href: "/markets", label: "Markets" },
        { href: "/portfolio", label: "Portfolio" },
      ],
    },
    getInvolved: {
      title: "Get Involved",
      links: [
        { href: "/sponsor", label: "Submit a Project" },
        { href: "/projects", label: "Browse Investments" },
        { href: "/markets", label: "Trade Markets" },
      ],
    },
  };

  const socialLinks = [
    { icon: Twitter, href: "https://twitter.com/salvation", label: "Twitter" },
    { icon: Github, href: "https://github.com/salvation", label: "GitHub" },
  ];

  return (
    <footer
      className="text-white relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1a1a1a 0%, #2d1b0f 50%, #1a2f1a 100%)",
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/images/logo.png"
                alt="Salvation"
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
              />
              <span className="text-xl font-bold text-white">
                {footerSections.brand.title}
              </span>
            </Link>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-md">
              {footerSections.brand.description}
            </p>
            {/* Social Media Icons */}
            <div className="flex space-x-3 pt-2">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Platform Column */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">
              {footerSections.platform.title}
            </h4>
            <ul className="space-y-2">
              {footerSections.platform.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Get Involved Column */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">
              {footerSections.getInvolved.title}
            </h4>
            <ul className="space-y-2">
              {footerSections.getInvolved.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-neutral-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-neutral-500">
              © {currentYear} Salvation. All rights reserved.
            </p>
            <p className="text-sm text-neutral-500">
              Built on Mantle Network
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
