import { useState, useRef } from 'react'

interface UploadedDoc {
  id: string
  name: string
  mimeType: string
  sizeBytes: number
}

interface DocumentUploadProps {
  applicationId: string
  uploadedById: string
  onUploaded?: (doc: UploadedDoc) => void
}

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
}

const MAX_MB = 20

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentUpload({ applicationId, uploadedById, onUploaded }: DocumentUploadProps) {
  const [uploads, setUploads] = useState<Array<{ file: File; status: 'uploading' | 'done' | 'error'; error?: string }>>([])
  const [docs, setDocs] = useState<UploadedDoc[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES[file.type]) {
        setUploads(prev => [...prev, { file, status: 'error', error: 'File type not allowed' }])
        continue
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        setUploads(prev => [...prev, { file, status: 'error', error: `Exceeds ${MAX_MB} MB limit` }])
        continue
      }

      setUploads(prev => [...prev, { file, status: 'uploading' }])

      try {
        // 1. Get presigned upload URL from our backend
        const urlRes = await fetch(`${API}/api/documents/upload-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId,
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            uploadedById,
          }),
        })
        const { uploadUrl, s3Key } = await urlRes.json()
        if (!urlRes.ok) throw new Error('Failed to get upload URL')

        // 2. Upload directly to R2/S3 — file never passes through our server
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        })
        if (!uploadRes.ok) throw new Error('Upload to storage failed')

        // 3. Confirm with our backend
        const confirmRes = await fetch(`${API}/api/documents/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId,
            s3Key,
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            uploadedById,
          }),
        })
        const doc = await confirmRes.json()
        if (!confirmRes.ok) throw new Error('Failed to confirm upload')

        setUploads(prev =>
          prev.map(u => (u.file === file ? { ...u, status: 'done' } : u))
        )
        setDocs(prev => [...prev, doc])
        onUploaded?.(doc)
      } catch (err) {
        setUploads(prev =>
          prev.map(u =>
            u.file === file
              ? { ...u, status: 'error', error: err instanceof Error ? err.message : 'Upload failed' }
              : u
          )
        )
      }
    }
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-indigo-300 hover:bg-indigo-50/20 transition-colors cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
      >
        <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-sm font-medium text-gray-600">Drop files here or <span className="text-indigo-600">browse</span></p>
        <p className="text-xs text-gray-400 mt-1">PDF, JPEG, PNG, WebP · Max {MAX_MB} MB each</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* Upload progress */}
      {uploads.map((upload, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
          <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">{upload.file.name}</p>
            <p className="text-[10px] text-gray-400">{formatBytes(upload.file.size)}</p>
          </div>
          {upload.status === 'uploading' && (
            <svg className="w-4 h-4 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {upload.status === 'done' && (
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {upload.status === 'error' && (
            <span className="text-[10px] text-red-600 font-medium">{upload.error}</span>
          )}
        </div>
      ))}

      {docs.length > 0 && (
        <p className="text-xs text-gray-500">{docs.length} document{docs.length !== 1 ? 's' : ''} uploaded successfully.</p>
      )}
    </div>
  )
}
