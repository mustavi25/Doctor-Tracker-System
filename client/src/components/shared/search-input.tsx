"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  /** The committed value (usually from the URL) */
  value: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  label?: string;
  delay?: number;
  className?: string;
}

/**
 * Debounced search box. Typing updates the input instantly; `onSearch` fires once
 * the user pauses (or presses Enter), so we send one request instead of one per key.
 */
export function SearchInput({
  value,
  onSearch,
  placeholder = "Search...",
  label = "Search",
  delay = 400,
  className,
}: SearchInputProps) {
  const [draft, setDraft] = useState(value);
  const [committed, setCommitted] = useState(value);
  const [seen, setSeen] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Sync from outside (e.g. "Clear filters", browser back) but ignore echoes of our own commits,
  // otherwise characters typed while the URL updates would be overwritten.
  if (value !== seen) {
    setSeen(value);
    if (value !== committed) {
      setDraft(value);
      setCommitted(value);
    }
  }

  const commit = (text: string) => {
    clearTimeout(timer.current);
    const next = text.trim();
    setCommitted(next);
    onSearchRef.current(next);
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        type="text"
        role="searchbox"
        aria-label={label}
        autoComplete="off"
        placeholder={placeholder}
        value={draft}
        className="pr-9 pl-9"
        onChange={(e) => {
          const text = e.target.value;
          setDraft(text);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => commit(text), delay);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(draft);
        }}
      />
      {draft && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setDraft("");
            commit("");
          }}
          className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
