"use client";

import { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Mail, Lock, Zap, ArrowRight, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tier: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("nimblize_session_user");
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch {
          localStorage.removeItem("nimblize_session_user");
        }
      }
    }
    return null;
  });
  const [isLoading] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const login = async (email: string) => {
    setIsSubmitting(true);
    setLoginError("");
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!email.includes("@") || email.length < 5) {
      setLoginError("Please enter a valid business email address.");
      setIsSubmitting(false);
      return false;
    }

    const mockUser: User = {
      id: "user-nimblize-938",
      email: email,
      name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      role: "Platform Engineer",
      tier: "Enterprise Production"
    };

    setUser(mockUser);
    localStorage.setItem("nimblize_session_user", JSON.stringify(mockUser));
    setIsSubmitting(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("nimblize_session_user");
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      setLoginError("Please fill in all credentials.");
      return;
    }
    await login(emailInput);
  };

  const handleOAuthLogin = async (provider?: string) => {
    console.log("OAuth login initiated via provider:", provider);
    await login(`admin.developer@nimblize.ai`);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
      {isLoading ? (
        <div className="h-screen w-screen flex items-center justify-center bg-[#070A11]">
          <div className="flex flex-col items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent"
            />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider animate-pulse">Initializing Gateways...</span>
          </div>
        </div>
      ) : !user ? (
        <AnimatePresence>
          <div className="h-screen w-screen flex items-center justify-center bg-[#06080E] text-foreground select-none relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
              <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary/10 rounded-full blur-[100px]" />
              <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-[398px] p-8 rounded-2xl border border-border/80 bg-zinc-950/70 shadow-2xl backdrop-blur-xl relative z-10 space-y-6"
            >
              {/* Logo Title */}
              <div className="text-center space-y-1.5">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <h2 className="text-lg font-extrabold tracking-tight text-foreground pt-2">Sign in to Nimblize Studio</h2>
                <p className="text-xs text-muted-foreground">Competitor intelligence & SLA automation portal</p>
              </div>

              {/* Form */}
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {loginError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg border border-destructive/35 bg-destructive/10 text-[11px] text-destructive flex items-start gap-2"
                  >
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </motion.div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                    <Mail className="h-3 w-3" /> Business Email
                  </label>
                  <Input
                    type="email"
                    placeholder="name@company.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="bg-zinc-900/60 text-xs border-border/60"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                    <Lock className="h-3 w-3" /> Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="bg-zinc-900/60 text-xs border-border/60"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full gap-2 text-xs font-bold py-2 bg-primary text-primary-foreground hover:bg-primary/95 shadow-lg shadow-primary/10 mt-2"
                >
                  {isSubmitting ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      Access Console <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-3 text-[9px] uppercase font-bold text-zinc-500">
                <div className="absolute left-0 w-full h-[1px] bg-border/40" />
                <span className="relative z-10 bg-zinc-950 px-3 tracking-widest">Or connect via</span>
              </div>

              {/* OAuth buttons (Clerk & Google styles) */}
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <Button 
                  variant="outline" 
                  onClick={() => handleOAuthLogin("google")}
                  className="h-8 bg-zinc-900/40 border-border/50 text-[10px] font-bold uppercase tracking-wider gap-1.5"
                >
                  Google
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleOAuthLogin("clerk")}
                  className="h-8 bg-zinc-900/40 border-border/50 text-[10px] font-bold uppercase tracking-wider gap-1.5"
                >
                  Clerk Gateway
                </Button>
              </div>

              {/* Secure badge footer */}
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                <ShieldCheck className="h-3.5 w-3.5 text-success" /> SSL Gateways Encrypted
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
