"use client";

import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFormo } from "@/contexts/FormoProvider";
import { toast } from "sonner";
import { Loader2, Activity, Sparkles } from "lucide-react";

const PRESET_EVENTS = [
  {
    name: "button_click",
    properties: { button_id: "cta_hero", page: "home" },
  },
  {
    name: "feature_used",
    properties: { feature: "swap", token_in: "SOL", token_out: "USDC" },
  },
];

export const CustomEvents: FC = () => {
  const { formo, isInitialized } = useFormo();
  // Count in-flight requests per event name so duplicate sends keep loading state correct
  const [loadingCounts, setLoadingCounts] = useState<Map<string, number>>(new Map());
  const [customName, setCustomName] = useState("");
  const [customProps, setCustomProps] = useState('{ "key": "value" }');
  const [sentEvents, setSentEvents] = useState<string[]>([]);

  const isLoading = (name: string) => (loadingCounts.get(name) ?? 0) > 0;

  const sendEvent = async (name: string, properties: Record<string, unknown>) => {
    if (!formo || !isInitialized) {
      toast.error("Formo SDK not initialized");
      return;
    }

    setLoadingCounts((prev) => {
      const next = new Map(prev);
      next.set(name, (next.get(name) ?? 0) + 1);
      return next;
    });
    try {
      await formo.track(name, properties);
      setSentEvents((prev) => [
        `${name} @ ${new Date().toLocaleTimeString()}`,
        ...prev.slice(0, 9),
      ]);
      toast.success("Event Sent", {
        description: `"${name}" tracked successfully`,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      toast.error("Event Failed", { description: msg });
    } finally {
      setLoadingCounts((prev) => {
        const next = new Map(prev);
        const count = (next.get(name) ?? 0) - 1;
        if (count <= 0) next.delete(name);
        else next.set(name, count);
        return next;
      });
    }
  };

  const sendCustom = async () => {
    if (!customName.trim()) {
      toast.error("Enter an event name");
      return;
    }
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(customProps);
    } catch {
      toast.error("Invalid JSON in properties");
      return;
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      toast.error("Properties must be a JSON object");
      return;
    }
    await sendEvent(customName.trim(), parsed);
  };

  return (
    <div className="space-y-4">
      {/* Preset Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Preset Events
          </CardTitle>
          <CardDescription>
            Fire common analytics events to test formo.track().
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {PRESET_EVENTS.map((evt) => (
              <Button
                key={evt.name}
                variant="outline"
                size="sm"
                className="justify-start font-mono text-xs"
                disabled={isLoading(evt.name) || !isInitialized}
                onClick={() => sendEvent(evt.name, evt.properties)}
              >
                {isLoading(evt.name) ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <Activity className="mr-2 h-3 w-3" />
                )}
                {evt.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Event */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Custom Event
          </CardTitle>
          <CardDescription>
            Send any custom event with arbitrary JSON properties.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Event Name
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="my_custom_event"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Properties (JSON)
            </label>
            <textarea
              value={customProps}
              onChange={(e) => setCustomProps(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Button
            variant="gradient"
            onClick={sendCustom}
            disabled={!isInitialized || isLoading(customName.trim())}
            className="w-full"
          >
            {isLoading(customName.trim()) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Custom Event"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Event Log */}
      {sentEvents.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {sentEvents.map((evt, i) => (
                <div
                  key={i}
                  className="rounded bg-muted/50 px-2 py-1 font-mono text-xs text-muted-foreground"
                >
                  {evt}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
