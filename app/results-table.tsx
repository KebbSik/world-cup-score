"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { CountryLabel } from "@/lib/country-flag";
import { moveJudgePlacement, scoreResults, type ResultRow } from "@/lib/placement";

type EditableRow = ResultRow & { id: number; steps: string[] };

type ResultsTableProps = {
  judges: string[];
  source: ResultRow[];
};

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("pl");
}

const DETAILS_MS = 300;

function splitStep(step: string): { label: string; detail: string } {
  const bullet = step.indexOf(" · ");
  if (bullet !== -1) return { label: step.slice(0, bullet), detail: step.slice(bullet + 3) };
  const colon = step.indexOf(": ");
  if (colon !== -1) return { label: step.slice(0, colon), detail: step.slice(colon + 2) };
  const sentence = step.indexOf(". ");
  if (sentence !== -1) return { label: step.slice(0, sentence), detail: step.slice(sentence + 2) };
  return { label: step, detail: "" };
}

function tieBreakersUsed(steps: string[]): { sum: boolean; head: boolean } {
  const last = steps.at(-1) ?? "";
  const head = last.startsWith("Tie-breaker 2");
  const sum = head || last.includes("Separated by the sum");
  return { sum, head };
}

function TieBreakIcons({ steps }: { steps: string[] }) {
  const { sum, head } = tieBreakersUsed(steps);
  if (!sum && !head) return null;

  return (
    <span className="ml-2 inline-flex items-center gap-1 align-[-2px]">
      {sum ? (
        <span title="Tie-breaker 1 · Ordinal sum" className="text-yellow-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M12 3v18" />
            <path d="M8 21h8" />
            <path d="M3 8h18" />
            <path d="M6 8 3 14h6L6 8z" />
            <path d="M18 8l-3 6h6l-3-6z" />
          </svg>
        </span>
      ) : null}
      {head ? (
        <span title="Tie-breaker 2 · Head judge" className="text-yellow-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0a2.12 2.12 0 0 1 0-3L11 10" />
            <path d="m16 16 6-6" />
            <path d="m8 8 6 6" />
            <path d="m9 7 8 8" />
            <path d="m21 11-8-8" />
          </svg>
        </span>
      ) : null}
    </span>
  );
}

function PlacementDetails({ id, steps }: { id: string; steps: string[] }) {
  return (
    <div id={id} className="flow-root px-3 py-4 sm:px-4">
      <div className="w-full max-w-2xl text-left md:float-left">
        <p className="text-base font-medium">How this placement was decided</p>
        <div className="mt-3 overflow-hidden rounded-lg border border-zinc-600">
          <div className="hidden bg-zinc-700 text-xs uppercase tracking-wide text-zinc-100 sm:grid sm:grid-cols-[minmax(0,42%)_minmax(0,1fr)]">
            <div className="px-3 py-2 font-medium">Step</div>
            <div className="px-3 py-2 font-medium">Explanation</div>
          </div>
          {steps.map((step, stepIndex) => {
            const { label, detail } = splitStep(step);
            return (
              <div
                key={`${stepIndex}-${step}`}
                className={`grid grid-cols-1 border-zinc-600 sm:grid-cols-[minmax(0,42%)_minmax(0,1fr)] ${
                  stepIndex === 0 ? "sm:border-t" : "border-t"
                }`}
              >
                <div className="px-3 pt-2 text-sm font-medium text-zinc-50 sm:py-2">{label}</div>
                <div className="px-3 pb-2 text-sm leading-relaxed text-zinc-100 sm:py-2">{detail || step}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function cloneSource(source: ResultRow[]): Array<ResultRow & { id: number }> {
  return source.map((row, id) => ({
    ...row,
    id,
    placements: [...row.placements],
  }));
}

export function ResultsTable({ judges, source }: ResultsTableProps) {
  const advanceLimit = source.filter((row) => row.advances).length;
  const [rows, setRows] = useState<EditableRow[]>(() =>
    scoreResults(cloneSource(source), advanceLimit, judges[0]),
  );
  const [details, setDetails] = useState<ReadonlyMap<number, "open" | "closing">>(new Map());
  const closeTimers = useRef(new Map<number, number>());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");

  const editing = rows.find((row) => row.id === editingId) ?? null;
  const advancing = rows.filter((row) => row.advances).length;
  const normalizedQuery = normalizeSearch(query);
  const normalizedCountry = normalizeSearch(countryQuery);
  const visibleRows = rows.filter((row) => {
    const nameMatches =
      !normalizedQuery || normalizeSearch(row.name).includes(normalizedQuery);
    const countryMatches =
      !normalizedCountry || normalizeSearch(row.country).includes(normalizedCountry);
    return nameMatches && countryMatches;
  });

  useEffect(() => {
    if (!editing) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setEditingId(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editing]);

  useEffect(() => {
    const timers = closeTimers.current;
    return () => {
      for (const timer of timers.values()) window.clearTimeout(timer);
    };
  }, []);

  function clearDetails() {
    for (const timer of closeTimers.current.values()) window.clearTimeout(timer);
    closeTimers.current.clear();
    setDetails(new Map());
  }

  function toggleDetails(id: number) {
    const existing = closeTimers.current.get(id);
    if (existing) {
      window.clearTimeout(existing);
      closeTimers.current.delete(id);
    }

    if (details.get(id) === "open") {
      setDetails((current) => {
        const next = new Map(current);
        next.set(id, "closing");
        return next;
      });
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const timer = window.setTimeout(() => {
        closeTimers.current.delete(id);
        setDetails((current) => {
          if (current.get(id) !== "closing") return current;
          const next = new Map(current);
          next.delete(id);
          return next;
        });
      }, reduceMotion ? 0 : DETAILS_MS);
      closeTimers.current.set(id, timer);
      return;
    }

    setDetails((current) => {
      const next = new Map(current);
      next.set(id, "open");
      return next;
    });
  }

  function openEditor(row: EditableRow) {
    setDraft(row.placements.map(String));
    setError(null);
    setEditingId(row.id);
  }

  function closeEditor() {
    setEditingId(null);
    setError(null);
  }

  function saveEditor() {
    if (!editing) return;
    const targets: number[] = [];
    for (const value of draft) {
      const target = Number(value);
      if (!Number.isInteger(target) || target < 1 || target > rows.length) {
        setError(`Each placement must be a whole number from 1 to ${rows.length}.`);
        return;
      }
      targets.push(target);
    }

    const index = rows.findIndex((row) => row.id === editing.id);
    let next: Array<ResultRow & { id: number }> = rows;
    targets.forEach((target, judgeIndex) => {
      if (target !== editing.placements[judgeIndex]) {
        next = moveJudgePlacement(next, index, judgeIndex, target);
      }
    });
    setRows(scoreResults(next, advanceLimit, judges[0]));
    clearDetails();
    closeEditor();
  }

  function reset() {
    setRows(scoreResults(cloneSource(source), advanceLimit, judges[0]));
    clearDetails();
    closeEditor();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-300">
          {visibleRows.length === rows.length
            ? `${rows.length} participants`
            : `${visibleRows.length} of ${rows.length}`}
          {" "}
          · {advancing} advancing · {judges.length} judges
        </p>
        <div className="flex flex-1 flex-col gap-2 sm:max-w-xl sm:flex-row">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
            <span className="sr-only">Search participant</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name"
              className="min-h-11 w-full rounded-full border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-base text-zinc-100 placeholder:text-zinc-400"
            />
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
            <span className="sr-only">Search country</span>
            <input
              type="search"
              value={countryQuery}
              onChange={(event) => setCountryQuery(event.target.value)}
              placeholder="Search by country"
              className="min-h-11 w-full rounded-full border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-base text-zinc-100 placeholder:text-zinc-400"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-zinc-700 px-8 py-3 text-base font-semibold text-white transition-colors duration-200 hover:bg-zinc-600 sm:w-auto"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 4v5h5" />
          </svg>
          Reset
        </button>
      </div>

      <div className="@container hidden max-h-[calc(100dvh-12rem)] min-h-96 overflow-auto overscroll-x-contain rounded-xl border border-zinc-700 bg-zinc-800 shadow-sm md:block">
        <table className="w-full min-w-max border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 text-xs uppercase tracking-wide text-zinc-200">
            <tr className="border-b border-zinc-700">
              <th className="sticky left-0 z-20 w-14 bg-zinc-700 px-3 py-3 font-medium">
                #
              </th>
              <th className="sticky left-14 z-20 w-44 max-w-44 bg-zinc-700 px-3 py-3 font-medium shadow-[inset_-2px_0_0_0_#d4d4d8]">
                Participant
              </th>
              <th className="bg-zinc-700 px-3 py-3 font-medium">Advances</th>
              <th className="bg-zinc-700 px-3 py-3 font-medium">
                Confirmed at
              </th>
              <th className="bg-zinc-700 px-3 py-3 font-medium">Details</th>
              {judges.map((judge) => (
                <th
                  key={judge}
                  className="whitespace-nowrap bg-zinc-700 px-3 py-3 text-center font-medium"
                >
                  {judge}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const cellBg = row.advances
                ? "bg-emerald-800"
                : "bg-zinc-800";
              const detailState = details.get(row.id);
              const isOpen = detailState === "open";

              return (
                <Fragment key={row.id}>
                  <tr
                    className={`cursor-pointer border-b border-zinc-700 transition-colors duration-150 hover:bg-zinc-700 ${cellBg}`}
                    onClick={() => openEditor(row)}
                  >
                    <td className={`sticky left-0 z-10 px-3 py-2.5 font-medium tabular-nums ${cellBg}`}>
                      {row.rank}
                    </td>
                    <td className={`sticky left-14 z-10 w-44 max-w-44 px-3 py-2.5 shadow-[inset_-2px_0_0_0_#d4d4d8] ${cellBg}`}>
                      <div className="font-medium break-words">{row.name}</div>
                      <div className="text-xs text-zinc-300">
                        <CountryLabel country={row.country} />
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {row.advances ? (
                        <span className="font-medium text-emerald-200">
                          Advances
                        </span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">
                      Top {row.confirmedAt}
                      <span className="ml-2 text-zinc-300">
                        {row.majority}/{judges.length}
                      </span>
                      <TieBreakIcons steps={row.steps} />
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`placement-${row.id}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleDetails(row.id);
                        }}
                        className={`cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium transition-colors duration-200 ${
                          isOpen
                            ? "border-zinc-500 bg-zinc-500 text-white"
                            : "border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                        }`}
                      >
                        Details
                      </button>
                    </td>
                    {row.placements.map((place, judgeIndex) => (
                      <td
                        key={judges[judgeIndex]}
                        className="px-3 py-2.5 text-center tabular-nums text-zinc-100"
                      >
                        #{place}
                      </td>
                    ))}
                  </tr>
                  {detailState ? (
                    <tr className={detailState === "open" ? "border-b border-zinc-700" : undefined}>
                      <td colSpan={5 + judges.length} className={`p-0 ${cellBg}`}>
                        <div data-state={detailState} className="details-panel">
                          <div className="overflow-hidden">
                            <div className="sticky left-0 w-[100cqw]">
                              <PlacementDetails id={`placement-${row.id}`} steps={row.steps} />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={5 + judges.length} className="px-4 py-8 text-center text-zinc-300">
                  No participant matches this search.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {visibleRows.map((row) => {
          const cellBg = row.advances ? "bg-emerald-800" : "bg-zinc-800";
          const detailState = details.get(row.id);
          const isOpen = detailState === "open";

          return (
            <article key={row.id} className={`overflow-hidden rounded-xl border border-zinc-700 ${cellBg}`}>
              <div
                className="flex cursor-pointer items-start gap-3 p-3"
                onClick={() => openEditor(row)}
              >
                <div className="w-8 shrink-0 pt-0.5 text-lg font-semibold tabular-nums">{row.rank}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium break-words">{row.name}</div>
                  <div className="text-xs text-zinc-300">
                    <CountryLabel country={row.country} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    {row.advances ? (
                      <span className="font-medium text-emerald-200">Advances</span>
                    ) : (
                      <span className="text-zinc-400">Does not advance</span>
                    )}
                    <span className="tabular-nums">
                      Top {row.confirmedAt}
                      <span className="ml-2 text-zinc-300">
                        {row.majority}/{judges.length}
                      </span>
                      <TieBreakIcons steps={row.steps} />
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`placement-card-${row.id}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleDetails(row.id);
                  }}
                  className={`shrink-0 cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium transition-colors duration-200 ${
                    isOpen
                      ? "border-zinc-500 bg-zinc-500 text-white"
                      : "border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                  }`}
                >
                  Details
                </button>
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-zinc-700/80 px-3 py-3 min-[420px]:grid-cols-3">
                {row.placements.map((place, judgeIndex) => (
                  <div key={judges[judgeIndex]} className="min-w-0">
                    <dt className="truncate text-[11px] uppercase tracking-wide text-zinc-300" title={judges[judgeIndex]}>
                      {judges[judgeIndex]}
                    </dt>
                    <dd className="font-medium tabular-nums text-zinc-50">#{place}</dd>
                  </div>
                ))}
              </dl>
              {detailState ? (
                <div data-state={detailState} className="details-panel border-t border-zinc-700">
                  <div className="overflow-hidden">
                    <PlacementDetails id={`placement-card-${row.id}`} steps={row.steps} />
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
        {visibleRows.length === 0 ? (
          <p className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-8 text-center text-zinc-300">
            No participant matches this search.
          </p>
        ) : null}
      </div>

      {editing ? (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-zinc-900/55 p-4"
          onClick={closeEditor}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-placement-title"
            className="modal-panel max-h-[90dvh] w-full max-w-lg cursor-auto overflow-y-auto rounded-2xl bg-zinc-800 p-4 text-zinc-100 shadow-xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="edit-placement-title" className="text-xl font-semibold">
              {editing.name}
            </h2>
            <p className="text-sm text-zinc-300">
              <CountryLabel country={editing.country} />
            </p>
            <p className="mt-3 text-sm text-zinc-300">
              Changing a placement shifts the other dancers in that judge's column. Tied dancers stay together.
            </p>
            <form
              className="mt-4"
              onSubmit={(event) => {
                event.preventDefault();
                saveEditor();
              }}
            >
              <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                {judges.map((judge, judgeIndex) => (
                  <label key={judge} className="flex flex-col gap-1 text-sm">
                    <span className="font-medium">
                      {judge}
                      {judgeIndex === 0 ? " · head judge" : ""}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={rows.length}
                      required
                      value={draft[judgeIndex] ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        setDraft((current) => current.map((item, index) => (index === judgeIndex ? value : item)));
                      }}
                      className="min-h-11 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-base text-zinc-100 tabular-nums"
                    />
                  </label>
                ))}
              </div>
              {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="min-h-11 cursor-pointer rounded-full border border-zinc-600 px-5 py-2 text-sm font-medium text-zinc-100 transition-colors duration-200 hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-11 cursor-pointer rounded-full bg-zinc-600 px-5 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-500"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
