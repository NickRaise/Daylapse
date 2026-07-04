import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "./migrations/migrations";
import { db } from "./index";

export function useDatabaseMigration() {
  return useMigrations(db, migrations);
}
