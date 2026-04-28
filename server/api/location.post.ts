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
      statusMessage: "无效的请求数据:",
    }));
  }

  const [created] = await db.insert(location).values({
    ...result.data,
    slug: result.data.name.replaceAll(" ", "-").toLowerCase(),
    userId: event.context.user.id,
  }).returning();

  return created;
});
