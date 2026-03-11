"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Mail,
  Clock,
  Search,
  MessageSquare,
  Inbox,
  CheckCircle2,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  CalendarRange,
  CheckCheck,
  CheckSquare,
  Square,
} from "lucide-react";

type SubmissionItem = {
  id: string;
  fullName: string;
  email: string;
  projectType: string;
  description: string;
  locale: string;
  isRead: boolean;
  createdAt: string;
};

type Props = {
  initialSubmissions: SubmissionItem[];
};

type Filter = "all" | "unread" | "read";

export default function AdminSubmissionsClient({ initialSubmissions }: Props) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const allIds = new Set(submissions.map((s) => s.id));
    setSelectedIds((prev) => prev.filter((id) => allIds.has(id)));
  }, [submissions]);

  const stats = useMemo(() => {
    const total = submissions.length;
    const unread = submissions.filter((s) => !s.isRead).length;
    const read = total - unread;
    return { total, unread, read };
  }, [submissions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const toDate = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

    return submissions.filter((s) => {
      if (filter === "unread" && s.isRead) return false;
      if (filter === "read" && !s.isRead) return false;

      const createdAt = new Date(s.createdAt);
      if (fromDate && createdAt < fromDate) return false;
      if (toDate && createdAt > toDate) return false;

      if (!q) return true;

      return (
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.projectType.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      );
    });
  }, [submissions, query, filter, dateFrom, dateTo]);

  const filteredIds = useMemo(() => filtered.map((s) => s.id), [filtered]);
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));
  const selectedCount = selectedIds.length;

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      if (allFilteredSelected) {
        return prev.filter((id) => !filteredIds.includes(id));
      }

      const merged = new Set([...prev, ...filteredIds]);
      return Array.from(merged);
    });
  };

  const clearDateFilter = () => {
    setDateFrom("");
    setDateTo("");
  };

  const updateReadState = async (id: string, isRead: boolean) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead }),
      });

      if (!res.ok) throw new Error("Failed to update submission");

      setSubmissions((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead } : item)),
      );
    } catch (error) {
      console.error(error);
      alert("Güncelleme başarısız oldu.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteSubmission = async (id: string) => {
    const confirmed = window.confirm("Bu talebi silmek istediğine emin misin?");
    if (!confirmed) return;

    setBusyId(id);
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete submission");

      setSubmissions((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
      alert("Silme işlemi başarısız oldu.");
    } finally {
      setBusyId(null);
    }
  };

  const bulkMarkRead = async () => {
    if (selectedIds.length === 0) return;

    setBulkBusy(true);
    try {
      const res = await fetch("/api/submissions/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, isRead: true }),
      });

      if (!res.ok) throw new Error("Bulk mark read failed");

      setSubmissions((prev) =>
        prev.map((item) =>
          selectedIds.includes(item.id) ? { ...item, isRead: true } : item,
        ),
      );
      setSelectedIds([]);
    } catch (error) {
      console.error(error);
      alert("Toplu okundu işaretleme başarısız oldu.");
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm(
      `${selectedIds.length} adet talebi silmek istediğine emin misin?`,
    );
    if (!confirmed) return;

    setBulkBusy(true);
    try {
      const res = await fetch("/api/submissions/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!res.ok) throw new Error("Bulk delete failed");

      const selectedSet = new Set(selectedIds);
      setSubmissions((prev) => prev.filter((item) => !selectedSet.has(item.id)));
      setSelectedIds([]);
    } catch (error) {
      console.error(error);
      alert("Toplu silme işlemi başarısız oldu.");
    } finally {
      setBulkBusy(false);
    }
  };

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">
            İletişim Talepleri
          </h1>
          <p className="font-ui text-sm text-[var(--arvesta-text-muted)]">
            Müşterilerden gelen mesajları filtrele, oku ve yönet.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-white/5 bg-[var(--arvesta-bg-card)]">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-ui text-xs text-[var(--arvesta-text-muted)]">Toplam</p>
              <p className="font-ui text-xl font-semibold text-white">{stats.total}</p>
            </div>
            <Inbox className="h-5 w-5 text-[var(--arvesta-gold)]" />
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-[var(--arvesta-bg-card)]">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-ui text-xs text-[var(--arvesta-text-muted)]">
                Okunmamış
              </p>
              <p className="font-ui text-xl font-semibold text-[var(--arvesta-accent)]">
                {stats.unread}
              </p>
            </div>
            <MessageSquare className="h-5 w-5 text-[var(--arvesta-accent)]" />
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-[var(--arvesta-bg-card)]">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-ui text-xs text-[var(--arvesta-text-muted)]">Okunan</p>
              <p className="font-ui text-xl font-semibold text-emerald-400">{stats.read}</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/5 bg-[var(--arvesta-bg-card)]">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--arvesta-text-muted)]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                placeholder="İsim, e-posta, proje tipi veya mesaj içinde ara..."
                className="h-10 border-white/10 bg-[var(--arvesta-bg-elevated)] pl-9 text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              {(["all", "unread", "read"] as Filter[]).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className={
                    filter === f
                      ? "bg-[var(--arvesta-accent)] text-white hover:bg-[var(--arvesta-accent-hover)]"
                      : "border-white/10 bg-[var(--arvesta-bg-elevated)] text-[var(--arvesta-text-secondary)]"
                  }
                >
                  {f === "all" ? "Tümü" : f === "unread" ? "Okunmamış" : "Okunan"}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs text-[var(--arvesta-text-muted)]">
                <CalendarRange className="h-3.5 w-3.5" />
                Tarih Aralığı
              </span>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.currentTarget.value)}
                className="h-9 w-[170px] border-white/10 bg-[var(--arvesta-bg-elevated)] text-white"
              />
              <span className="text-xs text-[var(--arvesta-text-muted)]">-</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.currentTarget.value)}
                className="h-9 w-[170px] border-white/10 bg-[var(--arvesta-bg-elevated)] text-white"
              />
              {(dateFrom || dateTo) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearDateFilter}
                  className="border-white/10 bg-[var(--arvesta-bg-elevated)] text-white"
                >
                  Temizle
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={filteredIds.length === 0}
                onClick={toggleSelectAllFiltered}
                className="border-white/10 bg-[var(--arvesta-bg-elevated)] text-white"
              >
                {allFilteredSelected ? (
                  <CheckSquare className="mr-1" />
                ) : (
                  <Square className="mr-1" />
                )}
                {allFilteredSelected ? "Filtreyi Bırak" : "Filtreyi Seç"}
              </Button>
            </div>
          </div>

          {selectedCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--arvesta-accent)]/20 bg-[var(--arvesta-accent)]/5 p-2.5">
              <Badge className="border-[var(--arvesta-accent)]/20 bg-[var(--arvesta-accent)]/10 text-[var(--arvesta-accent)]">
                {selectedCount} seçili
              </Badge>

              <Button
                size="sm"
                disabled={bulkBusy}
                onClick={bulkMarkRead}
                className="bg-[var(--arvesta-accent)] text-white hover:bg-[var(--arvesta-accent-hover)]"
              >
                <CheckCheck className="mr-1" />
                Toplu Okundu İşaretle
              </Button>

              <Button
                variant="destructive"
                size="sm"
                disabled={bulkBusy}
                onClick={bulkDelete}
              >
                <Trash2 className="mr-1" />
                Toplu Sil
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {filtered.map((sub) => {
          const isSelected = selectedIds.includes(sub.id);

          return (
            <Card
              key={sub.id}
              className={`border-white/5 bg-[var(--arvesta-bg-card)] transition-all ${
                !sub.isRead ? "border-l-2 border-l-[var(--arvesta-accent)]" : ""
              } ${isSelected ? "ring-1 ring-[var(--arvesta-accent)]/40" : ""}`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(sub.id)}
                      className="h-4 w-4 rounded border-white/20 bg-[var(--arvesta-bg-elevated)] accent-[var(--arvesta-accent)]"
                      aria-label={`${sub.fullName} seç`}
                    />

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(232,98,44,0.1)] text-sm font-bold text-[var(--arvesta-accent)]">
                      {sub.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-ui text-sm font-semibold text-white">
                        {sub.fullName}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--arvesta-text-muted)]">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {sub.email}
                        </span>
                        <Badge
                          variant="outline"
                          className="border-white/10 text-[var(--arvesta-text-secondary)]"
                        >
                          {sub.projectType}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-white/10 text-[var(--arvesta-text-muted)]"
                        >
                          {sub.locale.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!sub.isRead && (
                      <Badge className="border-[var(--arvesta-accent)]/20 bg-[var(--arvesta-accent)]/10 text-[var(--arvesta-accent)]">
                        Yeni
                      </Badge>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--arvesta-text-muted)]">
                      <Clock className="h-3 w-3" />
                      {new Date(sub.createdAt).toLocaleString("tr-TR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="rounded-xl border border-white/5 bg-[var(--arvesta-bg-elevated)] p-3">
                  <p className="whitespace-pre-wrap break-words font-ui text-sm leading-relaxed text-[var(--arvesta-text-secondary)]">
                    {sub.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === sub.id}
                    onClick={() => updateReadState(sub.id, !sub.isRead)}
                    className="border-white/10 bg-[var(--arvesta-bg-elevated)] text-white"
                  >
                    {sub.isRead ? <EyeOff className="mr-1" /> : <Eye className="mr-1" />}
                    {sub.isRead ? "Okunmamış Yap" : "Okundu İşaretle"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyEmail(sub.email)}
                    className="border-white/10 bg-[var(--arvesta-bg-elevated)] text-white"
                  >
                    <Copy className="mr-1" />
                    E-postayı Kopyala
                  </Button>

                  <a
                    href={`mailto:${sub.email}`}
                    className="inline-flex h-7 items-center justify-center rounded-lg border border-white/10 bg-[var(--arvesta-bg-elevated)] px-2.5 text-[0.8rem] text-white transition hover:bg-white/5"
                  >
                    Yanıtla
                  </a>

                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={busyId === sub.id}
                    onClick={() => deleteSubmission(sub.id)}
                  >
                    <Trash2 className="mr-1" />
                    Sil
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <Card className="border-white/5 bg-[var(--arvesta-bg-card)]">
            <CardContent className="py-12 text-center">
              <MessageSquare className="mx-auto mb-3 h-10 w-10 text-[var(--arvesta-text-muted)]" />
              <p className="font-ui text-[var(--arvesta-text-muted)]">
                Filtreye uygun talep bulunamadı.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
