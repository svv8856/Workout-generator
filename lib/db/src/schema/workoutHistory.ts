import { pgTable, text, bigint, jsonb, serial, index } from "drizzle-orm/pg-core";

export const workoutHistory = pgTable(
  "workout_history",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    ts: bigint("ts", { mode: "number" }).notNull(),
    muscles: jsonb("muscles").$type<string[]>().notNull(),
    focus: text("focus"),
  },
  (t) => [index("workout_history_user_ts_idx").on(t.userId, t.ts)],
);

export type WorkoutHistoryRow = typeof workoutHistory.$inferSelect;
export type InsertWorkoutHistory = typeof workoutHistory.$inferInsert;
