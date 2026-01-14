import type { Metadata } from "next";
import { Outfit, Ubuntu } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ClientProviders } from "@/lib/privy/ClientProviders";
import { Toaster } from "sonner";

// Outfit - Headings (Unique, modern, geometric)
const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

// Ubuntu - Body (African origin - South Africa)
const ubuntu = Ubuntu({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Salvation - African Infrastructure Bonds",
  description: "Yield-generating African infrastructure bonds with integrated prediction markets on Mantle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${ubuntu.variable} antialiased`}>
        <ClientProviders>
          <Header />
          <main className="min-h-screen pt-16 md:pt-20">
            {children}
          </main>
          <Footer />
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            theme="dark"
            toastOptions={{
              style: {
                fontFamily: 'var(--font-body)',
                background: '#1E293B',
                color: '#F8FAFC',
                border: '1px solid #334155',
                borderRadius: '8px',
              },
              className: 'sonner-toast',
            }}
          />
        </ClientProviders>
      </body>
    </html>
  );
}
