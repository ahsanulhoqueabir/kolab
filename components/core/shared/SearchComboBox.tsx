"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, ChevronDown, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/core/ui/input";
import { Button } from "@/components/ui/button";

export interface ComboBoxOption {
  value: string;
  label: string;
}

interface SearchComboBoxProps {
  options: ComboBoxOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  /** Label for the create button tooltip */
  createLabel?: string;
  /** Show create button (requires onCreateNew) */
  showCreate?: boolean;
  /** Called when the plus button is clicked */
  onCreateNew?: () => void;
}

export function SearchComboBox({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  disabled = false,
  className,
  showCreate = false,
  createLabel = "Create new",
  onCreateNew,
}: SearchComboBoxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedLabel = options.find((opt) => opt.value === value)?.label || "";

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()),
  );

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  const handleSelect = useCallback(
    (optionValue: string) => {
      // If the same option is clicked again, deselect it
      if (optionValue === value) {
        onValueChange("");
      } else {
        onValueChange(optionValue);
      }
      setOpen(false);
      setSearch("");
    },
    [onValueChange, value],
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      setSearch("");
    }
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !value && "text-muted-foreground",
        )}
      >
        <span className="truncate">{value ? selectedLabel : placeholder}</span>
        <ChevronDown
          className={cn(
            "ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
            "animate-in fade-in-80 slide-in-from-top-1",
          )}
          onKeyDown={handleKeyDown}
        >
          {/* Search input */}
          <div className="flex items-center gap-1 px-2 pb-1">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-8 pl-8 text-sm"
              />
            </div>
            {showCreate && onCreateNew && (
              <Button
                type="button"
                size="icon-sm"
                onClick={() => {
                  onCreateNew();
                  setOpen(false);
                  setSearch("");
                }}
                title={createLabel}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Options */}
          <div className="max-h-60 overflow-auto mt-2 space-y-1">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm text-left outline-none",
                    "hover:bg-accent hover:text-accent-foreground",
                    "data-disabled:pointer-events-none data-disabled:opacity-50",
                    "bg-accent/10",
                    option.value === value &&
                      "bg-accent text-accent-foreground",
                  )}
                >
                  {option.value === value && (
                    <Check className=" h-4 w-4 shrink-0" />
                  )}
                  <span className="ml-2 flex-1 truncate">{option.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
