import re
import logging
import tempfile
from pathlib import Path
from dataclasses import dataclass, field

logger = logging.getLogger("pdfforge.ocr")

LIST_PATTERNS = re.compile(
    r"^\s*"
    r"(?:"
    r"[\u2022\u2023\u25E6\u2043\u2219\-\*\+]+"  # bullets
    r"|"
    r"\d+[\.\)\:]"  # 1. 1) 1:
    r"|"
    r"[a-zA-Z][\.\)\:]"  # a. a) a:
    r")"
    r"\s+"
)


@dataclass
class RichRun:
    text: str
    bold: bool = False
    italic: bool = False
    underline: bool = False
    strikethrough: bool = False
    color: tuple[int, int, int] = (0, 0, 0)
    font_size: float = 11.0
    font_name: str = "Calibri"


@dataclass
class RichBlock:
    type: str  # paragraph, heading, list_item, table, image, page_break
    runs: list[RichRun] = field(default_factory=list)
    level: int = 1
    alignment: str = "left"
    indent_level: int = 0
    image_path: str = ""
    image_width: float = 0
    image_height: float = 0
    page_num: int = 0
    table_data: list[list[str]] = field(default_factory=list)
    table_col_count: int = 0


def _int_to_rgb(color_int: int) -> tuple[int, int, int]:
    r = (color_int >> 16) & 0xFF
    g = (color_int >> 8) & 0xFF
    b = color_int & 0xFF
    return (r, g, b)


def _get_heading_level(font_size: float, is_bold: bool) -> int:
    if font_size >= 26:
        return 1
    elif font_size >= 20:
        return 2
    elif font_size >= 16:
        return 3
    elif font_size >= 13 and is_bold:
        return 4
    return 0


def _classify_list_item(text: str) -> tuple[bool, int]:
    match = LIST_PATTERNS.match(text)
    if match:
        indent = len(match.group()) - len(match.group().strip())
        return True, max(0, indent // 2)
    return False, 0


def _is_page_break(prev_y: float, curr_y: float, page_height: float) -> bool:
    if page_height <= 0:
        return False
    return curr_y < prev_y - (page_height * 0.5)


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
                logger.warning("PaddleOCR not installed, using PyMuPDF")
                self._structure = "fallback"

    def process(self, pdf_path: str) -> list[RichBlock]:
        self._lazy_init()

        if self._structure == "fallback":
            return self._pymupdf_rich_extract(pdf_path)

        return self._paddle_extract(pdf_path)

    def _paddle_extract(self, pdf_path: str) -> list[RichBlock]:
        try:
            result = self._structure.predict(input=pdf_path)
            blocks = []

            for page_result in result:
                for item in page_result.get("res", []):
                    bbox = item.get("bbox", [0, 0, 0, 0])
                    text = item.get("text", "")
                    confidence = item.get("score", 0.0)
                    category = item.get("category", "text")

                    if not text.strip():
                        continue

                    run = RichRun(
                        text=text,
                        bold=category in ("title", "section_title"),
                        font_size=18.0 if category in ("title", "section_title") else 11.0,
                    )

                    block = RichBlock(
                        type="heading" if category in ("title", "section_title") else "paragraph",
                        runs=[run],
                        level=_get_heading_level(run.font_size, run.bold),
                    )

                    if category == "table" and "table_data" in item:
                        block.type = "table"
                        block.table_data = item["table_data"]
                        block.table_col_count = len(item["table_data"][0]) if item["table_data"] else 0

                    blocks.append(block)

            logger.info(f"PaddleOCR extracted {len(blocks)} blocks from {pdf_path}")
            return blocks

        except Exception as e:
            logger.exception(f"PaddleOCR failed: {e}, falling back to PyMuPDF")
            return self._pymupdf_rich_extract(pdf_path)

    def _pymupdf_rich_extract(self, pdf_path: str) -> list[RichBlock]:
        try:
            import pymupdf
            doc = pymupdf.open(pdf_path)
            all_blocks: list[RichBlock] = []
            prev_y = 0.0

            for page_num in range(len(doc)):
                page = doc[page_num]
                page_height = page.rect.height
                text_dict = page.get_text("dict", flags=pymupdf.TEXTFLAGS_TEXT)
                page_blocks = self._extract_page_blocks(text_dict, page_num, prev_y, page_height)
                all_blocks.extend(page_blocks)

                if page_blocks:
                    last_block = page_blocks[-1]
                    if last_block.runs:
                        prev_y = last_block.runs[-1].font_size  # approximate

                images = page.get_images(full=True)
                for img_index, img in enumerate(images):
                    xref = img[0]
                    try:
                        base_image = doc.extract_image(xref)
                        if base_image and base_image.get("image"):
                            img_ext = base_image.get("ext", "png")
                            img_filename = f"page{page_num + 1}_img{img_index + 1}.{img_ext}"
                            img_path = Path(tempfile.gettempdir()) / "pdfforge_images" / img_filename
                            img_path.parent.mkdir(parents=True, exist_ok=True)
                            img_path.write_bytes(base_image["image"])

                            img_block = RichBlock(
                                type="image",
                                image_path=str(img_path),
                                image_width=base_image.get("width", 200),
                                image_height=base_image.get("height", 200),
                                page_num=page_num,
                            )
                            all_blocks.append(img_block)
                    except Exception as e:
                        logger.warning(f"Failed to extract image {img_index} from page {page_num}: {e}")

            doc.close()

            merged = self._merge_paragraphs(all_blocks)
            logger.info(f"PyMuPDF rich extraction: {len(merged)} blocks from {pdf_path}")
            return merged

        except Exception as e:
            logger.exception(f"PyMuPDF rich extraction failed: {e}")
            return []

    def _extract_page_blocks(
        self, text_dict: dict, page_num: int, prev_y: float, page_height: float
    ) -> list[RichBlock]:
        blocks: list[RichBlock] = []

        for block in text_dict.get("blocks", []):
            if block["type"] == 1:  # image block
                continue

            if block["type"] == 0:  # text block
                block_spans = []
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        text = span.get("text", "")
                        if not text.strip():
                            continue

                        flags = span.get("flags", 0)
                        is_bold = bool(flags & (1 << 4))
                        is_italic = bool(flags & (1 << 1))
                        is_underline = bool(flags & (1 << 3))
                        is_strikethrough = bool(flags & (1 << 6))

                        color_int = span.get("color", 0)
                        color = _int_to_rgb(color_int) if isinstance(color_int, int) else (0, 0, 0)

                        run = RichRun(
                            text=text,
                            bold=is_bold,
                            italic=is_italic,
                            underline=is_underline,
                            strikethrough=is_strikethrough,
                            color=color,
                            font_size=span.get("size", 11.0),
                            font_name=span.get("font", "Calibri"),
                        )
                        block_spans.append(run)

                if not block_spans:
                    continue

                combined_text = "".join(r.text for r in block_spans)
                is_list, indent_level = _classify_list_item(combined_text)

                heading_level = 0
                if block_spans:
                    avg_size = sum(r.font_size for r in block_spans) / len(block_spans)
                    any_bold = any(r.bold for r in block_spans)
                    heading_level = _get_heading_level(avg_size, any_bold)

                if heading_level > 0:
                    block_type = "heading"
                elif is_list:
                    block_type = "list_item"
                else:
                    block_type = "paragraph"

                rich_block = RichBlock(
                    type=block_type,
                    runs=block_spans,
                    level=heading_level,
                    indent_level=indent_level,
                    page_num=page_num,
                )
                blocks.append(rich_block)

        return blocks

    def _merge_paragraphs(self, blocks: list[RichBlock]) -> list[RichBlock]:
        if not blocks:
            return blocks

        merged: list[RichBlock] = []
        current_para: list[RichBlock] = []

        for block in blocks:
            if block.type == "image" or block.type == "table":
                if current_para:
                    merged.append(self._combine_para_runs(current_para))
                    current_para = []
                merged.append(block)
                continue

            if block.type == "heading":
                if current_para:
                    merged.append(self._combine_para_runs(current_para))
                    current_para = []
                merged.append(block)
                continue

            if current_para:
                last = current_para[-1]
                last_text = "".join(r.text for r in last.runs).rstrip()
                curr_text = "".join(r.text for r in block.runs).lstrip()

                same_format = (
                    last.runs
                    and block.runs
                    and last.runs[-1].font_size == block.runs[0].font_size
                    and last.runs[-1].bold == block.runs[0].bold
                )

                ends_with_space = last_text.endswith(" ") or curr_text.startswith(" ")
                not_list = block.type != "list_item" and last.type != "list_item"

                if same_format and not_list and (ends_with_space or len(last_text) < 60):
                    last.runs.extend(block.runs)
                else:
                    merged.append(self._combine_para_runs(current_para))
                    current_para = [block]
            else:
                current_para = [block]

        if current_para:
            merged.append(self._combine_para_runs(current_para))

        return merged

    def _combine_para_runs(self, para_blocks: list[RichBlock]) -> RichBlock:
        if len(para_blocks) == 1:
            return para_blocks[0]

        combined_runs: list[RichRun] = []
        for block in para_blocks:
            combined_runs.extend(block.runs)

        return RichBlock(
            type=para_blocks[0].type,
            runs=combined_runs,
            level=para_blocks[0].level,
            indent_level=para_blocks[0].indent_level,
            page_num=para_blocks[0].page_num,
        )


ocr_engine = OCREngine()
