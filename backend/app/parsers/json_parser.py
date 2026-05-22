import json
from app.parsers.base import BaseParser


class JsonParser(BaseParser):
    def can_parse(self, filename: str) -> bool:
        return filename.lower().endswith(".json")

    def parse(self, content: str) -> dict[str, str]:
        try:
            data = json.loads(content)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON: {e}")

        if not isinstance(data, dict):
            raise ValueError("JSON root must be an object")

        return self.flatten(data)

    def flatten(self, data: dict, parent_key: str = "", sep: str = ".") -> dict[str, str]:
        items: dict[str, str] = {}
        for key, value in data.items():
            new_key = f"{parent_key}{sep}{key}" if parent_key else str(key)
            if isinstance(value, dict):
                items.update(self.flatten(value, new_key, sep=sep))
            elif isinstance(value, list):
                for i, item in enumerate(value):
                    list_key = f"{new_key}[{i}]"
                    if isinstance(item, dict):
                        items.update(self.flatten(item, list_key, sep=sep))
                    else:
                        items[list_key] = str(item)
            else:
                items[new_key] = str(value)
        return items