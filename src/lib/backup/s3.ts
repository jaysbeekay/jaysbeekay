import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getS3Config } from "@/lib/appSettings";

const KEY_PREFIX = "backups/";

async function getClient(): Promise<{ s3: S3Client; cfg: Awaited<ReturnType<typeof getS3Config>> }> {
  const cfg = await getS3Config();
  const s3 = new S3Client({
    endpoint: cfg.endpoint || undefined,
    region: cfg.region,
    forcePathStyle: cfg.forcePathStyle,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
  return { s3, cfg };
}

export async function uploadToS3(data: Buffer, fileName: string): Promise<void> {
  const { s3, cfg } = await getClient();
  await s3.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: `${KEY_PREFIX}${fileName}`,
      Body: data,
    }),
  );
}

export async function pruneS3(retentionCount: number): Promise<void> {
  const { s3, cfg } = await getClient();
  const listing = await s3.send(
    new ListObjectsV2Command({ Bucket: cfg.bucket, Prefix: KEY_PREFIX }),
  );

  const objects = (listing.Contents ?? [])
    .filter((obj) => obj.Key && obj.LastModified)
    .sort((a, b) => b.LastModified!.getTime() - a.LastModified!.getTime());

  const toDelete = objects.slice(retentionCount);
  for (const obj of toDelete) {
    await s3.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: obj.Key! }));
  }
}
