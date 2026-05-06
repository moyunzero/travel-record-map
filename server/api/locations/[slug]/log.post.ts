import { findLocation } from "~/lib/db/queries/location";
import { createLocationLog } from "~/lib/db/queries/location-log";
import { InsertLocationLog } from "~/lib/db/schema/location-log";
import defineAuthenticatedEventHandler from "~/utils/define-authenticated-event-handler";

export default defineAuthenticatedEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug") as string;

  // 验证请求体
  const result = await readValidatedBody(event, InsertLocationLog.safeParse);

  if (!result.success) {
    return sendError(event, createError({
      statusCode: 422,
      statusMessage: "无效的请求数据",
    }));
  }

  // 验证父地点存在且属于当前用户
  const parentLocation = await findLocation(slug, event.context.user.id);

  if (!parentLocation) {
    return sendError(event, createError({
      statusCode: 404,
      statusMessage: "地点不存在",
    }));
  }

  // 创建日志记录
  const created = await createLocationLog(
    result.data,
    parentLocation.id,
    event.context.user.id,
  );

  return created;
});
