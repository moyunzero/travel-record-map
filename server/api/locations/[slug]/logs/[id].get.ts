import { findLocationLog } from "~/lib/db/queries/location-log";
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

  // 查询日志记录
  const log = await findLocationLog(id, event.context.user.id);

  if (!log) {
    return sendError(event, createError({
      statusCode: 404,
      statusMessage: "日志不存在",
    }));
  }

  return log;
});
