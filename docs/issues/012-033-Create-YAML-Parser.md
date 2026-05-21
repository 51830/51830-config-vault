# [033] Create YAML Parser

**Issue #12 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

Issue [030] sudah membuat BaseParser abstract class. Sekarang kita perlu membuat YamlParser untuk memparse file `.yml` dan `.yaml`.

## Goal
Buat YamlParser yang bisa memparse file YAML, mendukung nested object (di-flatten ke dot-notation).

## Steps

### 1. Tambahkan PyYAML ke requirements.txt
```txt
PyYAML==6.0.2
```

Jalankan:
```bash
pip install -r backend/requirements.txt
```

### 2. Buat backend/app/parsers/yaml_parser.py
```python
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
```

### 3. Test parsing
```bash
cd backend
python -c "
from app.parsers.yaml_parser import YamlParser
p = YamlParser()

# Test can_parse
assert p.can_parse('config.yml')
assert p.can_parse('config.yaml')
assert not p.can_parse('config.json')

# Test simple YAML
result = p.parse('host: localhost\nport: 3306')
assert result['host'] == 'localhost'
assert result['port'] == '3306'

# Test nested YAML
result = p.parse('database:\n  host: localhost\n  port: \"3306\"')
assert result['database.host'] == 'localhost'
assert result['database.port'] == '3306'

print('All tests passed')
"
```

### 4. Update __init__.py parsers
```python
from app.parsers.base import BaseParser
from app.parsers.env_parser import EnvParser
from app.parsers.json_parser import JsonParser
from app.parsers.yaml_parser import YamlParser

__all__ = ["BaseParser", "EnvParser", "JsonParser", "YamlParser"]
```

## Verification
- [ ] `YamlParser().can_parse('config.yml')` mengembalikan `True`
- [ ] `YamlParser().can_parse('config.yaml')` mengembalikan `True`
- [ ] `YamlParser().can_parse('config.json')` mengembalikan `False`
- [ ] Parse YAML sederhana menghasilkan dict yang benar
- [ ] Parse nested YAML menghasilkan dot-notation
- [ ] YAML invalid memicu ValueError

## Depends on
#9
