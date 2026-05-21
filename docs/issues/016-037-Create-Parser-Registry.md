# [037] Create Parser Registry

**Issue #16 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

Issue [030]-[036] sudah membuat semua parser individual. Sekarang kita perlu membuat ParserRegistry yang mengelola dan mendeteksi parser yang tepat berdasarkan filename.

## Goal
Buat ParserRegistry yang mendaftarkan semua parser, mendeteksi parser yang sesuai berdasarkan ekstensi file, dan memudahkan penambahan parser baru.

## Steps

### 1. Buat backend/app/parsers/registry.py
```python
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
        """Cari parser yang bisa menangani file berdasarkan nama file.

        Args:
            filename: Nama file (e.g., '.env', 'config.json')

        Returns:
            Instance parser yang cocok, atau None jika tidak ada
        """
        for parser in self._parsers:
            if parser.can_parse(filename):
                return parser
        return None

    def parse_file(self, filename: str, content: str) -> dict[str, str]:
        """Parse konten file dengan parser yang sesuai.

        Args:
            filename: Nama file untuk deteksi parser
            content: Konten file

        Returns:
            Flat dictionary dengan dot-notation keys

        Raises:
            ValueError: Jika tidak ada parser yang cocok
        """
        parser = self.get_parser(filename)
        if parser is None:
            supported = ", ".join(self.get_supported_extensions())
            raise ValueError(
                f"No parser found for '{filename}'. Supported formats: {supported}"
            )
        return parser.parse(content)

    def register_parser(self, parser: BaseParser) -> None:
        """Daftarkan parser baru secara manual."""
        self._parsers.append(parser)

    def get_supported_extensions(self) -> list[str]:
        """Return daftar ekstensi yang didukung."""
        return [
            ".env / .env.*",
            ".json",
            ".yml / .yaml",
            ".toml",
            ".ini / .cfg",
            ".php",
        ]

    def get_all_parsers(self) -> list[BaseParser]:
        """Return semua parser yang terdaftar."""
        return self._parsers.copy()


# Singleton instance
registry = ParserRegistry()
```

### 2. Update parsers/__init__.py
```python
from app.parsers.base import BaseParser
from app.parsers.env_parser import EnvParser
from app.parsers.json_parser import JsonParser
from app.parsers.yaml_parser import YamlParser
from app.parsers.toml_parser import TomlParser
from app.parsers.ini_parser import IniParser
from app.parsers.php_parser import PhpParser
from app.parsers.registry import ParserRegistry, registry

__all__ = [
    "BaseParser", "EnvParser", "JsonParser", "YamlParser",
    "TomlParser", "IniParser", "PhpParser", "ParserRegistry", "registry",
]
```

### 3. Test registry
```bash
cd backend
python -c "
from app.parsers.registry import registry

# Test get_parser
assert registry.get_parser('.env') is not None
assert registry.get_parser('config.json') is not None
assert registry.get_parser('config.yml') is not None
assert registry.get_parser('config.yaml') is not None
assert registry.get_parser('config.toml') is not None
assert registry.get_parser('config.ini') is not None
assert registry.get_parser('config.cfg') is not None
assert registry.get_parser('config.php') is not None
assert registry.get_parser('unknown.xyz') is None

# Test parse_file
result = registry.parse_file('config.json', '{\"key\": \"value\"}')
assert result == {'key': 'value'}

# Test unsupported format
try:
    registry.parse_file('unknown.xyz', '')
    assert False, 'Should raise ValueError'
except ValueError as e:
    print(f'OK: {e}')

print('Registry: All tests passed')
"
```

## Verification
- [ ] `registry.get_parser('.env')` mengembalikan instance EnvParser
- [ ] `registry.get_parser('config.json')` mengembalikan instance JsonParser
- [ ] `registry.get_parser('unknown.xyz')` mengembalikan `None`
- [ ] `registry.parse_file('config.json', '{"k":"v"}')` mengembalikan `{'k': 'v'}`
- [ ] `registry.parse_file('unknown.xyz', '')` memicu ValueError
- [ ] `registry.get_supported_extensions()` mengembalikan list 6 format

## Depends on
#9
