#!/usr/bin/env python3
"""Genera la auditoría comparativa y clicable del directorio de abogados VWYS."""

from __future__ import annotations

import argparse
import html
import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
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


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--snapshot", required=True)
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


def link(label: str, url: str, color: str = "#AC162C") -> str:
    if not url:
        return "—"
    return f'<link href="{esc(url)}" color="{color}"><u>{esc(label)}</u></link>'


def make_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "kicker": ParagraphStyle(
            "kicker", parent=base["Normal"], fontName="Inter-Bold", fontSize=8,
            leading=10, textColor=VWYS_RED, spaceAfter=5,
        ),
        "cover_title": ParagraphStyle(
            "cover_title", parent=base["Title"], fontName="Gelasio-Medium",
            fontSize=29, leading=33, textColor=VWYS_DARK, spaceAfter=10,
        ),
        "cover_subtitle": ParagraphStyle(
            "cover_subtitle", parent=base["Normal"], fontName="Inter",
            fontSize=10.5, leading=15, textColor=MUTED, spaceAfter=7,
        ),
        "h1": ParagraphStyle(
            "h1", parent=base["Heading1"], fontName="Gelasio-Medium",
            fontSize=21, leading=25, textColor=VWYS_DARK, spaceAfter=7,
        ),
        "h2": ParagraphStyle(
            "h2", parent=base["Heading2"], fontName="Gelasio-Medium",
            fontSize=14, leading=18, textColor=VWYS_DARK, spaceBefore=7, spaceAfter=5,
        ),
        "body": ParagraphStyle(
            "body", parent=base["BodyText"], fontName="Inter", fontSize=8.5,
            leading=12, textColor=TEXT, spaceAfter=5,
        ),
        "small": ParagraphStyle(
            "small", parent=base["BodyText"], fontName="Inter", fontSize=7,
            leading=9.4, textColor=TEXT, spaceAfter=2,
        ),
        "note": ParagraphStyle(
            "note", parent=base["BodyText"], fontName="Inter-Italic", fontSize=7,
            leading=9.5, textColor=MUTED, leftIndent=5, spaceAfter=4,
        ),
        "metric": ParagraphStyle(
            "metric", parent=base["Normal"], fontName="Gelasio-Medium",
            fontSize=21, leading=23, textColor=VWYS_RED, alignment=TA_CENTER,
        ),
        "metric_label": ParagraphStyle(
            "metric_label", parent=base["Normal"], fontName="Inter-Bold",
            fontSize=6.2, leading=8, textColor=TEXT, alignment=TA_CENTER,
        ),
        "header": ParagraphStyle(
            "header", parent=base["Normal"], fontName="Inter-Bold", fontSize=5.8,
            leading=7.2, textColor=WHITE, alignment=TA_LEFT,
        ),
        "cell": ParagraphStyle(
            "cell", parent=base["Normal"], fontName="Inter", fontSize=5.6,
            leading=7, textColor=TEXT, wordWrap="CJK",
        ),
        "cell_center": ParagraphStyle(
            "cell_center", parent=base["Normal"], fontName="Inter", fontSize=5.6,
            leading=7, textColor=TEXT, alignment=TA_CENTER, wordWrap="CJK",
        ),
        "cell_bold": ParagraphStyle(
            "cell_bold", parent=base["Normal"], fontName="Inter-Bold", fontSize=5.7,
            leading=7.1, textColor=TEXT, wordWrap="CJK",
        ),
        "cell_status": ParagraphStyle(
            "cell_status", parent=base["Normal"], fontName="Inter-Bold", fontSize=5.3,
            leading=6.7, textColor=TEXT, alignment=TA_CENTER, wordWrap="CJK",
        ),
    }


def p(value: object, style: ParagraphStyle) -> Paragraph:
    return Paragraph(str(value), style)


def section(number: str, title: str, styles: dict[str, ParagraphStyle]) -> list:
    return [
        p(f"{esc(number)} | AUDITORÍA DE ABOGADOS", styles["kicker"]),
        p(esc(title), styles["h1"]),
        HRFlowable(width="100%", thickness=1.2, color=VWYS_RED, spaceAfter=8),
    ]


def metrics_table(metrics: list[tuple[str, str]], styles: dict[str, ParagraphStyle], width: float) -> Table:
    cells = []
    for value, label_text in metrics:
        cells.append(Table(
            [[p(esc(value), styles["metric"])], [p(esc(label_text), styles["metric_label"])]],
            colWidths=[width / len(metrics) - 6],
            style=TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), PAPER),
                ("BOX", (0, 0), (-1, -1), 0.4, LINE),
                ("TOPPADDING", (0, 0), (-1, 0), 8),
                ("BOTTOMPADDING", (0, -1), (-1, -1), 8),
            ]),
        ))
    return Table([cells], colWidths=[width / len(metrics)] * len(metrics))


def field_labels(fields: list[str]) -> str:
    labels = {
        "name": "nombre",
        "roleEs": "cargo ES",
        "roleEn": "cargo EN",
        "email": "correo",
        "phone": "teléfono",
        "introEs": "introducción ES",
        "introEn": "introducción EN",
        "bodyEs": "biografía ES",
        "bodyEn": "biografía EN",
        "education": "educación",
        "affiliations": "afiliaciones",
        "rankings": "reconocimientos",
        "languages": "idiomas",
        "projectPageEs": "ficha Replit ES",
        "projectPageEn": "ficha Replit EN",
        "officialPageEs": "ficha oficial ES",
        "officialPageEn": "ficha oficial EN",
        "renderedNameEs": "nombre renderizado ES",
        "renderedNameEn": "nombre renderizado EN",
    }
    return ", ".join(labels.get(field, field) for field in fields)


def status_color(status: str):
    if status == "Coincide":
        return SOFT_GREEN
    if status == "Solo en proyecto":
        return SOFT_AMBER
    return SOFT_RED


def draw_page(canvas, doc) -> None:
    canvas.saveState()
    canvas.setStrokeColor(VWYS_RED)
    canvas.setLineWidth(1.1)
    canvas.line(LEFT, PAGE_HEIGHT - 10 * mm, PAGE_WIDTH - RIGHT, PAGE_HEIGHT - 10 * mm)
    canvas.setFont("Inter-Bold", 6.5)
    canvas.setFillColor(VWYS_DARK)
    canvas.drawString(LEFT, PAGE_HEIGHT - 8 * mm, "VON WOBESER Y SIERRA · AUDITORÍA DE ABOGADOS")
    canvas.setFont("Inter", 6.2)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(PAGE_WIDTH - RIGHT, 8 * mm, f"SATMA · 14 AGO 2026 · PÁG. {doc.page}")
    canvas.restoreState()


def build_pdf(snapshot: dict, output: Path, root: Path) -> None:
    register_fonts(root)
    styles = make_styles()
    summary = snapshot["summary"]
    matrix = snapshot["matrix"]
    canonical = [row for row in matrix if row.get("legacyId")]
    review = [row for row in canonical if row.get("status") == "Revisar diferencias"]
    extras = [row for row in matrix if row.get("status") == "Solo en proyecto"]

    output.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(output), pagesize=PAGE_SIZE, leftMargin=LEFT, rightMargin=RIGHT,
        topMargin=TOP, bottomMargin=BOTTOM, title="Auditoría comparativa de abogados VWYS",
        author="SATMA", subject="Comparación del directorio oficial y el proyecto Replit",
    )
    usable = PAGE_WIDTH - LEFT - RIGHT
    story = []

    story.extend([
        Spacer(1, 10 * mm),
        p("VON WOBESER Y SIERRA · CONTROL EDITORIAL", styles["kicker"]),
        p("Auditoría comparativa<br/>de abogados", styles["cover_title"]),
        p(
            "Directorio oficial vigente vs. proyecto publicado en Replit · Español e inglés · "
            "Corte al 14 de agosto de 2026",
            styles["cover_subtitle"],
        ),
        Spacer(1, 5 * mm),
        metrics_table([
            (str(summary["officialCanonicalCount"]), "PERFILES OFICIALES"),
            (str(summary["projectPublishedCount"]), "PERFILES EN REPLIT"),
            (str(summary["matchedCount"]), "COINCIDEN EN PRESENCIA"),
            (str(summary["linksChecked"]), "ENLACES COMPROBADOS"),
        ], styles, usable),
        Spacer(1, 8 * mm),
        p(
            f"Resultado ejecutivo: los {summary['officialCanonicalCount']} abogados del directorio oficial "
            f"están presentes en Replit; no hay perfiles oficiales faltantes. El proyecto conserva "
            f"{summary['projectOnlyCount']} perfiles adicionales. Los {summary['linksChecked']} enlaces "
            "de ficha comprobados —oficial/Replit y ES/EN— respondieron correctamente y mostraron al abogado esperado.",
            styles["body"],
        ),
        p(
            f"La comparación editorial encontró {summary['exactMatchCount']} perfiles canónicos sin diferencias "
            f"en los controles revisados y {summary['reviewCount']} que requieren actualizar campos concretos.",
            styles["body"],
        ),
        p(
            "Todos los enlaces de la matriz son clicables. «ES» abre la ficha en español y «EN» la ficha en inglés; "
            "se incluyen por separado la página oficial y la réplica publicada.",
            styles["note"],
        ),
        PageBreak(),
    ])

    story.extend(section("01", "Alcance y metodología", styles))
    methods = [
        ("Inventario oficial", "Se recorrieron los cuatro directorios ES/EN: socios, of counsel, consejeros y asociados. El ID oficial enlaza ambas versiones lingüísticas."),
        ("Correspondencia", "Se emparejó por correo profesional y, como respaldo, por nombre normalizado y cargo. El homónimo Alejandro Torres se distingue por identidad y rol."),
        ("Contenido", "Se compararon nombre, cargo, correo, teléfono, introducción, biografía, educación, afiliaciones, reconocimientos e idiomas."),
        ("Enlaces", "Cada ficha se solicitó en vivo y solo se marcó correcta con HTTP 200 y el nombre esperado dentro de la página."),
        ("Cobertura", "Se probaron 266 fichas oficiales y 284 fichas Replit: 550 destinos en total."),
    ]
    method_table = Table(
        [[p(esc(title), styles["cell_bold"]), p(esc(text), styles["small"])] for title, text in methods],
        colWidths=[42 * mm, usable - 42 * mm],
        style=TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BACKGROUND", (0, 0), (0, -1), PAPER),
            ("LINEBELOW", (0, 0), (-1, -1), 0.35, LINE),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]),
    )
    story.extend([
        method_table,
        Spacer(1, 5 * mm),
        p("Distribución del directorio oficial", styles["h2"]),
    ])
    category_counts = []
    labels = {"partners": "Socios", "of-counsel": "Of Counsel", "counsel": "Consejeros", "associates": "Asociados"}
    for source in summary["categorySources"]:
        category_counts.append((str(source["es"]["count"]), labels.get(source["category"], source["category"])))
    story.extend([
        metrics_table(category_counts, styles, usable),
        Spacer(1, 5 * mm),
        p(
            "Los conteos español e inglés coinciden en las cuatro categorías. La auditoría conserva hashes de las listas y de la API del proyecto para repetir la comparación posteriormente.",
            styles["note"],
        ),
        PageBreak(),
    ])

    story.extend(section("02", "Hallazgos que requieren actualización", styles))
    if review:
        review_rows = [[
            p("Abogado", styles["header"]), p("Campos", styles["header"]),
            p("Página oficial", styles["header"]), p("Replit", styles["header"]),
        ]]
        for row in review:
            review_rows.append([
                p(f"<b>{esc(row['name'])}</b><br/><font color='#747478'>ID {esc(row['legacyId'])}</font>", styles["cell"]),
                p(esc(field_labels(row.get("failedChecks", []))), styles["cell"]),
                p(f"{link('ES', row['officialEsUrl'])} &nbsp;|&nbsp; {link('EN', row['officialEnUrl'])}", styles["cell_center"]),
                p(f"{link('ES', row['projectEsUrl'])} &nbsp;|&nbsp; {link('EN', row['projectEnUrl'])}", styles["cell_center"]),
            ])
        review_table = Table(review_rows, colWidths=[48 * mm, 92 * mm, 48 * mm, 48 * mm], repeatRows=1)
        review_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), VWYS_DARK),
            ("LINEBELOW", (0, 0), (-1, 0), 1, VWYS_RED),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.3, LINE),
            ("BACKGROUND", (0, 1), (-1, -1), SOFT_RED),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(review_table)
    else:
        story.append(p("No se localizaron diferencias editoriales.", styles["body"]))
    story.extend([
        Spacer(1, 5 * mm),
        p("Lectura del hallazgo", styles["h2"]),
        p(
            "Regina González y Arturo Hernández muestran contenido oficial actualizado después del snapshot canónico del 12 de agosto; deben sincronizarse nuevamente en ambos idiomas. Diego Altamirano conserva biografía coincidente, pero la fuente oficial añadió un tercer antecedente educativo.",
            styles["body"],
        ),
        p(
            "Estos tres casos no son enlaces rotos ni perfiles ausentes: son diferencias editoriales localizadas y revisables directamente desde los enlaces de la tabla.",
            styles["note"],
        ),
        p("Perfiles adicionales preservados en Replit", styles["h2"]),
    ])
    extra_rows = []
    for row in extras:
        extra_rows.append([
            p(esc(row["name"]), styles["cell_bold"]),
            p(esc(row["projectRoleEs"]), styles["cell"]),
            p(f"{link('ES', row['projectEsUrl'])} &nbsp;|&nbsp; {link('EN', row['projectEnUrl'])}", styles["cell_center"]),
        ])
    extras_table = Table(extra_rows, colWidths=[70 * mm, 55 * mm, 55 * mm])
    extras_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BACKGROUND", (0, 0), (-1, -1), SOFT_AMBER),
        ("LINEBELOW", (0, 0), (-1, -1), 0.3, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.extend([
        extras_table,
        p(
            "Estos nueve perfiles no aparecen en el directorio oficial vigente. Se mantienen publicados en Replit por decisión de preservación previa; conviene confirmar con la Firma si deben permanecer visibles.",
            styles["note"],
        ),
        PageBreak(),
    ])

    story.extend(section("03", "Matriz completa: oficial vs. Replit", styles))
    story.append(p(
        "Cada fila contiene los enlaces directos ES/EN de ambas fuentes. «Coincide» significa presencia, datos clave y estructura editorial equivalentes en los controles auditados; «Revisar» identifica diferencias concretas; «Solo en proyecto» no implica error automático.",
        styles["small"],
    ))
    rows = [[
        p("#", styles["header"]),
        p("Abogado / ID", styles["header"]),
        p("Cargo oficial / Replit", styles["header"]),
        p("Oficial", styles["header"]),
        p("Replit", styles["header"]),
        p("Estado", styles["header"]),
        p("Hallazgo", styles["header"]),
    ]]
    for index, row in enumerate(matrix, start=1):
        official_role = row.get("officialRoleEs") or "—"
        project_role = row.get("projectRoleEs") or "—"
        notes = field_labels(row.get("failedChecks", [])) if row.get("failedChecks") else row.get("notes") or "Sin diferencias detectadas"
        rows.append([
            p(str(index), styles["cell_center"]),
            p(f"<b>{esc(row['name'])}</b><br/><font color='#747478'>ID {esc(row.get('legacyId') or '—')}</font>", styles["cell"]),
            p(f"{esc(official_role)}<br/><font color='#747478'>{esc(project_role)}</font>", styles["cell"]),
            p(f"{link('ES', row.get('officialEsUrl', ''))} &nbsp;|&nbsp; {link('EN', row.get('officialEnUrl', ''))}", styles["cell_center"]),
            p(f"{link('ES', row.get('projectEsUrl', ''))} &nbsp;|&nbsp; {link('EN', row.get('projectEnUrl', ''))}", styles["cell_center"]),
            p(esc(row["status"]), styles["cell_status"]),
            p(esc(notes), styles["cell"]),
        ])
    table = LongTable(
        rows,
        colWidths=[8 * mm, 47 * mm, 38 * mm, 32 * mm, 32 * mm, 34 * mm, 78 * mm],
        repeatRows=1,
    )
    commands = [
        ("BACKGROUND", (0, 0), (-1, 0), VWYS_DARK),
        ("LINEBELOW", (0, 0), (-1, 0), 1, VWYS_RED),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 1), (-1, -1), 0.25, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 2.5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2.5),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]
    for row_index, row in enumerate(matrix, start=1):
        commands.append(("BACKGROUND", (0, row_index), (-1, row_index), status_color(row["status"]) if row["status"] != "Coincide" else (PAPER if row_index % 2 == 0 else WHITE)))
    table.setStyle(TableStyle(commands))
    story.append(table)

    doc.build(story, onFirstPage=draw_page, onLaterPages=draw_page)


def main() -> None:
    args = parse_args()
    root = Path(__file__).resolve().parents[1]
    with Path(args.snapshot).open("r", encoding="utf-8") as handle:
        snapshot = json.load(handle)
    build_pdf(snapshot, Path(args.output), root)


if __name__ == "__main__":
    main()
