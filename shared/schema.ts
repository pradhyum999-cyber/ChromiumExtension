import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Extension Feature schema
export const extensionFeatures = pgTable("extension_features", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  enabled: boolean("enabled").notNull().default(true),
  config: text("config").notNull(),
});

// Extension Permission schema
export const extensionPermissions = pgTable("extension_permissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  granted: boolean("granted").notNull().default(false),
  lastUpdated: text("last_updated").notNull(),
});

// Extension Log schema
export const extensionLogs = pgTable("extension_logs", {
  id: serial("id").primaryKey(),
  level: text("level").notNull(),
  message: text("message").notNull(),
  timestamp: text("timestamp").notNull(),
});

// Extension Settings schema
export const extensionSettings = pgTable("extension_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

// Create insertion schemas
export const insertFeatureSchema = createInsertSchema(extensionFeatures).pick({
  name: true,
  enabled: true,
  config: true,
});

export const insertPermissionSchema = createInsertSchema(extensionPermissions).pick({
  name: true,
  granted: true,
  lastUpdated: true,
});

export const insertLogSchema = createInsertSchema(extensionLogs).pick({
  level: true,
  message: true,
  timestamp: true,
});

export const insertSettingSchema = createInsertSchema(extensionSettings).pick({
  key: true,
  value: true,
});

// Types
export type InsertFeature = z.infer<typeof insertFeatureSchema>;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type InsertLog = z.infer<typeof insertLogSchema>;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

export type Feature = typeof extensionFeatures.$inferSelect;
export type Permission = typeof extensionPermissions.$inferSelect;
export type Log = typeof extensionLogs.$inferSelect;
export type Setting = typeof extensionSettings.$inferSelect;
