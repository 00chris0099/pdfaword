import logging
from pathlib import Path

logger = logging.getLogger("pdfforge.analyzer")


def analyze_pdf(pdf_path: str) -> dict:
    try:
        import pymupdf
        doc = pymupdf.open(pdf_path)
        total_pages = len(doc)

        has_images = False
        has_tables = False
        is_scanned = True
        total_text_length = 0

        for page_num in range(min(total_pages, 10)):  # Analyze first 10 pages
            page = doc[page_num]

            # Check for text
            text = page.get_text()
            total_text_length += len(text.strip())

            if len(text.strip()) > 50:
                is_scanned = False

            # Check for images
            images = page.get_images()
            if images:
                has_images = True

            # Check for table-like structures (lines)
            drawings = page.get_drawings()
            line_count = sum(1 for d in drawings if d.get("type") == "l" or "re" in str(d.get("items", [])))
            if line_count > 10:
                has_tables = True

            # Also check text-based table detection
            if text:
                lines = text.split("\n")
                pipe_lines = sum(1 for line in lines if "|" in line)
                tab_lines = sum(1 for line in lines if "\t" in line)
                if pipe_lines > 3 or tab_lines > 3:
                    has_tables = True

        doc.close()

        return {
            "pages": total_pages,
            "has_images": has_images,
            "has_tables": has_tables,
            "is_scanned": is_scanned,
            "total_text_length": total_text_length,
            "needs_ocr": is_scanned,
        }

    except Exception as e:
        logger.exception(f"PDF analysis failed: {e}")
        return {
            "pages": 0,
            "has_images": False,
            "has_tables": False,
            "is_scanned": True,
            "total_text_length": 0,
            "needs_ocr": True,
        }
