import re
from app.parsers.base import BaseParser


class PhpParser(BaseParser):
    def can_parse(self, filename: str) -> bool:
        return filename.lower().endswith(".php")

    def parse(self, content: str) -> dict[str, str]:
        php_content = content.strip()
        if not php_content.startswith("<?php"):
            raise ValueError("File must start with <?php")

        php_content = re.sub(r"^<\?php\s*", "", php_content)
        php_content = re.sub(r"\?>$", "", php_content)
        php_content = php_content.strip()

        if not php_content.startswith("return"):
            raise ValueError("File must contain a return statement")

        array_content = re.sub(r"^return\s*", "", php_content)
        array_content = array_content.strip()

        result = self._parse_php_array(array_content)
        return result

    def _parse_php_array(self, content: str) -> dict[str, str]:
        result: dict[str, str] = {}
        pattern = re.compile(
            r"""['"]?(\w+)['"]?\s*=>\s*['"]([^'"]*)['"]|['"]?(\w+)['"]?\s*=>\s*(true|false|TRUE|FALSE|null|NULL|\d+)""",
            re.MULTILINE,
        )

        for match in pattern.finditer(content):
            key = match.group(1) or match.group(3)
            value = match.group(2) or match.group(4)
            result[key] = str(value)

        return result