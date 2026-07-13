-- Restrict the portfolios bucket to actual image/video files. The upload UI
-- already filters by accept="image/*" / "video/*", but that's client-side
-- only — without this, any file type could be uploaded and served publicly,
-- which matters now that images are served with an inline Content-Disposition.
update storage.buckets
set allowed_mime_types = array[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'video/mp4',
  'video/quicktime',
  'video/webm'
]
where id = 'portfolios';
