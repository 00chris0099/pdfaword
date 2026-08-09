import logging
from dataclasses import dataclass, field

logger = logging.getLogger("pdfforge.ocr")


@dataclass
class OCRBlock:
    text: str
    bbox: tuple[int, int, int, int]  # x0, y0, x1, y1
    confidence: float
    is_title: bool = False
    is_table: bool = False
    table_data: list[list[str]] = field(default_factory=list)
    font_size: float = 12.0


class OCREngine:
    def __init__(self):
        self._structure = None

    def _lazy_init(self):
        if self._structure is None:
            try:
                from paddleocr import PaddleStructureV3
                self._structure = PaddleStructureV3()
                logger.info("PaddleStructureV3 initialized")
            except ImportError:
                logger.warning("PaddleOCR not installed, falling back to PyMuPDF text extraction")
                self._structure = "fallback"

    def process(self, pdf_path: str) -> list[OCRBlock]:
        self._lazy_init()

        if self._structure == "fallback":
            return self._fallback_extract(pdf_path)

        return self._paddle_extract(pdf_path)

    def _paddle_extract(self, pdf_path: str) -> list[OCRBlock]:
        try:
            result = self._structure.predict(input=pdf_path)
            blocks = []

            for page_result in result:
                for item in page_result.get("res", []):
                    bbox = item.get("bbox", [0, 0, 0, 0])
                    text = item.get("text", "")
                    confidence = item.get("score", 0.0)
                    category = item.get("category", "text")

                    block = OCRBlock(
                        text=text,
                        bbox=tuple(bbox),
                        confidence=confidence,
                        is_title=category in ("title", "section_title"),
                        is_table=category == "table",
                    )

                    if category == "table" and "table_data" in item:
                        block.table_data = item["table_data"]

                    if text:
                        blocks.append(block)

            logger.info(f"PaddleOCR extracted {len(blocks)} blocks from {pdf_path}")
            return blocks

        except Exception as e:
            logger.exception(f"PaddleOCR failed: {e}, falling back")
            return self._fallback_extract(pdf_path)

    def _fallback_extract(self, pdf_path: str) -> list[OCRBlock]:
        try:
            import pymupdf
            doc = pymupdf.open(pdf_path)
            blocks = []

            for page_num in range(len(doc)):
                page = doc[page_num]
                text_dict = page.get_text("dict", flags=pymupdf.TEXTFLAGS_TEXT)

                for block in text_dict["blocks"]:
                    if block["type"] == 0:  # text
                        for line in block["lines"]:
                            for span in line["spans"]:
                                flags = span.get("flags", 0)
                                is_bold = bool(flags & (1 << 4))
                                block_obj = OCRBlock(
                                    text=span["text"],
                                    bbox=(span["bbox"][0], span["bbox"][1], span["bbox"][2], span["bbox"][3]),
                                    confidence=1.0,
                                    is_title=is_bold or span["size"] > 16,
                                    font_size=span["size"],
                                )
                                if span["text"].strip():
                                    blocks.append(block_obj)

            doc.close()
            logger.info(f"Fallback extracted {len(blocks)} blocks from {pdf_path}")
            return blocks

        except Exception as e:
            logger.exception(f"Fallback extraction failed: {e}")
            return []


ocr_engine = OCREngine()
