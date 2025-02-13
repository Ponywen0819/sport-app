-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT
);

-- CreateTable
CREATE TABLE "BodyIndex" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "height" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL,
    "totalWater" INTEGER NOT NULL,
    "proteinWeight" INTEGER NOT NULL,
    "mineralWeight" INTEGER NOT NULL,
    "bodyFatWeight" INTEGER NOT NULL,
    "skeletalMuscleWeight" INTEGER NOT NULL,
    "visceralFatIndex" INTEGER NOT NULL,
    "basalMetabolicRate" INTEGER NOT NULL,
    "bodyFatPercentage" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "BodyIndex_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "mealTypeId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Meal_mealTypeId_fkey" FOREIGN KEY ("mealTypeId") REFERENCES "MealType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Meal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Food" (
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
    "potassium" INTEGER NOT NULL,
    "mealId" TEXT NOT NULL,
    CONSTRAINT "Food_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
