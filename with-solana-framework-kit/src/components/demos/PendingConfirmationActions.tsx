import { Button } from "@/components/ui/button";

type PendingConfirmationActionsProps = {
  canCheck: boolean;
  isChecking: boolean;
  onDismiss: () => void;
  onRetry: () => void;
};

export function PendingConfirmationActions({
  canCheck,
  isChecking,
  onDismiss,
  onRetry,
}: PendingConfirmationActionsProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={onRetry}
        disabled={isChecking || !canCheck}
        className="flex-1"
      >
        Check confirmation
      </Button>
      <Button variant="ghost" onClick={onDismiss} disabled={isChecking}>
        Dismiss
      </Button>
    </div>
  );
}
