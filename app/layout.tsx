import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

export const metadata = {
  title: 'Cursor for Sales',
  description: 'IDE-style sales assistant',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
          <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        </head>
        <body className="min-h-screen bg-background text-foreground antialiased">
          <TooltipProvider>
            <main className="relative flex min-h-screen flex-col">
              {children}
            </main>
            <Toaster />
          </TooltipProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
