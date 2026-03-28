import { redirect } from "next/navigation";

// Root path redirects to the default locale.
// next-intl middleware handles this at runtime, but this file
// satisfies the Next.js type validator which expects src/app/page.
export default function RootPage() {
  redirect("/fr");
}
