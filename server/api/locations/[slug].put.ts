import { findLocation, isLocationNameDuplicateError, updateLocationBySlug } from "~/lib/db/queries/location";
import { InsertLocation } from "~/lib/db/schema";
import defineAuthenticatedEventHandler from "~/utils/define-authenticated-event-handler";

export default defineAuthenticatedEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug") as string;

  // 验证请求体
  const result = await readValidatedBody(event, InsertLocation.safeParse);

  if (!result.success) {
    return sendError(event, createError({
      statusCode: 422,
      statusMessage: "无效的请求数据",
    }));
  }

  // 检查地点是否存在
  const existingLocation = await findLocation(slug, event.context.user.id);

  if (!existingLocation) {
    return sendError(event, createError({
      statusCode: 404,
      statusMessage: "地点不存在",
    }));
  }

  try {
    // 更新地点
    const updated = await updateLocationBySlug(result.data, slug, event.context.user.id);

    if (!updated) {
      return sendError(event, createError({
        statusCode: 404,
        statusMessage: "更新失败，地点不存在",
      }));
    }

    return updated;
  }
  catch (e) {
    // 检查是否是 name + userId 唯一约束冲突
    if (isLocationNameDuplicateError(e)) {
      return sendError(event, createError({
        statusCode: 409,
        statusMessage: "您已经创建过同名的位置",
      }));
    }

    // 重新抛出其他错误
    throw e;
  }
});
