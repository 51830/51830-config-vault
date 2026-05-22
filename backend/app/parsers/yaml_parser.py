import yaml
from app.parsers.base import BaseParser


class YamlParser(BaseParser):
    def can_parse(self, filename: str) -> bool:
        name = filename.lower()
        return name.endswith(".yml") or name.endswith(".yaml")

    def parse(self, content: str) -> dict[str, str]:
        try:
            data = yaml.safe_load(content)
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML: {e}")

        if data is None:
            return {}

        if not isinstance(data, dict):
            raise ValueError("YAML root must be a mapping")

        return self.flatten(data)