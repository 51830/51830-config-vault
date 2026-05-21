# [080] Implement Export Feature

**Issue #31 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

[072] sudah membuat VersionTimeline component. Sekarang kita perlu membuat fitur export untuk mengembalikan konfigurasi ke file asli (.env, .json, .yaml, .toml, .ini, .php). Fitur ini mencakup backend endpoint dan frontend UI.

## Goal
Buat fitur export yang memungkinkan user mendownload konfigurasi versi tertentu dalam format file asli. Backend mengembalikan file yang sudah direkonstruksi dari key-value pairs di database, frontend menyediakan tombol download di App Detail Page.

## Steps

### 1. Buat service exporter di `backend/app/services/exporter.py`
Service ini bertugas merekonstruksi file konfigurasi dari key-value pairs berdasarkan format aslinya.

```python
from typing import List
from backend.app.models.config_item import ConfigItem


class BaseExporter:
    def export(self, items: List[ConfigItem]) -> str:
        raise NotImplementedError


class EnvExporter(BaseExporter):
    def export(self, items: List[ConfigItem]) -> str:
        lines = []
        for item in items:
            if item.is_sensitive:
                lines.append(f'# {item.key}=***')
            lines.append(f'{item.key}={item.value_decrypted}')
        return '\n'.join(lines) + '\n'


class JsonExporter(BaseExporter):
    def export(self, items: List[ConfigItem]) -> str:
        result = {}
        for item in items:
            keys = item.key_path.split('.')
            current = result
            for k in keys[:-1]:
                if k not in current:
                    current[k] = {}
                current = current[k]
            current[keys[-1]] = item.value_decrypted
        import json
        return json.dumps(result, indent=2) + '\n'


class YamlExporter(BaseExporter):
    def export(self, items: List[ConfigItem]) -> str:
        result = {}
        for item in items:
            keys = item.key_path.split('.')
            current = result
            for k in keys[:-1]:
                if k not in current:
                    current[k] = {}
                current = current[k]
            current[keys[-1]] = item.value_decrypted
        import yaml
        return yaml.dump(result, default_flow_style=False)


class TomlExporter(BaseExporter):
    def export(self, items: List[ConfigItem]) -> str:
        result = {}
        for item in items:
            keys = item.key_path.split('.')
            current = result
            for k in keys[:-1]:
                if k not in current:
                    current[k] = {}
                current = current[k]
            current[keys[-1]] = item.value_decrypted
        import tomli_w
        return tomli_w.dumps(result)


class IniExporter(BaseExporter):
    def export(self, items: List[ConfigItem]) -> str:
        import configparser
        config = configparser.ConfigParser()
        for item in items:
            keys = item.key_path.split('.')
            if len(keys) == 1:
                section = 'DEFAULT'
                option = keys[0]
            else:
                section = keys[0]
                option = '.'.join(keys[1:])
            if section not in config.sections() and section != 'DEFAULT':
                config.add_section(section)
            config.set(section, option, item.value_decrypted)
        import io
        buf = io.StringIO()
        config.write(buf)
        return buf.getvalue()


class PhpExporter(BaseExporter):
    def export(self, items: List[ConfigItem]) -> str:
        result = {}
        for item in items:
            keys = item.key_path.split('.')
            current = result
            for k in keys[:-1]:
                if k not in current:
                    current[k] = {}
                current = current[k]
            current[keys[-1]] = item.value_decrypted

        def _to_php_array(data, indent=0):
            pad = '    ' * (indent + 1)
            end_pad = '    ' * indent
            parts = []
            for key, value in data.items():
                if isinstance(value, dict):
                    parts.append(f"{pad}'{key}' => [\n{_to_php_array(value, indent + 1)}{end_pad}],")
                else:
                    escaped = value.replace("'", "\\'")
                    parts.append(f"{pad}'{key}' => '{escaped}',")
            return '\n'.join(parts) + '\n'

        return "<?php\n\nreturn [\n" + _to_php_array(result) + "];\n"


EXPORTER_MAP = {
    'env': EnvExporter(),
    'json': JsonExporter(),
    'yaml': YamlExporter(),
    'yml': YamlExporter(),
    'toml': TomlExporter(),
    'ini': IniExporter(),
    'cfg': IniExporter(),
    'php': PhpExporter(),
}


def get_exporter(file_type: str) -> BaseExporter:
    exporter = EXPORTER_MAP.get(file_type.lower())
    if not exporter:
        raise ValueError(f'Unsupported file type: {file_type}')
    return exporter


def export_config(items: List[ConfigItem], file_type: str) -> str:
    exporter = get_exporter(file_type)
    selected_items = [item for item in items if item.is_selected]
    if not selected_items:
        selected_items = items
    return exporter.export(selected_items)
```

### 2. Buat endpoint export di `backend/app/routers/export.py`
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.config_file import ConfigFile
from backend.app.models.config_item import ConfigItem
from backend.app.services.exporter import export_config
from backend.app.auth.middleware import get_current_user

router = APIRouter(prefix='/api/v1/export', tags=['export'])


@router.get('/config-files/{config_file_id}')
def download_config(
    config_file_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    config_file = db.query(ConfigFile).filter(ConfigFile.id == config_file_id).first()
    if not config_file:
        raise HTTPException(status_code=404, detail='Config file not found')

    items = db.query(ConfigItem).filter(
        ConfigItem.config_file_id == config_file_id
    ).order_by(ConfigItem.key_path).all()

    if not items:
        raise HTTPException(status_code=404, detail='No items found in this config file')

    file_type = config_file.file_type
    content = export_config(items, file_type)

    media_type_map = {
        'env': 'text/plain',
        'json': 'application/json',
        'yaml': 'text/yaml',
        'yml': 'text/yaml',
        'toml': 'application/toml',
        'ini': 'text/plain',
        'cfg': 'text/plain',
        'php': 'text/x-php',
    }

    filename = f'{config_file.filename}.exported'
    if '.' not in filename:
        filename = f'{filename}.{file_type}'

    from fastapi.responses import Response
    return Response(
        content=content,
        media_type=media_type_map.get(file_type, 'application/octet-stream'),
        headers={
            'Content-Disposition': f'attachment; filename="{filename}"',
        },
    )
```

### 3. Register router di `backend/app/main.py`
```python
from backend.app.routers.export import router as export_router
app.include_router(export_router)
```

### 4. Tambahkan tombol download di frontend
Buat `frontend/src/components/ExportButton.jsx`:

```jsx
import React, { useState } from 'react';
import apiClient from '../api/client';

export default function ExportButton({ configFileId, filename, fileType }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExport = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get(
        `/api/v1/export/config-files/${configFileId}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const ext = filename.split('.').pop() || fileType;
      link.setAttribute('download', `config-${configFileId}.${ext}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Export failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="export-button-wrapper">
      <button
        className="btn-export"
        onClick={handleExport}
        disabled={loading}
      >
        {loading ? 'Exporting...' : 'Download Config'}
      </button>
      {error && <p className="export-error">{error}</p>}
    </div>
  );
}
```

### 5. Integrasikan ExportButton ke halaman yang relevan
Tambahkan ExportButton di App Detail Page (`frontend/src/pages/AppDetailPage.jsx`):

```jsx
import ExportButton from '../components/ExportButton';

// Di dalam render, tambahkan di bagian version card:
<ExportButton
  configFileId={version.id}
  filename={version.filename}
  fileType={version.file_type}
/>
```

## Verification
- [ ] Backend endpoint `GET /api/v1/export/config-files/{id}` mengembalikan file yang benar
- [ ] Export .env mengembalikan format KEY=VALUE
- [ ] Export .json mengembalikan JSON valid dengan nested structure
- [ ] Export .yaml mengembalikan YAML valid
- [ ] Export .toml mengembalikan TOML valid
- [ ] Export .ini mengembalikan INI valid
- [ ] Export .php mengembalikan PHP array valid
- [ ] Hanya item yang is_selected=true yang di-export (atau semua jika none selected)
- [ ] Frontend button download file dengan benar
- [ ] Error handling ketika config file tidak ditemukan (404)
- [ ] Error handling ketika export gagal

## Depends on
#30
