from sqlalchemy.orm import Session
from app.models.config_file import ConfigFile
from app.models.app_model import App


class VersioningService:
    def __init__(self, db: Session):
        self.db = db

    def get_next_version(self, app_id: int) -> int:
        latest = (
            self.db.query(ConfigFile)
            .filter(ConfigFile.app_id == app_id)
            .order_by(ConfigFile.version.desc())
            .first()
        )
        if latest is None:
            return 1
        return latest.version + 1

    def get_version_history(self, app_id: int) -> list[ConfigFile]:
        return (
            self.db.query(ConfigFile)
            .filter(ConfigFile.app_id == app_id)
            .order_by(ConfigFile.version.desc())
            .all()
        )

    def get_version(self, app_id: int, version: int) -> ConfigFile | None:
        return (
            self.db.query(ConfigFile)
            .filter(
                ConfigFile.app_id == app_id,
                ConfigFile.version == version,
            )
            .first()
        )

    def get_latest_version(self, app_id: int) -> ConfigFile | None:
        return (
            self.db.query(ConfigFile)
            .filter(ConfigFile.app_id == app_id)
            .order_by(ConfigFile.version.desc())
            .first()
        )

    def count_versions(self, app_id: int) -> int:
        return (
            self.db.query(ConfigFile)
            .filter(ConfigFile.app_id == app_id)
            .count()
        )