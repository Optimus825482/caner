"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
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
  Send,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Search,
  Upload,
  ImageIcon,
  Layers,
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
    label: "siteName",
    icon: Globe,
    placeholder: "Arvesta Menuiserie France",
    type: "text",
  },
  {
    key: "phone",
    label: "phone",
    icon: Phone,
    placeholder: "+33 (0) 1 43 67 88",
    type: "text",
  },
  {
    key: "email",
    label: "email",
    icon: Mail,
    placeholder: "contact@arvesta-france.com",
    type: "email",
  },
  {
    key: "address",
    label: "address",
    icon: MapPin,
    placeholder: "75001 Paris, France",
    type: "text",
  },
  {
    key: "instagram",
    label: "instagramUrl",
    icon: Globe,
    placeholder: "https://instagram.com/arvesta",
    type: "url",
  },
  {
    key: "whatsapp",
    label: "whatsappUrl",
    icon: Phone,
    placeholder: "https://wa.me/33143678800",
    type: "url",
  },
  {
    key: "cross_category_subcategory",
    label: "crossCategorySubcategory",
    icon: Layers,
    placeholder: "false",
    type: "boolean",
    help: "crossCategorySubcategoryHelp",
  },
];

const seoSettingKeys: SettingField[] = [
  {
    key: "seo_google_verification",
    label: "seoGoogleVerification",
    icon: Search,
    placeholder: "Google Search Console verification code",
    type: "text",
    help: "seoGoogleVerificationHelp",
  },
  {
    key: "seo_bing_verification",
    label: "seoBingVerification",
    icon: Search,
    placeholder: "Bing Webmaster Tools verification code",
    type: "text",
    help: "seoBingVerificationHelp",
  },
  {
    key: "seo_default_description_fr",
    label: "seoDefaultDescFr",
    icon: Globe,
    placeholder: "Mobilier sur mesure de haute qualité...",
    type: "text",
  },
  {
    key: "seo_default_description_en",
    label: "seoDefaultDescEn",
    icon: Globe,
    placeholder: "High-quality custom furniture...",
    type: "text",
  },
  {
    key: "seo_ga_id",
    label: "seoGaId",
    icon: Search,
    placeholder: "G-XXXXXXXXXX",
    type: "text",
    help: "seoGaIdHelp",
  },
];

const smtpSettingKeys: SettingField[] = [
  {
    key: "smtp_enabled",
    label: "smtpEnabled",
    icon: Send,
    placeholder: "false",
    type: "boolean",
    help: "smtpEnabledHelp",
  },
  {
    key: "smtp_host",
    label: "smtpHost",
    icon: Send,
    placeholder: "smtp.gmail.com",
    type: "text",
  },
  {
    key: "smtp_port",
    label: "smtpPort",
    icon: Send,
    placeholder: "587",
    type: "number",
  },
  {
    key: "smtp_secure",
    label: "smtpSecure",
    icon: Shield,
    placeholder: "false",
    type: "boolean",
    help: "smtpSecureHelp",
  },
  {
    key: "smtp_user",
    label: "smtpUser",
    icon: Mail,
    placeholder: "mailer@domain.com",
    type: "text",
  },
  {
    key: "smtp_pass",
    label: "smtpPass",
    icon: Shield,
    placeholder: "••••••••",
    type: "password",
  },
  {
    key: "smtp_from",
    label: "smtpFrom",
    icon: Mail,
    placeholder: "Arvesta <mailer@domain.com>",
    type: "text",
  },
  {
    key: "smtp_to",
    label: "smtpTo",
    icon: Mail,
    placeholder: "admin@domain.com, ops@domain.com",
    type: "text",
  },
];

export default function AdminSettings() {
  const t = useTranslations("adminSettings");
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

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

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-logo", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        alert(data.error || "Logo upload failed");
        return;
      }
      setValues((prev) => ({ ...prev, site_logo: data.url! }));
    } catch {
      alert("Logo upload failed");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  }

  async function handleTestSmtp() {
    setTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const res = await fetch("/api/settings/test-smtp", { method: "POST" });
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
          message: payload.message || t("smtpTestSuccess"),
        });
      }
    } catch {
      setSmtpTestResult({ type: "error", message: t("smtpTestNetworkError") });
    } finally {
      setTestingSmtp(false);
    }
  }

  function renderField(s: SettingField) {
    const fieldLabel = t(s.label as Parameters<typeof t>[0]);
    return (
      <div
        key={s.key}
        className="space-y-2 rounded-xl border border-(--arvesta-gold)/10 bg-[rgba(255,255,255,0.015)] p-4"
      >
        <Label className="flex items-center gap-2 text-sm text-(--arvesta-text-secondary)">
          <s.icon className="h-3.5 w-3.5 text-(--arvesta-gold)/90" />{" "}
          {fieldLabel}
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
          <p className="text-xs text-(--arvesta-text-muted)">
            {t(s.help as Parameters<typeof t>[0])}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-white">
          {t("title")}
        </h1>
        <p className="font-ui text-sm text-(--arvesta-text-muted)">
          {t("subtitle")}
        </p>
      </div>

      <Card className="mx-auto w-full max-w-5xl border-(--arvesta-gold)/20 bg-[linear-gradient(170deg,rgba(8,16,30,0.96),rgba(6,12,24,0.96))] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <CardHeader className="border-b border-(--arvesta-gold)/15 pb-4">
          <CardTitle className="flex items-center gap-2 font-ui text-base text-white">
            <SettingsIcon className="h-4 w-4 text-(--arvesta-gold)" />
            {t("settingsCenter")}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5 pt-5">
          <Tabs defaultValue="general" className="flex w-full flex-col gap-5">
            <TabsList className="flex h-auto w-full gap-1 rounded-xl border border-(--arvesta-gold)/20 bg-[rgba(255,255,255,0.02)] p-1">
              <TabsTrigger
                value="general"
                className="flex-1 h-9 rounded-lg px-4 text-sm data-[selected]:bg-(--arvesta-gold)/15 data-[selected]:text-(--arvesta-gold) data-active:bg-(--arvesta-gold)/15 data-active:text-(--arvesta-gold)"
              >
                {t("generalTab")}
              </TabsTrigger>
              <TabsTrigger
                value="smtp"
                className="flex-1 h-9 rounded-lg px-4 text-sm data-[selected]:bg-(--arvesta-gold)/15 data-[selected]:text-(--arvesta-gold) data-active:bg-(--arvesta-gold)/15 data-active:text-(--arvesta-gold)"
              >
                {t("smtpTab")}
              </TabsTrigger>
              <TabsTrigger
                value="seo"
                className="flex-1 h-9 rounded-lg px-4 text-sm data-[selected]:bg-(--arvesta-gold)/15 data-[selected]:text-(--arvesta-gold) data-active:bg-(--arvesta-gold)/15 data-active:text-(--arvesta-gold)"
              >
                {t("seoTab")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="pt-1">
              {/* Logo Upload */}
              <div className="mb-4 rounded-xl border border-(--arvesta-gold)/10 bg-[rgba(255,255,255,0.015)] p-4">
                <Label className="mb-3 flex items-center gap-2 text-sm text-(--arvesta-text-secondary)">
                  <ImageIcon className="h-3.5 w-3.5 text-(--arvesta-gold)/90" />
                  {t("siteLogo")}
                </Label>
                <div className="flex items-center gap-4">
                  {values.site_logo ? (
                    <Image
                      src={values.site_logo}
                      alt="Logo"
                      width={64}
                      height={64}
                      unoptimized
                      className="h-16 w-16 rounded-lg border border-white/10 bg-black/20 object-contain p-1"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-white/10 bg-black/20">
                      <ImageIcon className="h-6 w-6 text-(--arvesta-text-muted)" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-(--arvesta-gold)/25 bg-transparent px-4 py-2 text-sm text-(--arvesta-gold) transition-colors hover:bg-(--arvesta-gold)/10">
                      <Upload className="h-4 w-4" />
                      {uploadingLogo ? t("uploading") : t("uploadLogo")}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-(--arvesta-text-muted)">
                      PNG, JPG, WebP — max 2MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {generalSettingKeys.map(renderField)}
              </div>
            </TabsContent>

            <TabsContent value="smtp" className="space-y-4 pt-1">
              <div className="rounded-xl border border-(--arvesta-gold)/15 bg-[rgba(255,255,255,0.01)] p-4">
                <p className="font-ui text-xs leading-relaxed text-(--arvesta-text-muted) mb-4">
                  {t("smtpInfo")}
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  {smtpSettingKeys.map(renderField)}
                </div>
                <div className="mt-4 flex flex-col gap-3 rounded-xl border border-(--arvesta-gold)/15 bg-[rgba(255,255,255,0.01)] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-ui text-sm font-medium text-white">
                      {t("smtpTest")}
                    </p>
                    <p className="font-ui text-xs text-(--arvesta-text-muted)">
                      {t("smtpTestDesc")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleTestSmtp}
                    disabled={testingSmtp}
                    className="h-10 border border-(--arvesta-gold)/35 bg-transparent px-4 text-(--arvesta-gold) hover:bg-(--arvesta-gold)/10"
                  >
                    {testingSmtp ? t("smtpTesting") : t("smtpTestBtn")}
                  </Button>
                </div>
                {smtpTestResult ? (
                  <div
                    className={`mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
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
            </TabsContent>

            <TabsContent value="seo" className="pt-1">
              <div className="rounded-xl border border-(--arvesta-gold)/15 bg-[rgba(255,255,255,0.01)] p-4">
                <p className="font-ui text-xs leading-relaxed text-(--arvesta-text-muted) mb-4">
                  {t("seoInfo")}
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  {seoSettingKeys.map(renderField)}
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
              {saved ? t("saved") : saving ? t("saving") : t("saveSettings")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
