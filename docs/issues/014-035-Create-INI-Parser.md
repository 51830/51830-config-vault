# [035] Create INI Parser

**Issue #14 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

Issue [030] sudah membuat BaseParser abstract class. Sekarang kita perlu membuat IniParser untuk memparse file `.ini` dan `.cfg`.

## Goal
Buat IniParser yang bisa memparse file INI/CFG, mendukung section (di-flatten ke dot-notation).

## Steps

### 1. Buat backend/app/parsers/ini_parser.py
```python
import configparser
from io import StringIO
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

        # Handle DEFAULT section (keys tanpa section)
        if parser.defaults():
            for key, value in parser.defaults().items():
                result[key] = value

        return result
```

### 2. Test parsing
```bash
cd backend
python -c "
from app.parsers.ini_parser import IniParser
p = IniParser()

# Test can_parse
assert p.can_parse('config.ini')
assert p.can_parse('config.cfg')
assert not p.can_parse('config.json')

# Test INI with sections
result = p.parse('[database]\nhost = localhost\nport = 3306\n\n[app]\ndebug = true')
assert result['database.host'] == 'localhost'
assert result['database.port'] == '3306'
assert result['app.debug'] == 'true'

print('All tests passed')
"
```

### 3. Update __init__.py parsers
```python
from app.parsers.base import BaseParser
from app.parsers.env_parser import EnvParser
from app.parsers.json_parser import JsonParser
from app.parsers.yaml_parser import YamlParser
from app.parsers.toml_parser import TomlParser
from app.parsers.ini_parser import IniParser

__all__ = ["BaseParser", "EnvParser", "JsonParser", "YamlParser", "TomlParser", "IniParser"]
```

## Verification
- [ ] `IniParser().can_parse('config.ini')` mengembalikan `True`
- [ ] `IniParser().can_parse('config.cfg')` mengembalikan `True`
- [ ] `IniParser().can_parse('config.json')` mengembalikan `False`
- [ ] Parse INI dengan sections menghasilkan dot-notation: `section.key`
- [ ] Parse INI tanpa sections (DEFAULT) menghasilkan key biasa
- [ ] INI invalid memicu ValueError

## Depends on
#9
