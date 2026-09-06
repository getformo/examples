"use client";

import { CheckCircle } from "lucide-react";

export function FormoStatus() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
      <CheckCircle className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Formo Active</span>
    </div>
  );
}
