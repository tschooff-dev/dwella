import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'
import {
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  buildDocumentKey,
  documentExists,
  deleteDocument,
} from '../lib/s3'

export const documentsRouter = Router()

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

/**
 * POST /api/documents/upload-url
 *
 * Returns a presigned PUT URL so the client can upload directly to R2/S3.
 * The file bytes never pass through our server.
 *
 * After the client uploads, it must call POST /api/documents/confirm
 * to register the document in the database.
 *
 * Body: { applicationId, fileName, mimeType, sizeBytes, uploadedById }
 */
documentsRouter.post('/upload-url', async (req, res) => {
  try {
    const { applicationId, fileName, mimeType, sizeBytes, uploadedById } = req.body

    if (!applicationId || !fileName || !mimeType) {
      return res.status(400).json({ error: 'applicationId, fileName, and mimeType are required' })
    }

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return res.status(400).json({ error: 'File type not allowed. Accepted: PDF, JPEG, PNG, WebP' })
    }

    if (sizeBytes && sizeBytes > MAX_FILE_SIZE) {
      return res.status(400).json({ error: 'File exceeds 20 MB limit' })
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    })
    if (!application) {
      return res.status(404).json({ error: 'Application not found' })
    }

    const s3Key = buildDocumentKey(applicationId, fileName)
    const uploadUrl = await getPresignedUploadUrl(s3Key, mimeType, MAX_FILE_SIZE)

    res.json({ uploadUrl, s3Key })
  } catch (err) {
    console.error('Upload URL error:', err)
    res.status(500).json({ error: 'Failed to generate upload URL' })
  }
})

/**
 * POST /api/documents/confirm
 *
 * Called after a successful direct upload to confirm the file exists
 * and register it in the database.
 *
 * Body: { applicationId, s3Key, fileName, mimeType, sizeBytes, uploadedById }
 */
documentsRouter.post('/confirm', async (req, res) => {
  try {
    const { applicationId, s3Key, fileName, mimeType, sizeBytes, uploadedById } = req.body

    if (!applicationId || !s3Key || !fileName || !mimeType) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Verify the file actually exists in storage before recording it
    const exists = await documentExists(s3Key)
    if (!exists) {
      return res.status(400).json({ error: 'File not found in storage. Upload may have failed.' })
    }

    const document = await prisma.document.create({
      data: {
        applicationId,
        uploadedById: uploadedById ?? null,
        name: fileName,
        s3Key,
        mimeType,
        sizeBytes: sizeBytes ?? null,
      },
    })

    res.status(201).json({ id: document.id, name: document.name, createdAt: document.createdAt })
  } catch (err) {
    console.error('Document confirm error:', err)
    res.status(500).json({ error: 'Failed to confirm document' })
  }
})

/**
 * GET /api/documents/:applicationId
 *
 * List all documents for an application (metadata only, no file contents).
 * Only the landlord who owns the property may call this.
 */
documentsRouter.get('/:applicationId', requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.applicationId },
      include: { unit: { include: { property: { include: { landlord: { select: { clerkId: true } } } } } } },
    })
    if (!application) return res.status(404).json({ error: 'Application not found' })
    if (application.unit.property.landlord.clerkId !== authReq.auth.userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const documents = await prisma.document.findMany({
      where: { applicationId: req.params.applicationId },
      select: { id: true, name: true, mimeType: true, sizeBytes: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(documents)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch documents' })
  }
})

/**
 * GET /api/documents/:applicationId/:documentId/download
 *
 * Returns a short-lived presigned download URL (15 min).
 * Only the landlord who owns the property may download.
 */
documentsRouter.get('/:applicationId/:documentId/download', requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.documentId, applicationId: req.params.applicationId },
      include: {
        application: {
          include: { unit: { include: { property: { include: { landlord: { select: { clerkId: true } } } } } } },
        },
      },
    })

    if (!document) return res.status(404).json({ error: 'Document not found' })

    if (document.application.unit.property.landlord.clerkId !== authReq.auth.userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const downloadUrl = await getPresignedDownloadUrl(document.s3Key)
    res.json({ downloadUrl, expiresInSeconds: 900 })
  } catch (err) {
    console.error('Download URL error:', err)
    res.status(500).json({ error: 'Failed to generate download URL' })
  }
})

/**
 * DELETE /api/documents/:applicationId/:documentId
 *
 * Removes a document from both storage and the database.
 */
documentsRouter.delete('/:applicationId/:documentId', async (req, res) => {
  try {
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.documentId,
        applicationId: req.params.applicationId,
      },
    })

    if (!document) {
      return res.status(404).json({ error: 'Document not found' })
    }

    await deleteDocument(document.s3Key)
    await prisma.document.delete({ where: { id: document.id } })

    res.status(204).send()
  } catch (err) {
    console.error('Document delete error:', err)
    res.status(500).json({ error: 'Failed to delete document' })
  }
})
