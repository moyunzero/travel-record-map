import { createLocationLogImage, findLocationLog } from "~/lib/db/queries/location-log";
import { InsertLocationLogImage } from "~/lib/db/schema/location-log-image";
import defineAuthenticatedEventHandler from "~/utils/define-authenticated-event-handler";

export default defineAuthenticatedEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug") as string;
  const logId = getRouterParam(event, "id") as string;

  // 读取请求体
  const body = await readBody(event);

  // 验证请求体
  const result = InsertLocationLogImage.safeParse(body);

  if (!result.success) {
    return sendError(event, createError({
      statusCode: 422,
      statusMessage: "无效的请求数据",
      data: result.error.errors,
    }));
  }

  // 验证日志存在且属于当前用户
  const locationLog = await findLocationLog(Number.parseInt(logId), event.context.user.id);

  if (!locationLog) {
    return sendError(event, createError({
      statusCode: 404,
      statusMessage: "日志不存在",
    }));
  }

  // 创建图片记录
  const created = await createLocationLogImage(
    result.data.key,
    Number.parseInt(logId),
    event.context.user.id,
  );

  return created;
});
