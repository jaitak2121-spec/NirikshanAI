import { useRef, useState } from 'react'

const EVIDENCE_TYPES = [
  'Site photograph',
  'Work-progress photograph',
  'Completed asset photograph',
  'Location photograph',
  'Related-project photograph',
  'Document scan',
]

const MAX_BYTES = 2.5 * 1024 * 1024

/**
 * A small form for an officer to attach an image to a verification step.
 *
 * The image is read in the browser into a data URL and sent inline — a
 * deliberate prototype choice that needs no file-storage service. Attaching
 * evidence is not a verification: it records that something was looked at and
 * writes an audit line. Marking the step complete stays a separate action.
 */
export default function EvidenceUpload({ onSubmit, onCancel, busy, signalTitle }) {
  const [evidenceType, setEvidenceType] = useState(EVIDENCE_TYPES[0])
  const [caption, setCaption] = useState('')
  const [reference, setReference] = useState('')
  const [imageData, setImageData] = useState(null)
  const [fileName, setFileName] = useState('')
  const [localError, setLocalError] = useState(null)
  const fileRef = useRef(null)

  function onFile(e) {
    const file = e.target.files?.[0]
    setLocalError(null)
    if (!file) {
      setImageData(null)
      setFileName('')
      return
    }
    if (!file.type.startsWith('image/')) {
      setLocalError('Choose an image file.')
      setImageData(null)
      setFileName('')
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    if (file.size > MAX_BYTES) {
      setLocalError('Image must be under 2.5 MB for this prototype.')
      setImageData(null)
      setFileName('')
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => setImageData(String(reader.result))
    reader.onerror = () => setLocalError('Could not read that file.')
    reader.readAsDataURL(file)
    setFileName(file.name)
  }

  const canSubmit = !busy && (imageData || reference.trim())

  function submit() {
    if (!canSubmit) {
      setLocalError('Attach an image or enter a file reference.')
      return
    }
    onSubmit({
      evidence_type: evidenceType,
      caption: caption.trim() || null,
      image_data: imageData,
      reference: reference.trim() || null,
    })
  }

  return (
    <div className="mt-2 space-y-2 rounded border border-ink-200 bg-ink-50 p-2.5">
      {signalTitle && (
        <p className="text-2xs text-ink-500">
          Attaching to step raised by <span className="font-semibold text-ink-700">{signalTitle}</span>
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <select
          className="input max-w-[14rem]"
          value={evidenceType}
          onChange={(e) => setEvidenceType(e.target.value)}
          aria-label="Evidence type"
        >
          {EVIDENCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <input
        className="input"
        placeholder="Caption / remark (e.g. site inspection photograph showing current progress)"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onFile}
          className="text-2xs text-ink-600 file:mr-2 file:rounded file:border file:border-ink-300 file:bg-white file:px-2 file:py-1 file:text-2xs file:font-semibold file:text-ink-700 hover:file:bg-ink-100"
        />
        {fileName && <span className="truncate text-2xs text-ink-500">{fileName}</span>}
      </div>

      {imageData && (
        <div className="flex items-center gap-3 rounded border border-ink-200 bg-white p-2">
          <img
            src={imageData}
            alt="Selected evidence preview"
            className="h-16 w-20 rounded border border-ink-200 object-cover"
          />
          <div>
            <div className="text-2xs font-semibold uppercase tracking-wide text-ink-600">
              Upload preview
            </div>
            <p className="mt-0.5 text-2xs text-ink-400">
              This image will be recorded as officer-added evidence.
            </p>
          </div>
        </div>
      )}

      <input
        className="input"
        placeholder="File reference instead of an image (optional, e.g. SITE/JPR/2026/07)"
        value={reference}
        onChange={(e) => setReference(e.target.value)}
      />

      {localError && (
        <p className="rounded border border-ink-300 bg-white px-2 py-1 text-2xs text-ink-700">
          {localError}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button type="button" className="btn-primary" disabled={!canSubmit} onClick={submit}>
          Attach evidence
        </button>
        <button type="button" className="btn-secondary" disabled={busy} onClick={onCancel}>
          Cancel
        </button>
        <span className="text-2xs text-ink-400">Attaching does not mark the step verified.</span>
      </div>
    </div>
  )
}
