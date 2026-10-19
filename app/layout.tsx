import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Prism Stream — Material 3 Expressive Media Client',
  description: 'High-performance Material 3 Expressive media client for seamless video watching, music streaming, and Shorts browsing powered by real InnerTube endpoints.',
  openGraph: {
    title: 'Prism Stream — Material 3 Expressive Media Client',
    description: 'High-performance Material 3 Expressive media client for seamless video watching, music streaming, and Shorts browsing powered by real InnerTube endpoints.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prism Stream — Material 3 Expressive Media Client',
    description: 'High-performance Material 3 Expressive media client for seamless video watching, music streaming, and Shorts browsing powered by real InnerTube endpoints.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
