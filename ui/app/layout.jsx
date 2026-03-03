import { Space_Grotesk } from 'next/font/google';
import './globals.css';

const grotesk = Space_Grotesk({ subsets: ['latin'] });

export const metadata = {
  title: 'FoxBridge',
  description: 'FoxBridge Dashboard - Workspaces and Runs'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={grotesk.className}>{children}</body>
    </html>
  );
}
