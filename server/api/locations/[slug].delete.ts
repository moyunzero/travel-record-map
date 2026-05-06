import { removeLocationBySlug } from "~/lib/db/queries/location";
import defineAuthenticatedEventHandler from "~/utils/define-authenticated-event-handler";

export default defineAuthenticatedEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug") as string;
  const deleted = await removeLocationBySlug(slug, event.context.user.id);
  if (!deleted) {
    return sendError(event, createError({
      statusCode: 404,
      statusMessage: "地点未找到",
    }));
  }

  setResponseStatus(event, 204);
});
