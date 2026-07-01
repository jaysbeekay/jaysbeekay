import SftpClient from "ssh2-sftp-client";
import { getSftpConfig } from "@/lib/appSettings";

async function withConnection<T>(fn: (client: SftpClient) => Promise<T>): Promise<T> {
  const cfg = await getSftpConfig();
  const client = new SftpClient();
  try {
    await client.connect({
      host: cfg.host,
      port: cfg.port,
      username: cfg.username,
      password: cfg.password || undefined,
      privateKey: cfg.privateKey || undefined,
    });
    return await fn(client);
  } finally {
    await client.end();
  }
}

export async function uploadToSftp(data: Buffer, fileName: string): Promise<void> {
  const cfg = await getSftpConfig();
  await withConnection(async (client) => {
    await client.mkdir(cfg.remotePath, true);
    await client.put(data, `${cfg.remotePath}/${fileName}`);
  });
}

export async function pruneSftp(retentionCount: number): Promise<void> {
  const cfg = await getSftpConfig();
  await withConnection(async (client) => {
    const entries = await client.list(cfg.remotePath);
    const files = entries
      .filter((entry) => entry.type === "-")
      .sort((a, b) => b.modifyTime - a.modifyTime);

    const toDelete = files.slice(retentionCount);
    for (const file of toDelete) {
      await client.delete(`${cfg.remotePath}/${file.name}`);
    }
  });
}
