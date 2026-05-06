import { findLocation } from "~/lib/db/queries/location";
import defineAuthenticatedEventHandler from "~/utils/define-authenticated-event-handler";

export default defineAuthenticatedEventHandler(async (event) => {
  // await new Promise((resolve) => setTimeout(resolve, 1000)); // 模拟网络延迟
  const slug = getRouterParam(event, "slug") as string;
  const location = await findLocation(slug, event.context.user.id);

  if (!location) {
    throw createError({
      statusCode: 404,
      statusMessage: "地点不存在",
    });
  }

  return location;
});
