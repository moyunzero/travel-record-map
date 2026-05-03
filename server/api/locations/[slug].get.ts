import { findLocation } from "~/lib/db/queries/location";
import defineAuthenticatedEventHandler from "~/utils/define-authenticated-event-handler";

export default defineAuthenticatedEventHandler(async (event) => {
  // await new Promise((resolve) => setTimeout(resolve, 1000)); // 模拟网络延迟
  const slug = getRouterParam(event, "slug") as string;
  return findLocation(slug, event.context.user.id);
});
