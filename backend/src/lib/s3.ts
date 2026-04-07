import { S3Client, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Works with both Cloudflare R2 and AWS S3.
// For R2: set R2_ENDPOINT to https://<account_id>.r2.cloudflarestorage.com
// For S3: omit R2_ENDPOINT and set AWS_REGION instead
export const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
})

const BUCKET = process.env.R2_BUCKET_NAME ?? process.env.AWS_S3_BUCKET ?? 'dwella-documents'

// Upload URL expires after 10 minutes — enough to complete a file upload
const UPLOAD_EXPIRY_SECONDS = 600

// Download URL expires after 15 minutes — short-lived for security
const DOWNLOAD_EXPIRY_SECONDS = 900

/**
 * Generate a presigned PUT URL so the client can upload directly to R2/S3.
 * The file never passes through our server.
 *
 * The s3Key should follow the pattern:
 *   applications/{applicationId}/{uuid}.{ext}
 *
 * Server-side encryption (AES-256) is enforced via the upload conditions.
 */
export async function getPresignedUploadUrl(
  s3Key: string,
  mimeType: string,
  maxBytes = 20 * 1024 * 1024 // 20 MB default limit
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
    ContentType: mimeType,
    ServerSideEncryption: 'AES256',
    Metadata: {
      'max-size': String(maxBytes),
    },
  })

  return getSignedUrl(s3Client, command, { expiresIn: UPLOAD_EXPIRY_SECONDS })
}

/**
 * Generate a presigned GET URL for a landlord to download a document.
 * Only call this after verifying the requesting user has access to this application.
 */
export async function getPresignedDownloadUrl(s3Key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
  })

  return getSignedUrl(s3Client, command, { expiresIn: DOWNLOAD_EXPIRY_SECONDS })
}

/**
 * Delete a document from storage (e.g. when application is withdrawn or deleted).
 */
export async function deleteDocument(s3Key: string): Promise<void> {
  await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: s3Key }))
}

/**
 * Check if a file exists in storage (used to confirm upload completed).
 */
export async function documentExists(s3Key: string): Promise<boolean> {
  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: s3Key }))
    return true
  } catch {
    return false
  }
}

/**
 * Build a safe S3 key for an application document.
 * Prevents path traversal by sanitizing the filename.
 */
export function buildDocumentKey(applicationId: string, fileName: string): string {
  const ext = fileName.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') ?? 'bin'
  const uuid = crypto.randomUUID()
  return `applications/${applicationId}/${uuid}.${ext}`
}
