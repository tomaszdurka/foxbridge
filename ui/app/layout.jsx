import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/layout/Navigation';

const grotesk = Space_Grotesk({ subsets: ['latin'] });

export const metadata = {
  title: 'UnoComputer',
  description: 'UnoComputer Dashboard - Workspaces and Runs'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={grotesk.className}>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
