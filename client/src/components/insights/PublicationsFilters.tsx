/**
 * PublicationsFilters — fila de filtros del archivo (look viejo).
 *
 * El sitio viejo tenía, alineados a la derecha, un input de búsqueda
 * (`.archive__filters--input`, Geomanist con placeholder en mayúsculas y
 * letter-spacing) y un selector "Display #" (`.display-limit`). Aquí
 * recreamos ese estilo y, además, conservamos los filtros por categoría que
 * usa la página actual de News (botones de texto en lugar de un <select>,
 * pero con el mismo lenguaje visual Geomanist/uppercase).
 */

interface CategoryFilter {
  value: string;
  label: string;
}

interface PublicationsFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  /** Filtros de categoría (opcional — solo News los usa). */
  categories?: CategoryFilter[];
  selectedCategory?: string;
  onCategoryChange?: (value: string) => void;
}

export function PublicationsFilters({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  categories,
  selectedCategory,
  onCategoryChange,
}: PublicationsFiltersProps) {
  return (
    <div className="mb-14 w-full" data-testid="archive-filters">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Filtros de categoría (Geomanist uppercase) */}
        {categories && categories.length > 0 && onCategoryChange ? (
          <div
            className="flex flex-wrap items-center gap-x-6 gap-y-3"
            data-testid="container-category-filters"
          >
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => onCategoryChange(cat.value)}
                  className={[
                    "vw-label text-[14px] transition-colors duration-200",
                    isActive
                      ? "text-vw-red"
                      : "text-vw-gray hover:text-vw-red",
                  ].join(" ")}
                  data-testid={`button-filter-${cat.value}`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        ) : (
          <span aria-hidden="true" />
        )}

        {/* Buscador con estilo viejo (borde gris, Geomanist, placeholder uppercase) */}
        <div className="sm:ml-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="vw-label w-[220px] max-w-full border border-vw-gray bg-white px-3 py-2 text-[15px] text-vw-gray outline-none placeholder:text-vw-graylight"
            data-testid="input-search-publications"
          />
        </div>
      </div>
    </div>
  );
}

export default PublicationsFilters;
