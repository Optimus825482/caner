"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductsCatalogSection } from "./ProductsCatalogSection";

interface ProductItem {
  id: string;
  slug: string;
  title: string;
  image: string | null;
  categoryId: string;
  categoryName: string;
  subCategoryId: string;
  subCategoryName: string;
}

interface FilterOption {
  id: string;
  name: string;
  subCategories: { id: string; name: string }[];
}

interface Catalog {
  id: string;
  slug: string;
  translations: { locale: string; title: string }[];
  coverImage: string | null;
  pages: { imageUrl: string }[];
}

interface Props {
  products: ProductItem[];
  categories: FilterOption[];
  catalogs: Catalog[];
  locale: string;
  crossCategoryMode: boolean;
  labels: {
    all: string;
    allSubCategories: string;
    categories: string;
    digitalCatalog: string;
    collectionSuffix: string;
  };
}

export function ProductsPageContent({
  products,
  categories,
  catalogs,
  locale,
  crossCategoryMode,
  labels,
}: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<
    string | null
  >(null);
  const [selectedSubCategoryName, setSelectedSubCategoryName] = useState<
    string | null
  >(null);

  const filteredProducts = products.filter((p) => {
    // Cross-category mode: when a subcategory name is selected, show products
    // from ALL categories that have that same subcategory name
    if (crossCategoryMode && selectedSubCategoryName) {
      return p.subCategoryName === selectedSubCategoryName;
    }
    if (selectedCategoryId && p.categoryId !== selectedCategoryId) return false;
    if (selectedSubCategoryId) {
      return p.subCategoryId === selectedSubCategoryId;
    }
    return true;
  });

  const activeCategory = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)
    : null;

  const activeSubCategories = activeCategory?.subCategories ?? [];

  const subCategoryTitle = activeCategory
    ? `${activeCategory.name} ${labels.collectionSuffix}`
    : labels.allSubCategories;

  return (
    <div>
      {/* 1. Koleksiyonlarımız */}
      <div className="mb-8">
        <h2 className="mb-4 font-display text-lg font-semibold text-white">
          {labels.categories}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedCategoryId(null);
              setSelectedSubCategoryId(null);
              setSelectedSubCategoryName(null);
            }}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 ${
              !selectedCategoryId
                ? "bg-linear-to-b from-[#f6c583] to-(--arvesta-accent) text-[#2b160a] shadow-[0_4px_16px_rgba(232,98,44,0.25)]"
                : "border border-(--arvesta-gold)/20 bg-white/5 text-(--arvesta-text-secondary) hover:border-(--arvesta-gold)/40 hover:text-white"
            }`}
          >
            {labels.all}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategoryId(cat.id);
                setSelectedSubCategoryId(null);
                setSelectedSubCategoryName(null);
              }}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 ${
                selectedCategoryId === cat.id
                  ? "bg-linear-to-b from-[#f6c583] to-(--arvesta-accent) text-[#2b160a] shadow-[0_4px_16px_rgba(232,98,44,0.25)]"
                  : "border border-(--arvesta-gold)/20 bg-white/5 text-(--arvesta-text-secondary) hover:border-(--arvesta-gold)/40 hover:text-white"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Alt kategoriler (kategori seçilince) */}
      {activeSubCategories.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 font-display text-lg font-semibold text-white">
            {subCategoryTitle}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedSubCategoryId(null);
                setSelectedSubCategoryName(null);
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300 ${
                !selectedSubCategoryId
                  ? "bg-(--arvesta-gold)/20 text-(--arvesta-gold) border border-(--arvesta-gold)/40"
                  : "border border-white/10 bg-white/5 text-(--arvesta-text-muted) hover:border-white/20 hover:text-white"
              }`}
            >
              {labels.allSubCategories}
            </button>
            {activeSubCategories.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => {
                  setSelectedSubCategoryId(sc.id);
                  setSelectedSubCategoryName(sc.name);
                }}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300 ${
                  selectedSubCategoryId === sc.id
                    ? "bg-(--arvesta-gold)/20 text-(--arvesta-gold) border border-(--arvesta-gold)/40"
                    : "border border-white/10 bg-white/5 text-(--arvesta-text-muted) hover:border-white/20 hover:text-white"
                }`}
              >
                {sc.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Ürünler */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <Link
            key={product.id}
            href={`/${locale}/products/${product.slug}`}
            className="group overflow-hidden rounded-2xl border border-(--arvesta-gold)/15 bg-(--arvesta-bg-card) transition-all duration-500 hover:-translate-y-1 hover:border-(--arvesta-gold)/40"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              {product.image && (
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              )}
            </div>
            <div className="p-6">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-(--arvesta-gold)/10 px-3 py-0.5 text-[11px] font-medium text-(--arvesta-gold)">
                  {product.categoryName}
                </span>
                <span className="rounded-full bg-white/5 px-3 py-0.5 text-[11px] font-medium text-(--arvesta-text-muted)">
                  {product.subCategoryName}
                </span>
              </div>
              <h3 className="font-display text-xl font-bold text-white transition-colors group-hover:text-(--arvesta-gold)">
                {product.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="py-16 text-center text-(--arvesta-text-muted)">
          <p className="text-lg">—</p>
        </div>
      )}

      {/* 4. Dijital Katalog */}
      <ProductsCatalogSection
        catalogs={catalogs}
        locale={locale}
        title={labels.digitalCatalog}
      />
    </div>
  );
}
