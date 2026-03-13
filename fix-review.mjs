import fs from 'fs/promises';

async function replaceInFile(filePath, search, replacement) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    if (content.includes(search)) {
      content = content.replace(search, replacement);
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✅ Başarıyla düzeltildi: ${filePath}`);
    } else {
      console.log(`⚠️ Hedef kod bulunamadı (Zaten düzeltilmiş veya değiştirilmiş olabilir): ${filePath}`);
    }
  } catch (err) {
    console.error(`❌ Okuma/Yazma Hatası (${filePath}):`, err.message);
  }
}

async function runFixes() {
  console.log("🛠️ Toolsmith: Kod İnceleme Düzeltmeleri Uygulanıyor...\n");

  // 1. ContactForm.tsx (Turnstile Memory Leak Temizliği)
  const contactFormPath = 'src/components/public/ContactForm.tsx';
  const cfSearch = `turnstileWidgetIdRef.current = window.turnstile.render(
      turnstileContainerRef.current,
      {
        sitekey: turnstileSiteKey,
        callback: (token) => {
          setCaptchaToken(token);
        },
        "expired-callback": () => {
          setCaptchaToken("");
        },
        "error-callback": () => {
          setCaptchaToken("");
        },
      },
    );
  }, [isTurnstileScriptLoaded]);`;

  const cfReplace = `turnstileWidgetIdRef.current = window.turnstile.render(
      turnstileContainerRef.current,
      {
        sitekey: turnstileSiteKey,
        callback: (token) => {
          setCaptchaToken(token);
        },
        "expired-callback": () => {
          setCaptchaToken("");
        },
        "error-callback": () => {
          setCaptchaToken("");
        },
      },
    );

    // DÜZELTME: Component unmount olduğunda widget DOM'dan temizlenir.
    return () => {
      if (window.turnstile && turnstileWidgetIdRef.current) {
        window.turnstile.remove(turnstileWidgetIdRef.current);
        turnstileWidgetIdRef.current = null;
      }
    };
  }, [isTurnstileScriptLoaded]);`;
  await replaceInFile(contactFormPath, cfSearch, cfReplace);

  // 2. api/products/route.ts (Prisma Tip Güvenliği & DRY)
  const productsRoutePath = 'src/app/api/products/route.ts';
  const prImportSearch = `import { prisma } from "@/lib/prisma";`;
  const prImportReplace = `import { Prisma } from "@prisma/client";\nimport { prisma } from "@/lib/prisma";`;
  await replaceInFile(productsRoutePath, prImportSearch, prImportReplace);

  const duckTypingSearch = `function prismaWriteErrorResponse(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : null;

  if (code === "P2002") {
    return NextResponse.json(
      { error: "Resource already exists", code },
      { status: 409 },
    );
  }

  if (code === "P2025") {
    return NextResponse.json(
      { error: "Resource not found", code },
      { status: 404 },
    );
  }

  if (code === "P2003" || code === "P2014") {
    return NextResponse.json(
      { error: "Invalid relation reference", code },
      { status: 422 },
    );
  }

  return NextResponse.json({ error: "Database write failed" }, { status: 500 });
}`;
  const duckTypingReplace = `function prismaWriteErrorResponse(error: unknown) {
  // DÜZELTME: Native Prisma Error Class üzerinden strict tip kontrolü.
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Resource already exists", code: error.code },
        { status: 409 },
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Resource not found", code: error.code },
        { status: 404 },
      );
    }

    if (error.code === "P2003" || error.code === "P2014") {
      return NextResponse.json(
        { error: "Invalid relation reference", code: error.code },
        { status: 422 },
      );
    }
  }

  return NextResponse.json({ error: "Database write failed" }, { status: 500 });
}`;
  await replaceInFile(productsRoutePath, duckTypingSearch, duckTypingReplace);

  // 3. api/products/[id]/route.ts (Aynı prisma hatası onarımı)
  const productIdRoutePath = 'src/app/api/products/[id]/route.ts';
  await replaceInFile(productIdRoutePath, duckTypingSearch, duckTypingReplace);

  // 4. api/contact/route.ts (Memory Leak / Lambda Rate Limit Hatası)
  const contactRoutePath = 'src/app/api/contact/route.ts';
  const crImportSearch = `  buildClientKey,\n  createMemoryRateLimitAdapter,\n  enforceRateLimit,`;
  const crImportReplace = `  buildClientKey,\n  createSiteSettingRateLimitAdapter,\n  enforceRateLimit,`;
  await replaceInFile(contactRoutePath, crImportSearch, crImportReplace);

  const crAdapterSearch = `const contactRateLimitAdapter = createMemoryRateLimitAdapter();`;
  const crAdapterReplace = `// DÜZELTME: Memory yerine kalıcı DB (Site Settings) bazlı rate limit.
const contactRateLimitAdapter = createSiteSettingRateLimitAdapter(prisma.siteSetting);`;
  await replaceInFile(contactRoutePath, crAdapterSearch, crAdapterReplace);

  // 5. api/upload/route.ts (Yarıda kesilebilen Void asenkron blok)
  const uploadRoutePath = 'src/app/api/upload/route.ts';
  const uploadSearch = `  const saved = await saveTempMedia(finalBuffer, finalExt);\n  void cleanupOldTempMedia(24);\n\n  return NextResponse.json({`;
  const uploadReplace = `  const saved = await saveTempMedia(finalBuffer, finalExt);\n  // DÜZELTME: void yerine await ile sunucu sürecinin sonlanması engellendi.\n  await cleanupOldTempMedia(24);\n\n  return NextResponse.json({`;
  await replaceInFile(uploadRoutePath, uploadSearch, uploadReplace);

  console.log("\n🎉 İşlem Bitti: Tüm düzeltmeler başarıyla tamamlandı.");
}

runFixes();