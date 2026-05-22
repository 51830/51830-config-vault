import tomli
from app.parsers.base import BaseParser


class TomlParser(BaseParser):
    def can_parse(self, filename: str) -> bool:
        return filename.lower().endswith(".toml")

    def parse(self, content: str) -> dict[str, str]:
        try:
            data = tomli.loads(content)
        except tomli.TOMLDecodeError as e:
            raise ValueError(f"Invalid TOML: {e}")

        return self.flatten(data)
