'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Settings } from 'lucide-react';

// Simple Label component since it doesn't exist in the UI components
const Label = ({ htmlFor, className, children }: { 
  htmlFor: string; 
  className?: string; 
  children: React.ReactNode 
}) => (
  <label
    htmlFor={htmlFor}
    className={`text-sm font-medium leading-none ${className || ''}`}
  >
    {children}
  </label>
);

export default function CopilotSettings({ onSettingsChange }: { 
  onSettingsChange: (settings: CopilotSettings) => void 
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<CopilotSettings>({
    endpoint: 'default',
    customApiUrl: '',
    customApiKey: '',
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('copilotSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({
          endpoint: parsed.endpoint === 'custom' ? 'custom' : 'default',
          customApiUrl: parsed.customApiUrl || '',
          customApiKey: parsed.customApiKey || '',
        });
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
      }
    }
  }, []);

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('copilotSettings', JSON.stringify(settings));
    
    // Notify parent component
    onSettingsChange(settings);
    
    setOpen(false);
    
    toast({
      title: "Settings saved",
      description: "Your Copilot settings have been updated"
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Copilot Settings">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Copilot Settings</DialogTitle>
          <DialogDescription>
            Configure your Copilot API settings
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endpoint" className="text-right">
              Endpoint
            </Label>
            <select
              id="endpoint"
              className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
              value={settings.endpoint}
              onChange={(e) => setSettings({
                ...settings, 
                endpoint: e.target.value === 'custom' ? 'custom' : 'default'
              })}
            >
              <option value="default">Default (OpenAI)</option>
              <option value="custom">Custom API</option>
            </select>
          </div>
          
          {settings.endpoint === 'custom' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="apiUrl" className="text-right">
                  API URL
                </Label>
                <Input
                  id="apiUrl"
                  placeholder="https://api.example.com/v1/chat/completions"
                  className="col-span-3"
                  value={settings.customApiUrl}
                  onChange={(e) => setSettings({...settings, customApiUrl: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="apiKey" className="text-right">
                  API Key
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Your API key"
                  className="col-span-3"
                  value={settings.customApiKey}
                  onChange={(e) => setSettings({...settings, customApiKey: e.target.value})}
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export interface CopilotSettings {
  endpoint: 'default' | 'custom';
  customApiUrl: string;
  customApiKey: string;
} 