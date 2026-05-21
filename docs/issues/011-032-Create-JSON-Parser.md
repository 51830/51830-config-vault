# [032] Create JSON Parser

**Issue #11 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

Issue [030] sudah membuat BaseParser abstract class. Sekarang kita perlu membuat JsonParser untuk memparse file `.json`.

## Goal
Buat JsonParser yang bisa memparse file JSON, mendukung nested object (di-flatten ke dot-notation) dan array dengan index notation.

## Steps

### 1. Buat backend/app/parsers/json_parser.py
```python
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
        """Override flatten untuk handle list/index notation."""
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
```

### 2. Test parsing
```bash
cd backend
python -c "
from app.parsers.json_parser import JsonParser
p = JsonParser()

# Test can_parse
assert p.can_parse('config.json')
assert p.can_parse('app.JSON')
assert not p.can_parse('.env')

# Test simple JSON
result = p.parse('{\"host\": \"localhost\", \"port\": 3306}')
assert result['host'] == 'localhost'
assert result['port'] == '3306'

# Test nested JSON
result = p.parse('{\"database\": {\"host\": \"localhost\", \"port\": \"3306\"}}')
assert result['database.host'] == 'localhost'
assert result['database.port'] == '3306'

# Test JSON with array
result = p.parse('{\"servers\": [\"web1\", \"web2\"]}')
assert result['servers[0]'] == 'web1'
assert result['servers[1]'] == 'web2'

print('All tests passed')
"
```

### 3. Update __init__.py parsers
```python
from app.parsers.base import BaseParser
from app.parsers.env_parser import EnvParser
from app.parsers.json_parser import JsonParser

__all__ = ["BaseParser", "EnvParser", "JsonParser"]
```

## Verification
- [ ] `JsonParser().can_parse('config.json')` mengembalikan `True`
- [ ] `JsonParser().can_parse('.env')` mengembalikan `False`
- [ ] Parse JSON sederhana: `{"key": "value"}` â†’ `{"key": "value"}`
- [ ] Parse nested JSON: `{"db": {"host": "local"}}` â†’ `{"db.host": "local"}`
- [ ] Parse JSON dengan array: `{"arr": [1,2]}` â†’ `{"arr[0]": "1", "arr[1]": "2"}`
- [ ] JSON invalid memicu ValueError

## Depends on
#9
