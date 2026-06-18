/**
 * Pagination — recreación del bloque `.archive__nav` del sitio viejo de
 * Von Wobeser (mirror Joomla beez3).
 *
 * El look viejo:
 *   - Botones Start / Prev / Next / End en Geomanist uppercase (letter-spacing 5px).
 *   - Números con `border-top` gris claro; el actual / hover usan `border-top`
 *     gris oscuro (#5e5e5e).
 *   - Todo centrado.
 *
 * Es paginación del lado del cliente (los datos ya vienen completos de /api/news),
 * así que en lugar de navegar a URLs `start-N.html` exponemos un callback.
 */

interface PaginationLabels {
  start: string;
  prev: string;
  next: string;
  end: string;
  /** Plantilla "Page {current} of {total}" — usa {current} y {total}. */
  pageOf: string;
}

interface PaginationProps {
  currentPage: number; // 1-based
  totalPages: number;
  onPageChange: (page: number) => void;
  labels: PaginationLabels;
}

/** Calcula los números visibles (ventana deslizante de hasta 10, como el viejo). */
function getPageWindow(current: number, total: number, size = 10): number[] {
  if (total <= size) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  let start = Math.max(1, current - Math.floor(size / 2));
  const end = Math.min(total, start + size - 1);
  start = Math.max(1, end - size + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  labels,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageWindow(currentPage, totalPages);
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  const counter = labels.pageOf
    .replace("{current}", String(currentPage))
    .replace("{total}", String(totalPages));

  const navItemBase =
    "vw-label mx-3 text-[16px] text-vw-gray transition-opacity duration-200";
  const navItemActive = "cursor-pointer hover:opacity-60";
  const navItemDisabled = "cursor-default opacity-40";

  return (
    <nav
      className="flex w-full flex-wrap items-end justify-center pt-4"
      aria-label="Pagination"
      data-testid="archive-pagination"
    >
      <p className="mb-4 w-full text-center text-[14px] text-vw-graylight">
        {counter}
      </p>

      <ul className="flex flex-wrap items-end justify-center">
        {/* Start */}
        <li>
          <button
            type="button"
            disabled={isFirst}
            onClick={() => onPageChange(1)}
            className={`${navItemBase} ${isFirst ? navItemDisabled : navItemActive}`}
            data-testid="button-page-start"
          >
            {labels.start}
          </button>
        </li>
        {/* Prev */}
        <li>
          <button
            type="button"
            disabled={isFirst}
            onClick={() => onPageChange(currentPage - 1)}
            className={`${navItemBase} ${isFirst ? navItemDisabled : navItemActive}`}
            data-testid="button-page-prev"
          >
            {labels.prev}
          </button>
        </li>

        {/* Números */}
        {pages.map((p) => {
          const isCurrent = p === currentPage;
          return (
            <li key={p}>
              <button
                type="button"
                onClick={() => !isCurrent && onPageChange(p)}
                aria-current={isCurrent ? "page" : undefined}
                className={[
                  "geomanist-book mx-[3px] px-[15px] pt-5 text-center text-[16px] transition-colors duration-200",
                  "font-label",
                  isCurrent
                    ? "border-t border-vw-gray text-vw-gray"
                    : "border-t border-vw-graylight text-vw-gray hover:border-vw-gray",
                ].join(" ")}
                data-testid={`button-page-${p}`}
              >
                {p}
              </button>
            </li>
          );
        })}

        {/* Next */}
        <li>
          <button
            type="button"
            disabled={isLast}
            onClick={() => onPageChange(currentPage + 1)}
            className={`${navItemBase} ${isLast ? navItemDisabled : navItemActive}`}
            data-testid="button-page-next"
          >
            {labels.next}
          </button>
        </li>
        {/* End */}
        <li>
          <button
            type="button"
            disabled={isLast}
            onClick={() => onPageChange(totalPages)}
            className={`${navItemBase} ${isLast ? navItemDisabled : navItemActive}`}
            data-testid="button-page-end"
          >
            {labels.end}
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Pagination;
