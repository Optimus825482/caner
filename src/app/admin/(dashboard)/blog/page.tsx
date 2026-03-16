"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";

interface BlogPost {
  id: string;
  slug: string;
  image: string | null;
  published: boolean;
  order: number;
  translations: { locale: string; title: string; excerpt: string | null }[];
  createdAt: string;
}

export default function AdminBlog() {
  const t = useTranslations("adminBlog");
  const locale = useLocale();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/blog")
      .then((r) => r.json())
      .then((data) => {
        setPosts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function getTitle(post: BlogPost) {
    const tr =
      post.translations.find((t) => t.locale === locale) ||
      post.translations.find((t) => t.locale === "fr") ||
      post.translations[0];
    return tr?.title || post.slug;
  }

  async function handleDelete() {
    if (!deleteId) return;
    await fetch(`/api/blog/${deleteId}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== deleteId));
    setDeleteId(null);
  }

  const deletePost = posts.find((p) => p.id === deleteId);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
          <p className="text-sm text-zinc-400">
            {posts.length} {t("countLabel")}
          </p>
        </div>
        <Link href="/admin/blog/new">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {t("newPost")}
          </Button>
        </Link>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="w-16">{t("table.image")}</TableHead>
                  <TableHead>{t("table.title")}</TableHead>
                  <TableHead className="w-24">{t("table.status")}</TableHead>
                  <TableHead className="w-32">{t("table.date")}</TableHead>
                  <TableHead className="w-24">{t("table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-zinc-500 py-12"
                    >
                      ...
                    </TableCell>
                  </TableRow>
                ) : posts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-zinc-500 py-12"
                    >
                      {t("noPosts")}
                    </TableCell>
                  </TableRow>
                ) : (
                  posts.map((post) => (
                    <TableRow key={post.id} className="border-zinc-800">
                      <TableCell>
                        {post.image ? (
                          <Image
                            src={post.image}
                            alt=""
                            width={48}
                            height={48}
                            className="rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-zinc-800 text-zinc-600 text-xs">
                            —
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-white">
                        {getTitle(post)}
                      </TableCell>
                      <TableCell>
                        {post.published ? (
                          <Badge
                            variant="default"
                            className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30"
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            {t("published")}
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-zinc-700/50 text-zinc-400"
                          >
                            <EyeOff className="mr-1 h-3 w-3" />
                            {t("draft")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-400 text-sm">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Link href={`/admin/blog/${post.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={t("editAriaLabel")}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Dialog>
                            <DialogTrigger
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-400 hover:text-red-300 hover:bg-accent"
                              onClick={() => setDeleteId(post.id)}
                              aria-label={t("deleteAriaLabel")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  {t("deleteDialog.title")}
                                </DialogTitle>
                                <DialogDescription>
                                  {t("deleteDialog.descriptionPrefix")}{" "}
                                  <strong>
                                    {deletePost ? getTitle(deletePost) : ""}
                                  </strong>
                                  . {t("deleteDialog.descriptionSuffix")}
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <DialogClose>
                                  <Button variant="outline">
                                    {t("deleteDialog.cancel")}
                                  </Button>
                                </DialogClose>
                                <DialogClose>
                                  <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                  >
                                    {t("deleteDialog.confirm")}
                                  </Button>
                                </DialogClose>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
