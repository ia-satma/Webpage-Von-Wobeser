#!/usr/bin/env python3
"""Genera el informe institucional de la auditoría integral de publicaciones."""

from __future__ import annotations

import argparse
import collections
import csv
import html
import json
import os
import shutil
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    Image,
    KeepTogether,
    LongTable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


VWYS_RED = colors.HexColor("#AC162C")
VWYS_DARK = colors.HexColor("#2D2D2F")
TEXT = colors.HexColor("#4A4A4D")
MUTED = colors.HexColor("#727277")
PAPER = colors.HexColor("#F7F6F4")
LINE = colors.HexColor("#D9D7D3")
SOFT_RED = colors.HexColor("#F7E9EC")
SOFT_GREEN = colors.HexColor("#E9F5EE")
SOFT_AMBER = colors.HexColor("#FBF2DF")
WHITE = colors.white
PAGE_SIZE = landscape(A4)
PAGE_WIDTH, PAGE_HEIGHT = PAGE_SIZE
LEFT = RIGHT = 14 * mm
TOP = 18 * mm
BOTTOM = 15 * mm


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--snapshot", required=True)
    parser.add_argument("--dropbox", required=True)
    parser.add_argument("--output", required=True)
    return parser.parse_args()


def register_fonts(root: Path) -> None:
    pdfmetrics.registerFont(TTFont("Gelasio", root / "assets/fonts/Gelasio/Gelasio-Regular.ttf"))
    pdfmetrics.registerFont(TTFont("Gelasio-Medium", root / "assets/fonts/Gelasio/Gelasio-Medium.ttf"))
    pdfmetrics.registerFont(TTFont("Gelasio-Bold", root / "assets/fonts/Gelasio/Gelasio-Bold.ttf"))
    pdfmetrics.registerFont(TTFont("Inter", root / "assets/fonts/Inter/Inter-Regular.ttf"))
    pdfmetrics.registerFont(TTFont("Inter-Bold", root / "assets/fonts/Inter/Inter-Bold.ttf"))
    pdfmetrics.registerFont(TTFont("Inter-Italic", root / "assets/fonts/Inter/Inter-Italic.ttf"))


def esc(value: object) -> str:
    return html.escape(str(value or ""), quote=True)


def short_url(value: str, limit: int = 82) -> str:
    try:
        parsed = urlparse(value)
        text = f"{parsed.netloc}{parsed.path}"
        if parsed.query:
            text += f"?{parsed.query}"
    except ValueError:
        text = value
    if len(text) <= limit:
        return text
    return f"{text[: limit - 1]}…"


def link_markup(label: str, url: str, color: str = "#AC162C") -> str:
    return f'<link href="{esc(url)}" color="{color}">{esc(label)}</link>' if url else esc(label)


def make_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    styles = {
        "cover_kicker": ParagraphStyle(
            "cover_kicker",
            parent=base["Normal"],
            fontName="Inter-Bold",
            fontSize=8.5,
            leading=11,
            textColor=VWYS_RED,
            spaceAfter=7,
            uppercase=True,
            tracking=1.4,
        ),
        "cover_title": ParagraphStyle(
            "cover_title",
            parent=base["Title"],
            fontName="Gelasio-Medium",
            fontSize=30,
            leading=34,
            textColor=VWYS_DARK,
            spaceAfter=11,
        ),
        "cover_subtitle": ParagraphStyle(
            "cover_subtitle",
            parent=base["Normal"],
            fontName="Inter",
            fontSize=11,
            leading=16,
            textColor=MUTED,
            spaceAfter=8,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName="Gelasio-Medium",
            fontSize=22,
            leading=26,
            textColor=VWYS_DARK,
            spaceBefore=3,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName="Gelasio-Medium",
            fontSize=15,
            leading=19,
            textColor=VWYS_DARK,
            spaceBefore=8,
            spaceAfter=6,
        ),
        "h3": ParagraphStyle(
            "h3",
            parent=base["Heading3"],
            fontName="Inter-Bold",
            fontSize=9.5,
            leading=12,
            textColor=VWYS_RED,
            spaceBefore=6,
            spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["BodyText"],
            fontName="Inter",
            fontSize=8.6,
            leading=12.2,
            textColor=TEXT,
            spaceAfter=5,
        ),
        "body_small": ParagraphStyle(
            "body_small",
            parent=base["BodyText"],
            fontName="Inter",
            fontSize=7.2,
            leading=10,
            textColor=TEXT,
            spaceAfter=3,
        ),
        "note": ParagraphStyle(
            "note",
            parent=base["BodyText"],
            fontName="Inter-Italic",
            fontSize=7.2,
            leading=10,
            textColor=MUTED,
            leftIndent=6,
            borderColor=VWYS_RED,
            borderWidth=0,
            borderPadding=4,
            spaceAfter=5,
        ),
        "metric_number": ParagraphStyle(
            "metric_number",
            parent=base["Normal"],
            fontName="Gelasio-Medium",
            fontSize=22,
            leading=24,
            textColor=VWYS_RED,
            alignment=TA_CENTER,
            spaceAfter=3,
        ),
        "metric_label": ParagraphStyle(
            "metric_label",
            parent=base["Normal"],
            fontName="Inter-Bold",
            fontSize=6.8,
            leading=8.8,
            textColor=TEXT,
            alignment=TA_CENTER,
        ),
        "table_header": ParagraphStyle(
            "table_header",
            parent=base["Normal"],
            fontName="Inter-Bold",
            fontSize=6.2,
            leading=7.5,
            textColor=WHITE,
            alignment=TA_LEFT,
        ),
        "cell": ParagraphStyle(
            "cell",
            parent=base["Normal"],
            fontName="Inter",
            fontSize=5.8,
            leading=7.3,
            textColor=TEXT,
            wordWrap="CJK",
        ),
        "cell_bold": ParagraphStyle(
            "cell_bold",
            parent=base["Normal"],
            fontName="Inter-Bold",
            fontSize=5.8,
            leading=7.3,
            textColor=TEXT,
            wordWrap="CJK",
        ),
        "cell_tiny": ParagraphStyle(
            "cell_tiny",
            parent=base["Normal"],
            fontName="Inter",
            fontSize=5.1,
            leading=6.3,
            textColor=TEXT,
            wordWrap="CJK",
        ),
        "toc": ParagraphStyle(
            "toc",
            parent=base["Normal"],
            fontName="Inter",
            fontSize=9,
            leading=14,
            textColor=TEXT,
            leftIndent=4,
            spaceAfter=2,
        ),
    }
    return styles


def p(text: object, style: ParagraphStyle) -> Paragraph:
    return Paragraph(str(text), style)


def section_header(number: str, title: str, styles: dict[str, ParagraphStyle]) -> list:
    return [
        p(f"{esc(number)} · {esc(title)}", styles["cover_kicker"]),
        p(esc(title), styles["h1"]),
        HRFlowable(width="100%", thickness=1.2, color=VWYS_RED, spaceBefore=1, spaceAfter=8),
    ]


def table_style(header=True, small=False) -> TableStyle:
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3 if small else 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3 if small else 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3 if small else 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3 if small else 4),
        ("LINEBELOW", (0, 0), (-1, -1), 0.35, LINE),
    ]
    if header:
        commands.extend(
            [
                ("BACKGROUND", (0, 0), (-1, 0), VWYS_DARK),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("LINEBELOW", (0, 0), (-1, 0), 1.1, VWYS_RED),
            ]
        )
    return TableStyle(commands)


def alternating(table: Table, row_count: int, start: int = 1) -> None:
    commands = []
    for row in range(start, row_count):
        if (row - start) % 2:
            commands.append(("BACKGROUND", (0, row), (-1, row), PAPER))
    table.setStyle(TableStyle(commands))


def metrics_table(metrics: list[tuple[str, str]], styles: dict[str, ParagraphStyle], width: float) -> Table:
    cells = []
    for value, label in metrics:
        cells.append(
            Table(
                [[p(esc(value), styles["metric_number"])], [p(esc(label), styles["metric_label"])]],
                colWidths=[width / len(metrics) - 5],
                style=TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, -1), PAPER),
                        ("BOX", (0, 0), (-1, -1), 0.45, LINE),
                        ("TOPPADDING", (0, 0), (-1, 0), 9),
                        ("BOTTOMPADDING", (0, -1), (-1, -1), 9),
                        ("LEFTPADDING", (0, 0), (-1, -1), 7),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                    ]
                ),
            )
        )
    return Table([cells], colWidths=[width / len(metrics)] * len(metrics), style=TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))


def coverage_bar(value: float, label: str, styles: dict[str, ParagraphStyle], width: float = 210) -> Table:
    drawing = Drawing(width, 12)
    drawing.add(Rect(0, 2, width, 7, fillColor=colors.HexColor("#E7E5E1"), strokeColor=None))
    drawing.add(Rect(0, 2, width * max(0, min(1, value)), 7, fillColor=VWYS_RED, strokeColor=None))
    drawing.add(String(width - 1, 1, f"{value * 100:.1f}%", textAnchor="end", fontName="Inter-Bold", fontSize=6.5, fillColor=TEXT))
    return Table([[p(esc(label), styles["body_small"]), drawing]], colWidths=[215, width], style=TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 4)]))


def header_footer(canvas, doc, logo_path: Path) -> None:
    canvas.saveState()
    canvas.setFillColor(WHITE)
    canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    if doc.page > 1:
        canvas.drawImage(str(logo_path), LEFT, PAGE_HEIGHT - 11.2 * mm, width=44 * mm, height=7.2 * mm, preserveAspectRatio=True, mask="auto")
        canvas.setStrokeColor(VWYS_RED)
        canvas.setLineWidth(0.8)
        canvas.line(LEFT, PAGE_HEIGHT - 13 * mm, PAGE_WIDTH - RIGHT, PAGE_HEIGHT - 13 * mm)
        canvas.setFont("Inter", 6.4)
        canvas.setFillColor(MUTED)
        canvas.drawString(LEFT, 7 * mm, "Auditoría integral de Publicaciones · corte 14-ago-2026")
        canvas.drawRightString(PAGE_WIDTH - RIGHT, 7 * mm, f"Página {doc.page}")
    canvas.restoreState()


def first_page(canvas, doc, logo_path: Path) -> None:
    canvas.saveState()
    canvas.setFillColor(WHITE)
    canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    canvas.setFillColor(VWYS_RED)
    canvas.rect(0, 0, 8 * mm, PAGE_HEIGHT, fill=1, stroke=0)
    canvas.restoreState()


def code_summary(snapshot: dict) -> list[dict]:
    labels = {
        "PROJECT_MISSING": "Faltante en proyecto",
        "PROJECT_DUPLICATE": "Más de un registro del proyecto",
        "CONTENT_ES_MISSING": "Cuerpo ES vacío",
        "CONTENT_EN_MISSING": "Cuerpo EN vacío",
        "CONTENT_DUPLICATED_LANG": "Cuerpo ES/EN idéntico",
        "CONTENT_ES_PROBABLE_EN": "ES probablemente en inglés",
        "CONTENT_EN_PROBABLE_ES": "EN probablemente en español",
        "PROJECT_DATE_MISSING": "Fecha ausente",
        "PROJECT_DATE_INFERRED_DAY": "Día 1 inferido",
        "PROJECT_DATE_DIFF": "Mes/fecha distinta",
        "CATEGORY_DIFF": "Categoría distinta",
        "PDF_ES_MISSING_PROJECT": "Referencia PDF ES no localizada",
        "PDF_EN_MISSING_PROJECT": "Referencia PDF EN no localizada",
        "TITLE_ES_DIFF": "Título ES distinto",
        "TITLE_EN_DIFF": "Título EN distinto",
        "BODY_ES_DIFF": "Baja similitud editorial ES",
        "BODY_EN_DIFF": "Baja similitud editorial EN",
        "OFFICIAL_ES_MISSING": "Fuente oficial sin ES",
        "OFFICIAL_EN_MISSING": "Fuente oficial sin EN",
        "PAIRING_REVIEW": "Emparejamiento ES/EN a revisar",
        "AUTHORS_UNMATCHED": "Correos sin ningún perfil actual",
    }
    rows = []
    for code, label in labels.items():
        canonicals = [canonical for canonical in snapshot["canonicals"] if any(finding["code"] == code for finding in canonical["findings"])]
        occurrences = sum(sum(1 for finding in canonical["findings"] if finding["code"] == code) for canonical in canonicals)
        rows.append({"code": code, "label": label, "canonicals": len(canonicals), "occurrences": occurrences})
    return rows


def domain_summary(links: list[dict], classification: str) -> list[tuple[str, int]]:
    counter = collections.Counter()
    for link in links:
        if link["classification"] != classification:
            continue
        try:
            counter[urlparse(link["url"]).hostname or "sin-dominio"] += 1
        except ValueError:
            counter["URL inválida"] += 1
    return counter.most_common()


def build_story(root: Path, snapshot: dict, dropbox: dict, styles: dict[str, ParagraphStyle], output_path: Path) -> list:
    story = []
    summary = snapshot["summary"]
    counts = summary["counts"]
    quality = summary["projectQuality"]
    generated_local = datetime.fromisoformat(summary["generatedAt"].replace("Z", "+00:00")).astimezone(ZoneInfo("America/Monterrey"))
    body_width = PAGE_WIDTH - LEFT - RIGHT
    logo_path = root / "frontend-mirror/images/vonwobeser_2025_.png"

    story.extend(
        [
            Spacer(1, 19 * mm),
            Image(str(logo_path), width=59 * mm, height=9 * mm, mask="auto"),
            Spacer(1, 25 * mm),
            p("AUDITORÍA INTEGRAL · PUBLICACIONES", styles["cover_kicker"]),
            p("Reconciliación del archivo editorial, bilingüe y de enlaces", styles["cover_title"]),
            p(
                "Comparación completa entre el sitio oficial de Von Wobeser y Sierra, el CMS/proyecto publicado y las notas 2026 compartidas en Dropbox.",
                styles["cover_subtitle"],
            ),
            Spacer(1, 10 * mm),
            HRFlowable(width="100%", thickness=2, color=VWYS_RED, spaceAfter=8),
            Table(
                [
                    [p("FECHA DE CORTE", styles["table_header"]), p("ALCANCE", styles["table_header"]), p("CARÁCTER", styles["table_header"])],
                    [
                        p("14 de agosto de 2026", styles["body"]),
                        p("Noticias y artículos · español e inglés · historial completo", styles["body"]),
                        p("Solo lectura · no modifica producción", styles["body"]),
                    ],
                ],
                colWidths=[body_width * 0.2, body_width * 0.48, body_width * 0.32],
                style=table_style(),
            ),
            Spacer(1, 17 * mm),
            p(
                f"Extracción finalizada el {generated_local.strftime('%d/%m/%Y a las %H:%M')} (America/Monterrey). Evidencia reproducible con hashes y archivos CSV/JSON.",
                styles["note"],
            ),
            PageBreak(),
        ]
    )

    story.extend(section_header("00", "Índice y lectura del informe", styles))
    toc_items = [
        "01 · Resumen ejecutivo",
        "02 · Metodología y cobertura",
        "03 · Comparación oficial vs. proyecto",
        "04 · Publicaciones faltantes",
        "05 · Estado bilingüe ES/EN",
        "06 · Contenido, fechas, categorías, PDFs y autores",
        "07 · Duplicados y registros exclusivos del proyecto",
        "08 · Auditoría de enlaces",
        "09 · Reconciliación de las 41 notas 2026 de Dropbox",
        "10 · Prioridades de corrección",
        "Apéndice A · Matriz completa de 928 publicaciones canónicas",
        "Apéndice B · Inventario de 41 notas 2026",
        "Apéndice C · Enlaces confirmados como rotos o incompatibles",
        "Apéndice D · Leyenda de códigos",
    ]
    story.extend([p(item, styles["toc"]) for item in toc_items])
    story.append(Spacer(1, 6 * mm))
    story.append(
        p(
            "Cómo leer las cifras. Los 1,816 registros oficiales son páginas localizadas por idioma. Al emparejar español e inglés resultan 928 publicaciones canónicas. Los hallazgos de similitud editorial son señales de revisión, no una declaración automática de contenido incorrecto. Los estados “bloqueado” e “inaccesible” tampoco se contabilizan como enlaces rotos.",
            styles["body"],
        )
    )
    story.append(PageBreak())

    story.extend(section_header("01", "Resumen ejecutivo", styles))
    story.append(
        metrics_table(
            [
                (f"{counts['officialLocalizedEntries']:,}", "PÁGINAS OFICIALES ES/EN"),
                (f"{counts['officialCanonicalEntries']:,}", "PUBLICACIONES CANÓNICAS"),
                (f"{counts['projectRows']:,}", "REGISTROS EN EL PROYECTO"),
                (f"{counts['missingInProject']}", "OFICIALES NO LOCALIZADAS"),
            ],
            styles,
            body_width,
        )
    )
    story.append(Spacer(1, 6 * mm))
    story.extend(
        [
            coverage_bar((counts["officialCanonicalEntries"] - counts["missingInProject"]) / counts["officialCanonicalEntries"], "Cobertura canónica oficial localizada en el proyecto", styles),
            coverage_bar(counts["projectMatchedRows"] / counts["projectRows"], "Registros del proyecto reconciliados con una ficha oficial", styles),
            coverage_bar((counts["officialCanonicalEntries"] - counts["officialUnpaired"]) / counts["officialCanonicalEntries"], "Publicaciones oficiales con ambos idiomas emparejados", styles),
            coverage_bar((summary["linkClassificationCounts"].get("correcto", 0) + summary["linkClassificationCounts"].get("redireccion-valida", 0)) / counts["linkTargets"], "Destinos correctos o con redirección válida", styles),
        ]
    )
    story.append(Spacer(1, 4 * mm))
    executive_rows = [
        [p("Conclusión", styles["table_header"]), p("Resultado verificable", styles["table_header"]), p("Lectura", styles["table_header"])],
        [p("Cobertura histórica", styles["cell_bold"]), p("925 de 928 publicaciones canónicas oficiales tienen coincidencia en el proyecto.", styles["cell"]), p("La cobertura es alta; faltan tres fichas históricas ES.", styles["cell"])],
        [p("Modelo de datos heredado", styles["cell_bold"]), p("817 publicaciones canónicas coinciden con más de un registro; 816 grupos tienen dos registros y uno tiene tres.", styles["cell"]), p("El importador histórico conserva idiomas como filas separadas. No equivale a 817 títulos distintos.", styles["cell"])],
        [p("Integridad editorial", styles["cell_bold"]), p(f"{quality['missingDate']} filas sin fecha, {quality['inferredDayOne']} con día 1 inferido, {quality['missingContentEs']} sin cuerpo ES y {quality['missingContentEn']} sin cuerpo EN.", styles["cell"]), p("Debe corregirse por lotes y con snapshot, conservando URLs y relaciones.", styles["cell"])],
        [p("Enlaces", styles["cell_bold"]), p(f"{counts['brokenLinks']} destinos dieron 404/410 en tres comprobaciones; {counts['invalidContentLinks']} enlaces rotulados como PDF entregan otro tipo de contenido.", styles["cell"]), p("De los rotos, 35 pertenecen al oficial y 8 son PDFs expuestos por el proyecto.", styles["cell"])],
        [p("Notas 2026", styles["cell_bold"]), p("30 de 41 temas de Dropbox ya están representados como 60 filas; 11 temas posteriores al 17 de junio están pendientes.", styles["cell"]), p("La incorporación debe hacerse después de esta auditoría para evitar duplicados.", styles["cell"])],
    ]
    executive_table = Table(executive_rows, colWidths=[118, 330, body_width - 448], repeatRows=1)
    executive_table.setStyle(table_style(small=True))
    alternating(executive_table, len(executive_rows))
    story.append(executive_table)
    story.append(
        p(
            "Advertencia de interpretación: el criterio estricto marca una publicación si existe cualquier diferencia de contenido, fecha, PDF, idioma o duplicación. Por ello 928/928 contienen al menos una señal; esto no significa que las 928 páginas estén rotas.",
            styles["note"],
        )
    )
    story.append(PageBreak())

    story.extend(section_header("02", "Metodología y cobertura", styles))
    methodology = [
        ("1", "Cobertura de listados", "Se recorrieron las 77 páginas de Noticias ES, 77 de Noticias EN, 15 de Artículos ES y 15 de Artículos EN, respetando la paginación oficial."),
        ("2", "Extracción de fichas", "Se capturaron título, fecha y precisión, introducción, cuerpo, p_id, canonical, hreflang, selector de idioma, PDFs, imágenes, enlaces y correos asociados."),
        ("3", "Canonización ES/EN", "Se priorizó el enlace recíproco del selector oficial. Solo se usó el nombre de PDF como respaldo cuando existió una única coincidencia compatible por tipo y mes; estos casos permanecen marcados para revisión."),
        ("4", "Reconciliación con CMS", "Se compararon legacyId/p_id, títulos normalizados, PDF y fecha. Cada fila del proyecto se asignó una sola vez a la mejor coincidencia verificable."),
        ("5", "Enlaces", "Se comprobaron 9,865 destinos. Los fallos se repitieron tres veces con petición GET de rango, redirecciones activas y 20 segundos de espera por ronda."),
        ("6", "Notas 2026", "Se inventarió el ZIP público de Dropbox: carpetas, fechas, 81 PDFs, 83 DOCX, firma PDF, correos y coincidencia de contenido contra el proyecto."),
    ]
    method_rows = [[p("Paso", styles["table_header"]), p("Proceso", styles["table_header"]), p("Criterio", styles["table_header"])]]
    method_rows.extend([[p(number, styles["cell_bold"]), p(esc(name), styles["cell_bold"]), p(esc(description), styles["cell"])] for number, name, description in methodology])
    method_table = Table(method_rows, colWidths=[38, 150, body_width - 188], repeatRows=1)
    method_table.setStyle(table_style())
    alternating(method_table, len(method_rows))
    story.append(method_table)
    story.append(Spacer(1, 5 * mm))
    source_rows = [[p("Colección", styles["table_header"]), p("Idioma", styles["table_header"]), p("Páginas de listado", styles["table_header"]), p("Fichas", styles["table_header"]), p("Fuente", styles["table_header"])]]
    source_urls = {
        "es-news": "https://www.vonwobeser.com/index.php/publicaciones/noticias",
        "en-news": "https://www.vonwobeser.com/index.php/publications/news",
        "es-articles": "https://www.vonwobeser.com/index.php/publicaciones/articulos",
        "en-articles": "https://www.vonwobeser.com/index.php/publications/articles",
    }
    source_names = {"es-news": "Noticias", "en-news": "News", "es-articles": "Artículos", "en-articles": "Articles"}
    for collection in summary["collections"]:
        key = collection["key"]
        source_rows.append(
            [
                p(esc(source_names[key]), styles["cell_bold"]),
                p("ES" if key.startswith("es") else "EN", styles["cell"]),
                p(str(collection["pages"]), styles["cell"]),
                p(f"{collection['items']:,}", styles["cell"]),
                p(link_markup(short_url(source_urls[key], 62), source_urls[key]), styles["cell"]),
            ]
        )
    source_table = Table(source_rows, colWidths=[85, 40, 80, 55, body_width - 260], repeatRows=1)
    source_table.setStyle(table_style())
    alternating(source_table, len(source_rows))
    story.append(source_table)
    story.append(
        p(
            "Limitaciones controladas: algunos sitios externos impiden automatización (403/429) o no resolvieron DNS/TLS. Se conservaron como “bloqueado” o “inaccesible”, nunca como “roto”. El análisis de autores distingue correos detectados en el contenido de una atribución editorial confirmada.",
            styles["note"],
        )
    )
    story.append(PageBreak())

    story.extend(section_header("03", "Comparación general: sitio oficial vs. proyecto", styles))
    comparison_rows = [
        [p("Indicador", styles["table_header"]), p("Sitio oficial", styles["table_header"]), p("Proyecto", styles["table_header"]), p("Resultado", styles["table_header"])],
        [p("Entradas localizadas", styles["cell_bold"]), p("1,816 páginas localizadas (907 ES, 909 EN)", styles["cell"]), p("1,792 registros publicados", styles["cell"]), p("Las unidades no son equivalentes: el oficial está contado por idioma.", styles["cell"])],
        [p("Publicaciones canónicas", styles["cell_bold"]), p("928 después de emparejar ES/EN", styles["cell"]), p("925 grupos con coincidencia", styles["cell"]), p("3 faltantes oficiales; cobertura 99.7%.", styles["cell"])],
        [p("Idiomas", styles["cell_bold"]), p("885 con ambos idiomas; 43 unilaterales", styles["cell"]), p("Muchos idiomas se almacenan como filas separadas", styles["cell"]), p("817 grupos con multiplicidad; requiere consolidación posterior.", styles["cell"])],
        [p("Registros exclusivos", styles["cell_bold"]), p("-", styles["cell"]), p("49 filas no asignadas a una ficha oficial", styles["cell"]), p("Incluyen contenido propio/nuevo y casos para revisión; no se recomienda borrar automáticamente.", styles["cell"])],
        [p("Detalle público", styles["cell_bold"]), p("1,813 URLs únicas respondieron correctamente", styles["cell"]), p("3,486 vistas localizadas y 1,743 APIs de autores respondieron correctamente", styles["cell"]), p("No se detectó 404/5xx en fichas públicas emparejadas.", styles["cell"])],
    ]
    comparison_table = Table(comparison_rows, colWidths=[120, 190, 190, body_width - 500], repeatRows=1)
    comparison_table.setStyle(table_style())
    alternating(comparison_table, len(comparison_rows))
    story.append(comparison_table)
    story.append(Spacer(1, 5 * mm))
    story.append(p("Calidad de los 1,792 registros del proyecto", styles["h2"]))
    quality_metrics = [
        (f"{quality['missingDate']}", "SIN FECHA"),
        (f"{quality['inferredDayOne']}", "DÍA 1 INFERIDO"),
        (f"{quality['missingContentEs']}", "SIN CUERPO ES"),
        (f"{quality['missingContentEn']}", "SIN CUERPO EN"),
        (f"{quality['identicalTitleLanguages']}", "TÍTULOS ES/EN IDÉNTICOS"),
        (f"{quality['identicalBodyLanguages']}", "CUERPOS ES/EN IDÉNTICOS"),
    ]
    story.append(metrics_table(quality_metrics, styles, body_width))
    story.append(p("Los títulos idénticos pueden ser válidos (nombres propios, rankings o títulos originalmente iguales); se clasifican como revisión, no como error automático.", styles["note"]))
    story.append(PageBreak())

    story.extend(section_header("04", "Publicaciones oficiales faltantes en el proyecto", styles))
    missing = [canonical for canonical in snapshot["canonicals"] if any(finding["code"] == "PROJECT_MISSING" for finding in canonical["findings"])]
    story.append(p("Se confirmaron tres fichas oficiales en español sin coincidencia por p_id, título, PDF o fecha dentro de los 1,792 registros del proyecto. Ninguna ofrece versión inglesa enlazada en la fuente oficial.", styles["body"]))
    missing_rows = [[p("Fecha", styles["table_header"]), p("Título oficial", styles["table_header"]), p("p_id", styles["table_header"]), p("Idioma", styles["table_header"]), p("Enlace oficial", styles["table_header"]), p("Prioridad", styles["table_header"])]]
    for canonical in missing:
        item = canonical.get("es") or canonical.get("en")
        missing_rows.append(
            [
                p(esc(item["date"]["normalized"]), styles["cell"]),
                p(esc(item["title"]), styles["cell_bold"]),
                p(esc(item["pid"]), styles["cell"]),
                p(item["language"].upper(), styles["cell"]),
                p(link_markup(short_url(item["detailUrl"], 65), item["detailUrl"]), styles["cell"]),
                p("Alta", styles["cell_bold"]),
            ]
        )
    missing_table = Table(missing_rows, colWidths=[55, 275, 42, 42, body_width - 464, 50], repeatRows=1)
    missing_table.setStyle(table_style())
    alternating(missing_table, len(missing_rows))
    story.append(missing_table)
    story.append(Spacer(1, 5 * mm))
    story.append(p("Acción recomendada", styles["h2"]))
    story.append(p("Crear un solo registro por publicación, conservar el p_id como alias histórico, mantener el mes como precisión conocida y dejar inglés vacío/indisponible hasta contar con traducción editorial aprobada. No inventar una versión inglesa.", styles["body"]))
    story.append(PageBreak())

    story.extend(section_header("05", "Estado bilingüe ES/EN", styles))
    unpaired = [canonical for canonical in snapshot["canonicals"] if not canonical.get("es") or not canonical.get("en")]
    pairing_review = [canonical for canonical in snapshot["canonicals"] if canonical.get("pairingReview")]
    story.append(
        metrics_table(
            [
                (str(counts["officialCanonicalEntries"] - counts["officialUnpaired"]), "CON AMBOS IDIOMAS"),
                (str(sum(1 for canonical in unpaired if not canonical.get("es"))), "SIN ES OFICIAL"),
                (str(sum(1 for canonical in unpaired if not canonical.get("en"))), "SIN EN OFICIAL"),
                (str(counts["officialPairingReview"]), "EMPAREJAMIENTOS A REVISAR"),
            ],
            styles,
            body_width,
        )
    )
    story.append(Spacer(1, 5 * mm))
    story.append(p("Publicaciones oficiales sin pareja lingüística", styles["h2"]))
    unpaired_rows = [[p("Fecha", styles["table_header"]), p("Tipo", styles["table_header"]), p("Idioma disponible", styles["table_header"]), p("Título", styles["table_header"]), p("p_id", styles["table_header"]), p("URL", styles["table_header"])]]
    for canonical in sorted(unpaired, key=lambda item: ((item.get("es") or item.get("en"))["date"]["normalized"], (item.get("es") or item.get("en"))["title"]), reverse=True):
        item = canonical.get("es") or canonical.get("en")
        unpaired_rows.append(
            [
                p(esc(item["date"]["normalized"]), styles["cell"]),
                p("Artículo" if canonical["type"] == "articles" else "Noticia", styles["cell"]),
                p(item["language"].upper(), styles["cell_bold"]),
                p(esc(item["title"]), styles["cell"]),
                p(esc(item["pid"]), styles["cell"]),
                p(link_markup(short_url(item["detailUrl"], 48), item["detailUrl"]), styles["cell_tiny"]),
            ]
        )
    unpaired_table = LongTable(unpaired_rows, colWidths=[48, 48, 65, 310, 38, body_width - 509], repeatRows=1)
    unpaired_table.setStyle(table_style(small=True))
    alternating(unpaired_table, len(unpaired_rows))
    story.append(unpaired_table)
    story.append(PageBreak())
    story.append(p("Emparejamientos que requieren revisión humana", styles["h2"]))
    story.append(p("Treinta casos tienen títulos ES/EN compatibles, pero la relación se sostuvo por PDF o por un enlace de idioma no recíproco. Un caso permanece como artículo ES sin pareja. Se conservaron marcados; no se fusionaron por similitud incierta.", styles["body"]))
    review_rows = [[p("Fecha", styles["table_header"]), p("Método", styles["table_header"]), p("Título ES", styles["table_header"]), p("Título EN", styles["table_header"]), p("Revisión", styles["table_header"])]]
    for canonical in pairing_review:
        item = canonical.get("es") or canonical.get("en")
        review_rows.append(
            [
                p(esc(item["date"]["normalized"]), styles["cell"]),
                p(esc(canonical["pairing"]), styles["cell"]),
                p(esc(canonical.get("es", {}).get("title", "-") if canonical.get("es") else "-"), styles["cell"]),
                p(esc(canonical.get("en", {}).get("title", "-") if canonical.get("en") else "-"), styles["cell"]),
                p("Confirmar selector/archivo", styles["cell"]),
            ]
        )
    review_table = LongTable(review_rows, colWidths=[48, 70, 280, 280, body_width - 678], repeatRows=1)
    review_table.setStyle(table_style(small=True))
    alternating(review_table, len(review_rows))
    story.append(review_table)
    story.append(PageBreak())

    story.extend(section_header("06", "Contenido, fechas, categorías, PDFs y autores", styles))
    code_rows = [[p("Código", styles["table_header"]), p("Hallazgo", styles["table_header"]), p("Publicaciones canónicas", styles["table_header"]), p("Ocurrencias en filas", styles["table_header"]), p("Tratamiento", styles["table_header"])]]
    treatment = {
        "PROJECT_MISSING": "Alta · incorporar",
        "PROJECT_DUPLICATE": "Alta · consolidar",
        "CONTENT_ES_MISSING": "Alta · restaurar",
        "CONTENT_EN_MISSING": "Alta · restaurar",
        "CONTENT_DUPLICATED_LANG": "Alta · validar idioma",
        "CONTENT_ES_PROBABLE_EN": "Alta · validar idioma",
        "CONTENT_EN_PROBABLE_ES": "Alta · validar idioma",
        "PROJECT_DATE_MISSING": "Media · recuperar precisión",
        "PROJECT_DATE_INFERRED_DAY": "Editorial · marcar mes",
        "PROJECT_DATE_DIFF": "Media · corregir",
        "CATEGORY_DIFF": "Media · normalizar",
        "PDF_ES_MISSING_PROJECT": "Media · relacionar asset",
        "PDF_EN_MISSING_PROJECT": "Media · relacionar asset",
        "TITLE_ES_DIFF": "Editorial · comparar",
        "TITLE_EN_DIFF": "Editorial · comparar",
        "BODY_ES_DIFF": "Editorial · comparar",
        "BODY_EN_DIFF": "Editorial · comparar",
        "OFFICIAL_ES_MISSING": "No inventar traducción",
        "OFFICIAL_EN_MISSING": "No inventar traducción",
        "PAIRING_REVIEW": "Manual · confirmar",
        "AUTHORS_UNMATCHED": "Media · revisar créditos",
    }
    for row in code_summary(snapshot):
        code_rows.append(
            [
                p(esc(row["code"]), styles["cell_tiny"]),
                p(esc(row["label"]), styles["cell"]),
                p(str(row["canonicals"]), styles["cell_bold"]),
                p(str(row["occurrences"]), styles["cell"]),
                p(esc(treatment[row["code"]]), styles["cell"]),
            ]
        )
    code_table = LongTable(code_rows, colWidths=[128, 210, 85, 80, body_width - 503], repeatRows=1)
    code_table.setStyle(table_style(small=True))
    alternating(code_table, len(code_rows))
    story.append(code_table)
    story.append(Spacer(1, 5 * mm))
    story.append(p("Autores y relaciones con abogados", styles["h2"]))
    author_refs = [author for canonical in snapshot["canonicals"] for author in canonical.get("authorAudit", [])]
    exact_refs = sum(author.get("method") == "email-local-part" for author in author_refs)
    alias_refs = sum(author.get("method") == "explicit-alias" for author in author_refs)
    unmatched_refs = sum(author.get("method") == "unmatched" for author in author_refs)
    story.append(p(f"Se detectaron {len(author_refs):,} referencias de correo en 427 publicaciones oficiales: {exact_refs:,} resolvieron por correo/local-part, {alias_refs:,} mediante alias explícito y {unmatched_refs:,} no resolvieron a un perfil actual. Treinta publicaciones con correos no tienen ningún perfil actual resuelto.", styles["body"]))
    story.append(p("Los correos sin perfil incluyen contactos externos, dependencias públicas y colaboradores históricos; no deben convertirse automáticamente en abogados del CMS. La relación debe aprobarse por publicación.", styles["note"]))
    story.append(PageBreak())

    story.extend(section_header("07", "Duplicados y registros exclusivos del proyecto", styles))
    duplicate_distribution = collections.Counter(len(canonical.get("projectMatches", [])) for canonical in snapshot["canonicals"] if len(canonical.get("projectMatches", [])) > 1)
    duplicate_rows = [
        [p("Coincidencias por publicación", styles["table_header"]), p("Grupos canónicos", styles["table_header"]), p("Interpretación", styles["table_header"])],
        [p("2 filas", styles["cell_bold"]), p(str(duplicate_distribution.get(2, 0)), styles["cell"]), p("Patrón dominante: español e inglés guardados como registros separados.", styles["cell"])],
        [p("3 filas", styles["cell_bold"]), p(str(duplicate_distribution.get(3, 0)), styles["cell"]), p("Un grupo requiere revisión por multiplicidad adicional.", styles["cell"])],
    ]
    duplicate_table = Table(duplicate_rows, colWidths=[170, 110, body_width - 280], repeatRows=1)
    duplicate_table.setStyle(table_style())
    alternating(duplicate_table, len(duplicate_rows))
    story.append(duplicate_table)
    story.append(Spacer(1, 5 * mm))
    story.append(p("La matriz completa del Apéndice A identifica cada grupo duplicado mediante la columna “Proj.” y el código PROJECT_DUPLICATE. La futura consolidación debe preservar el slug principal, los p_id ES/EN como aliases, PDFs y relaciones de autores; no debe borrar filas por coincidencia de título sin una migración transaccional.", styles["body"]))
    story.append(p("Registros del proyecto sin ficha oficial asignada", styles["h2"]))
    unmatched = snapshot["unmatchedProjectRows"]
    unmatched_rows = [[p("Fecha", styles["table_header"]), p("Categoría", styles["table_header"]), p("Título ES", styles["table_header"]), p("Slug", styles["table_header"]), p("Estado", styles["table_header"])]]
    for row in sorted(unmatched, key=lambda item: str(item.get("date") or ""), reverse=True):
        unmatched_rows.append(
            [
                p(esc(str(row.get("date") or "")[:10] or "-"), styles["cell"]),
                p(esc(row.get("category") or "-"), styles["cell"]),
                p(esc(row.get("titleEs") or row.get("title") or "-"), styles["cell"]),
                p(esc(row.get("slug") or "-"), styles["cell_tiny"]),
                p("Revisar; no borrar", styles["cell"]),
            ]
        )
    unmatched_table = LongTable(unmatched_rows, colWidths=[55, 120, 310, 220, body_width - 705], repeatRows=1)
    unmatched_table.setStyle(table_style(small=True))
    alternating(unmatched_table, len(unmatched_rows))
    story.append(unmatched_table)
    story.append(PageBreak())

    story.extend(section_header("08", "Auditoría de enlaces", styles))
    link_counts = summary["linkClassificationCounts"]
    link_rows = [[p("Clasificación", styles["table_header"]), p("Destinos", styles["table_header"]), p("Criterio", styles["table_header"]), p("Conclusión", styles["table_header"])]]
    link_definitions = [
        ("Correcto", link_counts.get("correcto", 0), "2xx y contenido compatible", "Sin acción"),
        ("Redirección válida", link_counts.get("redireccion-valida", 0), "Destino final 2xx", "Conservar o normalizar"),
        ("Roto", link_counts.get("roto", 0), "404/410 en tres comprobaciones", "Corregir o retirar"),
        ("Contenido incompatible", link_counts.get("contenido-invalido", 0), "Enlace rotulado PDF entrega HTML/JPEG", "Corregir etiqueta o archivo"),
        ("Bloqueado", link_counts.get("bloqueado", 0), "401/403/429", "Verificación humana; no declarar roto"),
        ("Inaccesible", link_counts.get("inaccesible", 0), "Timeout, DNS o TLS", "Revisar fuera de automatización"),
        ("Error", link_counts.get("error", 0), "5xx", "Reintentar y escalar"),
    ]
    for label, count, criterion, conclusion in link_definitions:
        link_rows.append([p(label, styles["cell_bold"]), p(f"{count:,}", styles["cell"]), p(criterion, styles["cell"]), p(conclusion, styles["cell"])])
    link_table = Table(link_rows, colWidths=[130, 75, 285, body_width - 490], repeatRows=1)
    link_table.setStyle(table_style())
    alternating(link_table, len(link_rows))
    story.append(link_table)
    story.append(Spacer(1, 5 * mm))
    broken_official = [link for link in snapshot["links"] if link["classification"] == "roto" and link["source"] == "oficial"]
    broken_project = [link for link in snapshot["links"] if link["classification"] == "roto" and link["source"] == "proyecto"]
    story.append(p(f"Se confirmaron {len(broken_official)} destinos rotos en el contenido oficial (18 PDFs y 17 enlaces de contenido) y {len(broken_project)} PDFs rotos expuestos por el proyecto. No hubo errores 5xx. Las fichas de detalle emparejadas y APIs de autores respondieron correctamente.", styles["body"]))
    story.append(p("Dominios con destinos inaccesibles después de tres rondas", styles["h2"]))
    domain_rows = [[p("Dominio", styles["table_header"]), p("Destinos", styles["table_header"]), p("Lectura", styles["table_header"])]]
    for domain, count in domain_summary(snapshot["links"], "inaccesible"):
        domain_rows.append([p(esc(domain), styles["cell"]), p(str(count), styles["cell_bold"]), p("No se clasificó como roto; requiere comprobación manual o corrección de URL si el dominio es inválido.", styles["cell"])])
    domain_table = LongTable(domain_rows, colWidths=[270, 70, body_width - 340], repeatRows=1)
    domain_table.setStyle(table_style(small=True))
    alternating(domain_table, len(domain_rows))
    story.append(domain_table)
    story.append(PageBreak())

    story.extend(section_header("09", "Reconciliación de las 41 notas 2026 de Dropbox", styles))
    db = dropbox["summary"]
    resolved_email_count = len({match["email"] for topic in dropbox["topics"] for match in topic["authorMatches"] if match["profileId"]})
    story.append(
        metrics_table(
            [
                (str(db["topicCount"]), "TEMAS"),
                (f"{db['validPdfCount']}/{db['pdfCount']}", "PDFS CON FIRMA VÁLIDA"),
                (str(db["docxCount"]), "ARCHIVOS DOCX"),
                (str(db["representedTopicCount"]), "TEMAS YA REPRESENTADOS"),
                (str(db["missingTopicCount"]), "TEMAS PENDIENTES"),
            ],
            styles,
            body_width,
        )
    )
    story.append(Spacer(1, 5 * mm))
    story.append(p(f"La carpeta agrupa 41 temas. Treinta están presentes tanto en el sitio oficial como en el proyecto, como 60 filas - dos por tema. Los once temas posteriores al 17 de junio aún no aparecen en el listado oficial rastreado ni en el proyecto.", styles["body"]))
    story.append(p(f"Se detectaron {db['uniqueAuthorEmailCount']} correos únicos en los DOCX: {resolved_email_count} resuelven a {db['matchedProfileCount']} perfiles actuales distintos. Permanecen sin perfil Ana Diener (adiener@vwys.com.mx) y Mauricio Puebla (mpuebla@vwys.com.mx). Seis carpetas no contienen correos de autor extraíbles y requieren revisión del arte/PDF antes de asignar créditos.", styles["body"]))
    story.append(p("Excepción bilingüe de archivos: la carpeta del 14 de abril contiene un solo PDF; las otras 40 contienen dos. Debe confirmarse cuál idioma carece de PDF antes de publicar.", styles["note"]))
    story.append(p("Once temas pendientes de incorporación", styles["h2"]))
    pending_topics = [topic for topic in dropbox["topics"] if topic["status"] == "missing"]
    pending_rows = [[p("Fecha", styles["table_header"]), p("Título", styles["table_header"]), p("PDF", styles["table_header"]), p("Correos detectados", styles["table_header"]), p("Estado", styles["table_header"])]]
    for topic in pending_topics:
        pending_rows.append(
            [
                p(esc(topic["date"]), styles["cell"]),
                p(esc(topic["title"]), styles["cell_bold"]),
                p(f"{topic['validPdfCount']}/{topic['pdfCount']}", styles["cell"]),
                p(esc("; ".join(topic["emails"]) or "Sin correo extraíble"), styles["cell_tiny"]),
                p("Pendiente", styles["cell_bold"]),
            ]
        )
    pending_table = LongTable(pending_rows, colWidths=[62, 340, 48, 260, body_width - 710], repeatRows=1)
    pending_table.setStyle(table_style(small=True))
    alternating(pending_table, len(pending_rows))
    story.append(pending_table)
    story.append(p("La incorporación recomendada es una sola publicación bilingüe por tema, con fecha real, PDFs ES/EN, créditos resueltos contra TeamMember y publicación explícita. No debe ejecutarse antes de aprobar el inventario final.", styles["body"]))
    story.append(PageBreak())

    story.extend(section_header("10", "Prioridades de corrección", styles))
    priority_rows = [
        [p("Prioridad", styles["table_header"]), p("Alcance", styles["table_header"]), p("Acción recomendada", styles["table_header"]), p("Condición de cierre", styles["table_header"])],
        [p("Crítica · 0", styles["cell_bold"]), p("No se detectaron fichas emparejadas con 5xx ni una caída general del archivo.", styles["cell"]), p("Mantener monitoreo.", styles["cell"]), p("Sin errores 5xx públicos.", styles["cell"])],
        [p("Alta", styles["cell_bold"]), p("3 oficiales faltantes; 11 notas Dropbox pendientes; 817 grupos múltiples; cuerpos ausentes/idioma incorrecto; 8 PDFs rotos del proyecto.", styles["cell"]), p("Migración transaccional aditiva, consolidación por p_id, carga de archivos y validación editorial por lote.", styles["cell"]), p("Cada publicación queda única, bilingüe cuando exista y con enlaces válidos.", styles["cell"])],
        [p("Media", styles["cell_bold"]), p("Fechas ausentes/día inferido, 43 fuentes unilaterales, categorías, referencias PDF y autores sin relación actual.", styles["cell"]), p("Recuperar precisión, normalizar catálogos y confirmar créditos sin inventarlos.", styles["cell"]), p("Metadatos verificables y trazabilidad conservada.", styles["cell"])],
        [p("Editorial", styles["cell_bold"]), p("Diferencias de título/cuerpo y textos iguales entre idiomas que pueden ser legítimos.", styles["cell"]), p("Comparación humana contra fuente y aprobación del responsable editorial.", styles["cell"]), p("Snapshot aprobado; sin falsos cambios por normalización.", styles["cell"])],
    ]
    priority_table = Table(priority_rows, colWidths=[100, 245, 255, body_width - 600], repeatRows=1)
    priority_table.setStyle(table_style())
    alternating(priority_table, len(priority_rows))
    story.append(priority_table)
    story.append(Spacer(1, 5 * mm))
    story.append(p("Orden propuesto", styles["h2"]))
    order = [
        "1. Aprobar este inventario y resolver los 31 emparejamientos marcados.",
        "2. Incorporar las 11 notas 2026 pendientes, empezando por las dos del 14 de agosto.",
        "3. Restaurar los 8 PDFs rotos del proyecto y corregir los 3 enlaces PDF incompatibles del oficial si el cliente controla su contenido.",
        "4. Crear las 3 publicaciones históricas oficiales faltantes.",
        "5. Consolidar duplicados en lotes reversibles, preservando slugs, p_id, relaciones y aliases.",
        "6. Normalizar fechas/categorías y cerrar diferencias editoriales con revisión humana.",
    ]
    story.extend([p(esc(item), styles["body"]) for item in order])
    story.append(p("Esta auditoría no ejecutó migraciones, no editó el CMS y no publicó contenido. La fase de reconciliación requiere autorización expresa.", styles["note"]))
    story.append(PageBreak())

    story.extend(section_header("A", "Apéndice A · Matriz completa de publicaciones canónicas", styles))
    story.append(p("Una fila por publicación canónica. “Proj.” indica el número de filas del proyecto asociadas. Los códigos completos se explican en el Apéndice D; el CSV conserva URLs, PDFs, IDs y mensajes completos.", styles["body_small"]))
    matrix_rows = [[p("#", styles["table_header"]), p("Fecha", styles["table_header"]), p("Tipo", styles["table_header"]), p("Título ES", styles["table_header"]), p("Título EN", styles["table_header"]), p("Proj.", styles["table_header"]), p("Prioridad", styles["table_header"]), p("Códigos", styles["table_header"])]]
    sorted_canonicals = sorted(snapshot["canonicals"], key=lambda canonical: ((canonical.get("es") or canonical.get("en"))["date"]["normalized"], (canonical.get("es") or canonical.get("en"))["title"]), reverse=True)
    for index, canonical in enumerate(sorted_canonicals, start=1):
        item = canonical.get("es") or canonical.get("en")
        es_title = canonical["es"]["title"] if canonical.get("es") else "-"
        en_title = canonical["en"]["title"] if canonical.get("en") else "-"
        es_url = canonical["es"]["detailUrl"] if canonical.get("es") else ""
        en_url = canonical["en"]["detailUrl"] if canonical.get("en") else ""
        codes = sorted({finding["code"] for finding in canonical["findings"]})
        matrix_rows.append(
            [
                p(str(index), styles["cell_tiny"]),
                p(esc(item["date"]["normalized"] or "-"), styles["cell_tiny"]),
                p("Art." if canonical["type"] == "articles" else "Not.", styles["cell_tiny"]),
                p(link_markup(es_title, es_url, "#4A4A4D"), styles["cell_tiny"]),
                p(link_markup(en_title, en_url, "#4A4A4D"), styles["cell_tiny"]),
                p(str(len(canonical.get("projectMatches", []))), styles["cell_tiny"]),
                p(esc(canonical["severity"]), styles["cell_tiny"]),
                p(esc(" · ".join(codes)), styles["cell_tiny"]),
            ]
        )
    matrix_table = LongTable(matrix_rows, colWidths=[22, 44, 34, 220, 220, 30, 45, body_width - 615], repeatRows=1)
    matrix_table.setStyle(table_style(small=True))
    alternating(matrix_table, len(matrix_rows))
    story.append(matrix_table)
    story.append(PageBreak())

    story.extend(section_header("B", "Apéndice B · Inventario completo de notas Dropbox 2026", styles))
    db_rows = [[p("Fecha", styles["table_header"]), p("Carpeta", styles["table_header"]), p("Título", styles["table_header"]), p("PDF", styles["table_header"]), p("DOCX", styles["table_header"]), p("Proyecto", styles["table_header"]), p("Perfiles/correos", styles["table_header"])]]
    for topic in dropbox["topics"]:
        matched = [match for match in topic["authorMatches"] if match["profileId"]]
        unmatched_emails = [match["email"] for match in topic["authorMatches"] if not match["profileId"]]
        profile_text = f"{len(matched)} resueltos"
        if unmatched_emails:
            profile_text += f"; sin perfil: {', '.join(unmatched_emails)}"
        if not topic["emails"]:
            profile_text = "Sin correo extraíble"
        db_rows.append(
            [
                p(esc(topic["date"]), styles["cell"]),
                p(esc(topic["folder"]), styles["cell_tiny"]),
                p(esc(topic["title"]), styles["cell"]),
                p(f"{topic['validPdfCount']}/{topic['pdfCount']}", styles["cell"]),
                p(str(topic["docxCount"]), styles["cell"]),
                p(f"{len(topic['projectMatches'])} filas" if topic["status"] == "represented" else "Pendiente", styles["cell_bold"]),
                p(esc(profile_text), styles["cell_tiny"]),
            ]
        )
    db_table = LongTable(db_rows, colWidths=[55, 105, 300, 42, 42, 65, body_width - 609], repeatRows=1)
    db_table.setStyle(table_style(small=True))
    alternating(db_table, len(db_rows))
    story.append(db_table)
    story.append(PageBreak())

    story.extend(section_header("C", "Apéndice C · Enlaces confirmados como rotos o incompatibles", styles))
    problematic = [link for link in snapshot["links"] if link["classification"] in {"roto", "contenido-invalido"}]
    problem_rows = [[p("Fuente", styles["table_header"]), p("Tipo", styles["table_header"]), p("HTTP", styles["table_header"]), p("Clasificación", styles["table_header"]), p("URL", styles["table_header"]), p("Destino final/MIME", styles["table_header"])]]
    for link in problematic:
        problem_rows.append(
            [
                p(esc(link["source"]), styles["cell"]),
                p(esc(link["kind"]), styles["cell"]),
                p(str(link["status"]), styles["cell_bold"]),
                p(esc(link["classification"]), styles["cell"]),
                p(link_markup(short_url(link["url"], 92), link["url"]), styles["cell_tiny"]),
                p(esc(f"{short_url(link.get('finalUrl') or '', 70)} · {link.get('mime') or 'sin MIME'}"), styles["cell_tiny"]),
            ]
        )
    problem_table = LongTable(problem_rows, colWidths=[50, 70, 38, 82, 345, body_width - 585], repeatRows=1)
    problem_table.setStyle(table_style(small=True))
    alternating(problem_table, len(problem_rows))
    story.append(problem_table)
    story.append(PageBreak())

    story.extend(section_header("D", "Apéndice D · Leyenda y archivos de evidencia", styles))
    legend_rows = [[p("Código", styles["table_header"]), p("Significado", styles["table_header"]), p("Unidad", styles["table_header"]), p("Advertencia", styles["table_header"])]]
    for row in code_summary(snapshot):
        legend_rows.append(
            [
                p(esc(row["code"]), styles["cell_tiny"]),
                p(esc(row["label"]), styles["cell"]),
                p("Publicación canónica / fila de proyecto", styles["cell"]),
                p("Requiere revisión humana" if row["code"].startswith(("TITLE_", "BODY_", "PAIRING_", "AUTHORS_")) else "Criterio determinista", styles["cell"]),
            ]
        )
    legend_table = LongTable(legend_rows, colWidths=[150, 250, 180, body_width - 580], repeatRows=1)
    legend_table.setStyle(table_style(small=True))
    alternating(legend_table, len(legend_rows))
    story.append(legend_table)
    story.append(PageBreak())
    evidence_files = [
        "output/csv/VWYS_Auditoria_Publicaciones_2026-08-14_inventario.csv",
        "output/csv/VWYS_Auditoria_Publicaciones_2026-08-14_enlaces_rotos.csv",
        "output/csv/VWYS_Notas_Dropbox_2026.csv",
        "output/json/VWYS_Auditoria_Publicaciones_2026-08-14_snapshot.json",
        "output/json/VWYS_Notas_Dropbox_2026.json",
    ]
    story.extend(section_header("D.1", "Archivos reproducibles y trazabilidad", styles))
    story.extend([p(esc(file), styles["body"]) for file in evidence_files])
    story.append(p(f"Snapshot oficial/proyecto: {counts['officialCanonicalEntries']} canónicos, {counts['linkTargets']:,} enlaces. Snapshot Dropbox SHA-256 del ZIP: {dropbox['summary']['zipSha256']}.", styles["note"]))
    return story


def write_supporting_files(root: Path, snapshot: dict, dropbox_path: Path, snapshot_path: Path) -> None:
    csv_dir = root / "output/csv"
    json_dir = root / "output/json"
    csv_dir.mkdir(parents=True, exist_ok=True)
    json_dir.mkdir(parents=True, exist_ok=True)
    base = "VWYS_Auditoria_Publicaciones_2026-08-14"
    shutil.copy2(snapshot_path, json_dir / f"{base}_snapshot.json")
    shutil.copy2(dropbox_path, json_dir / "VWYS_Notas_Dropbox_2026.json")
    inventory_csv = snapshot_path.with_name(
        snapshot_path.name.replace(".snapshot.json", ".inventario.csv")
    )
    if not inventory_csv.exists():
        raise FileNotFoundError(f"No se localizo el inventario tecnico: {inventory_csv}")
    shutil.copy2(inventory_csv, csv_dir / f"{base}_inventario.csv")
    dropbox_csv = dropbox_path.with_suffix(".csv")
    if dropbox_csv.exists():
        shutil.copy2(dropbox_csv, csv_dir / "VWYS_Notas_Dropbox_2026.csv")
    link_headers = ["owner", "source", "kind", "language", "url", "status", "classification", "finalUrl", "redirected", "mime", "bytesRead", "signature", "elapsedMs", "error", "recheckedAt"]
    broken = [link for link in snapshot["links"] if link["classification"] == "roto"]
    with (csv_dir / f"{base}_enlaces_rotos.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=link_headers, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(broken)


def main() -> None:
    args = parse_args()
    script_path = Path(__file__).resolve()
    root = script_path.parent.parent
    snapshot_path = Path(args.snapshot).resolve()
    dropbox_path = Path(args.dropbox).resolve()
    output_path = Path(args.output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    register_fonts(root)
    styles = make_styles()
    snapshot = json.loads(snapshot_path.read_text(encoding="utf-8"))
    dropbox = json.loads(dropbox_path.read_text(encoding="utf-8"))
    write_supporting_files(root, snapshot, dropbox_path, snapshot_path)
    logo_path = root / "frontend-mirror/images/vonwobeser_2025_.png"
    document = SimpleDocTemplate(
        str(output_path),
        pagesize=PAGE_SIZE,
        rightMargin=RIGHT,
        leftMargin=LEFT,
        topMargin=TOP,
        bottomMargin=BOTTOM,
        title="VWYS Auditoría integral de Publicaciones 2026-08-14",
        author="VWYS / Auditoría técnica",
        subject="Reconciliación del sitio oficial, CMS y notas 2026",
    )
    story = build_story(root, snapshot, dropbox, styles, output_path)
    document.build(
        story,
        onFirstPage=lambda canvas, doc: first_page(canvas, doc, logo_path),
        onLaterPages=lambda canvas, doc: header_footer(canvas, doc, logo_path),
    )
    print(output_path)


if __name__ == "__main__":
    main()
