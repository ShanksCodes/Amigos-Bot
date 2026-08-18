# ============================================================
# Amigos Bot - NestJS Monorepo Folder Structure Setup
# Run this from the root of the project.
#
# Safe with spaces in folder names.
# Existing directories/files will NOT be overwritten.
# ============================================================

$Root = (Get-Location).Path

Write-Host "Creating project structure in:"
Write-Host $Root
Write-Host ""

# ------------------------------------------------------------
# Directories
# ------------------------------------------------------------

$Directories = @(
    # Bot application
    "apps",
    "apps/bot",
    "apps/bot/src",

    # Discord infrastructure
    "apps/bot/src/discord",
    "apps/bot/src/discord/listeners",
    "apps/bot/src/discord/types",

    # Bot features
    "apps/bot/src/features",

    # Shared code that belongs specifically to the bot app
    "apps/bot/src/shared",
    "apps/bot/src/shared/discord",
    "apps/bot/src/shared/constants",

    # Shared Nest libraries
    "libs",

    "libs/database",
    "libs/database/src",

    "libs/config",
    "libs/config/src",

    "libs/logging",
    "libs/logging/src",

    "libs/common",
    "libs/common/src",
    "libs/common/src/errors",
    "libs/common/src/types",
    "libs/common/src/constants",
    "libs/common/src/utils",

    # Prisma
    "prisma",

    # Standalone scripts/tools
    "tools",
    "tools/discord",

    # Tests
    "test",
    "test/e2e",

    # GitHub Actions
    ".github",
    ".github/workflows"
)

foreach ($Directory in $Directories) {
    $FullPath = Join-Path -Path $Root -ChildPath $Directory

    if (-not (Test-Path -LiteralPath $FullPath)) {
        New-Item -ItemType Directory -Path $FullPath -Force | Out-Null
        Write-Host "[CREATED DIR] $Directory"
    }
    else {
        Write-Host "[EXISTS DIR]  $Directory"
    }
}


# ------------------------------------------------------------
# Helper: Create an empty file only if it doesn't already exist
# ------------------------------------------------------------

function New-SafeFile {
    param(
        [Parameter(Mandatory = $true)]
        [string] $RelativePath
    )

    $FullPath = Join-Path -Path $Root -ChildPath $RelativePath

    if (-not (Test-Path -LiteralPath $FullPath)) {
        New-Item -ItemType File -Path $FullPath -Force | Out-Null
        Write-Host "[CREATED FILE] $RelativePath"
    }
    else {
        Write-Host "[EXISTS FILE]  $RelativePath"
    }
}


# ------------------------------------------------------------
# Core Nest bot application
# ------------------------------------------------------------

New-SafeFile "apps/bot/src/main.ts"
New-SafeFile "apps/bot/src/bot.module.ts"

New-SafeFile "apps/bot/src/discord/discord.module.ts"
New-SafeFile "apps/bot/src/discord/discord-client.service.ts"
New-SafeFile "apps/bot/src/discord/command-registry.service.ts"
New-SafeFile "apps/bot/src/discord/interaction-router.service.ts"

New-SafeFile "apps/bot/src/discord/types/discord-command.interface.ts"

New-SafeFile "apps/bot/tsconfig.app.json"


# ------------------------------------------------------------
# Database library
# ------------------------------------------------------------

New-SafeFile "libs/database/src/database.module.ts"
New-SafeFile "libs/database/src/prisma.service.ts"
New-SafeFile "libs/database/src/index.ts"
New-SafeFile "libs/database/tsconfig.lib.json"


# ------------------------------------------------------------
# Configuration library
# ------------------------------------------------------------

New-SafeFile "libs/config/src/config.module.ts"
New-SafeFile "libs/config/src/index.ts"
New-SafeFile "libs/config/tsconfig.lib.json"


# ------------------------------------------------------------
# Logging library
# ------------------------------------------------------------

New-SafeFile "libs/logging/src/logging.module.ts"
New-SafeFile "libs/logging/src/logger.service.ts"
New-SafeFile "libs/logging/src/winston.config.ts"
New-SafeFile "libs/logging/src/index.ts"
New-SafeFile "libs/logging/tsconfig.lib.json"


# ------------------------------------------------------------
# Common shared library
# ------------------------------------------------------------

New-SafeFile "libs/common/src/index.ts"
New-SafeFile "libs/common/tsconfig.lib.json"


# ------------------------------------------------------------
# Prisma
# ------------------------------------------------------------

New-SafeFile "prisma/schema.prisma"
New-SafeFile "prisma/seed.ts"


# ------------------------------------------------------------
# Discord tooling
# ------------------------------------------------------------

New-SafeFile "tools/discord/deploy-commands.ts"


# ------------------------------------------------------------
# Root project configuration
# ------------------------------------------------------------

New-SafeFile ".env"
New-SafeFile ".env.example"
New-SafeFile ".gitignore"

New-SafeFile "nest-cli.json"
New-SafeFile "prisma.config.ts"

New-SafeFile "eslint.config.mjs"
New-SafeFile "prettier.config.mjs"

New-SafeFile "tsconfig.json"
New-SafeFile "tsconfig.build.json"


# ------------------------------------------------------------
# Keep intentionally empty folders visible to Git
# ------------------------------------------------------------

New-SafeFile "apps/bot/src/features/.gitkeep"
New-SafeFile "apps/bot/src/discord/listeners/.gitkeep"

New-SafeFile "apps/bot/src/shared/discord/.gitkeep"
New-SafeFile "apps/bot/src/shared/constants/.gitkeep"

New-SafeFile "libs/common/src/errors/.gitkeep"
New-SafeFile "libs/common/src/types/.gitkeep"
New-SafeFile "libs/common/src/constants/.gitkeep"
New-SafeFile "libs/common/src/utils/.gitkeep"

New-SafeFile "test/e2e/.gitkeep"
New-SafeFile ".github/workflows/.gitkeep"


Write-Host ""
Write-Host "========================================="
Write-Host "Amigos Bot folder structure created."
Write-Host "========================================="