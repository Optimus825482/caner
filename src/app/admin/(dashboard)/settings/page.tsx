"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  Settings as SettingsIcon,
  Phone,
  Mail,
  MapPin,
  Globe,
  Instagram,
  Send,
  Shield,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

type FieldType = "text" | "email" | "url" | "number" | "password" | "boolean";

type SettingField = {
  key: string;
  label: string;
  placeholder: string;
  type: FieldType;
  icon: React.ComponentType<{ className?: string }>;
  help?: string;
};

const generalSettingKeys: SettingField[] = [
  {
    key: "site_name",
    label: "Site Adı",
    icon: Globe,
    placeholder: "Arvesta Menuiserie France",
    type: "text",
  },
  {
    key: "phone",
    label: "Telefon",
    icon: Phone,
    placeholder: "+33 (0) 1 43 67 88",
    type: "text",
  },
  {
    key: "email",
    label: "E-posta",
    icon: Mail,
    placeholder: "contact@arvesta-france.com",
    type: "email",
  },
  {
    key: "address",
    label: "Adres",
    icon: MapPin,
    placeholder: "75001 Paris, France",
    type: "text",
  },
  {
    key: "instagram",
    label: "Instagram URL",
    icon: Instagram,
    placeholder: "https://instagram.com/arvesta",
    type: "url",
  },
  {
    key: "whatsapp",
    label: "WhatsApp URL",
    icon: Phone,
    placeholder: "https://wa.me/33143678800",
    type: "url",
  },
];

const smtpSettingKeys: SettingField[] = [
  {
    key: "smtp_enabled",
    label: "SMTP Aktif",
    icon: Send,
    placeholder: "false",
    type: "boolean",
    help: "Açık olduğunda contact form mesajları mail olarak iletilir.",
  },
  {
    key: "smtp_host",
    label: "SMTP Host",
    icon: Send,
    placeholder: "smtp.gmail.com",
    type: "text",
  },
  {
    key: "smtp_port",
    label: "SMTP Port",
    icon: Send,
    placeholder: "587",
    type: "number",
  },
  {
    key: "smtp_secure",
    label: "SMTP Secure",
    icon: Shield,
    placeholder: "false",
    type: "boolean",
    help: "465 için true, 587 için false",
  },
  {
    key: "smtp_user",
    label: "SMTP Kullanıcı",
    icon: Mail,
    placeholder: "mailer@domain.com",
    type: "text",
  },
  {
    key: "smtp_pass",
    label: "SMTP Şifre / App Password",
    icon: Shield,
    placeholder: "••••••••",
    type: "password",
  },
  {
    key: "smtp_from",
    label: "Gönderen (From)",
    icon: Mail,
    placeholder: "Arvesta <mailer@domain.com>",
    type: "text",
  },
  {
    key: "smtp_to",
    label: "İletilecek E-posta (To)",
    icon: Mail,
    placeholder: "admin@domain.com, ops@domain.com",
    type: "text",
  },
];

export default function AdminSettings() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setValues);
  }, []);

  async function handleSave() {
    setSaving(true);
    setSmtpTestResult(null);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  async function handleTestSmtp() {
    setTestingSmtp(true);
    setSmtpTestResult(null);

    try {
      const res = await fetch("/api/settings/test-smtp", {
        method: "POST",
      });
      const payload = (await res.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };

      if (!res.ok || !payload.ok) {
        setSmtpTestResult({
          type: "error",
          message: payload.error || "SMTP test failed.",
        });
      } else {
        setSmtpTestResult({
          type: "success",
          message: payload.message || "SMTP test başarılı.",
        });
      }
    } catch {
      setSmtpTestResult({
        type: "error",
        message: "SMTP test sırasında ağ hatası oluştu.",
      });
    } finally {
      setTestingSmtp(false);
    }
  }

  function renderField(s: SettingField) {
    return (
      <div
        key={s.key}
        className="space-y-2 rounded-xl border border-(--arvesta-gold)/10 bg-[rgba(255,255,255,0.015)] p-4"
      >
        <Label className="flex items-center gap-2 text-sm text-(--arvesta-text-secondary)">
          <s.icon className="h-3.5 w-3.5 text-(--arvesta-gold)/90" />{" "}
          {s.label}
        </Label>

        {s.type === "boolean" ? (
          <Select
            value={values[s.key] || "false"}
            onValueChange={(value) =>
              setValues((prev) => ({ ...prev, [s.key]: value ?? "false" }))
            }
          >
            <SelectTrigger className="h-10 w-full border-(--arvesta-gold)/20 bg-(--arvesta-bg-elevated) text-white">
              <SelectValue placeholder={s.placeholder} />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-(--arvesta-bg-card) text-white">
              <SelectItem value="true">true</SelectItem>
              <SelectItem value="false">false</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Input
            type={s.type}
            value={values[s.key] || ""}
            onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
            className="h-10 border-(--arvesta-gold)/20 bg-(--arvesta-bg-elevated) text-white focus-visible:ring-(--arvesta-accent-glow)"
            placeholder={s.placeholder}
          />
        )}

        {s.help ? (
          <p className="text-xs text-(--arvesta-text-muted)">{s.help}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-white">
          Site Ayarları
        </h1>
        <p className="font-ui text-sm text-(--arvesta-text-muted)">
          Genel ayarlar ve SMTP e-posta yönlendirme yapılandırması
        </p>
      </div>

      <Card className="mx-auto w-full max-w-5xl border-(--arvesta-gold)/20 bg-[linear-gradient(170deg,rgba(8,16,30,0.96),rgba(6,12,24,0.96))] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <CardHeader className="border-b border-(--arvesta-gold)/15 pb-4">
          <CardTitle className="flex items-center gap-2 font-ui text-base text-white">
            <SettingsIcon className="h-4 w-4 text-(--arvesta-gold)" />
            Ayar Merkezi
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5 pt-5">
          <Tabs defaultValue="general" className="flex w-full flex-col gap-5">
            <TabsList className="flex h-auto w-full gap-1 rounded-xl border border-(--arvesta-gold)/20 bg-[rgba(255,255,255,0.02)] p-1">
              <TabsTrigger
                value="general"
                className="flex-1 h-9 rounded-lg px-4 text-sm data-[selected]:bg-(--arvesta-gold)/15 data-[selected]:text-(--arvesta-gold) data-active:bg-(--arvesta-gold)/15 data-active:text-(--arvesta-gold)"
              >
                Genel Bilgiler
              </TabsTrigger>
              <TabsTrigger
                value="smtp"
                className="flex-1 h-9 rounded-lg px-4 text-sm data-[selected]:bg-(--arvesta-gold)/15 data-[selected]:text-(--arvesta-gold) data-active:bg-(--arvesta-gold)/15 data-active:text-(--arvesta-gold)"
              >
                SMTP & Mail Forward
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="pt-1">
              <div className="grid gap-4 md:grid-cols-2">
                {generalSettingKeys.map(renderField)}
              </div>
            </TabsContent>

            <TabsContent value="smtp" className="space-y-4 pt-1">
              <div className="rounded-xl border border-(--arvesta-gold)/15 bg-[rgba(255,255,255,0.01)] p-4">
                <p className="font-ui text-xs leading-relaxed text-(--arvesta-text-muted)">
                  İletişim formundan gelen mesajlar DB’ye kaydedilir. SMTP
                  aktifse aynı anda mail adresine iletilir.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  {smtpSettingKeys.map(renderField)}
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-(--arvesta-gold)/15 bg-[rgba(255,255,255,0.01)] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-ui text-sm font-medium text-white">
                      SMTP Test
                    </p>
                    <p className="font-ui text-xs text-(--arvesta-text-muted)">
                      Bağlantıyı doğrular ve test mail gönderir.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={handleTestSmtp}
                      disabled={testingSmtp}
                      className="h-10 border border-(--arvesta-gold)/35 bg-transparent px-4 text-(--arvesta-gold) hover:bg-(--arvesta-gold)/10"
                    >
                      {testingSmtp
                        ? "Test ediliyor..."
                        : "SMTP Test Mail Gönder"}
                    </Button>
                  </div>

                  {smtpTestResult ? (
                    <div
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                        smtpTestResult.type === "success"
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                          : "border-red-500/40 bg-red-500/10 text-red-300"
                      }`}
                    >
                      {smtpTestResult.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      <span>{smtpTestResult.message}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="border-t border-(--arvesta-gold)/15 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className={`h-11 w-full font-ui font-semibold ${saved ? "bg-green-600 hover:bg-green-600" : "bg-(--arvesta-accent) hover:bg-(--arvesta-accent-hover)"}`}
            >
              <Save className="mr-2 h-4 w-4" />
              {saved
                ? "✓ Kaydedildi"
                : saving
                  ? "Kaydediliyor..."
                  : "Ayarları Kaydet"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
