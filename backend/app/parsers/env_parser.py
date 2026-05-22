import re
from app.parsers.base import BaseParser


class EnvParser(BaseParser):
    _LINE_PATTERN = re.compile(
        r"^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$"
    )

    def can_parse(self, filename: str) -> bool:
        name = filename.lower()
        if name == ".env" or name.startswith(".env."):
            return True
        return name.endswith(".env")

    def parse(self, content: str) -> dict[str, str]:
        result: dict[str, str] = {}
        for line_num, line in enumerate(content.splitlines(), 1):
            stripped = line.strip()
            if not stripped or stripped.startswith("#"):
                continue
            match = self._LINE_PATTERN.match(stripped)
            if not match:
                raise ValueError(f"Invalid env syntax at line {line_num}: {line}")
            key, raw_value = match.group(1), match.group(2)
            value = self._clean_value(raw_value)
            result[key] = value
        return result

    def _clean_value(self, raw: str) -> str:
        raw = raw.strip()
        if raw and raw[0] in ('"', "'"):
            quote = raw[0]
            end_idx = raw.find(quote, 1)
            if end_idx != -1:
                return raw[1:end_idx]
            else:
                return raw[1:]
        comment_pos = raw.find(" #")
        if comment_pos == -1:
            comment_pos = raw.find("\t#")
        if comment_pos != -1:
            raw = raw[:comment_pos].rstrip()
        if len(raw) >= 2 and raw[0] == raw[-1] and raw[0] in ('"', "'"):
            raw = raw[1:-1]
        return raw