# [031] Create Env Parser

**Issue #10 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

Issue [030] sudah membuat BaseParser abstract class. Sekarang kita perlu membuat EnvParser untuk memparse file `.env` dan `.env.*`.

## Goal
Buat EnvParser yang bisa memparse file environment variables (.env, .env.local, .env.production, dll).

## Steps

### 1. Buat backend/app/parsers/env_parser.py
```python
import re
from app.parsers.base import BaseParser


class EnvParser(BaseParser):
    # Pattern untuk baris KEY=VALUE (dengan optional export prefix)
    _LINE_PATTERN = re.compile(
        r"^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$"
    )

    def can_parse(self, filename: str) -> bool:
        name = filename.lower()
        # Handle: .env, .env.local, .env.production, .env.example
        if name == ".env" or name.startswith(".env."):
            return True
        # Handle: env.txt atau file .env dengan suffix apapun
        return name.endswith(".env")

    def parse(self, content: str) -> dict[str, str]:
        result: dict[str, str] = {}
        for line_num, line in enumerate(content.splitlines(), 1):
            stripped = line.strip()

            # Skip baris kosong dan komentar
            if not stripped or stripped.startswith("#"):
                continue

            match = self._LINE_PATTERN.match(stripped)
            if not match:
                raise ValueError(f"Invalid env syntax at line {line_num}: {line}")

            key, raw_value = match.group(1), match.group(2)
            value = self._clean_value(raw_value)
            result[key] = value

        return result

    def _clean_value(self, raw: str) -> str:
        """Bersihkan value: hapus quotes, handle komentar inline."""
        raw = raw.strip()

        # Hapus komentar inline (#) â€” hati-hati dengan # di dalam string
        # Sederhana: hapus dari # pertama sampai akhir, asal # bukan di dalam quote
        # Untuk kasus sederhana, kita handle dengan aturan:
        # Jika value diquote, jangan hapus komentar
        if raw and raw[0] in ('"', "'"):
            # Value diquote: cari closing quote
            quote = raw[0]
            end_idx = raw.find(quote, 1)
            if end_idx != -1:
                value_part = raw[1:end_idx]
                # Abaikan setelah closing quote (bisa ada komentar)
                return value_part
            else:
                # No closing quote, ambil semua setelah quote pertama
                return raw[1:]

        # Value tidak diquote: hapus komentar inline
        comment_pos = raw.find(" #")
        if comment_pos == -1:
            comment_pos = raw.find("\t#")
        if comment_pos != -1:
            raw = raw[:comment_pos].rstrip()

        # Hapus quotes jika ada
        if len(raw) >= 2 and raw[0] == raw[-1] and raw[0] in ('"', "'"):
            raw = raw[1:-1]

        return raw
```

### 2. Test parsing
```bash
cd backend
python -c "
from app.parsers.env_parser import EnvParser
p = EnvParser()

# Test can_parse
assert p.can_parse('.env')
assert p.can_parse('.env.local')
assert p.can_parse('.env.production')
assert not p.can_parse('config.json')

# Test parse
result = p.parse('DATABASE_URL=mysql://localhost:3306/db\nAPP_ENV=production\n# comment\nEMPTY=')
print(result)
assert result['DATABASE_URL'] == 'mysql://localhost:3306/db'
assert result['APP_ENV'] == 'production'
assert result['EMPTY'] == ''
print('All tests passed')
"
```

### 3. Update __init__.py parsers
```python
from app.parsers.base import BaseParser
from app.parsers.env_parser import EnvParser

__all__ = ["BaseParser", "EnvParser"]
```

## Verification
- [ ] `EnvParser().can_parse('.env')` mengembalikan `True`
- [ ] `EnvParser().can_parse('.env.production')` mengembalikan `True`
- [ ] `EnvParser().can_parse('config.json')` mengembalikan `False`
- [ ] Parse `.env` dengan format `KEY=VALUE` menghasilkan dict yang benar
- [ ] Parse dengan komentar (`#`) dan baris kosong skip dengan benar
- [ ] Parse dengan `export` prefix berhasil (e.g., `export DB_HOST=localhost`)
- [ ] Value dengan quote di-handle dengan benar

## Depends on
#9
