import { Button } from "@/components/ui/button";

interface CreatePageHeaderProps {
  resource: string;
  title: string;
  description?: string;
  onDiscard: () => void;
  onSaveAndReturn: () => void;
  onSave: () => void;
  isSubmitting: boolean;
  disabled?: boolean;
}

export function CreatePageHeader({
  title,
  description,
  onDiscard,
  onSaveAndReturn,
  onSave,
  isSubmitting,
  disabled,
}: CreatePageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 mb-6 md:flex-row md:justify-between md:items-start border-b pb-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="delete"
          size="lg"
          onClick={onDiscard}
          disabled={isSubmitting}
        >
          Discard
        </Button>
        <Button
          type="button"
          size="lg"
          variant="secondary"
          onClick={onSave}
          disabled={disabled || isSubmitting}
        >
          Save & Stay
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={onSaveAndReturn}
          disabled={disabled || isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save & Close"}
        </Button>
      </div>
    </div>
  );
}
