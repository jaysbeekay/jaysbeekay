import SftpClient from "ssh2-sftp-client";
import { env } from "@/lib/env";

async function withConnection<T>(fn: (client: SftpClient) => Promise<T>): Promise<T> {
  const client = new SftpClient();
  try {
    await client.connect({
      host: env.backup.sftp.host,
      port: env.backup.sftp.port,
      username: env.backup.sftp.username,
      password: env.backup.sftp.password || undefined,
      privateKey: env.backup.sftp.privateKey || undefined,
    });
    return await fn(client);
  } finally {
    await client.end();
  }
}

export async function uploadToSftp(data: Buffer, fileName: string): Promise<void> {
  await withConnection(async (client) => {
    await client.mkdir(env.backup.sftp.remotePath, true);
    await client.put(data, `${env.backup.sftp.remotePath}/${fileName}`);
  });
}

// Deletes the oldest backups beyond the configured retention count.
export async function pruneSftp(retentionCount: number): Promise<void> {
  await withConnection(async (client) => {
    const entries = await client.list(env.backup.sftp.remotePath);
    const files = entries
      .filter((entry) => entry.type === "-")
      .sort((a, b) => b.modifyTime - a.modifyTime);

    const toDelete = files.slice(retentionCount);
    for (const file of toDelete) {
      await client.delete(`${env.backup.sftp.remotePath}/${file.name}`);
    }
  });
}
