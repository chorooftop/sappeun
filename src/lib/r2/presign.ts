import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client } from './client'
import { getServerEnv } from '@/lib/utils/env'

const EXPIRES_IN_SECONDS = 600

export async function createPresignedUpload(params: {
  key: string
  contentType: string
  maxSizeBytes?: number
}): Promise<{ uploadUrl: string; expiresAt: string }> {
  const env = getServerEnv()
  const client = getR2Client()
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: params.key,
    ContentType: params.contentType,
    ContentLength: params.maxSizeBytes,
  })

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: EXPIRES_IN_SECONDS,
  })

  return {
    uploadUrl,
    expiresAt: new Date(Date.now() + EXPIRES_IN_SECONDS * 1000).toISOString(),
  }
}

export function publicPhotoUrl(key: string): string {
  const env = getServerEnv()
  if (env.R2_PUBLIC_URL) {
    return `${env.R2_PUBLIC_URL}/${key}`
  }
  return `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${key}`
}
