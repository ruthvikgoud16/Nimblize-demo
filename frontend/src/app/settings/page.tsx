"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { fetchFromAPI } from "@/lib/api";
import { 
  Moon, 
  Sun, 
  Terminal, 
  GitBranch, 
  Key, 
  Keyboard, 
  Cpu,
  Check
} from "lucide-react";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [cacheTtl, setCacheTtl] = useState(86400);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchFromAPI("/api/v1/settings")
      .then((data) => {
        if (data && data.settings) {
          setOpenaiKey(data.settings.openai_key || "");
          setAnthropicKey(data.settings.anthropic_key || "");
          setCacheTtl(data.settings.cache_ttl || 86400);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveKeys = async () => {
    try {
      await fetchFromAPI("/api/v1/settings", {
        method: "POST",
        body: JSON.stringify({
          settings: {
            openai_key: openaiKey,
            anthropic_key: anthropicKey,
            cache_ttl: cacheTtl
          }
        })
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  };

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
            <CardDescription className="text-xs">Input your credentials securely. These are stored encrypted in the backend.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="openai-key" className="text-xs font-mono">OPENAI_API_KEY</Label>
                <Input 
                  id="openai-key" 
                  type="password" 
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..." 
                  className="bg-background font-mono text-xs" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="anthropic-key" className="text-xs font-mono">ANTHROPIC_API_KEY</Label>
                <Input 
                  id="anthropic-key" 
                  type="password" 
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..." 
                  className="bg-background font-mono text-xs" 
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={handleSaveKeys} className="gap-1.5">
                {isSaved ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Key className="h-3.5 w-3.5" />}
                {isSaved ? "Saved to DB" : "Save Keys"}
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
              <Input 
                type="number" 
                value={cacheTtl} 
                onChange={(e) => setCacheTtl(Number(e.target.value))}
                className="w-[120px] bg-background text-right font-mono" 
              />
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
                <span className="font-mono text-muted-foreground">Next.js Version: <span className="font-bold text-foreground">16.2.10</span></span>
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
