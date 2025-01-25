# Enable verbose output
$VerbosePreference = "Continue"

Write-Host "🗑️  Removing all local migration files..."
Remove-Item -Path "supabase/migrations/*" -Force -ErrorAction SilentlyContinue

Write-Host "🔄 Getting list of migrations to repair..."
# Get all migrations including the latest remote schema
$migrations = supabase migration list | Select-String -Pattern '^\d{14}' | ForEach-Object { $_.Matches.Value }

Write-Host "🔧 Marking all migrations as reverted..."
foreach ($migration in $migrations) {
    supabase migration repair --status reverted $migration
}

# First attempt to pull schema
Write-Host "⬇️  First attempt to pull schema..."
$pullOutput = supabase db pull 2>&1
Write-Host $pullOutput

# Check if we need to repair a specific migration
$repairMigration = $pullOutput | Select-String -Pattern '\d{14}' | ForEach-Object { $_.Matches.Value }
if ($repairMigration) {
    Write-Host "🔧 Repairing specific migration: $repairMigration"
    supabase migration repair --status reverted $repairMigration
}

# Pull again after repairing
Write-Host "⬇️  Pulling schema after repairs..."
"y" | supabase db pull

Write-Host "✨ Migration reset complete!"

# Generate types
Write-Host "🔄 Generating TypeScript types..."
npm run generate:types --workspace=packages/shared

Write-Host "🎉 All done! The database schema and types have been updated." 