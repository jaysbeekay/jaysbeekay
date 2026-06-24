import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

const KEY_PREFIX = "backups/";

function client(): S3Client {
  return new S3Client({
    endpoint: env.backup.s3.endpoint || undefined,
    region: env.backup.s3.region,
    forcePathStyle: env.backup.s3.forcePathStyle,
    credentials: {
      accessKeyId: env.backup.s3.accessKeyId,
      secretAccessKey: env.backup.s3.secretAccessKey,
    },
  });
}

export async function uploadToS3(data: Buffer, fileName: string): Promise<void> {
  await client().send(
    new PutObjectCommand({
      Bucket: env.backup.s3.bucket,
      Key: `${KEY_PREFIX}${fileName}`,
      Body: data,
    }),
  );
}

// Deletes the oldest backups beyond the configured retention count.
export async function pruneS3(retentionCount: number): Promise<void> {
  const s3 = client();
  const listing = await s3.send(
    new ListObjectsV2Command({ Bucket: env.backup.s3.bucket, Prefix: KEY_PREFIX }),
  );

  const objects = (listing.Contents ?? [])
    .filter((obj) => obj.Key && obj.LastModified)
    .sort((a, b) => b.LastModified!.getTime() - a.LastModified!.getTime());

  const toDelete = objects.slice(retentionCount);
  for (const obj of toDelete) {
    await s3.send(new DeleteObjectCommand({ Bucket: env.backup.s3.bucket, Key: obj.Key! }));
  }
}
