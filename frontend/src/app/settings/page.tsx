"use client";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Moon, 
  Sun, 
  Terminal, 
  GitBranch, 
  Key, 
  Keyboard, 
  Cpu 
} from "lucide-react";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <PageHeader
        title="Settings"
        description="Configure your environment variables, provider credentials, and workspace preferences."
      />

      <div className="grid gap-6">
        {/* Appearance Section */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Appearance</CardTitle>
            <CardDescription className="text-xs">Customize the look and feel of Nimblize Studio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Theme Mode</Label>
                <p className="text-xs text-muted-foreground">Switch between light and dark visual interfaces.</p>
              </div>
              <div className="flex gap-2 border border-border rounded-md p-1 bg-muted/30">
                <Button 
                  variant={theme === 'light' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setTheme('light')}
                  className="gap-1.5 h-8 text-xs"
                >
                  <Sun className="h-4 w-4" /> Light
                </Button>
                <Button 
                  variant={theme === 'dark' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setTheme('dark')}
                  className="gap-1.5 h-8 text-xs"
                >
                  <Moon className="h-4 w-4" /> Dark
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Providers */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">LLM API Providers</CardTitle>
            <CardDescription className="text-xs">Input your credentials securely. These are stored locally.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="openai-key" className="text-xs font-mono">OPENAI_API_KEY</Label>
                <Input id="openai-key" type="password" placeholder="sk-..." className="bg-background font-mono text-xs" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="anthropic-key" className="text-xs font-mono">ANTHROPIC_API_KEY</Label>
                <Input id="anthropic-key" type="password" placeholder="sk-ant-..." className="bg-background font-mono text-xs" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button size="sm" className="gap-1.5">
                <Key className="h-3.5 w-3.5" /> Save Keys
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Prompt Settings */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Prompt Control Preferences</CardTitle>
            <CardDescription className="text-xs">Configure platform defaults for variable injection and execution caching.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Semantic Cache TTL</Label>
                <p className="text-xs text-muted-foreground">Lifespan of vector equivalence matches in Redis cache (seconds).</p>
              </div>
              <Input type="number" defaultValue={86400} className="w-[120px] bg-background text-right font-mono" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Global Temperature Cap</Label>
                <p className="text-xs text-muted-foreground">Force generation queries to adhere to a max creative cap.</p>
              </div>
              <Input type="number" step="0.1" defaultValue={1.0} className="w-[120px] bg-background text-right font-mono" />
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts */}
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Keyboard Shortcuts</CardTitle>
              <CardDescription className="text-xs">Quick shortcuts to navigate the console.</CardDescription>
            </div>
            <Keyboard className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50 font-mono text-xs">
              <div className="flex justify-between items-center p-4">
                <span className="text-muted-foreground">Trigger Command Palette</span>
                <span className="bg-zinc-950 border border-zinc-900 px-2 py-0.5 rounded text-[10px]">⌘ + K</span>
              </div>
              <div className="flex justify-between items-center p-4">
                <span className="text-muted-foreground">Execute Prompt (Playground)</span>
                <span className="bg-zinc-950 border border-zinc-900 px-2 py-0.5 rounded text-[10px]">⌘ + Enter</span>
              </div>
              <div className="flex justify-between items-center p-4">
                <span className="text-muted-foreground">Save as Draft</span>
                <span className="bg-zinc-950 border border-zinc-900 px-2 py-0.5 rounded text-[10px]">⌘ + S</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System / Repository Info */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center text-xs">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />
                <span className="font-mono text-muted-foreground">Branch: <span className="font-bold text-foreground">main</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                <span className="font-mono text-muted-foreground">Next.js Version: <span className="font-bold text-foreground">15.1.0</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                <span className="font-mono text-muted-foreground">FastAPI Engine: <span className="font-bold text-foreground">Online</span></span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
