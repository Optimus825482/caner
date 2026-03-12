"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import frMessages from "@/i18n/messages/fr.json";
import { CONTENT_LOCALE } from "@/i18n/routing";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const t = frMessages.adminProducts;

interface Product {
  id: string;
  slug: string;
  featured: boolean;
  order: number;
  translations: { locale: string; title: string; description: string }[];
  images: { url: string; alt: string }[];
  category: { slug: string; translations: { locale: string; name: string }[] };
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">
            {t.title}
          </h1>
          <p className="text-[var(--arvesta-text-muted)] font-ui text-sm">
            {products.length} {t.countLabel}
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button className="bg-[var(--arvesta-accent)] hover:bg-[var(--arvesta-accent-hover)] font-ui">
            <Plus className="w-4 h-4 mr-2" /> {t.newProduct}
          </Button>
        </Link>
      </div>

      <Card className="border-white/5 bg-[var(--arvesta-bg-card)]">
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="space-y-3 p-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-14 h-10 rounded-lg bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-white/5" />
                    <div className="h-3 w-1/5 rounded bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-[var(--arvesta-text-muted)] font-ui">
                    {t.table.image}
                  </TableHead>
                  <TableHead className="text-[var(--arvesta-text-muted)] font-ui">
                    {t.table.name}
                  </TableHead>
                  <TableHead className="text-[var(--arvesta-text-muted)] font-ui">
                    {t.table.category}
                  </TableHead>
                  <TableHead className="text-[var(--arvesta-text-muted)] font-ui">
                    {t.table.status}
                  </TableHead>
                  <TableHead className="text-[var(--arvesta-text-muted)] font-ui text-right">
                    {t.table.actions}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const primaryTitle =
                    product.translations.find(
                      (tr) => tr.locale === CONTENT_LOCALE,
                    )?.title || product.slug;
                  const categoryName =
                    product.category.translations.find(
                      (tr) => tr.locale === CONTENT_LOCALE,
                    )?.name || product.category.slug;
                  return (
                    <TableRow
                      key={product.id}
                      className="border-white/5 hover:bg-white/2"
                    >
                      <TableCell>
                        <div className="w-14 h-10 rounded-lg overflow-hidden bg-white/5 relative">
                          {product.images[0] && (
                            <Image
                              src={product.images[0].url}
                              alt={primaryTitle}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-white">
                          {primaryTitle}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-white/10 text-[var(--arvesta-text-secondary)] font-ui text-xs"
                        >
                          {categoryName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {product.featured && (
                          <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 font-ui text-xs">
                            <Star className="w-3 h-3 mr-1" /> {t.featured}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Link href={`/admin/products/${product.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[var(--arvesta-text-muted)] hover:text-white"
                              aria-label={t.editAriaLabel}
                            >
                              <Pencil className="w-4 h-4" />
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
                                  className="text-[var(--arvesta-text-muted)] hover:text-red-400"
                                  aria-label={t.deleteAriaLabel}
                                />
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </DialogTrigger>
                            <DialogContent className="bg-[var(--arvesta-bg-card)] border-white/5">
                              <DialogHeader>
                                <DialogTitle className="text-white font-display">
                                  {t.deleteDialog.title}
                                </DialogTitle>
                                <DialogDescription className="text-[var(--arvesta-text-muted)]">
                                  {t.deleteDialog.descriptionPrefix}&nbsp;
                                  &quot;
                                  {primaryTitle}&quot;. &nbsp;
                                  {t.deleteDialog.descriptionSuffix}
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <DialogClose
                                  render={
                                    <Button
                                      variant="ghost"
                                      className="text-[var(--arvesta-text-secondary)]"
                                    />
                                  }
                                >
                                  {t.deleteDialog.cancel}
                                </DialogClose>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDelete(product.id)}
                                >
                                  {t.deleteDialog.confirm}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
