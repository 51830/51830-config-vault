# [034] Create TOML Parser

**Issue #13 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

Issue [030] sudah membuat BaseParser abstract class. Sekarang kita perlu membuat TomlParser untuk memparse file `.toml`.

## Goal
Buat TomlParser yang bisa memparse file TOML, mendukung nested table (di-flatten ke dot-notation).

## Steps

### 1. Tambahkan tomli ke requirements.txt
```txt
tomli==2.0.1
```

Jalankan:
```bash
pip install -r backend/requirements.txt
```

### 2. Buat backend/app/parsers/toml_parser.py
```python
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
```

### 3. Test parsing
```bash
cd backend
python -c "
from app.parsers.toml_parser import TomlParser
p = TomlParser()

# Test can_parse
assert p.can_parse('config.toml')
assert not p.can_parse('config.json')

# Test simple TOML
result = p.parse('host = \"localhost\"\nport = 3306')
assert result['host'] == 'localhost'
assert result['port'] == '3306'

# Test nested TOML
result = p.parse('[database]\nhost = \"localhost\"\nport = \"3306\"')
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
from app.parsers.toml_parser import TomlParser

__all__ = ["BaseParser", "EnvParser", "JsonParser", "YamlParser", "TomlParser"]
```

## Verification
- [ ] `TomlParser().can_parse('config.toml')` mengembalikan `True`
- [ ] `TomlParser().can_parse('config.json')` mengembalikan `False`
- [ ] Parse TOML sederhana menghasilkan dict yang benar
- [ ] Parse nested TOML table menghasilkan dot-notation
- [ ] TOML invalid memicu ValueError

## Depends on
#9
