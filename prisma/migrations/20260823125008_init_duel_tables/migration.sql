-- CreateTable
CREATE TABLE "DuelProfile" (
    "userId" TEXT NOT NULL,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "currentWinStreak" INTEGER NOT NULL DEFAULT 0,
    "bestWinStreak" INTEGER NOT NULL DEFAULT 0,
    "totalDamageDealt" INTEGER NOT NULL DEFAULT 0,
    "totalDamageTaken" INTEGER NOT NULL DEFAULT 0,
    "totalHealing" INTEGER NOT NULL DEFAULT 0,
    "criticalHits" INTEGER NOT NULL DEFAULT 0,
    "parries" INTEGER NOT NULL DEFAULT 0,
    "fastestReaction" INTEGER,
    "totalBerries" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DuelProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "DuelHistory" (
    "id" TEXT NOT NULL,
    "challengerId" TEXT NOT NULL,
    "opponentId" TEXT NOT NULL,
    "winnerId" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'Regular',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "berriesAwarded" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DuelHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DuelProfile" ADD CONSTRAINT "DuelProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuelHistory" ADD CONSTRAINT "DuelHistory_challengerId_fkey" FOREIGN KEY ("challengerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuelHistory" ADD CONSTRAINT "DuelHistory_opponentId_fkey" FOREIGN KEY ("opponentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuelHistory" ADD CONSTRAINT "DuelHistory_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
