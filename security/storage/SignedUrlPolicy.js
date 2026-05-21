export const SIGNED_URL_TTL_SECONDS = Object.freeze({
  upload: 300,
  download: 180,
  preview: 120,
});

export function getSignedUrlTtl(kind = 'download') {
  return SIGNED_URL_TTL_SECONDS[kind] || SIGNED_URL_TTL_SECONDS.download;
}

export function assertPrivateBucket(isPublic, bucketName) {
  if (isPublic) {
    throw new Error(`Bucket must be private: ${bucketName}`);
  }
  return true;
}
