import type { InsertLocation } from "~/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import slugify from "slugify";
import db from "~/lib/db";
import { location } from "~/lib/db/schema";

/**
 * 生成唯一的 slug
 * @param name - 位置名称
 * @returns 带随机后缀的 slug
 */
export function generateLocationSlug(name: string): string {
  const baseSlug = slugify(name, {
    lower: false,
    strict: false,
    trim: true,
    replacement: "-",
    remove: /[*+~.()'"!:@]/g,
  });

  const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 5);
  return `${baseSlug}-${nanoid()}`;
}

/**
 * 创建位置记录
 * @param data - 位置数据（name, description, lat, long）
 * @param userId - 用户 ID
 * @returns 创建的位置记录
 */
export async function createLocation(data: InsertLocation, userId: number) {
  const slug = generateLocationSlug(data.name);

  const [created] = await db.insert(location).values({
    ...data,
    slug,
    userId,
  }).returning();

  return created;
}

/**
 * 检查错误是否为位置名称重复约束冲突
 * @param error - 捕获的错误对象
 * @returns 是否为名称重复错误
 */
export function isLocationNameDuplicateError(error: any): boolean {
  const errorCode = error.code || error.cause?.code || "";
  const causeMessage = error.cause?.message || "";

  return errorCode === "SQLITE_CONSTRAINT" && causeMessage.includes("location.name");
}

/**
 * 根据用户 ID 查找位置记录
 * @param userId - 用户 ID
 * @returns 位置记录列表
 */

export async function findLocations(userId: number) {
  return db.query.location.findMany({
    where: (location, { eq }) => eq(location.userId, userId),
  });
}

export async function findLocation(slug: string, userId: number) {
  return db.query.location.findFirst({
    where: and (
      eq(location.slug, slug),
      eq(location.userId, userId),
    ),
    with: {
      locationLogs: {
        with: {
          images: true,
        },
      },
    },
  });
}

export async function updateLocationBySlug(
  updates: InsertLocation,
  slug: string,
  userId: number,
) {
  const [updated] = await db.update(location).set(updates).where(and (
    eq(location.slug, slug),
    eq(location.userId, userId),
  )).returning();
  return updated;
}

export async function removeLocationBySlug(
  slug: string,
  userId: number,
) {
  const [removed] = await db.delete(location)
    .where(and (
      eq(location.slug, slug),
      eq(location.userId, userId),
    ))
    .returning();
  return removed;
}
