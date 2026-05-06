import { relations } from "drizzle-orm";
import { int, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { user } from "./auth";
import { location } from "./location";
import { locationLogImage } from "./location-log-image";

export const locationLog = sqliteTable("locationLog", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  description: text(),
  startAt: int().notNull(),
  endAt: int().notNull(),
  lat: real().notNull(),
  long: real().notNull(),
  locationId: int().notNull().references(() => location.id, { onDelete: "cascade" }),
  userId: int().notNull().references(() => user.id),
  createAt: int().notNull().$default(() => Date.now()),
  updateAt: int().notNull().$default(() => Date.now()).$onUpdate(() => Date.now()),
});

export const locationLogRelations = relations(locationLog, ({ one, many }) => ({
  location: one(location, {
    fields: [locationLog.locationId],
    references: [location.id],
  }),
  images: many(locationLogImage),
}));

export const InsertLocationLog = createInsertSchema(locationLog, {
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
  userId: true,
  locationId: true,
  createAt: true,
  updateAt: true,
});

export type InsertLocationLog = z.infer<typeof InsertLocationLog>;
export type SelectLocationLog = typeof locationLog.$inferSelect;
