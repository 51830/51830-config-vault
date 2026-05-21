from abc import ABC, abstractmethod


class BaseParser(ABC):
    """Abstract base class untuk semua parser.

    Setiap parser harus mengimplementasikan:
    - can_parse(filename): mengecek apakah file bisa diparse oleh parser ini
    - parse(content): memparsing konten string menjadi flat dict dengan dot-notation keys
    """

    @abstractmethod
    def can_parse(self, filename: str) -> bool:
        ...

    @abstractmethod
    def parse(self, content: str) -> dict[str, str]:
        ...

    def flatten(self, data: dict, parent_key: str = "", sep: str = ".") -> dict[str, str]:
        items: dict[str, str] = {}
        for key, value in data.items():
            new_key = f"{parent_key}{sep}{key}" if parent_key else str(key)
            if isinstance(value, dict):
                items.update(self.flatten(value, new_key, sep=sep))
            else:
                items[new_key] = str(value)
        return items