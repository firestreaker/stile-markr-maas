import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

const timestamps = {
  updated_at: integer({ mode: "timestamp" })
    .notNull()
    .$onUpdate(() => new Date()),
  created_at: integer({ mode: "timestamp" })
    .notNull()
    .$default(() => new Date()),
};

export const students = sqliteTable("students", {
  id: integer().primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  ...timestamps,
});

export const results = sqliteTable(
  "results",
  {
    id: text().primaryKey(),
    testId: integer("test_id").notNull(),
    studentId: integer("student_id").references(() => students.id),
    marksAvalilable: integer("marks_avalilable").notNull(),
    marksObtained: integer("marks_obtained").notNull(),
    scannedAt: integer({ mode: "timestamp" }).notNull(),
    ...timestamps,
  },
  (table) => {
    return {
      testIndex: index("name_idx").on(table.testId),
    };
  }
);
