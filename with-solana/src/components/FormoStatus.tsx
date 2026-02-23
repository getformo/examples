"use client";

import { useFormo } from "@/contexts/FormoProvider";
import { Activity, AlertCircle, CheckCircle } from "lucide-react";

export function FormoStatus() {
  const { isInitialized, error } = useFormo();

  if (error) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-yellow-600 dark:text-yellow-400">
        <AlertCircle className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Formo: {error}</span>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Activity className="h-3.5 w-3.5 animate-pulse" />
        <span className="hidden sm:inline">Initializing...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
      <CheckCircle className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Formo Active</span>
    </div>
  );
}
