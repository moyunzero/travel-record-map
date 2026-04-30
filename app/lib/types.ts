import type { UserWithId } from "./auth";

declare module "h3" {
  interface H3EventContext {
    user?: UserWithId;
  }
}
 