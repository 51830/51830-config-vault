import configparser
from app.parsers.base import BaseParser


class IniParser(BaseParser):
    def can_parse(self, filename: str) -> bool:
        name = filename.lower()
        return name.endswith(".ini") or name.endswith(".cfg")

    def parse(self, content: str) -> dict[str, str]:
        parser = configparser.ConfigParser()
        try:
            parser.read_string(content)
        except configparser.Error as e:
            raise ValueError(f"Invalid INI: {e}")

        result: dict[str, str] = {}
        for section in parser.sections():
            for key, value in parser[section].items():
                dot_key = f"{section}.{key}"
                result[dot_key] = value

        if parser.defaults():
            for key, value in parser.defaults().items():
                result[key] = value

        return result
