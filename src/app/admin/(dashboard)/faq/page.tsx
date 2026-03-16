"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
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
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";

interface FaqItem {
  id: string;
  order: number;
  published: boolean;
  translations: { locale: string; question: string; answer: string }[];
  createdAt: string;
}

export default function AdminFaq() {
  const t = useTranslations("adminFaq");
  const locale = useLocale();
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/faq")
      .then((r) => r.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function getQuestion(item: FaqItem) {
    const tr =
      item.translations.find((t) => t.locale === locale) ||
      item.translations.find((t) => t.locale === "fr") ||
      item.translations[0];
    return tr?.question || t("untitled");
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await fetch(`/api/faq/${deleteId}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== deleteId));
    } catch {
      // silent
    }
    setDeleteId(null);
  }

  async function togglePublished(item: FaqItem) {
    try {
      const res = await fetch(`/api/faq/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: item.order, published: !item.published }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, published: !i.published } : i,
          ),
        );
      }
    } catch {
      // silent
    }
  }

  const deleteItem = items.find((i) => i.id === deleteId);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
          <p className="text-sm text-zinc-400">
            {items.length} {t("countLabel")}
          </p>
        </div>
        <Link href="/admin/faq/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("newItem")}
          </Button>
        </Link>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-zinc-400">{t("loading")}</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-zinc-400">{t("noItems")}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>{t("table.question")}</TableHead>
                    <TableHead className="w-24">{t("table.status")}</TableHead>
                    <TableHead className="w-32">{t("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} className="border-zinc-800">
                      <TableCell className="text-zinc-400">
                        {item.order}
                      </TableCell>
                      <TableCell className="font-medium text-white max-w-md truncate">
                        {getQuestion(item)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.published ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => togglePublished(item)}
                        >
                          {item.published ? (
                            <Eye className="mr-1 h-3 w-3" />
                          ) : (
                            <EyeOff className="mr-1 h-3 w-3" />
                          )}
                          {item.published ? t("published") : t("draft")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link href={`/admin/faq/${item.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t("editAriaLabel")}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(item.id)}
                            aria-label={t("deleteAriaLabel")}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("deleteDialog.descriptionPrefix")}{" "}
              <strong>
                &quot;{deleteItem ? getQuestion(deleteItem) : ""}&quot;
              </strong>
              . {t("deleteDialog.descriptionSuffix")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>
              <Button variant="outline">{t("deleteDialog.cancel")}</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              {t("deleteDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
