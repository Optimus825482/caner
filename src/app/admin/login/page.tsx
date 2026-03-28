"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import frMessages from "@/i18n/messages/fr.json";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

const t = frMessages.adminLogin;

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [logoUrl, setLogoUrl] = useState("/uploads/products/logo.png");

  useEffect(() => {
    fetch("/api/public-settings")
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        if (data.site_logo) setLogoUrl(data.site_logo);
      })
      .catch(() => {});
  }, []);

  async function loginWithCredentials(
    inputUsername: string,
    inputPassword: string,
  ) {
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      username: inputUsername,
      password: inputPassword,
      redirect: false,
    });

    if (res?.error) {
      setError(t.invalidCredentials);
      setLoading(false);
      return;
    }

    router.push("/admin");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await loginWithCredentials(username, password);
  }

  async function handleDemoLogin() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(payload.error ?? t.invalidCredentials);
        return;
      }

      const { username: demoUser, password: demoPass } = (await res.json()) as {
        username: string;
        password: string;
      };

      await loginWithCredentials(demoUser, demoPass);
    } catch {
      setError("Demo giriş sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--arvesta-bg) px-4">
      <Card className="w-full max-w-md border-white/5 bg-(--arvesta-bg-card)">
        <CardHeader className="text-center space-y-3">
          <Image
            src={logoUrl}
            alt="Arvesta"
            width={60}
            height={60}
            className="mx-auto opacity-70 object-contain"
          />
          <CardTitle className="font-display text-2xl text-white">
            {t.title}
          </CardTitle>
          <CardDescription className="text-(--arvesta-text-muted)">
            {t.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-(--arvesta-text-secondary)"
              >
                {t.usernameLabel}
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t.usernamePlaceholder}
                required
                className="bg-(--arvesta-bg-elevated) border-white/5 text-white h-11"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-(--arvesta-text-secondary)"
              >
                {t.passwordLabel}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-(--arvesta-bg-elevated) border-white/5 text-white h-11"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-(--arvesta-accent) hover:bg-(--arvesta-accent-hover) font-ui font-semibold"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {loading ? t.loading : t.submit}
            </Button>

            {isDemoMode && (
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={handleDemoLogin}
                className="w-full h-11 border-white/20 text-white hover:bg-white/10"
              >
                Demo giriş yap
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
