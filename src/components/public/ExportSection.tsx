import { getTranslations } from "next-intl/server";
import ExportSectionClient from "./ExportSectionClient";

export default async function ExportSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "export" });

  return (
    <ExportSectionClient
      texts={{
        tag: t("tag"),
        title: t("title"),
        desc: t("desc"),
        network: t("network"),
        networkDesc: t("networkDesc"),
        quality: t("quality"),
        qualityDesc: t("qualityDesc"),
        from: t("from"),
        to: t("to"),
      }}
    />
  );
}
