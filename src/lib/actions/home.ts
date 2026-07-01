"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { propertySchema, homeItemSchema } from "@/lib/validation/home";
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  deleteHomeItemDir,
  deleteHomeItemDocument as deleteHomeItemDocumentFile,
  saveHomeItemDocument,
} from "@/lib/storage";
import { formDataToStringValues } from "@/lib/form-state";
import { isModuleEnabled } from "@/lib/modules/enablement";
import type { ActionState } from "@/lib/actions/auth";

const PROPERTY_FORM_FIELDS = ["label", "address", "notes"];

const HOME_ITEM_FORM_FIELDS = ["type", "title", "provider", "date", "cost", "currency", "notes"];

function firstIssueMessage(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Invalid input";
}

async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in");
  if (!(await isModuleEnabled("HOME"))) throw new Error("Home module is disabled");
  return session.user;
}

async function attachItemDocument(homeItemId: string, file: File): Promise<ActionState | null> {
  if (file.size > MAX_UPLOAD_BYTES) return { error: "File is too large (15MB max)." };
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { error: "Unsupported file type. Use PDF, Word, or image files." };
  }

  const { storedName, size } = await saveHomeItemDocument(homeItemId, file);
  await prisma.homeItemDocument.create({
    data: {
      homeItemId,
      filename: file.name.slice(0, 255),
      storedName,
      mimeType: file.type,
      size,
    },
  });
  return null;
}

function formToPropertyInput(formData: FormData) {
  return {
    label: formData.get("label"),
    address: formData.get("address"),
    notes: formData.get("notes"),
  };
}

function formToHomeItemInput(formData: FormData) {
  return {
    type: formData.get("type"),
    title: formData.get("title"),
    provider: formData.get("provider"),
    date: formData.get("date"),
    cost: formData.get("cost"),
    currency: formData.get("currency") || "AUD",
    notes: formData.get("notes"),
  };
}

export async function createProperty(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = propertySchema.safeParse(formToPropertyInput(formData));
  if (!parsed.success) {
    return {
      error: firstIssueMessage(parsed.error),
      values: formDataToStringValues(formData, PROPERTY_FORM_FIELDS),
    };
  }

  const property = await prisma.property.create({
    data: { ...parsed.data, createdById: user.id },
  });

  revalidatePath("/home");
  redirect(`/home/${property.id}`);
}

export async function updateProperty(
  propertyId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();

  const parsed = propertySchema.safeParse(formToPropertyInput(formData));
  if (!parsed.success) {
    return {
      error: firstIssueMessage(parsed.error),
      values: formDataToStringValues(formData, PROPERTY_FORM_FIELDS),
    };
  }

  const existing = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!existing) return { error: "Property not found." };

  await prisma.property.update({ where: { id: propertyId }, data: parsed.data });

  revalidatePath("/home");
  revalidatePath(`/home/${propertyId}`);
  redirect(`/home/${propertyId}`);
}

export async function deleteProperty(propertyId: string): Promise<ActionState> {
  await requireUser();

  const existing = await prisma.property.findUnique({
    where: { id: propertyId },
    include: { items: { select: { id: true } } },
  });
  if (!existing) return { error: "Property not found." };

  // Cascade removes the DB rows but not the uploaded files — clean those up first.
  for (const item of existing.items) {
    await deleteHomeItemDir(item.id);
  }

  await prisma.property.delete({ where: { id: propertyId } });

  revalidatePath("/home");
  redirect("/home");
}

export async function addHomeItem(
  propertyId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return { error: "Property not found." };

  const parsed = homeItemSchema.safeParse(formToHomeItemInput(formData));
  if (!parsed.success) {
    return {
      error: firstIssueMessage(parsed.error),
      values: formDataToStringValues(formData, HOME_ITEM_FORM_FIELDS),
    };
  }

  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_UPLOAD_BYTES) return { error: "File is too large (15MB max)." };
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return { error: "Unsupported file type. Use PDF, Word, or image files." };
    }
  }

  const item = await prisma.homeItem.create({
    data: { ...parsed.data, propertyId },
  });

  if (file instanceof File && file.size > 0) {
    await attachItemDocument(item.id, file);
  }

  revalidatePath(`/home/${propertyId}`);
  redirect(`/home/${propertyId}`);
}

export async function updateHomeItem(
  propertyId: string,
  itemId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();

  const parsed = homeItemSchema.safeParse(formToHomeItemInput(formData));
  if (!parsed.success) {
    return {
      error: firstIssueMessage(parsed.error),
      values: formDataToStringValues(formData, HOME_ITEM_FORM_FIELDS),
    };
  }

  const existing = await prisma.homeItem.findUnique({ where: { id: itemId } });
  if (!existing || existing.propertyId !== propertyId) return { error: "Item not found." };

  await prisma.homeItem.update({ where: { id: itemId }, data: parsed.data });

  revalidatePath(`/home/${propertyId}`);
  redirect(`/home/${propertyId}`);
}

export async function deleteHomeItem(propertyId: string, itemId: string): Promise<ActionState> {
  await requireUser();

  const existing = await prisma.homeItem.findUnique({ where: { id: itemId } });
  if (!existing || existing.propertyId !== propertyId) return { error: "Item not found." };

  await prisma.homeItem.delete({ where: { id: itemId } });
  await deleteHomeItemDir(itemId);

  revalidatePath(`/home/${propertyId}`);
  return { success: "Item removed." };
}

export async function addItemDocument(
  itemId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }

  const item = await prisma.homeItem.findUnique({ where: { id: itemId } });
  if (!item) return { error: "Item not found." };

  const error = await attachItemDocument(itemId, file);
  if (error) return error;

  revalidatePath(`/home/${item.propertyId}`);
  return { success: "Document uploaded." };
}

export async function deleteItemDocumentAction(
  itemId: string,
  documentId: string,
): Promise<ActionState> {
  await requireUser();

  const doc = await prisma.homeItemDocument.findUnique({ where: { id: documentId } });
  if (!doc || doc.homeItemId !== itemId) {
    return { error: "Document not found." };
  }

  const item = await prisma.homeItem.findUnique({ where: { id: itemId } });

  await prisma.homeItemDocument.delete({ where: { id: documentId } });
  await deleteHomeItemDocumentFile(itemId, doc.storedName);

  if (item) revalidatePath(`/home/${item.propertyId}`);
  return { success: "Document removed." };
}
