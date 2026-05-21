# Prompt untuk Membuat Issue GitHub

## Instruksi Utama

Kamu adalah AI yang membuat GitHub issue untuk project **51830-config-vault** (Config Vault - aplikasi manajemen konfigurasi).

**Format WAJIB** untuk setiap issue:

```markdown
## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

## Goal
[Goal yang jelas dan spesifik]

## Steps

### 1. [Judul step 1]
[Instruksi detail]

### 2. [Judul step 2]
[Instruksi detail]

...

## Verification
- [ ] [Checklist item 1]
- [ ] [Checklist item 2]

## Depends on
[Issue number atau "None"]
```

---

## List Judul Issue yang Perlu Dibuat

Buat GitHub issue dengan judul berikut (pakai format `[XXX] Title`):

```
[003] Setup Docker Compose
[010] Create Database Models
[011] Run Initial Migration
[020] Implement Auth - User Model
[021] Implement Auth - Login Endpoint
[022] Implement Auth - Middleware
[030] Create Parser Base Interface
[031] Create Env Parser
[032] Create JSON Parser
[033] Create YAML Parser
[034] Create TOML Parser
[035] Create INI Parser
[036] Create PHP Parser
[037] Create Parser Registry
[040] Implement Encryption Service
[050] Implement Apps API
[051] Implement Config Files API
[052] Implement Config Items API
[053] Implement Versioning Service
[060] Create Login Page
[061] Create Apps List Page
[062] Create App Detail Page
[063] Create Upload Page
[064] Create Config Review Page
[065] Create Diff Page
[070] Create KeyValueTable Component
[071] Create DiffViewer Component
[072] Create VersionTimeline Component
[080] Implement Export Feature
```

---

## Cara Kerja

1. Untuk setiap judul issue di atas, buat 1 GitHub issue dengan format WAJIB di atas
2. Untuk **Depends on**:
   - Issue [003] → depends on #1 dan #2
   - Issue [010] → depends on #3
   - Issue [011] → depends on #10
   - Issue [020], [021], [022] → depends on #11
   - Issue [030] sampai [037] → depends on #22
   - Issue [040] → depends on #37
   - Issue [050] sampai [053] → depends on #40
   - Issue [060] sampai [065] → depends on #51
   - Issue [070] sampai [072] → depends on #60
   - Issue [080] → depends on #72
3. Buat issue secara berurutan atau beberapa sekaligus
4. Gunakan `gh issue create` untuk membuat issue di repo https://github.com/51830/51830-config-vault

---

## Contoh Issue (Reference)

Contoh issue #1 dan #2 sudah ada di repo:
- https://github.com/51830/51830-config-vault/issues/1
- https://github.com/51830/51830-config-vault/issues/2

Ikuti format yang sama.

---

## Catatan Tambahan

- Setiap step harus sangat detail karena dieksekusi oleh AI dengan keterbatasan
- Sertakan code snippet lengkap
- Untuk issue terkait frontend, gunakan JavaScript/JSX (bukan TypeScript)
- Verifikasi harus realistis dan bisadicheck manually