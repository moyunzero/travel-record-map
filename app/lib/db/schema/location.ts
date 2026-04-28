import { int, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { user } from "./auth";

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

});

export const InsertLocation = createInsertSchema(location, {
  name: field => field.min(1, "名称不能为空").max(100),
  description: field => field.max(1000).optional(),
  lat: z.coerce.number().min(-90, "纬度必须在 -90 和 90 之间").max(90, "纬度必须在 -90 和 90 之间"),
  long: z.coerce.number().min(-180, "经度必须在 -180 和 180 之间").max(180, "经度必须在 -180 和 180 之间"),
}).omit({
  id: true,
  slug: true,
  userId: true,
  createAt: true,
  updateAt: true,
});
