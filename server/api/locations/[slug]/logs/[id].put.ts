import { findLocationLog, updateLocationLog } from "~/lib/db/queries/location-log";
import { InsertLocationLog } from "~/lib/db/schema/location-log";
import defineAuthenticatedEventHandler from "~/utils/define-authenticated-event-handler";

export default defineAuthenticatedEventHandler(async (event) => {
  const idParam = getRouterParam(event, "id") as string;
  const id = Number.parseInt(idParam, 10);

  // 验证 ID 是否为有效数字
  if (Number.isNaN(id)) {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: "无效的日志 ID",
    }));
  }

  // 验证请求体
  const result = await readValidatedBody(event, InsertLocationLog.safeParse);

  if (!result.success) {
    return sendError(event, createError({
      statusCode: 422,
      statusMessage: "无效的请求数据",
    }));
  }

  // 检查日志是否存在且属于当前用户
  const existingLog = await findLocationLog(id, event.context.user.id);

  if (!existingLog) {
    return sendError(event, createError({
      statusCode: 404,
      statusMessage: "日志不存在",
    }));
  }

  // 更新日志
  const updated = await updateLocationLog(result.data, id, event.context.user.id);

  if (!updated) {
    return sendError(event, createError({
      statusCode: 404,
      statusMessage: "更新失败，日志不存在",
    }));
  }

  return updated;
});
