# [036] Create PHP Parser

**Issue #15 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

Issue [030] sudah membuat BaseParser abstract class. Sekarang kita perlu membuat PhpParser untuk memparse file PHP config (`<?php return [...]`) yang umum di framework seperti Laravel, Symfony, dll.

## Goal
Buat PhpParser yang bisa memparse file PHP yang berisi array return statement (`<?php return ['key' => 'value'];`).

## Steps

### 1. Buat backend/app/parsers/php_parser.py
```python
import re
from app.parsers.base import BaseParser


class PhpParser(BaseParser):
    def can_parse(self, filename: str) -> bool:
        return filename.lower().endswith(".php")

    def parse(self, content: str) -> dict[str, str]:
        # Hanya handle PHP config files dengan pattern:
        # <?php return [ ... ];
        # Untuk full PHP parsing butuh eksekusi PHP, di sini kita
        # parse dengan regex sederhana untuk key-value pairs

        # Strip PHP tag
        php_content = content.strip()
        if not php_content.startswith("<?php"):
            raise ValueError("File must start with <?php")

        # Remove <?php and closing tag if any
        php_content = re.sub(r"^<\?php\s*", "", php_content)
        php_content = re.sub(r"\?>$", "", php_content)
        php_content = php_content.strip()

        # Cek return statement
        if not php_content.startswith("return"):
            raise ValueError("File must contain a return statement")

        # Remove return and opening/closing brackets
        array_content = re.sub(r"^return\s*", "", php_content)
        array_content = array_content.strip()

        # Simple key-value extraction using regex
        result = self._parse_php_array(array_content)
        return result

    def _parse_php_array(self, content: str) -> dict[str, str]:
        """Parse PHP array syntax menjadi flat dict."""
        result: dict[str, str] = {}

        # Pattern untuk 'key' => 'value', "key" => "value", key => value
        pattern = re.compile(
            r"""['"]?(\w+)['"]?\s*=>\s*['"]([^'"]*)['"]|['"]?(\w+)['"]?\s*=>\s*(true|false|TRUE|FALSE|null|NULL|\d+)""",
            re.MULTILINE,
        )

        for match in pattern.finditer(content):
            key = match.group(1) or match.group(3)
            value = match.group(2) or match.group(4)
            result[key] = str(value)

        return result
```

### 2. Test parsing
```bash
cd backend
python -c "
from app.parsers.php_parser import PhpParser
p = PhpParser()

# Test can_parse
assert p.can_parse('config.php')
assert not p.can_parse('config.json')

# Test PHP config
result = p.parse('<?php return [\"DB_HOST\" => \"localhost\", \"DB_PORT\" => \"3306\"];')
assert result['DB_HOST'] == 'localhost'
assert result['DB_PORT'] == '3306'

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
from app.parsers.php_parser import PhpParser

__all__ = [
    "BaseParser", "EnvParser", "JsonParser", "YamlParser",
    "TomlParser", "IniParser", "PhpParser",
]
```

## Verification
- [ ] `PhpParser().can_parse('config.php')` mengembalikan `True`
- [ ] `PhpParser().can_parse('config.json')` mengembalikan `False`
- [ ] Parse `<?php return ['key' => 'value'];` menghasilkan `{'key': 'value'}`
- [ ] File tanpa `<?php` memicu ValueError
- [ ] File tanpa `return` memicu ValueError

## Depends on
#9
