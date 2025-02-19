/*
  Warnings:

  - A unique constraint covering the columns `[date,userId,mealTypeId]` on the table `Meal` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Meal_date_userId_mealTypeId_key" ON "Meal"("date", "userId", "mealTypeId");
