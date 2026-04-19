'use client';

import { AuthProvider } from '../src/context/AuthContext';
import { Navbar } from '../src/components/Navbar';
import '../src/styles/index.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="app">
            <Navbar />
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}