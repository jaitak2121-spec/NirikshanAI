import { useMemo, useState } from 'react'
import EvidenceThumb from './EvidenceThumb'
import EvidenceUpload from './EvidenceUpload'
import { humanDate } from '../utils/format'

const NOTE =
  'Images marked “Synthetic” are illustrative demonstration placeholders, not photographs of any real work. Officer-added evidence is attributed to the officer who recorded it. An image records that something was looked at; it is not a finding.'

/**
 * A compact grid of evidence images for a work.
 *
 * Additive to the existing Project Detail page. Renders whatever evidence has
 * been recorded against the work — seeded synthetic demonstration images, plus
 * anything an officer attached during an investigation — and falls back to a
 * plain empty state when there is none, so a record with no images still renders.
 */
export default function EvidenceGallery({
  evidence = [],
  title = 'Site & evidence images',
  note = NOTE,
  canUpload = false,
  busy = false,
  onUpload,
}) {
  const items = evidence || []
  const [uploadOpen, setUploadOpen] = useState(false)
  const ordered = useMemo(
    () =>
      [...items].sort((a, b) => {
        const aDate = a.captured_date || a.created_at || ''
        const bDate = b.captured_date || b.created_at || ''
        return String(bDate).localeCompare(String(aDate)) || Number(b.id || 0) - Number(a.id || 0)
      }),
    [items],
  )
  const syntheticCount = items.filter((item) => item.is_synthetic).length

  return (
    <section className="panel">
      <div className="panel-header">
        <h3 className="panel-title">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="tnum text-2xs text-ink-500">
            {items.length} image{items.length === 1 ? '' : 's'}
            {syntheticCount > 0 ? ` · ${syntheticCount} synthetic` : ''}
          </span>
          {canUpload && onUpload && (
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={() => setUploadOpen((open) => !open)}
            >
              {uploadOpen ? 'Cancel upload' : '+ Add evidence'}
            </button>
          )}
        </div>
      </div>
      <div className="p-4">
        {uploadOpen && canUpload && onUpload && (
          <EvidenceUpload
            busy={busy}
            onCancel={() => setUploadOpen(false)}
            onSubmit={(body) => {
              onUpload(body)
              setUploadOpen(false)
            }}
          />
        )}

        {items.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-ink-500">No evidence images available.</p>
        ) : (
          <>
            <ol className={`${uploadOpen ? 'mt-4 ' : ''}ml-1 border-l border-ink-200 pl-4`}>
              {ordered.map((item) => {
                const when = item.captured_date || item.created_at
                return (
                  <li
                    key={item.id ?? `${item.evidence_type}-${item.caption}`}
                    className="relative pb-4 last:pb-0"
                  >
                    <span
                      aria-hidden
                      className="absolute -left-[1.28rem] top-1.5 h-2 w-2 rounded-full border border-white bg-ink-500"
                    />
                    <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-2xs font-semibold uppercase tracking-wide text-ink-500">
                        {when ? humanDate(when) : 'Date not recorded'}
                      </span>
                      <span className="text-2xs text-ink-400">
                        {item.is_synthetic ? 'Synthetic demonstration evidence' : 'Officer-added evidence'}
                      </span>
                    </div>
                    <EvidenceThumb item={item} />
                  </li>
                )
              })}
            </ol>
            <p className="mt-3 text-2xs leading-relaxed text-ink-400">{note}</p>
          </>
        )}
      </div>
    </section>
  )
}
