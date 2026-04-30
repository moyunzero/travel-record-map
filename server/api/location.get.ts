import { findLocations } from "~/lib/db/queries/location";
import defineAuthenticatedEventHandler from "~/utils/define-authenticated-event-handler";

export default defineAuthenticatedEventHandler(async (event) => {
  // await new Promise((resolve) => setTimeout(resolve, 1000)); // 模拟网络延迟
  return findLocations(event.context.user.id);
});
