import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "./migrations/migrations";



const expo = openDatabaseSync("daylapse.db");

export const db = drizzle(expo);

export async function migrateDb() {
  await migrate(db, migrations);
}