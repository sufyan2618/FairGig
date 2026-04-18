import { integer, pgTable, varchar, date, index, text, boolean, timestamp, serial } from "drizzle-orm/pg-core";


export const productsTable = pgTable("products", {
    id: serial("id").primaryKey(),
    title : varchar("title", { length: 255 }).notNull(),
    description : text("description").notNull(),
    slug : varchar("slug", { length: 255 }).notNull().unique(),
    quantity : integer("quantity").notNull(),
    price : integer("price").notNull(),
    imageUrl : varchar("image_url", { length: 255 }).notNull(),
    createdAt : timestamp("created_at").defaultNow().notNull(),
    updatedAt : timestamp("updated_at").defaultNow().notNull(),
});