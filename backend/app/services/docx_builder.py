from __future__ import annotations
import logging
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from docx import Document

logger = logging.getLogger("pdfforge.docx_builder")


def convert_pdf_to_docx(pdf_path: str, docx_path: str) -> None:
    try:
        from pdf2docx import Converter
        cv = Converter(pdf_path)
        cv.convert(docx_path)
        cv.close()
        logger.info(f"pdf2docx converted {pdf_path} -> {docx_path}")
    except Exception as e:
        logger.exception(f"pdf2docx failed: {e}")
        raise


def build_docx_from_ocr(blocks: list, docx_path: str) -> None:
    from docx import Document
    from docx.shared import Pt
    from app.services.ocr_engine import OCRBlock

    doc = Document()

    style = doc.styles["Normal"]
    font = style.font
    font.name = "Calibri"
    font.size = Pt(11)

    sorted_blocks = sorted(blocks, key=lambda b: (b.bbox[1], b.bbox[0]))

    for block in sorted_blocks:
        if block.is_table and block.table_data:
            _add_table(doc, block.table_data)
            continue

        if not block.text.strip():
            continue

        if block.is_title or block.font_size >= 18:
            heading_level = _get_heading_level(block.font_size)
            doc.add_heading(block.text, level=heading_level)
        else:
            paragraph = doc.add_paragraph()
            run = paragraph.add_run(block.text)
            run.font.size = Pt(block.font_size if block.font_size else 11)

            if block.is_title:
                run.bold = True

    doc.save(docx_path)
    logger.info(f"Built DOCX from OCR blocks: {docx_path}")


def _get_heading_level(font_size: float) -> int:
    if font_size >= 24:
        return 1
    elif font_size >= 18:
        return 2
    elif font_size >= 14:
        return 3
    return 4


def _add_table(doc: "Document", table_data: list[list[str]]) -> None:
    if not table_data or not table_data[0]:
        return

    rows = len(table_data)
    cols = len(table_data[0])
    table = doc.add_table(rows=rows, cols=cols, style="Table Grid")

    for i, row in enumerate(table_data):
        for j, cell_text in enumerate(row):
            if j < cols:
                table.cell(i, j).text = str(cell_text) if cell_text else ""
