import type { UserWithId } from "./auth";

declare module "h3" {
  type H3EventContext = {
    user?: UserWithId;
  };
}

export type LatLongItem = {
  lat: number;
  long: number;
};

export type MapPoint = {
  id: number;
  label: string;
} & LatLongItem;
