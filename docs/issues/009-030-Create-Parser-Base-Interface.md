# [030] Create Parser Base Interface

**Issue #9 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

Aplikasi Config Vault mendukung parsing file konfigurasi dari berbagai format (.env, .json, .yaml, .toml, .ini, .php). Kita perlu membuat base interface/abstract class yang akan menjadi kontrak untuk semua parser.

## Goal
Buat abstract base class `BaseParser` yang mendefinisikan interface `can_parse()` dan `parse()` untuk semua parser.

## Steps

### 1. Buat folder backend/app/parsers/
```
backend/app/parsers/
â”œâ”€â”€ __init__.py
â”œâ”€â”€ base.py
```

### 2. Buat backend/app/parsers/base.py
```python
from abc import ABC, abstractmethod


class BaseParser(ABC):
    """Abstract base class untuk semua parser.

    Setiap parser harus mengimplementasikan:
    - can_parse(filename): mengecek apakah file bisa diparse oleh parser ini
    - parse(content): memparsing konten string menjadi flat dict dengan dot-notation keys
    """

    @abstractmethod
    def can_parse(self, filename: str) -> bool:
        """Cek apakah parser bisa menangani file ini berdasarkan nama file.

        Args:
            filename: Nama file (misal: '.env', 'config.json', 'app.yml')

        Returns:
            True jika bisa parse, False jika tidak
        """
        ...

    @abstractmethod
    def parse(self, content: str) -> dict[str, str]:
        """Parse konten file menjadi dictionary flat dengan dot-notation.

        Args:
            content: String konten file

        Returns:
            Dictionary dengan key dot-notation, value string.
            Contoh nested: {"database.host": "localhost", "database.port": "3306"}

        Raises:
            ValueError: Jika format file tidak valid
        """
        ...

    def flatten(self, data: dict, parent_key: str = "", sep: str = ".") -> dict[str, str]:
        """Flatten nested dictionary menjadi dot-notation.

        Contoh:
            {"db": {"host": "localhost"}} -> {"db.host": "localhost"}

        Args:
            data: Nested dictionary
            parent_key: Key parent untuk rekursi
            sep: Separator (default: ".")

        Returns:
            Flat dictionary dengan dot-notation keys
        """
        items: dict[str, str] = {}
        for key, value in data.items():
            new_key = f"{parent_key}{sep}{key}" if parent_key else str(key)
            if isinstance(value, dict):
                items.update(self.flatten(value, new_key, sep=sep))
            else:
                items[new_key] = str(value)
        return items
```

### 3. Buat backend/app/parsers/__init__.py
```python
from app.parsers.base import BaseParser

__all__ = ["BaseParser"]
```

### 4. Test base class (pastikan tidak bisa di-instantiate langsung)
Jalankan:
```bash
cd backend
python -c "
from app.parsers.base import BaseParser
try:
    p = BaseParser()
    print('ERROR: Should not be able to instantiate BaseParser')
except TypeError as e:
    print(f'OK: {e}')
"
```

## Verification
- [ ] `BaseParser` tidak bisa di-instantiate langsung (abstract class)
- [ ] Import `from app.parsers.base import BaseParser` berhasil
- [ ] Method `flatten()` bekerja dengan nested dict
- [ ] `python -c "from app.parsers.base import BaseParser; b=type('TestParser', (BaseParser,), {'can_parse': lambda s,f: True, 'parse': lambda s,c: {}})(); print(b.flatten({'a': {'b': 'c'}}))"` mencetak `{'a.b': 'c'}`

## Depends on
#8
