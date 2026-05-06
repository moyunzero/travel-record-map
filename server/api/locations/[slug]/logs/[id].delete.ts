import { removeLocationLog } from "~/lib/db/queries/location-log";
import defineAuthenticatedEventHandler from "~/utils/define-authenticated-event-handler";

export default defineAuthenticatedEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  // 验证 ID 参数
  const logId = Number(id);
  if (Number.isNaN(logId)) {
    return sendError(event, createError({
      statusCode: 422,
      statusMessage: "无效的日志 ID",
    }));
  }

  // 删除日志记录
  const deleted = await removeLocationLog(logId, event.context.user.id);

  if (!deleted) {
    return sendError(event, createError({
      statusCode: 404,
      statusMessage: "日志不存在或已被删除",
    }));
  }

  return { success: true };
});
