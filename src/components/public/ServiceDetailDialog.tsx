"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  title: string;
  summary: string;
  detail: string;
  icon: string | null;
}

export default function ServiceDetailDialog({
  title,
  summary,
  detail,
  icon,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-2xl border border-(--arvesta-gold)/15 bg-[rgba(255,255,255,0.015)] p-8 text-left transition-all duration-300 hover:border-(--arvesta-gold)/40 hover:bg-[rgba(255,255,255,0.03)] cursor-pointer"
      >
        {icon && (
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-(--arvesta-gold)/10">
            <span className="material-symbols-outlined text-2xl text-(--arvesta-gold)">
              {icon}
            </span>
          </div>
        )}
        <h3 className="mb-3 font-display text-lg font-bold text-white">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-(--arvesta-text-secondary)">
          {summary}
        </p>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg border-zinc-800 bg-zinc-900 text-white">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {icon && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--arvesta-gold)/10">
                  <span className="material-symbols-outlined text-xl text-(--arvesta-gold)">
                    {icon}
                  </span>
                </div>
              )}
              <DialogTitle className="font-display text-xl text-white">
                {title}
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="mt-2 whitespace-pre-line text-sm leading-relaxed text-(--arvesta-text-secondary)">
            {detail || summary}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
