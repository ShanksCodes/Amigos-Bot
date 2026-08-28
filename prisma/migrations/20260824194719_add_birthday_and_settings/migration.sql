-- CreateTable
CREATE TABLE "GuildBirthdaySetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuildBirthdaySetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BirthdayChange" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prevDay" INTEGER,
    "prevMonth" INTEGER,
    "prevYear" INTEGER,
    "newDay" INTEGER,
    "newMonth" INTEGER,
    "newYear" INTEGER,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BirthdayChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BirthdayAnnouncement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "birthdayDate" DATE NOT NULL,
    "announcedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BirthdayAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuildBirthdayConfig" (
    "guildId" TEXT NOT NULL,
    "announcementChannelId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuildBirthdayConfig_pkey" PRIMARY KEY ("guildId")
);

-- CreateIndex
CREATE INDEX "GuildBirthdaySetting_guildId_idx" ON "GuildBirthdaySetting"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "GuildBirthdaySetting_userId_guildId_key" ON "GuildBirthdaySetting"("userId", "guildId");

-- CreateIndex
CREATE INDEX "BirthdayChange_userId_changedAt_idx" ON "BirthdayChange"("userId", "changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BirthdayAnnouncement_userId_guildId_birthdayDate_key" ON "BirthdayAnnouncement"("userId", "guildId", "birthdayDate");

-- CreateIndex
CREATE INDEX "UserProfile_birthMonth_birthDay_idx" ON "UserProfile"("birthMonth", "birthDay");

-- AddForeignKey
ALTER TABLE "GuildBirthdaySetting" ADD CONSTRAINT "GuildBirthdaySetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildBirthdaySetting" ADD CONSTRAINT "GuildBirthdaySetting_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;
