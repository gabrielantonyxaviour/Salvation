"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LoginButton } from "@/components/auth/LoginButton";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const mainNavLinks = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/markets", label: "Markets" },
  { href: "/map", label: "Map" },
];

const secondaryNavLinks = [
  { href: "/sponsor", label: "Sponsor" },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-900">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/images/logo.png"
              alt="Salvation"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
              priority
            />
            <span className="text-xl font-bold text-white">Salvation</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {mainNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "text-orange-500"
                    : "text-neutral-300 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            ))}

            {/* Vertical Divider */}
            <div className="h-5 w-px bg-neutral-700" />

            {secondaryNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "text-orange-500"
                    : "text-neutral-300 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Login Button */}
          <div className="hidden md:flex items-center">
            <LoginButton />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg transition-colors hover:bg-neutral-900 text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 pt-2 space-y-2 border-t border-neutral-900">
            {mainNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block px-4 py-2 text-base font-medium rounded transition-colors",
                  pathname === link.href
                    ? "text-orange-500 bg-neutral-900"
                    : "text-white hover:bg-neutral-900"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* Horizontal Divider for Mobile */}
            <div className="mx-4 h-px bg-neutral-700" />

            {secondaryNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block px-4 py-2 text-base font-medium rounded transition-colors",
                  pathname === link.href
                    ? "text-orange-500 bg-neutral-900"
                    : "text-white hover:bg-neutral-900"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="px-4 pt-2">
              <LoginButton />
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
