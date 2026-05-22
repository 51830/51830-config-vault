from app.parsers.base import BaseParser
from app.parsers.env_parser import EnvParser
from app.parsers.json_parser import JsonParser
from app.parsers.yaml_parser import YamlParser
from app.parsers.toml_parser import TomlParser
from app.parsers.ini_parser import IniParser
from app.parsers.php_parser import PhpParser


class ParserRegistry:
    def __init__(self):
        self._parsers: list[BaseParser] = [
            EnvParser(),
            JsonParser(),
            YamlParser(),
            TomlParser(),
            IniParser(),
            PhpParser(),
        ]

    def get_parser(self, filename: str) -> BaseParser | None:
        for parser in self._parsers:
            if parser.can_parse(filename):
                return parser
        return None

    def parse_file(self, filename: str, content: str) -> dict[str, str]:
        parser = self.get_parser(filename)
        if parser is None:
            supported = ", ".join(self.get_supported_extensions())
            raise ValueError(
                f"No parser found for '{filename}'. Supported formats: {supported}"
            )
        return parser.parse(content)

    def register_parser(self, parser: BaseParser) -> None:
        self._parsers.append(parser)

    def get_supported_extensions(self) -> list[str]:
        return [
            ".env / .env.*",
            ".json",
            ".yml / .yaml",
            ".toml",
            ".ini / .cfg",
            ".php",
        ]

    def get_all_parsers(self) -> list[BaseParser]:
        return self._parsers.copy()


# Singleton instance
registry = ParserRegistry()