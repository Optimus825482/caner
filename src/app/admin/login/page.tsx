"use client";

import { useState } from "react";
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

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);

    const res = await signIn("credentials", {
      username: fd.get("username") as string,
      password: fd.get("password") as string,
      redirect: false,
    });

    if (res?.error) {
      setError(t.invalidCredentials);
      setLoading(false);
    } else {
      router.push("/admin");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--arvesta-bg)] px-4">
      <Card className="w-full max-w-md border-white/5 bg-[var(--arvesta-bg-card)]">
        <CardHeader className="text-center space-y-3">
          <Image
            src="/uploads/products/logo.png"
            alt="Arvesta"
            width={60}
            height={60}
            className="mx-auto opacity-70 object-contain"
          />
          <CardTitle className="font-display text-2xl text-white">
            {t.title}
          </CardTitle>
          <CardDescription className="text-[var(--arvesta-text-muted)]">
            {t.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-[var(--arvesta-text-secondary)]"
              >
                {t.usernameLabel}
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder={t.usernamePlaceholder}
                required
                className="bg-[var(--arvesta-bg-elevated)] border-white/5 text-white h-11"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-[var(--arvesta-text-secondary)]"
              >
                {t.passwordLabel}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="bg-[var(--arvesta-bg-elevated)] border-white/5 text-white h-11"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[var(--arvesta-accent)] hover:bg-[var(--arvesta-accent-hover)] font-ui font-semibold"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {loading ? t.loading : t.submit}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
