"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Star } from "lucide-react";

interface Product {
  id: string;
  slug: string;
  featured: boolean;
  order: number;
  translations: { locale: string; title: string; description: string }[];
  images: { url: string; alt: string }[];
  subCategory: {
    id: string;
    slug: string;
    translations: { locale: string; name: string }[];
    category: {
      id: string;
      slug: string;
      translations: { locale: string; name: string }[];
    };
  };
}

export default function AdminProducts() {
  const t = useTranslations("adminProducts");
  const locale = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<
    string | null
  >(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  async function handleDelete(id: string) {
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeleteId(null);
  }

  // Extract unique categories
  const categoryMap = new Map<string, string>();
  for (const p of products) {
    const cat = p.subCategory.category;
    if (!categoryMap.has(cat.id)) {
      const name =
        cat.translations.find((tr) => tr.locale === locale)?.name ||
        cat.translations.find((tr) => tr.locale === "fr")?.name ||
        cat.slug;
      categoryMap.set(cat.id, name);
    }
  }
  const categories = Array.from(categoryMap.entries());

  // Extract unique subcategories for selected category
  const subCategoryMap = new Map<string, string>();
  if (selectedCategoryId) {
    for (const p of products) {
      if (p.subCategory.category.id === selectedCategoryId) {
        const sub = p.subCategory;
        if (!subCategoryMap.has(sub.id)) {
          const name =
            sub.translations.find((tr) => tr.locale === locale)?.name ||
            sub.translations.find((tr) => tr.locale === "fr")?.name ||
            sub.slug;
          subCategoryMap.set(sub.id, name);
        }
      }
    }
  }
  const subCategories = Array.from(subCategoryMap.entries());

  const filtered = selectedSubCategoryId
    ? products.filter((p) => p.subCategory.id === selectedSubCategoryId)
    : selectedCategoryId
      ? products.filter((p) => p.subCategory.category.id === selectedCategoryId)
      : products;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">
            {t("title")}
          </h1>
          <p className="text-(--arvesta-text-muted) font-ui text-sm">
            {filtered.length} {t("countLabel")}
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button className="bg-(--arvesta-accent) hover:bg-(--arvesta-accent-hover) font-ui">
            <Plus className="w-4 h-4 mr-2" /> {t("newProduct")}
          </Button>
        </Link>
      </div>

      {/* Category filters */}
      {categories.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedCategoryId(null);
              setSelectedSubCategoryId(null);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !selectedCategoryId
                ? "bg-(--arvesta-accent) text-white"
                : "border border-white/10 bg-white/5 text-(--arvesta-text-muted) hover:bg-white/10 hover:text-white"
            }`}
          >
            {t("table.image") === "Görsel" ? "Tümü" : "All"}
          </button>
          {categories.map(([id, name]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setSelectedCategoryId(id);
                setSelectedSubCategoryId(null);
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedCategoryId === id
                  ? "bg-(--arvesta-accent) text-white"
                  : "border border-white/10 bg-white/5 text-(--arvesta-text-muted) hover:bg-white/10 hover:text-white"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {/* SubCategory filters */}
      {subCategories.length > 0 && selectedCategoryId && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedSubCategoryId(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !selectedSubCategoryId
                ? "bg-(--arvesta-gold)/20 text-(--arvesta-gold) border border-(--arvesta-gold)/30"
                : "border border-white/10 bg-white/5 text-(--arvesta-text-muted) hover:bg-white/10 hover:text-white"
            }`}
          >
            {t("table.image") === "Görsel"
              ? "Tüm Alt Kategoriler"
              : "All Subcategories"}
          </button>
          {subCategories.map(([id, name]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSelectedSubCategoryId(id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedSubCategoryId === id
                  ? "bg-(--arvesta-gold)/20 text-(--arvesta-gold) border border-(--arvesta-gold)/30"
                  : "border border-white/10 bg-white/5 text-(--arvesta-text-muted) hover:bg-white/10 hover:text-white"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/5 bg-(--arvesta-bg-card) animate-pulse"
            >
              <div className="aspect-[4/3] bg-white/5 rounded-t-xl" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-2/3 rounded bg-white/5" />
                <div className="h-3 w-1/3 rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => {
            const primaryTitle =
              product.translations.find((tr) => tr.locale === locale)?.title ||
              product.translations.find((tr) => tr.locale === "fr")?.title ||
              product.slug;
            const categoryName =
              product.subCategory.category.translations.find(
                (tr) => tr.locale === locale,
              )?.name ||
              product.subCategory.category.translations.find(
                (tr) => tr.locale === "fr",
              )?.name ||
              product.subCategory.category.slug;
            const subCategoryName =
              product.subCategory.translations.find(
                (tr) => tr.locale === locale,
              )?.name ||
              product.subCategory.translations.find((tr) => tr.locale === "fr")
                ?.name ||
              product.subCategory.slug;

            return (
              <div
                key={product.id}
                className="group relative rounded-xl border border-white/5 bg-(--arvesta-bg-card) overflow-hidden transition-all hover:border-white/15"
              >
                {/* Image */}
                <Link href={`/admin/products/${product.id}`} className="block">
                  <div className="relative aspect-[4/3] bg-white/5 overflow-hidden">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0].url}
                        alt={primaryTitle}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-(--arvesta-text-muted) text-xs">
                        No image
                      </div>
                    )}
                    {product.featured && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 font-ui text-[10px] backdrop-blur-sm">
                          <Star className="w-3 h-3 mr-0.5" /> {t("featured")}
                        </Badge>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="p-3">
                  <Link href={`/admin/products/${product.id}`}>
                    <h3 className="text-sm font-medium text-white truncate hover:text-(--arvesta-gold) transition-colors">
                      {primaryTitle}
                    </h3>
                  </Link>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <Badge
                      variant="outline"
                      className="border-white/10 text-(--arvesta-text-secondary) font-ui text-[10px] px-2 py-0"
                    >
                      {categoryName}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-white/10 text-(--arvesta-text-muted) font-ui text-[10px] px-2 py-0"
                    >
                      {subCategoryName}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="mt-2 flex items-center justify-end gap-1">
                    <Link href={`/admin/products/${product.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-(--arvesta-text-muted) hover:text-white"
                        aria-label={t("editAriaLabel")}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    <Dialog
                      open={deleteId === product.id}
                      onOpenChange={(o) => !o && setDeleteId(null)}
                    >
                      <DialogTrigger
                        onClick={() => setDeleteId(product.id)}
                        render={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-(--arvesta-text-muted) hover:text-red-400"
                            aria-label={t("deleteAriaLabel")}
                          />
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </DialogTrigger>
                      <DialogContent className="bg-(--arvesta-bg-card) border-white/5">
                        <DialogHeader>
                          <DialogTitle className="text-white font-display">
                            {t("deleteDialog.title")}
                          </DialogTitle>
                          <DialogDescription className="text-(--arvesta-text-muted)">
                            {t("deleteDialog.descriptionPrefix")}&nbsp;&quot;
                            {primaryTitle}&quot;.&nbsp;
                            {t("deleteDialog.descriptionSuffix")}
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose
                            render={
                              <Button
                                variant="ghost"
                                className="text-(--arvesta-text-secondary)"
                              />
                            }
                          >
                            {t("deleteDialog.cancel")}
                          </DialogClose>
                          <Button
                            variant="destructive"
                            onClick={() => handleDelete(product.id)}
                          >
                            {t("deleteDialog.confirm")}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
