"use client";

import { useMemo, useRef, useState } from "react";
import type { BrandSuggestion } from "@/lib/client/api";
import { fileToDataUrl } from "@/lib/client/image";
import type { FoodEntry } from "@/lib/types";
import { BrandLogo } from "./brand-logo";

export interface ComposerSubmit {
  text: string;
  image: string | null;
  /** Set when the input is exactly one #past-log chip — reuse it, skip the AI */
  repeatEntryId: string | null;
}

interface ComposerProps {
  busy: boolean;
  brands: BrandSuggestion[];
  pastEntries: FoodEntry[];
  onSubmit: (input: ComposerSubmit) => void;
}

interface Trigger {
  kind: "@" | "#";
  node: Text;
  /** offset of the @/# character inside the text node */
  start: number;
  query: string;
}

function findTrigger(editor: HTMLElement): Trigger | null {
  const sel = window.getSelection();
  if (!sel || !sel.isCollapsed || !sel.anchorNode) return null;
  const node = sel.anchorNode;
  if (node.nodeType !== Node.TEXT_NODE || !editor.contains(node)) return null;
  const upto = (node as Text).data.slice(0, sel.anchorOffset);
  const match = upto.match(/(^|[\s ])([@#])([^@#\n]{0,40})$/);
  if (!match) return null;
  return {
    kind: match[2] as "@" | "#",
    node: node as Text,
    start: sel.anchorOffset - match[3].length - 1,
    query: match[3],
  };
}

export function Composer({ busy, brands, pastEntries, onSubmit }: ComposerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState<Trigger | null>(null);
  const [highlight, setHighlight] = useState(0);
  const [hasContent, setHasContent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const canSubmit = !busy && (hasContent || image !== null);

  /** Brand names already tagged in the editor — used to scope # suggestions. */
  function taggedBrands(): string[] {
    const editor = editorRef.current;
    if (!editor) return [];
    return [...editor.querySelectorAll<HTMLElement>('[data-chip="brand"]')]
      .map((el) => el.dataset.name ?? "")
      .filter(Boolean);
  }

  const brandMatches = useMemo(() => {
    if (trigger?.kind !== "@") return [];
    const q = trigger.query.trim().toLowerCase();
    const pool = q
      ? brands.filter((b) => b.name.toLowerCase().includes(q))
      : brands;
    return pool.slice(0, 6);
  }, [trigger, brands]);

  const mealMatches = useMemo(() => {
    if (trigger?.kind !== "#") return [];
    const tagged = taggedBrands().map((n) => n.toLowerCase());
    let pool = pastEntries;
    if (tagged.length > 0) {
      pool = pool.filter((e) =>
        e.items.some((i) => i.brand && tagged.includes(i.brand.toLowerCase()))
      );
    }
    const q = trigger.query.trim().toLowerCase();
    if (q) pool = pool.filter((e) => e.description.toLowerCase().includes(q));
    // dedup identical meals, keep the most recent
    const seen = new Set<string>();
    const deduped: FoodEntry[] = [];
    for (const e of pool) {
      const key = e.description.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(e);
    }
    return deduped.slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, pastEntries]);

  const menuOpen =
    trigger !== null &&
    (trigger.kind === "@" ? brandMatches.length > 0 : mealMatches.length > 0);

  function syncTrigger() {
    const editor = editorRef.current;
    if (!editor) return;
    const next = findTrigger(editor);
    setTrigger(next);
    if (next) setHighlight(0);
    setHasContent(
      !!editor.textContent?.replace(/ /g, " ").trim() ||
        !!editor.querySelector("[data-chip]")
    );
  }

  function insertChip(el: HTMLSpanElement) {
    if (!trigger) return;
    const { node, start } = trigger;
    const sel = window.getSelection();
    const caret = sel?.anchorNode === node ? sel.anchorOffset : node.data.length;
    node.deleteData(start, Math.max(0, caret - start));
    const rest = node.splitText(start);
    rest.parentNode?.insertBefore(el, rest);
    rest.parentNode?.insertBefore(document.createTextNode(" "), rest);
    const range = document.createRange();
    range.setStart(rest, 0);
    range.collapse(true);
    sel?.removeAllRanges();
    sel?.addRange(range);
    setTrigger(null);
    setHasContent(true);
    editorRef.current?.focus();
  }

  function pickBrand(brand: BrandSuggestion) {
    const el = document.createElement("span");
    el.contentEditable = "false";
    el.dataset.chip = "brand";
    el.dataset.name = brand.name;
    el.className = "chip-brand";
    el.textContent = `@${brand.name}`;
    insertChip(el);
  }

  function pickMeal(entry: FoodEntry) {
    const el = document.createElement("span");
    el.contentEditable = "false";
    el.dataset.chip = "meal";
    el.dataset.entryId = entry.id;
    el.className = "chip-meal";
    el.textContent = `#${entry.description}`;
    insertChip(el);
  }

  /** Editor content as analyze-ready text; meal chips expand to their exact items. */
  function serialize(expandMeals: boolean): string {
    const editor = editorRef.current;
    if (!editor) return "";
    const out: string[] = [];
    const walk = (node: Node) => {
      node.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          out.push((child as Text).data);
        } else if (child instanceof HTMLElement && child.dataset.chip === "brand") {
          out.push(child.dataset.name ?? "");
        } else if (child instanceof HTMLElement && child.dataset.chip === "meal") {
          if (expandMeals) {
            const entry = pastEntries.find((e) => e.id === child.dataset.entryId);
            if (entry) {
              const items = entry.items
                .map(
                  (i) =>
                    `${i.name} (${i.quantity}, ${i.calories} cal, P${i.protein_g}/C${i.carbs_g}/F${i.fat_g})`
                )
                .join("; ");
              out.push(
                `"${entry.description}" — same as a previous log, use these exact items: ${items}`
              );
            }
          }
        } else if (child.nodeName === "BR") {
          out.push("\n");
        } else {
          walk(child);
        }
      });
    };
    walk(editor);
    return out.join("").replace(/ /g, " ").replace(/[ \t]{2,}/g, " ").trim();
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setImageError(null);
    try {
      setImage(await fileToDataUrl(file));
    } catch {
      setImageError("Couldn't read that photo — try a different one.");
    }
  }

  function submit() {
    if (!canSubmit) return;
    const editor = editorRef.current;
    const mealIds = editor
      ? [...editor.querySelectorAll<HTMLElement>('[data-chip="meal"]')]
          .map((el) => el.dataset.entryId ?? "")
          .filter(Boolean)
      : [];
    const textWithoutMeals = serialize(false);
    const soloRepeat =
      mealIds.length === 1 && textWithoutMeals === "" && !image;

    onSubmit({
      text: soloRepeat ? "" : serialize(true),
      image,
      repeatEntryId: soloRepeat ? mealIds[0] : null,
    });

    if (editor) editor.innerHTML = "";
    setHasContent(false);
    setImage(null);
    setTrigger(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const matches = trigger?.kind === "@" ? brandMatches : mealMatches;
    if (menuOpen && matches.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => (h + 1) % matches.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => (h - 1 + matches.length) % matches.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (trigger?.kind === "@") pickBrand(brandMatches[highlight]);
        else pickMeal(mealMatches[highlight]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setTrigger(null);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  const placeholder = image
    ? "Anything to add about the photo? (optional)"
    : "Tell Anna what you ate… @ tags a brand, # repeats a past log";

  return (
    <div className="relative rounded-3xl border border-line/80 bg-surface p-4 shadow-soft transition-shadow focus-within:border-leaf/40 focus-within:shadow-lift sm:p-5">
      <div className="relative">
        {!hasContent && (
          <span className="pointer-events-none absolute inset-0 text-base leading-relaxed text-muted/70">
            {placeholder}
          </span>
        )}
        <div
          ref={editorRef}
          contentEditable={!busy}
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Describe your food"
          aria-autocomplete="list"
          aria-expanded={menuOpen}
          onInput={syncTrigger}
          onKeyDown={handleKeyDown}
          onKeyUp={syncTrigger}
          onClick={syncTrigger}
          onBlur={() => setTimeout(() => setTrigger(null), 150)}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, text);
          }}
          className={`min-h-[3.1em] w-full whitespace-pre-wrap break-words text-base leading-relaxed outline-none ${
            busy ? "opacity-50" : ""
          }`}
        />
      </div>

      {/* @brand / #past-log suggestions */}
      {menuOpen && (
        <div
          role="listbox"
          aria-label={trigger?.kind === "@" ? "Brand suggestions" : "Past logs"}
          className="animate-rise absolute left-4 right-4 top-full z-20 -mt-1 overflow-hidden rounded-2xl border border-line/80 bg-surface/95 shadow-lift backdrop-blur-md"
        >
          {trigger?.kind === "@"
            ? brandMatches.map((brand, i) => (
                <button
                  key={brand.name.toLowerCase()}
                  type="button"
                  role="option"
                  aria-selected={i === highlight}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pickBrand(brand);
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors ${
                    i === highlight ? "bg-leaf-soft/60" : ""
                  }`}
                >
                  {brand.domain ? (
                    <BrandLogo
                      domain={brand.domain}
                      name={brand.name}
                      className="h-6 w-6 shrink-0 rounded-full object-contain text-xs"
                    />
                  ) : (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-leaf-soft font-display text-xs text-leaf">
                      {brand.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {brand.name}
                  </span>
                  <span className="shrink-0 text-[11px] tabular-nums text-muted">
                    {brand.count}×
                  </span>
                </button>
              ))
            : mealMatches.map((entry, i) => (
                <button
                  key={entry.id}
                  type="button"
                  role="option"
                  aria-selected={i === highlight}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pickMeal(entry);
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors ${
                    i === highlight ? "bg-amber-soft/60" : ""
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center text-base">
                    {entry.emoji || "🍽️"}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {entry.description}
                  </span>
                  <span className="shrink-0 text-[11px] tabular-nums text-muted">
                    {entry.totals.calories.toLocaleString()} cal
                  </span>
                </button>
              ))}
        </div>
      )}

      {image && (
        <div className="mt-2 flex items-start gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt="Food to analyze"
            className="h-20 w-20 rounded-xl border border-line object-cover"
          />
          <button
            type="button"
            onClick={() => {
              setImage(null);
              if (fileRef.current) fileRef.current.value = "";
            }}
            className="rounded-full p-1 text-muted transition-colors hover:bg-cream hover:text-ink"
            aria-label="Remove photo"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {imageError && <p className="mt-2 text-sm text-clay">{imageError}</p>}

      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="flex min-h-[2.5rem] items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-ink-soft transition-all hover:bg-cream active:scale-95 disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="1.5" y="3.5" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="8" cy="8.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M5.5 3.5L6.5 2h3l1 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          {image ? "Change photo" : "Add photo"}
        </button>

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="rounded-full bg-gradient-to-b from-leaf to-leaf-deep px-6 py-2.5 text-sm font-semibold text-white shadow-pop transition-all hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? (
            <span className="animate-pulse-soft">Analyzing…</span>
          ) : (
            "Analyze"
          )}
        </button>
      </div>
    </div>
  );
}
