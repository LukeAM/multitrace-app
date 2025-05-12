'use client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'theme-monokai' | 'theme-greenonblack';

function Logo() {
  return (
    <Card className="flex items-center gap-2 px-4 py-2 rounded-full shadow border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#2563eb" />
        <text x="50%" y="54%" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="Inter, sans-serif" dy=".3em">MT</text>
      </svg>
      <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">MultiTrace</span>
    </Card>
  );
}

export default function TopBar({
  children,
}: {
  children?: ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.remove('light', 'dark', 'theme-monokai', 'theme-greenonblack');
      document.documentElement.classList.add(theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme, mounted]);

  return (
    <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm min-h-0">
      {/* Logo area */}
      <div className="flex items-center gap-6">
        <Logo />
        {/* Nav */}
        <nav className="flex gap-2 ml-2">
          {['Opportunities', 'Accounts', 'Contacts', 'Reports', 'AI Agents'].map((item, idx) => (
            <TooltipProvider key={item}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" className="px-3 py-1 text-sm font-medium" style={{marginLeft: idx === 0 ? 0 : 2}}>
                    {item}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{item}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </nav>
      </div>
      {/* Theme selector */}
      <div className="flex items-center gap-3">
        <Select value={theme} onValueChange={v => setTheme(v as Theme)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="theme-monokai">Monokai</SelectItem>
            <SelectItem value="theme-greenonblack">Green</SelectItem>
          </SelectContent>
        </Select>
        {children && <div className="ml-2 flex items-center">{children}</div>}
      </div>
    </div>
  );
}
