<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Import/Export System

## Export (src/components/ui/ExportModal.tsx)
- Uses `exceljs` v4.4.0 (dynamic import) for xlsx generation with styles + images.
- Normal export: images embedded as Excel image objects (`ws.addImage`).
- Import-mode export (checkbox "I want to import data"): images written as absolute URL (with `window.location.origin`) to avoid Excel cell truncation (>32K chars). Only base64 if < 1KB.
- ExportTemplateModal writes headers as field keys (English) for import compatibility.

## Import (src/app/api/associations/import/route.ts)
- Accepts both base64 (`data:image/...`) and absolute HTTP/HTTPS URLs.
- Local URLs (`/api/attachments/{id}/file`) → reads directly from Prisma (no HTTP fetch).
- Image download timeout: 10s (AbortController).
- Max image size: 10MB.
- Always creates new Attachment record per row (never dedup) because `logoId` is `@unique` on Association.
- Errors reported per-row; association still created without logo on image failure.
- `checksum` prefixed with timestamp to avoid `@unique` constraint collisions when copying attachments.

## Key Constraints
- `Attachment.checksum` is `@unique` → must be unique per record.
- `Association.logoId` is `@unique` → each logo links to exactly one association.
- Row processing continues on image failure (association created without logo).

## Odoo Ideas Not Yet Implemented
- Saved column→field mappings (`base_import.mapping`) for re-import.
- Fuzzy header-to-field matching (`difflib.SequenceMatcher`).
- Column type detection (int/float/date/bool) for smarter suggestions.
