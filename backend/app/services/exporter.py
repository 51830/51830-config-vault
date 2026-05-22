from typing import List, Optional
from app.models.config_item import ConfigItem
from app.services.encryption import EncryptionService


class BaseExporter:
    def export(self, items: List[ConfigItem], enc_service: EncryptionService) -> str:
        raise NotImplementedError


class EnvExporter(BaseExporter):
    def export(self, items: List[ConfigItem], enc_service: EncryptionService) -> str:
        lines = []
        for item in items:
            value = enc_service.decrypt(item.value_encrypted, item.key_version or 0)
            if item.is_sensitive:
                lines.append(f"# {item.key_path}=***")
            lines.append(f"{item.key_path}={value}")
        return "\n".join(lines) + "\n"


class JsonExporter(BaseExporter):
    def export(self, items: List[ConfigItem], enc_service: EncryptionService) -> str:
        import json

        result = self._build_nested(items, enc_service)
        return json.dumps(result, indent=2) + "\n"

    def _build_nested(self, items: List[ConfigItem], enc_service: EncryptionService) -> dict:
        result = {}
        for item in items:
            keys = item.key_path.split(".")
            current = result
            for k in keys[:-1]:
                if k not in current:
                    current[k] = {}
                current = current[k]
            current[keys[-1]] = enc_service.decrypt(item.value_encrypted, item.key_version or 0)
        return result


class YamlExporter(JsonExporter):
    def export(self, items: List[ConfigItem], enc_service: EncryptionService) -> str:
        import yaml

        result = self._build_nested(items, enc_service)
        return yaml.dump(result, default_flow_style=False)


class TomlExporter(JsonExporter):
    def export(self, items: List[ConfigItem], enc_service: EncryptionService) -> str:
        import tomli_w

        result = self._build_nested(items, enc_service)
        return tomli_w.dumps(result)


class IniExporter(BaseExporter):
    def export(self, items: List[ConfigItem], enc_service: EncryptionService) -> str:
        import configparser
        import io

        config = configparser.ConfigParser()
        for item in items:
            keys = item.key_path.split(".")
            value = enc_service.decrypt(item.value_encrypted, item.key_version or 0)
            if len(keys) == 1:
                section = "DEFAULT"
                option = keys[0]
            else:
                section = keys[0]
                option = ".".join(keys[1:])
            if section not in config.sections() and section != "DEFAULT":
                config.add_section(section)
            config.set(section, option, value)
        buf = io.StringIO()
        config.write(buf)
        return buf.getvalue()


class PhpExporter(JsonExporter):
    def export(self, items: List[ConfigItem], enc_service: EncryptionService) -> str:
        result = self._build_nested(items, enc_service)

        def _to_php_array(data, indent=0):
            pad = "    " * (indent + 1)
            end_pad = "    " * indent
            parts = []
            for key, value in data.items():
                if isinstance(value, dict):
                    parts.append(
                        f"{pad}'{key}' => [\n{_to_php_array(value, indent + 1)}{end_pad}],"
                    )
                else:
                    escaped = str(value).replace("'", "\\'")
                    parts.append(f"{pad}'{key}' => '{escaped}',")
            return "\n".join(parts) + "\n"

        return "<?php\n\nreturn [\n" + _to_php_array(result) + "];\n"


EXPORTER_MAP = {
    "env": EnvExporter(),
    "json": JsonExporter(),
    "yaml": YamlExporter(),
    "yml": YamlExporter(),
    "toml": TomlExporter(),
    "ini": IniExporter(),
    "cfg": IniExporter(),
    "php": PhpExporter(),
}


def get_exporter(file_type: str) -> BaseExporter:
    exporter = EXPORTER_MAP.get(file_type.lower())
    if not exporter:
        raise ValueError(f"Unsupported file type: {file_type}")
    return exporter


def export_config(items: List[ConfigItem], file_type: str, enc_service: EncryptionService) -> str:
    exporter = get_exporter(file_type)
    selected_items = [item for item in items if item.is_selected]
    if not selected_items:
        selected_items = items
    return exporter.export(selected_items, enc_service)