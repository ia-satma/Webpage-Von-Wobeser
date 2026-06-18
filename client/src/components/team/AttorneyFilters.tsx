import { X } from "lucide-react";

/**
 * AttorneyFilters — barra de filtros del listado de abogados (look viejo).
 *
 * Recrea el bloque "Search by / Browse by Last Name" del mirror:
 *   · búsqueda por nombre (input)
 *   · categoría de rol: Socios / Of Counsel / Asociados (+ Todos)
 *   · letra inicial A–Z (barra de letras, fuente Geomanist)
 *
 * Es presentacional: recibe estado y setters del contenedor `Team.tsx`.
 * Todos los textos llegan ya traducidos (i18n) vía `labels`.
 * Solo tokens Tailwind establecidos (vw-red, vw-gray, vw-graylight, font-label).
 */
export interface AttorneyFiltersLabels {
  searchPlaceholder: string;
  all: string;
  partnersOnly: string;
  ofCounsel: string;
  associates: string;
  clearFilters: string;
  resultsLabel: string; // p.ej. "miembros del equipo"
  browseByLetter: string;
}

export interface AttorneyFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterSeniority: string;
  onSeniorityChange: (value: string) => void;
  filterLetter: string;
  onLetterChange: (value: string) => void;
  hasActiveFilters: boolean;
  onClear: () => void;
  totalVisible: number;
  labels: AttorneyFiltersLabels;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const SENIORITY_KEYS = [
  { value: "all", labelKey: "all" as const },
  { value: "partners", labelKey: "partnersOnly" as const },
  { value: "ofcounsel", labelKey: "ofCounsel" as const },
  { value: "associates", labelKey: "associates" as const },
];

export default function AttorneyFilters({
  searchQuery,
  onSearchChange,
  filterSeniority,
  onSeniorityChange,
  filterLetter,
  onLetterChange,
  hasActiveFilters,
  onClear,
  totalVisible,
  labels,
}: AttorneyFiltersProps) {
  return (
    <div
      className="border-b border-vw-graylight pb-8"
      data-testid="attorney-filters"
    >
      {/* Categorías de rol */}
      <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
        {SENIORITY_KEYS.map(({ value, labelKey }) => {
          const isActive = filterSeniority === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onSeniorityChange(value)}
              aria-pressed={isActive}
              data-testid={`filter-seniority-${value}`}
              className={`font-label text-[13px] uppercase tracking-[0.22em] transition-colors duration-200 ${
                isActive
                  ? "text-vw-red"
                  : "text-vw-gray/60 hover:text-vw-gray"
              }`}
            >
              {labels[labelKey]}
              <span
                aria-hidden="true"
                className={`mt-1 block h-px origin-left transition-transform duration-300 ${
                  isActive ? "scale-x-100 bg-vw-red" : "scale-x-0 bg-vw-red"
                }`}
              />
            </button>
          );
        })}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            data-testid="button-clear-filters"
            className="ml-auto inline-flex items-center gap-1.5 font-label text-[12px] uppercase tracking-[0.2em] text-vw-gray/50 transition-colors hover:text-vw-red"
          >
            <X className="h-3.5 w-3.5" />
            {labels.clearFilters}
          </button>
        )}
      </div>

      {/* Búsqueda por nombre */}
      <div className="mt-6 max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={labels.searchPlaceholder}
          data-testid="input-search"
          aria-label={labels.searchPlaceholder}
          className="w-full border border-vw-graylight bg-white px-4 py-2.5 font-sans text-[15px] text-vw-gray placeholder:text-vw-gray/40 focus:border-vw-red focus:outline-none focus:ring-1 focus:ring-vw-red/30"
        />
      </div>

      {/* Barra A–Z */}
      <div className="mt-6">
        <span className="mb-2 block font-label text-[11px] uppercase tracking-[0.2em] text-vw-gray/50">
          {labels.browseByLetter}
        </span>
        <div className="flex flex-wrap gap-x-1.5 gap-y-2">
          <button
            type="button"
            onClick={() => onLetterChange("all")}
            aria-pressed={filterLetter === "all"}
            data-testid="filter-letter-all"
            className={`font-label text-[16px] leading-none transition-colors duration-150 ${
              filterLetter === "all"
                ? "text-vw-red underline"
                : "text-vw-gray/60 hover:text-vw-red hover:underline"
            }`}
          >
            {labels.all}
          </button>
          {ALPHABET.map((letter) => {
            const isActive = filterLetter === letter;
            return (
              <button
                key={letter}
                type="button"
                onClick={() => onLetterChange(letter)}
                aria-pressed={isActive}
                data-testid={`filter-letter-${letter}`}
                className={`w-6 font-label text-[18px] leading-none transition-colors duration-150 ${
                  isActive
                    ? "text-vw-red underline"
                    : "text-vw-gray/60 hover:text-vw-red hover:underline"
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteo de resultados */}
      <p
        className="mt-6 font-label text-[12px] uppercase tracking-[0.2em] text-vw-gray/50"
        data-testid="text-results-count"
      >
        {totalVisible} {labels.resultsLabel}
      </p>
    </div>
  );
}
