import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";
import { env } from "@/lib/env";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function contractDir(contractId: string) {
  return path.join(path.resolve(env.uploadsDir), contractId);
}

function productDir(productId: string) {
  return path.join(path.resolve(env.uploadsDir), "products", productId);
}

function tripSegmentDir(tripSegmentId: string) {
  return path.join(path.resolve(env.uploadsDir), "trip-segments", tripSegmentId);
}

// storedName is always a freshly generated UUID plus a sanitized extension,
// never derived from the user-supplied filename, to avoid path traversal.
function safeExtension(filename: string) {
  const ext = path.extname(filename).toLowerCase().replace(/[^a-z0-9.]/g, "");
  return ext.length > 0 && ext.length <= 10 ? ext : "";
}

export async function saveDocument(contractId: string, file: File) {
  const dir = contractDir(contractId);
  await fs.mkdir(dir, { recursive: true });

  const storedName = `${randomUUID()}${safeExtension(file.name)}`;
  const fullPath = path.join(dir, storedName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(fullPath, buffer);

  return { storedName, size: buffer.byteLength };
}

export async function readDocument(contractId: string, storedName: string) {
  const fullPath = path.join(contractDir(contractId), storedName);
  return fs.readFile(fullPath);
}

export async function deleteDocument(contractId: string, storedName: string) {
  const fullPath = path.join(contractDir(contractId), storedName);
  await fs.rm(fullPath, { force: true });
}

export async function deleteContractDir(contractId: string) {
  await fs.rm(contractDir(contractId), { recursive: true, force: true });
}

export async function saveProductDocument(productId: string, file: File) {
  const dir = productDir(productId);
  await fs.mkdir(dir, { recursive: true });

  const storedName = `${randomUUID()}${safeExtension(file.name)}`;
  const fullPath = path.join(dir, storedName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(fullPath, buffer);

  return { storedName, size: buffer.byteLength };
}

export async function readProductDocument(productId: string, storedName: string) {
  const fullPath = path.join(productDir(productId), storedName);
  return fs.readFile(fullPath);
}

export async function deleteProductDocument(productId: string, storedName: string) {
  const fullPath = path.join(productDir(productId), storedName);
  await fs.rm(fullPath, { force: true });
}

export async function deleteProductDir(productId: string) {
  await fs.rm(productDir(productId), { recursive: true, force: true });
}

export async function saveTripSegmentDocument(tripSegmentId: string, file: File) {
  const dir = tripSegmentDir(tripSegmentId);
  await fs.mkdir(dir, { recursive: true });

  const storedName = `${randomUUID()}${safeExtension(file.name)}`;
  const fullPath = path.join(dir, storedName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(fullPath, buffer);

  return { storedName, size: buffer.byteLength };
}

export async function readTripSegmentDocument(tripSegmentId: string, storedName: string) {
  const fullPath = path.join(tripSegmentDir(tripSegmentId), storedName);
  return fs.readFile(fullPath);
}

export async function deleteTripSegmentDocument(tripSegmentId: string, storedName: string) {
  const fullPath = path.join(tripSegmentDir(tripSegmentId), storedName);
  await fs.rm(fullPath, { force: true });
}

export async function deleteTripSegmentDir(tripSegmentId: string) {
  await fs.rm(tripSegmentDir(tripSegmentId), { recursive: true, force: true });
}
