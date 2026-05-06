import type { InsertLocationLog } from "~/lib/db/schema/location-log";
import { and, eq } from "drizzle-orm";
import db from "~/lib/db";
import { locationLog, locationLogImage } from "~/lib/db/schema";

/**
 * 创建日志记录
 * @param data - 日志数据
 * @param locationId - 关联的地点 ID
 * @param userId - 用户 ID
 * @returns 创建的日志记录
 */
export async function createLocationLog(
  data: InsertLocationLog,
  locationId: number,
  userId: number,
) {
  const [created] = await db.insert(locationLog).values({
    ...data,
    locationId,
    userId,
  }).returning();

  return created;
}

/**
 * 根据 ID 查找日志记录
 * @param id - 日志 ID
 * @param userId - 用户 ID
 * @returns 日志记录或 undefined
 */
export async function findLocationLog(id: number, userId: number) {
  return db.query.locationLog.findFirst({
    where: and(
      eq(locationLog.id, id),
      eq(locationLog.userId, userId),
    ),
  });
}

/**
 * 更新日志记录
 * @param updates - 更新的数据
 * @param id - 日志 ID
 * @param userId - 用户 ID
 * @returns 更新后的日志记录或 undefined
 */
export async function updateLocationLog(
  updates: InsertLocationLog,
  id: number,
  userId: number,
) {
  const [updated] = await db.update(locationLog)
    .set(updates)
    .where(and(
      eq(locationLog.id, id),
      eq(locationLog.userId, userId),
    ))
    .returning();

  return updated;
}

/**
 * 删除日志记录
 * @param id - 日志 ID
 * @param userId - 用户 ID
 * @returns 删除的日志记录或 undefined
 */
export async function removeLocationLog(id: number, userId: number) {
  const [removed] = await db.delete(locationLog)
    .where(and(
      eq(locationLog.id, id),
      eq(locationLog.userId, userId),
    ))
    .returning();

  return removed;
}

/**
 * 创建图片记录
 * @param key - S3 文件 key
 * @param locationLogId - 关联的日志 ID
 * @param userId - 用户 ID
 * @returns 创建的图片记录
 */
export async function createLocationLogImage(
  key: string,
  locationLogId: number,
  userId: number,
) {
  const [created] = await db.insert(locationLogImage).values({
    key,
    locationLogId,
    userId,
  }).returning();

  return created;
}

/**
 * 根据 ID 查找图片记录
 * @param id - 图片 ID
 * @param userId - 用户 ID
 * @returns 图片记录或 undefined
 */
export async function findLocationLogImage(id: number, userId: number) {
  return db.query.locationLogImage.findFirst({
    where: and(
      eq(locationLogImage.id, id),
      eq(locationLogImage.userId, userId),
    ),
  });
}

/**
 * 删除图片记录
 * @param id - 图片 ID
 * @param userId - 用户 ID
 * @returns 删除的图片记录或 undefined
 */
export async function deleteLocationLogImage(id: number, userId: number) {
  const [deleted] = await db.delete(locationLogImage)
    .where(and(
      eq(locationLogImage.id, id),
      eq(locationLogImage.userId, userId),
    ))
    .returning();

  return deleted;
}
