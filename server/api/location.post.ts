import { createLocation, isLocationNameDuplicateError } from "~/lib/db/queries/location";
import { InsertLocation } from "~/lib/db/schema";
import defineAuthenticatedEventHandler from "~/utils/define-authenticated-event-handler";

export default defineAuthenticatedEventHandler(async (event) => {
  const result = await readValidatedBody(event, InsertLocation.safeParse);

  if (!result.success) {
    return sendError(event, createError({
      statusCode: 422,
      statusMessage: "无效的请求数据",
    }));
  }

  try {
    const created = await createLocation(result.data, event.context.user.id);
    return created;
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
