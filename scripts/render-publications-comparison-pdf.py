#!/usr/bin/env python3
"""Genera una comparativa directa y clicable del archivo de publicaciones VWYS."""

from __future__ import annotations

import argparse
import csv
import html
import json
import re
import unicodedata
from collections import defaultdict
from difflib import SequenceMatcher
from pathlib import Path
from urllib.parse import quote, urlparse

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    Image,
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
MUTED = colors.HexColor("#747478")
PAPER = colors.HexColor("#F7F6F4")
LINE = colors.HexColor("#D8D6D2")
SOFT_RED = colors.HexColor("#F8E9EC")
SOFT_GREEN = colors.HexColor("#EAF5EE")
SOFT_AMBER = colors.HexColor("#FBF1DE")
WHITE = colors.white
PAGE_SIZE = landscape(A4)
PAGE_WIDTH, PAGE_HEIGHT = PAGE_SIZE
LEFT = RIGHT = 14 * mm
TOP = 18 * mm
BOTTOM = 15 * mm
PROJECT_ORIGIN = "https://webpage-von-wobeser-2026.replit.app"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--snapshot", required=True)
    parser.add_argument("--dropbox", required=True)
    parser.add_argument("--output", required=True)
    return parser.parse_args()


def register_fonts(root: Path) -> None:
    fonts = root / "assets/fonts"
    pdfmetrics.registerFont(TTFont("Gelasio-Medium", str(fonts / "Gelasio/Gelasio-Medium.ttf")))
    pdfmetrics.registerFont(TTFont("Inter", str(fonts / "Inter/Inter-Regular.ttf")))
    pdfmetrics.registerFont(TTFont("Inter-Bold", str(fonts / "Inter/Inter-Bold.ttf")))
    pdfmetrics.registerFont(TTFont("Inter-Italic", str(fonts / "Inter/Inter-Italic.ttf")))


def esc(value: object) -> str:
    return html.escape(str(value or ""), quote=True)


def normalize(value: object) -> str:
    text = unicodedata.normalize("NFKD", str(value or ""))
    text = "".join(char for char in text if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def short_url(value: str, limit: int = 52) -> str:
    if not value:
        return ""
    try:
        parsed = urlparse(value)
        text = f"{parsed.netloc}{parsed.path}"
    except ValueError:
        text = value
    return text if len(text) <= limit else f"{text[: limit - 3]}..."


def link_markup(label: str, url: str, color: str = "#AC162C") -> str:
    if not url:
        return esc(label)
    return f'<link href="{esc(url)}" color="{color}"><u>{esc(label)}</u></link>'


def make_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "kicker": ParagraphStyle(
            "kicker",
            parent=base["Normal"],
            fontName="Inter-Bold",
            fontSize=8,
            leading=10,
            textColor=VWYS_RED,
            spaceAfter=5,
        ),
        "cover_title": ParagraphStyle(
            "cover_title",
            parent=base["Title"],
            fontName="Gelasio-Medium",
            fontSize=29,
            leading=33,
            textColor=VWYS_DARK,
            spaceAfter=10,
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
            fontSize=21,
            leading=25,
            textColor=VWYS_DARK,
            spaceAfter=7,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName="Gelasio-Medium",
            fontSize=14,
            leading=18,
            textColor=VWYS_DARK,
            spaceBefore=7,
            spaceAfter=5,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["BodyText"],
            fontName="Inter",
            fontSize=8.7,
            leading=12.2,
            textColor=TEXT,
            spaceAfter=5,
        ),
        "small": ParagraphStyle(
            "small",
            parent=base["BodyText"],
            fontName="Inter",
            fontSize=7,
            leading=9.4,
            textColor=TEXT,
            spaceAfter=2,
        ),
        "note": ParagraphStyle(
            "note",
            parent=base["BodyText"],
            fontName="Inter-Italic",
            fontSize=7.2,
            leading=10,
            textColor=MUTED,
            leftIndent=5,
            spaceAfter=4,
        ),
        "metric": ParagraphStyle(
            "metric",
            parent=base["Normal"],
            fontName="Gelasio-Medium",
            fontSize=21,
            leading=23,
            textColor=VWYS_RED,
            alignment=TA_CENTER,
            spaceAfter=2,
        ),
        "metric_label": ParagraphStyle(
            "metric_label",
            parent=base["Normal"],
            fontName="Inter-Bold",
            fontSize=6.3,
            leading=8,
            textColor=TEXT,
            alignment=TA_CENTER,
        ),
        "header": ParagraphStyle(
            "header",
            parent=base["Normal"],
            fontName="Inter-Bold",
            fontSize=5.7,
            leading=7,
            textColor=WHITE,
            alignment=TA_CENTER,
        ),
        "header_left": ParagraphStyle(
            "header_left",
            parent=base["Normal"],
            fontName="Inter-Bold",
            fontSize=5.7,
            leading=7,
            textColor=WHITE,
            alignment=TA_LEFT,
        ),
        "cell": ParagraphStyle(
            "cell",
            parent=base["Normal"],
            fontName="Inter",
            fontSize=5.5,
            leading=6.9,
            textColor=TEXT,
            wordWrap="CJK",
        ),
        "cell_center": ParagraphStyle(
            "cell_center",
            parent=base["Normal"],
            fontName="Inter",
            fontSize=5.5,
            leading=6.9,
            textColor=TEXT,
            alignment=TA_CENTER,
            wordWrap="CJK",
        ),
        "cell_bold": ParagraphStyle(
            "cell_bold",
            parent=base["Normal"],
            fontName="Inter-Bold",
            fontSize=5.5,
            leading=6.9,
            textColor=TEXT,
            wordWrap="CJK",
        ),
        "cell_title": ParagraphStyle(
            "cell_title",
            parent=base["Normal"],
            fontName="Inter-Bold",
            fontSize=5.6,
            leading=7,
            textColor=TEXT,
            wordWrap="CJK",
            spaceAfter=1,
        ),
        "cell_meta": ParagraphStyle(
            "cell_meta",
            parent=base["Normal"],
            fontName="Inter",
            fontSize=4.7,
            leading=5.8,
            textColor=MUTED,
            wordWrap="CJK",
        ),
        "yes": ParagraphStyle(
            "yes",
            parent=base["Normal"],
            fontName="Inter-Bold",
            fontSize=5.4,
            leading=6.8,
            textColor=colors.HexColor("#236B3D"),
            alignment=TA_CENTER,
        ),
        "no": ParagraphStyle(
            "no",
            parent=base["Normal"],
            fontName="Inter-Bold",
            fontSize=5.4,
            leading=6.8,
            textColor=VWYS_RED,
            alignment=TA_CENTER,
        ),
        "status": ParagraphStyle(
            "status",
            parent=base["Normal"],
            fontName="Inter-Bold",
            fontSize=5,
            leading=6.3,
            textColor=TEXT,
            alignment=TA_CENTER,
            wordWrap="CJK",
        ),
    }


def p(value: object, style: ParagraphStyle) -> Paragraph:
    return Paragraph(str(value), style)


def section_header(number: str, title: str, styles: dict[str, ParagraphStyle]) -> list:
    return [
        p(f"{esc(number)} | {esc(title)}", styles["kicker"]),
        p(esc(title), styles["h1"]),
        HRFlowable(width="100%", thickness=1.2, color=VWYS_RED, spaceAfter=8),
    ]


def table_style(header_rows: int = 1, compact: bool = True) -> TableStyle:
    pad = 2.2 if compact else 4
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), pad),
        ("RIGHTPADDING", (0, 0), (-1, -1), pad),
        ("TOPPADDING", (0, 0), (-1, -1), pad),
        ("BOTTOMPADDING", (0, 0), (-1, -1), pad),
        ("LINEBELOW", (0, 0), (-1, -1), 0.3, LINE),
        ("BACKGROUND", (0, 0), (-1, header_rows - 1), VWYS_DARK),
        ("LINEBELOW", (0, header_rows - 1), (-1, header_rows - 1), 1.1, VWYS_RED),
    ]
    return TableStyle(commands)


def add_alternating_rows(table: Table, row_count: int, first_data_row: int) -> None:
    commands = []
    for row in range(first_data_row, row_count):
        if (row - first_data_row) % 2:
            commands.append(("BACKGROUND", (0, row), (-1, row), PAPER))
    table.setStyle(TableStyle(commands))


def metrics_table(metrics: list[tuple[str, str]], styles: dict[str, ParagraphStyle], width: float) -> Table:
    cells = []
    for value, label in metrics:
        cells.append(
            Table(
                [[p(esc(value), styles["metric"])], [p(esc(label), styles["metric_label"])]],
                colWidths=[width / len(metrics) - 6],
                style=TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, -1), PAPER),
                        ("BOX", (0, 0), (-1, -1), 0.4, LINE),
                        ("TOPPADDING", (0, 0), (-1, 0), 8),
                        ("BOTTOMPADDING", (0, -1), (-1, -1), 8),
                    ]
                ),
            )
        )
    return Table([cells], colWidths=[width / len(metrics)] * len(metrics))


def title_score(match: dict, official: dict | None, language: str) -> float:
    if not official:
        source = match.get("titleEs") if language == "es" else match.get("title")
        text = normalize(source)
        if language == "es":
            hints = (" de ", " la ", " el ", " para ", " y ", " en ")
        else:
            hints = (" the ", " of ", " and ", " for ", " in ", " to ")
        wrapped = f" {text} "
        return sum(wrapped.count(hint) for hint in hints)
    target = normalize(official.get("title"))
    candidates = [normalize(match.get("title")), normalize(match.get("titleEs"))]
    return max((SequenceMatcher(None, target, candidate).ratio() for candidate in candidates if candidate), default=0)


def project_match_for(canonical: dict, language: str) -> dict | None:
    matches = canonical.get("projectMatches") or []
    if not matches:
        return None
    official = canonical.get(language)
    pid = str(official.get("pid")) if official and official.get("pid") is not None else ""
    if pid:
        exact = next((match for match in matches if str(match.get("legacyId") or "") == pid), None)
        if exact:
            return exact
    if len(matches) == 1:
        return matches[0]
    return max(matches, key=lambda match: title_score(match, official, language))


def project_url(match: dict | None, language: str) -> str:
    if not match or not match.get("slug"):
        return ""
    suffix = "?lang=en" if language == "en" else ""
    return f"{PROJECT_ORIGIN}/news/{quote(str(match['slug']), safe='')}{suffix}"


def availability_cell(available: bool, url: str, styles: dict[str, ParagraphStyle]) -> Paragraph:
    if not available:
        return p("No", styles["no"])
    return p(link_markup("Sí - abrir", url, "#236B3D"), styles["yes"])


def main_header(styles: dict[str, ParagraphStyle]) -> list[list]:
    return [
        [
            p("#", styles["header"]),
            p("Fecha", styles["header"]),
            p("Tipo", styles["header"]),
            p("Nota / referencia", styles["header_left"]),
            p("Sitio oficial Von Wobeser", styles["header"]),
            "",
            p("Proyecto Replit", styles["header"]),
            "",
            p("Comparación", styles["header"]),
            p("Enlaces", styles["header"]),
        ],
        ["", "", "", "", p("ES", styles["header"]), p("EN", styles["header"]), p("ES", styles["header"]), p("EN", styles["header"]), "", ""],
    ]


def main_table_spans() -> list[tuple]:
    return [
        ("SPAN", (0, 0), (0, 1)),
        ("SPAN", (1, 0), (1, 1)),
        ("SPAN", (2, 0), (2, 1)),
        ("SPAN", (3, 0), (3, 1)),
        ("SPAN", (4, 0), (5, 0)),
        ("SPAN", (6, 0), (7, 0)),
        ("SPAN", (8, 0), (8, 1)),
        ("SPAN", (9, 0), (9, 1)),
    ]


def canonical_title(canonical: dict) -> str:
    return str((canonical.get("es") or canonical.get("en") or {}).get("title") or "Sin título")


def canonical_date(canonical: dict) -> str:
    item = canonical.get("es") or canonical.get("en") or {}
    return str((item.get("date") or {}).get("normalized") or "-")


def canonical_reference(canonical: dict) -> str:
    parts = []
    if canonical.get("es"):
        parts.append(f"p_id ES {canonical['es'].get('pid')}")
    if canonical.get("en"):
        parts.append(f"p_id EN {canonical['en'].get('pid')}")
    return " | ".join(parts) or canonical.get("canonicalId", "")


def comparison_status(canonical: dict) -> str:
    if not canonical.get("projectMatches"):
        return "Falta en Replit"
    codes = {finding.get("code") for finding in canonical.get("findings") or []}
    language_warnings = {
        "CONTENT_ES_MISSING",
        "CONTENT_EN_MISSING",
        "CONTENT_ES_PROBABLE_EN",
        "CONTENT_EN_PROBABLE_ES",
    }
    if codes & language_warnings:
        return "En ambas | revisar texto"
    if not canonical.get("es") or not canonical.get("en"):
        return "En ambas | oficial en 1 idioma"
    return "En ambas"


def link_status(owner_links: list[dict]) -> tuple[str, int, int]:
    broken = sum(link.get("classification") == "roto" for link in owner_links)
    invalid = sum(link.get("classification") == "contenido-invalido" for link in owner_links)
    parts = []
    if broken:
        parts.append(f"Roto: {broken}")
    if invalid:
        parts.append(f"Formato: {invalid}")
    return (" | ".join(parts) or "OK", broken, invalid)


def build_comparison_rows(snapshot: dict, styles: dict[str, ParagraphStyle]) -> tuple[list[list], list[dict]]:
    links_by_owner: dict[str, list[dict]] = defaultdict(list)
    for link in snapshot["links"]:
        links_by_owner[str(link.get("owner") or "")].append(link)
    canonicals = sorted(snapshot["canonicals"], key=lambda canonical: (canonical_date(canonical), canonical_title(canonical)), reverse=True)
    rows = main_header(styles)
    csv_rows = []
    for index, canonical in enumerate(canonicals, start=1):
        official_es = canonical.get("es")
        official_en = canonical.get("en")
        project_es = project_match_for(canonical, "es")
        project_en = project_match_for(canonical, "en")
        project_es_url = project_url(project_es, "es")
        project_en_url = project_url(project_en, "en")
        link_label, broken_count, invalid_count = link_status(links_by_owner.get(canonical["canonicalId"], []))
        rows.append(
            [
                p(str(index), styles["cell_center"]),
                p(esc(canonical_date(canonical)), styles["cell_center"]),
                p("Artículo" if canonical.get("type") == "articles" else "Noticia", styles["cell_center"]),
                [p(esc(canonical_title(canonical)), styles["cell_title"]), p(esc(canonical_reference(canonical)), styles["cell_meta"])],
                availability_cell(bool(official_es), official_es.get("detailUrl", "") if official_es else "", styles),
                availability_cell(bool(official_en), official_en.get("detailUrl", "") if official_en else "", styles),
                availability_cell(bool(project_es), project_es_url, styles),
                availability_cell(bool(project_en), project_en_url, styles),
                p(esc(comparison_status(canonical)), styles["status"]),
                p(esc(link_label), styles["no"] if broken_count else styles["status"]),
            ]
        )
        csv_rows.append(
            {
                "fecha": canonical_date(canonical),
                "tipo": "articulo" if canonical.get("type") == "articles" else "noticia",
                "nota": canonical_title(canonical),
                "von_wobeser_es": "si" if official_es else "no",
                "von_wobeser_es_url": official_es.get("detailUrl", "") if official_es else "",
                "von_wobeser_en": "si" if official_en else "no",
                "von_wobeser_en_url": official_en.get("detailUrl", "") if official_en else "",
                "replit_es": "si" if project_es else "no",
                "replit_es_url": project_es_url,
                "replit_en": "si" if project_en else "no",
                "replit_en_url": project_en_url,
                "comparacion": comparison_status(canonical),
                "estado_enlaces": link_label,
                "enlaces_rotos": broken_count,
                "contenido_incompatible": invalid_count,
                "referencia": canonical_reference(canonical),
            }
        )
    return rows, csv_rows


def style_main_table(table: LongTable, row_count: int) -> None:
    style = table_style(header_rows=2)
    style.add(*main_table_spans()[0])
    for command in main_table_spans()[1:]:
        style.add(*command)
    style.add("BACKGROUND", (4, 1), (5, 1), colors.HexColor("#454548"))
    style.add("BACKGROUND", (6, 1), (7, 1), colors.HexColor("#454548"))
    table.setStyle(style)
    add_alternating_rows(table, row_count, 2)


def canonical_for_topic(topic: dict, snapshot: dict) -> dict | None:
    project_ids = {str(item.get("id")) for item in topic.get("projectMatches") or [] if item.get("id")}
    if project_ids:
        for canonical in snapshot["canonicals"]:
            canonical_ids = {str(item.get("id")) for item in canonical.get("projectMatches") or [] if item.get("id")}
            if project_ids & canonical_ids:
                return canonical
    target_date = str(topic.get("date") or "")[:7]
    target_title = normalize(topic.get("title"))
    best = None
    best_score = 0.0
    for canonical in snapshot["canonicals"]:
        if canonical_date(canonical) != target_date:
            continue
        score = SequenceMatcher(None, target_title, normalize(canonical_title(canonical))).ratio()
        if score > best_score:
            best = canonical
            best_score = score
    return best if best_score >= 0.72 else None


def build_dropbox_rows(dropbox: dict, snapshot: dict, styles: dict[str, ParagraphStyle]) -> list[list]:
    rows = main_header(styles)
    for index, topic in enumerate(dropbox["topics"], start=1):
        canonical = canonical_for_topic(topic, snapshot)
        official_es = canonical.get("es") if canonical else None
        official_en = canonical.get("en") if canonical else None
        project_es = project_match_for(canonical, "es") if canonical else None
        project_en = project_match_for(canonical, "en") if canonical else None
        status = "En ambas" if canonical and canonical.get("projectMatches") else "Pendiente en ambas"
        pdf_status = f"PDF {topic.get('validPdfCount', 0)}/{topic.get('pdfCount', 0)}"
        rows.append(
            [
                p(str(index), styles["cell_center"]),
                p(esc(topic.get("date") or "-"), styles["cell_center"]),
                p("Nota 2026", styles["cell_center"]),
                [p(esc(topic.get("title") or "Sin título"), styles["cell_title"]), p(esc(topic.get("folder") or ""), styles["cell_meta"])],
                availability_cell(bool(official_es), official_es.get("detailUrl", "") if official_es else "", styles),
                availability_cell(bool(official_en), official_en.get("detailUrl", "") if official_en else "", styles),
                availability_cell(bool(project_es), project_url(project_es, "es"), styles),
                availability_cell(bool(project_en), project_url(project_en, "en"), styles),
                p(esc(status), styles["status"]),
                p(esc(pdf_status), styles["status"]),
            ]
        )
    return rows


def problematic_links(snapshot: dict) -> list[dict]:
    by_id = {canonical["canonicalId"]: canonical for canonical in snapshot["canonicals"]}
    results = []
    for link in snapshot["links"]:
        if link.get("classification") not in {"roto", "contenido-invalido"}:
            continue
        canonical = by_id.get(str(link.get("owner") or ""))
        if not canonical:
            continue
        language = str(link.get("language") or "es")
        official = canonical.get(language) or canonical.get("es") or canonical.get("en")
        match = project_match_for(canonical, language)
        host_url = official.get("detailUrl", "") if link.get("source") == "oficial" and official else project_url(match, language)
        locate = canonical_reference(canonical)
        if link.get("source") == "proyecto" and match:
            locate = f"slug {match.get('slug')}"
        results.append(
            {
                "canonical": canonical,
                "date": canonical_date(canonical),
                "title": canonical_title(canonical),
                "source": link.get("source") or "-",
                "language": language.upper(),
                "kind": "PDF" if link.get("kind") == "pdf" else "Enlace dentro del texto",
                "classification": link.get("classification"),
                "status": link.get("status"),
                "url": link.get("url") or "",
                "host_url": host_url,
                "locate": locate,
            }
        )
    return sorted(results, key=lambda item: (item["date"], item["title"], item["url"]), reverse=True)


def build_problem_rows(snapshot: dict, styles: dict[str, ParagraphStyle]) -> tuple[list[list], list[dict]]:
    items = problematic_links(snapshot)
    rows = [
        [
            p("Fecha", styles["header"]),
            p("Nota a la que pertenece", styles["header_left"]),
            p("Origen", styles["header"]),
            p("Idioma", styles["header"]),
            p("Tipo", styles["header"]),
            p("Resultado", styles["header"]),
            p("Enlace comprobado", styles["header"]),
            p("Cómo localizar la nota", styles["header_left"]),
        ]
    ]
    csv_rows = []
    for item in items:
        result = "Roto" if item["classification"] == "roto" else "Formato incorrecto"
        rows.append(
            [
                p(esc(item["date"]), styles["cell_center"]),
                p(esc(item["title"]), styles["cell_title"]),
                p(esc(item["source"].title()), styles["cell_center"]),
                p(esc(item["language"]), styles["cell_center"]),
                p(esc(item["kind"]), styles["cell_center"]),
                p(esc(f"{result} | HTTP {item['status']}"), styles["no"]),
                [p(link_markup("Abrir enlace comprobado", item["url"]), styles["cell"]), p(esc(short_url(item["url"])), styles["cell_meta"])],
                [p(link_markup("Abrir nota", item["host_url"]), styles["cell"]), p(esc(item["locate"]), styles["cell_meta"])],
            ]
        )
        csv_rows.append(
            {
                "fecha": item["date"],
                "nota": item["title"],
                "origen": item["source"],
                "idioma": item["language"].lower(),
                "tipo": item["kind"],
                "clasificacion": item["classification"],
                "http": item["status"],
                "enlace_comprobado": item["url"],
                "ficha_de_la_nota": item["host_url"],
                "como_buscar": item["locate"],
            }
        )
    return rows, csv_rows


def cover_page(canvas, doc, logo_path: Path) -> None:
    canvas.saveState()
    canvas.setFillColor(WHITE)
    canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    canvas.setFillColor(VWYS_RED)
    canvas.rect(0, 0, 8 * mm, PAGE_HEIGHT, fill=1, stroke=0)
    canvas.restoreState()


def header_footer(canvas, doc, logo_path: Path) -> None:
    canvas.saveState()
    canvas.setFillColor(WHITE)
    canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    canvas.drawImage(str(logo_path), LEFT, PAGE_HEIGHT - 11.2 * mm, width=44 * mm, height=7.2 * mm, preserveAspectRatio=True, mask="auto")
    canvas.setStrokeColor(VWYS_RED)
    canvas.setLineWidth(0.8)
    canvas.line(LEFT, PAGE_HEIGHT - 13 * mm, PAGE_WIDTH - RIGHT, PAGE_HEIGHT - 13 * mm)
    canvas.setFont("Inter", 6.4)
    canvas.setFillColor(MUTED)
    canvas.drawString(LEFT, 7 * mm, "Comparativa directa de Publicaciones | corte 14-ago-2026")
    canvas.drawRightString(PAGE_WIDTH - RIGHT, 7 * mm, f"Página {doc.page}")
    canvas.restoreState()


def write_csv(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()) if rows else [])
        if rows:
            writer.writeheader()
            writer.writerows(rows)


def build_story(root: Path, snapshot: dict, dropbox: dict, styles: dict[str, ParagraphStyle]) -> tuple[list, list[dict], list[dict]]:
    story = []
    width = PAGE_WIDTH - LEFT - RIGHT
    counts = snapshot["summary"]["counts"]
    link_counts = snapshot["summary"]["linkClassificationCounts"]
    logo_path = root / "frontend-mirror/images/vonwobeser_2025_.png"
    comparison_rows, comparison_csv = build_comparison_rows(snapshot, styles)
    problem_rows, problem_csv = build_problem_rows(snapshot, styles)
    missing_official = [canonical for canonical in snapshot["canonicals"] if not canonical.get("projectMatches")]
    missing_dropbox = [topic for topic in dropbox["topics"] if topic.get("status") == "missing"]

    story.extend(
        [
            Spacer(1, 20 * mm),
            Image(str(logo_path), width=59 * mm, height=9 * mm, mask="auto"),
            Spacer(1, 26 * mm),
            p("AUDITORÍA DE PUBLICACIONES | COMPARATIVA DIRECTA", styles["kicker"]),
            p("Qué notas están en Von Wobeser y cuáles están en el proyecto Replit", styles["cover_title"]),
            p("Una fila por nota, cuatro respuestas visibles y todos los enlaces clicables.", styles["cover_subtitle"]),
            Spacer(1, 10 * mm),
            HRFlowable(width="100%", thickness=2, color=VWYS_RED, spaceAfter=9),
            Table(
                [
                    [p("CORTE", styles["header_left"]), p("FUENTES", styles["header_left"]), p("CARÁCTER", styles["header_left"])],
                    [p("14 de agosto de 2026", styles["body"]), p("Sitio oficial + proyecto Replit + Dropbox 2026", styles["body"]), p("Solo lectura", styles["body"])],
                ],
                colWidths=[width * 0.2, width * 0.52, width * 0.28],
                style=table_style(compact=False),
            ),
            Spacer(1, 14 * mm),
            p("El objetivo de este documento es responder una pregunta sencilla: ¿la nota existe en cada sitio y se puede abrir?", styles["note"]),
            PageBreak(),
        ]
    )

    story.extend(section_header("01", "Cómo leer la tabla", styles))
    reading_rows = [
        [p("Marca", styles["header_left"]), p("Significado", styles["header_left"]), p("Qué hacer", styles["header_left"])],
        [p("Sí - abrir", styles["yes"]), p("La ficha pública existe en ese idioma.", styles["body"]), p("Haz clic sobre el texto para abrirla.", styles["body"])],
        [p("No", styles["no"]), p("No se localizó una ficha pública en esa fuente o idioma.", styles["body"]), p("Si dice 'Falta en Replit', debe incorporarse al proyecto.", styles["body"])],
        [p("Roto: N", styles["no"]), p("La nota contiene N enlaces o PDFs que dieron 404/410 tres veces.", styles["body"]), p("Consulta el último apéndice: indica la nota, el enlace roto y cómo encontrarla.", styles["body"])],
        [p("Formato: N", styles["status"]), p("El enlace dice ser PDF, pero entrega HTML o una imagen.", styles["body"]), p("Corregir la etiqueta o sustituir el archivo.", styles["body"])],
    ]
    reading_table = Table(reading_rows, colWidths=[115, 315, width - 430], repeatRows=1)
    reading_table.setStyle(table_style(compact=False))
    add_alternating_rows(reading_table, len(reading_rows), 1)
    story.append(reading_table)
    story.append(Spacer(1, 6 * mm))
    story.append(
        metrics_table(
            [
                (f"{counts['officialCanonicalEntries']:,}", "NOTAS OFICIALES"),
                (f"{counts['officialCanonicalEntries'] - counts['missingInProject']:,}", "TAMBIÉN EN REPLIT"),
                (str(counts["missingInProject"]), "FALTAN EN REPLIT"),
                (str(counts["brokenLinks"]), "ENLACES ROTOS"),
                (str(counts["invalidContentLinks"]), "FORMATOS INCORRECTOS"),
            ],
            styles,
            width,
        )
    )
    story.append(Spacer(1, 5 * mm))
    story.append(p("Importante: 'Sí' confirma que la página pública abre. Si el texto necesita corrección de idioma o contenido, la columna Comparación lo indica como 'revisar texto'.", styles["note"]))
    story.append(p(f"No se llamaron rotos los {link_counts.get('inaccesible', 0)} destinos inaccesibles ni los {link_counts.get('bloqueado', 0)} bloqueados; permanecen separados para no crear falsos positivos.", styles["note"]))
    story.append(PageBreak())

    story.extend(section_header("02", "Lo que falta", styles))
    story.append(p("Tres publicaciones están en el sitio oficial de Von Wobeser, pero no se localizaron en Replit.", styles["body"]))
    missing_rows = [[p("Fecha", styles["header"]), p("Nota", styles["header_left"]), p("Von Wobeser", styles["header"]), p("Replit", styles["header"]), p("Cómo buscar", styles["header_left"])]]
    for canonical in sorted(missing_official, key=canonical_date, reverse=True):
        item = canonical.get("es") or canonical.get("en")
        missing_rows.append(
            [
                p(esc(canonical_date(canonical)), styles["cell_center"]),
                p(esc(canonical_title(canonical)), styles["cell_title"]),
                availability_cell(True, item.get("detailUrl", ""), styles),
                p("No", styles["no"]),
                p(esc(canonical_reference(canonical)), styles["cell"]),
            ]
        )
    missing_table = Table(missing_rows, colWidths=[65, 410, 90, 70, width - 635], repeatRows=1)
    missing_table.setStyle(table_style())
    add_alternating_rows(missing_table, len(missing_rows), 1)
    story.append(missing_table)
    story.append(Spacer(1, 7 * mm))
    story.append(p("Once notas recientes de Dropbox aún no están ni en el listado oficial rastreado ni en Replit.", styles["body"]))
    pending_rows = [[p("Fecha", styles["header"]), p("Nota Dropbox", styles["header_left"]), p("Von Wobeser", styles["header"]), p("Replit", styles["header"]), p("Archivos", styles["header"]), p("Estado", styles["header"])]]
    for topic in missing_dropbox:
        pending_rows.append(
            [
                p(esc(topic.get("date") or "-"), styles["cell_center"]),
                p(esc(topic.get("title") or "Sin título"), styles["cell_title"]),
                p("No", styles["no"]),
                p("No", styles["no"]),
                p(esc(f"PDF {topic.get('validPdfCount', 0)}/{topic.get('pdfCount', 0)} | DOCX {topic.get('docxCount', 0)}"), styles["cell_center"]),
                p("Pendiente de incorporar", styles["status"]),
            ]
        )
    pending_table = LongTable(pending_rows, colWidths=[65, 410, 80, 70, 80, width - 705], repeatRows=1)
    pending_table.setStyle(table_style())
    add_alternating_rows(pending_table, len(pending_rows), 1)
    story.append(pending_table)
    story.append(PageBreak())

    story.extend(section_header("03", "Tabla completa: Von Wobeser vs. Replit", styles))
    story.append(p("Cada 'Sí - abrir' es un enlace clicable. La columna Enlaces resume los vínculos contenidos dentro de esa nota; 'OK' significa que no se confirmó un 404/410.", styles["small"]))
    main_table = LongTable(comparison_rows, colWidths=[22, 45, 34, 260, 70, 70, 70, 70, 65, 56], repeatRows=2)
    style_main_table(main_table, len(comparison_rows))
    story.append(main_table)
    story.append(PageBreak())

    story.extend(section_header("04", "Las 41 notas de Dropbox 2026", styles))
    story.append(p("Las primeras 30 ya tienen correspondencia oficial y en Replit. Las 11 restantes aparecen como 'No' en ambas fuentes y deben incorporarse después de aprobar el inventario.", styles["body"]))
    dropbox_rows = build_dropbox_rows(dropbox, snapshot, styles)
    dropbox_table = LongTable(dropbox_rows, colWidths=[22, 60, 44, 245, 70, 70, 70, 70, 70, 41], repeatRows=2)
    style_main_table(dropbox_table, len(dropbox_rows))
    story.append(dropbox_table)
    story.append(PageBreak())

    story.extend(section_header("05", "Enlaces rotos y la nota a la que pertenecen", styles))
    story.append(p("Aquí se puede abrir el enlace que falló y, por separado, la ficha pública de la nota que lo contiene. La última columna incluye el p_id oficial o el slug de Replit para localizarla manualmente.", styles["body"]))
    problem_table = LongTable(problem_rows, colWidths=[48, 225, 48, 35, 65, 75, 150, width - 646], repeatRows=1)
    problem_table.setStyle(table_style())
    add_alternating_rows(problem_table, len(problem_rows), 1)
    story.append(problem_table)
    story.append(PageBreak())

    story.extend(section_header("06", "Conclusión práctica", styles))
    conclusion_rows = [
        [p("Pregunta", styles["header_left"]), p("Respuesta", styles["header_left"])],
        [p("¿Cuántas notas oficiales hay?", styles["cell_bold"]), p("928 publicaciones canónicas.", styles["body"])],
        [p("¿Cuántas están también en Replit?", styles["cell_bold"]), p("925.", styles["body"])],
        [p("¿Cuántas faltan en Replit?", styles["cell_bold"]), p("3 publicaciones históricas oficiales.", styles["body"])],
        [p("¿Qué pasa con Dropbox 2026?", styles["cell_bold"]), p("30 temas ya están en ambas fuentes y 11 siguen pendientes.", styles["body"])],
        [p("¿Cuántos enlaces están rotos?", styles["cell_bold"]), p("43 enlaces dieron 404/410 en tres comprobaciones. Otros 3 enlaces entregan un formato distinto al anunciado.", styles["body"])],
        [p("¿Se modificó producción?", styles["cell_bold"]), p("No. Esta auditoría fue exclusivamente de lectura.", styles["body"])],
    ]
    conclusion_table = Table(conclusion_rows, colWidths=[240, width - 240], repeatRows=1)
    conclusion_table.setStyle(table_style(compact=False))
    add_alternating_rows(conclusion_table, len(conclusion_rows), 1)
    story.append(conclusion_table)
    story.append(Spacer(1, 7 * mm))
    story.append(p("Siguiente paso recomendado: aprobar las 3 fichas históricas y las 11 notas recientes antes de importarlas, para no crear duplicados.", styles["note"]))
    return story, comparison_csv, problem_csv


def main() -> None:
    args = parse_args()
    root = Path(__file__).resolve().parent.parent
    snapshot_path = Path(args.snapshot).resolve()
    dropbox_path = Path(args.dropbox).resolve()
    output_path = Path(args.output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    snapshot = json.loads(snapshot_path.read_text(encoding="utf-8"))
    dropbox = json.loads(dropbox_path.read_text(encoding="utf-8"))
    register_fonts(root)
    styles = make_styles()
    story, comparison_csv, problem_csv = build_story(root, snapshot, dropbox, styles)
    write_csv(root / "output/csv/VWYS_Auditoria_Publicaciones_2026-08-14_comparativa_simple.csv", comparison_csv)
    write_csv(root / "output/csv/VWYS_Auditoria_Publicaciones_2026-08-14_enlaces_rotos_contexto.csv", [row for row in problem_csv if row["clasificacion"] == "roto"])
    write_csv(root / "output/csv/VWYS_Auditoria_Publicaciones_2026-08-14_enlaces_problematicos_contexto.csv", problem_csv)
    logo_path = root / "frontend-mirror/images/vonwobeser_2025_.png"
    document = SimpleDocTemplate(
        str(output_path),
        pagesize=PAGE_SIZE,
        rightMargin=RIGHT,
        leftMargin=LEFT,
        topMargin=TOP,
        bottomMargin=BOTTOM,
        title="VWYS Comparativa directa de Publicaciones 2026-08-14",
        author="VWYS / Auditoría técnica",
        subject="Presencia y enlaces de publicaciones en el sitio oficial y Replit",
    )
    document.build(
        story,
        onFirstPage=lambda canvas, doc: cover_page(canvas, doc, logo_path),
        onLaterPages=lambda canvas, doc: header_footer(canvas, doc, logo_path),
    )
    print(output_path)


if __name__ == "__main__":
    main()
