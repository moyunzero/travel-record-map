import type { SelectLocationLog } from "./location-log";
import type { SelectLocationLogImage } from "./location-log-image";
import { relations } from "drizzle-orm";
import { int, real, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { user } from "./auth";
import { locationLog } from "./location-log";

export const location = sqliteTable("location", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  slug: text().notNull().unique(),
  description: text(),
  lat: real().notNull(),
  long: real().notNull(),
  userId: int().notNull().references(() => user.id),
  createAt: int().notNull().$default(() => Date.now()),
  updateAt: int().notNull().$default(() => Date.now()).$onUpdate(() => Date.now()),
}, t => [
  unique().on(t.name, t.userId),
]);

export const locationRelations = relations(location, ({ many }) => ({
  locationLogs: many(locationLog),
}));

export const InsertLocation = createInsertSchema(location, {
  name: z.string({ message: "名称不能为空" }).min(1, "名称不能为空").max(100, "名称最多 100 个字符"),
  description: field => field.max(1000).optional(),
  lat: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined)
        return undefined;
      return Number(val);
    },
    z.number({ message: "纬度不能为空" })
      .min(-90, "纬度必须在 -90 和 90 之间")
      .max(90, "纬度必须在 -90 和 90 之间"),
  ),
  long: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined)
        return undefined;
      return Number(val);
    },
    z.number({ message: "经度不能为空" })
      .min(-180, "经度必须在 -180 和 180 之间")
      .max(180, "经度必须在 -180 和 180 之间"),
  ),
}).omit({
  id: true,
  slug: true,
  userId: true,
  createAt: true,
  updateAt: true,
});

export type InsertLocation = z.infer<typeof InsertLocation>;
export type SelectLocation = typeof location.$inferSelect;

export type SelectLocationLogWithImages = SelectLocationLog & {
  images: SelectLocationLogImage[];
};

export type SelectLocationWithLog = SelectLocation & {
  locationLogs: SelectLocationLogWithImages[];
};
