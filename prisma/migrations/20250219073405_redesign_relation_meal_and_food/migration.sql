/*
  Warnings:

  - You are about to drop the column `mealId` on the `Food` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "MealItem" (
    "mealId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "intake" INTEGER NOT NULL,

    PRIMARY KEY ("mealId", "foodId"),
    CONSTRAINT "MealItem_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MealItem_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Food" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "calories" INTEGER NOT NULL,
    "protein" INTEGER NOT NULL,
    "fat" INTEGER NOT NULL,
    "transFat" INTEGER NOT NULL,
    "saturatedFat" INTEGER NOT NULL,
    "monounsaturatedFat" INTEGER NOT NULL,
    "polyunsaturatedFat" INTEGER NOT NULL,
    "carbs" INTEGER NOT NULL,
    "sugar" INTEGER NOT NULL,
    "dietaryFiber" INTEGER NOT NULL,
    "sodium" INTEGER NOT NULL,
    "potassium" INTEGER NOT NULL
);
INSERT INTO "new_Food" ("calories", "carbs", "dietaryFiber", "fat", "id", "monounsaturatedFat", "name", "polyunsaturatedFat", "potassium", "protein", "saturatedFat", "sodium", "sugar", "transFat", "weight") SELECT "calories", "carbs", "dietaryFiber", "fat", "id", "monounsaturatedFat", "name", "polyunsaturatedFat", "potassium", "protein", "saturatedFat", "sodium", "sugar", "transFat", "weight" FROM "Food";
DROP TABLE "Food";
ALTER TABLE "new_Food" RENAME TO "Food";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
