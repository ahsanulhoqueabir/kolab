"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/core/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  onDebouncedChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Debounced search input with search icon and clear button.
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState("")
 *
 * <SearchInput
 *   value={search}
 *   onChange={setSearch}
 *   onDebouncedChange={(val) => fetchResults(val)}
 *   placeholder="Search users..."
 * />
 * ```
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  debounceMs = 300,
  onDebouncedChange,
  className,
  disabled,
}: SearchInputProps) {
  const debouncedValue = useDebounce(value, debounceMs);

  React.useEffect(() => {
    if (onDebouncedChange) {
      onDebouncedChange(debouncedValue);
    }
  }, [debouncedValue, onDebouncedChange]);

  return (
    <div className={cn("relative w-full", className)}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        className="pl-8 pr-8"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
