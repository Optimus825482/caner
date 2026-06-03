import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = (await requestLocale) as string | undefined;
  const locale: (typeof routing.locales)[number] =
    requested && (routing.locales as readonly string[]).includes(requested)
      ? (requested as (typeof routing.locales)[number])
      : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
