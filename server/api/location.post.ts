import { customAlphabet } from "nanoid";
import slugify from "slugify";
import db from "~/lib/db";
import { InsertLocation, location } from "~/lib/db/schema";

export default defineEventHandler(async (event) => {
  if (!event.context.user) {
    return sendError(event, createError({
      statusCode: 401,
      statusMessage: "未授权",
    }));
  }

  const result = await readValidatedBody(event, InsertLocation.safeParse);

  if (!result.success) {
    return sendError(event, createError({
      statusCode: 422,
      statusMessage: "无效的请求数据",
    }));
  }

  // 生成 slug：使用 slugify 处理特殊字符，保留中文
  // 添加随机后缀确保全局唯一性（因为不同用户可以创建同名位置）
  const baseSlug = slugify(result.data.name, {
    lower: false,
    strict: false,
    trim: true,
    replacement: "-",
    remove: /[*+~.()'"!:@]/g,
  });

  const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 5);
  const slug = `${baseSlug}-${nanoid()}`;

  try {
    const [created] = await db.insert(location).values({
      ...result.data,
      slug,
      userId: event.context.user.id,
    }).returning();

    return created;
  }
  catch (e) {
    const error = e as any;
    const errorCode = error.code || error.cause?.code || "";
    const causeMessage = error.cause?.message || "";

    // 检查是否是 name + userId 唯一约束冲突
    if (errorCode === "SQLITE_CONSTRAINT" && causeMessage.includes("location.name")) {
      return sendError(event, createError({
        statusCode: 409,
        statusMessage: "您已经创建过同名的位置",
      }));
    }

    // 重新抛出其他错误
    throw error;
  }
});
