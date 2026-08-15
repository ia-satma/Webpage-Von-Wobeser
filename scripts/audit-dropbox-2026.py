#!/usr/bin/env python3
"""Inventaría las notas 2026 de la carpeta pública de Dropbox sin modificar el CMS."""

from __future__ import annotations

import argparse
import collections
import csv
import hashlib
import io
import json
import os
import re
import unicodedata
import xml.etree.ElementTree as ET
import zipfile
from datetime import date, datetime, timezone
from pathlib import Path


MONTHS = {
    "Enero": 1,
    "Febrero": 2,
    "Marzo": 3,
    "Abril": 4,
    "Mayo": 5,
    "Junio": 6,
    "Julio": 7,
    "Agosto": 8,
}

STOP_WORDS = set(
    "de la el los las y en para del por que un una con se al a su sus lo como the of and to in for on is are was were this that from by or our your their mexico mexican clients client dear apreciables amigos".split()
)

ALIASES = {
    "acordova": "acordoba",
    "agallanes": "amagallanes",
    "amgallanes": "amagallanes",
    "aperez": "alperez",
    "bruz": "bcruz",
    "lmijimenez": "lmjimenez",
    "rrosas": "rrosasg",
}

MISSING_TITLES = {
    "Junio/22 Junio": "Migración voluntaria y expedita de permisos de autoabastecimiento y cogeneración al marco de la LSPEE/LSE",
    "Junio/26 Junio": "Medidas administrativas por eventos de la Copa Mundial FIFA 2026 en la Ciudad de México",
    "Julio/03 Julio": "OFAC y FinCEN: facilitadores del contrabando transfronterizo de combustible vinculado al CJNG",
    "Julio/16 Julio": "Contingencia fiscal multimillonaria resuelta mediante acuerdo conclusivo",
    "Julio/17 Julio": "Estados Unidos amplía las designaciones terroristas de cárteles",
    "Julio/21 Julio": "Implementación de la e.firma como único certificado válido ante el IMSS",
    "Julio/28 Julio": "IMPI designado como Administración de Búsqueda Internacional y Examen Preliminar Internacional",
    "Julio/29 Julio": "Programa temporal de registro para despacho para autoconsumo de petrolíferos",
    "Agosto/4 Agosto": "Nuevas disposiciones para proyectos de minería en áreas naturales protegidas",
    "Agosto/14 Agosto": "Reforma a las Reglas de Carácter General de la Ley Antilavado",
    "Agosto/14 Agosto Bis": "Recomendaciones sobre la viabilidad del fracking en México",
}


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFD", value.lower())
    value = "".join(character for character in value if unicodedata.category(character) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", value).strip()


def tokens(value: str) -> set[str]:
    return {word for word in normalize(value).split() if len(word) > 3 and word not in STOP_WORDS}


def similarity(left: set[str], right: set[str]) -> float:
    if not left or not right:
        return 0.0
    intersection = len(left & right)
    return max(intersection / min(len(left), len(right)), intersection / len(left), intersection / len(right))


def docx_text(payload: bytes) -> str:
    with zipfile.ZipFile(io.BytesIO(payload)) as archive:
        root = ET.fromstring(archive.read("word/document.xml"))
    return " ".join((element.text or "") for element in root.iter() if element.tag.endswith("}t"))


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def topic_date(folder: str) -> str:
    month_name, label = folder.split("/", 1)
    day_match = re.search(r"(\d{1,2})", label)
    if not day_match:
        return ""
    return f"2026-{MONTHS[month_name]:02d}-{int(day_match.group(1)):02d}"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--zip", required=True, dest="zip_path")
    parser.add_argument("--snapshot", required=True)
    parser.add_argument("--output", required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    zip_path = Path(args.zip_path)
    snapshot_path = Path(args.snapshot)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    snapshot = json.loads(snapshot_path.read_text(encoding="utf-8"))

    project_rows: dict[str, dict] = {}
    for canonical in snapshot["canonicals"]:
        for row in canonical.get("projectMatches", []):
            project_rows[row["id"]] = row
    for row in snapshot["unmatchedProjectRows"]:
        project_rows[row["id"]] = row

    project_tokens = {
        row_id: tokens(" ".join(str(row.get(key) or "") for key in ("title", "titleEs", "excerpt", "excerptEs", "content", "contentEs")))
        for row_id, row in project_rows.items()
    }
    team_by_email = {
        str(member.get("email") or "").lower().split("@")[0]: member
        for member in snapshot["projectTeam"]
        if member.get("email")
    }

    topics: dict[str, list[zipfile.ZipInfo]] = collections.defaultdict(list)
    extension_counts: collections.Counter[str] = collections.Counter()
    with zipfile.ZipFile(zip_path) as archive:
        for entry in archive.infolist():
            if entry.is_dir() or entry.filename.startswith("_automatizacion/"):
                continue
            parts = entry.filename.split("/")
            if len(parts) < 3:
                continue
            folder = "/".join(parts[:2])
            topics[folder].append(entry)
            extension_counts[Path(entry.filename).suffix.lower()] += 1

        topic_data = []
        topic_token_map: dict[str, set[str]] = {}
        for folder, entries in topics.items():
            texts: list[str] = []
            emails: set[str] = set()
            pdf_files: list[str] = []
            valid_pdfs: list[str] = []
            docx_files: list[str] = []
            for entry in entries:
                extension = Path(entry.filename).suffix.lower()
                payload = archive.read(entry)
                if extension == ".pdf":
                    pdf_files.append(entry.filename)
                    if payload.startswith(b"%PDF-"):
                        valid_pdfs.append(entry.filename)
                elif extension == ".docx":
                    docx_files.append(entry.filename)
                    try:
                        text = docx_text(payload)
                    except (KeyError, ET.ParseError, zipfile.BadZipFile):
                        text = ""
                    texts.append(text)
                    emails.update(match.lower() for match in re.findall(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", text, re.I))
            topic_token_map[folder] = tokens(" ".join(texts))
            topic_data.append(
                {
                    "folder": folder,
                    "date": topic_date(folder),
                    "pdfCount": len(pdf_files),
                    "validPdfCount": len(valid_pdfs),
                    "pdfFiles": pdf_files,
                    "docxCount": len(docx_files),
                    "docxFiles": docx_files,
                    "emails": sorted(emails),
                }
            )

    scores: list[tuple[float, str, str]] = []
    for folder, topic_token_set in topic_token_map.items():
        folder_date = date.fromisoformat(topic_date(folder))
        for row_id, row_token_set in project_tokens.items():
            row_date_text = str(project_rows[row_id].get("date") or "")[:10]
            try:
                row_date = date.fromisoformat(row_date_text)
            except ValueError:
                continue
            if row_date.year != 2026 or abs((row_date - folder_date).days) > 45:
                continue
            score = similarity(topic_token_set, row_token_set)
            if score >= 0.30:
                scores.append((score, folder, row_id))

    row_assignment: dict[str, tuple[float, str]] = {}
    for score, folder, row_id in sorted(scores, reverse=True):
        if row_id not in row_assignment:
            row_assignment[row_id] = (score, folder)

    rows_by_topic: dict[str, list[tuple[float, dict]]] = collections.defaultdict(list)
    for row_id, (score, folder) in row_assignment.items():
        if score >= 0.78:
            rows_by_topic[folder].append((score, project_rows[row_id]))

    all_emails: set[str] = set()
    all_matched_profiles: set[str] = set()
    all_unmatched_emails: set[str] = set()
    for topic in topic_data:
        assignments = sorted(rows_by_topic.get(topic["folder"], []), reverse=True, key=lambda item: item[0])
        topic["status"] = "represented" if assignments else "missing"
        topic["projectMatches"] = [
            {
                "score": round(score, 4),
                "id": row["id"],
                "legacyId": row.get("legacyId"),
                "slug": row.get("slug", ""),
                "titleEs": row.get("titleEs", ""),
                "titleEn": row.get("title", ""),
            }
            for score, row in assignments
        ]
        topic["title"] = (
            topic["projectMatches"][0]["titleEs"]
            if topic["projectMatches"]
            else MISSING_TITLES.get(topic["folder"], topic["folder"])
        )
        author_matches = []
        for email in topic["emails"]:
            local = email.split("@")[0]
            exact = team_by_email.get(local)
            target = ALIASES.get(local, local)
            member = exact or team_by_email.get(target)
            author_matches.append(
                {
                    "email": email,
                    "method": "email-local-part" if exact else "explicit-alias" if member else "unmatched",
                    "profileId": member.get("id", "") if member else "",
                    "profileSlug": member.get("slug", "") if member else "",
                    "profileName": member.get("name", "") if member else "",
                }
            )
            all_emails.add(email)
            if member:
                all_matched_profiles.add(member["id"])
            else:
                all_unmatched_emails.add(email)
        topic["authorMatches"] = author_matches

    topic_data.sort(key=lambda topic: (topic["date"], topic["folder"]))
    represented = [topic for topic in topic_data if topic["status"] == "represented"]
    missing = [topic for topic in topic_data if topic["status"] == "missing"]
    summary = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": "https://www.dropbox.com/scl/fo/4jfjqczcv4nazb9f4irzi/ADBWvFL_whoW4J4rfKXIvxY?rlkey=sh9kwmn6npsnr9g7gpkmj4tbu&dl=0",
        "zipSha256": sha256_file(zip_path),
        "topicCount": len(topic_data),
        "pdfCount": extension_counts[".pdf"],
        "validPdfCount": sum(topic["validPdfCount"] for topic in topic_data),
        "docxCount": extension_counts[".docx"],
        "representedTopicCount": len(represented),
        "missingTopicCount": len(missing),
        "representedProjectRowCount": len({match["id"] for topic in represented for match in topic["projectMatches"]}),
        "uniqueAuthorEmailCount": len(all_emails),
        "matchedProfileCount": len(all_matched_profiles),
        "unmatchedAuthorEmails": sorted(all_unmatched_emails),
        "extensionCounts": dict(sorted(extension_counts.items())),
    }
    evidence = {"summary": summary, "topics": topic_data}
    json_path = output_dir / "VWYS_Notas_Dropbox_2026.json"
    csv_path = output_dir / "VWYS_Notas_Dropbox_2026.csv"
    json_path.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    with csv_path.open("w", encoding="utf-8", newline="") as handle:
        fieldnames = [
            "folder",
            "date",
            "status",
            "title",
            "pdfCount",
            "validPdfCount",
            "docxCount",
            "emails",
            "matchedProfiles",
            "unmatchedEmails",
            "projectSlugs",
            "bestScore",
        ]
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for topic in topic_data:
            writer.writerow(
                {
                    "folder": topic["folder"],
                    "date": topic["date"],
                    "status": topic["status"],
                    "title": topic["title"],
                    "pdfCount": topic["pdfCount"],
                    "validPdfCount": topic["validPdfCount"],
                    "docxCount": topic["docxCount"],
                    "emails": " | ".join(topic["emails"]),
                    "matchedProfiles": " | ".join(match["profileSlug"] for match in topic["authorMatches"] if match["profileSlug"]),
                    "unmatchedEmails": " | ".join(match["email"] for match in topic["authorMatches"] if not match["profileId"]),
                    "projectSlugs": " | ".join(match["slug"] for match in topic["projectMatches"]),
                    "bestScore": max((match["score"] for match in topic["projectMatches"]), default=""),
                }
            )
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
