#!/bin/bash

# Print each command before executing it
set -x

echo "🗑️  Removing all local migration files..."
rm -f supabase/migrations/*

echo "🔄 Getting list of migrations to repair..."
# Get all migrations including the latest remote schema
MIGRATIONS=$(supabase migration list | grep -E '^[0-9]{14}' | awk '{print $1}')

echo "🔧 Marking all migrations as reverted..."
for migration in $MIGRATIONS
do
    supabase migration repair --status reverted "$migration"
done

# First attempt to pull schema
echo "⬇️  First attempt to pull schema..."
PULL_OUTPUT=$(supabase db pull 2>&1)
echo "$PULL_OUTPUT"

# Check if we need to repair a specific migration
REPAIR_MIGRATION=$(echo "$PULL_OUTPUT" | grep -o '[0-9]\{14\}')
if [ ! -z "$REPAIR_MIGRATION" ]; then
    echo "🔧 Repairing specific migration: $REPAIR_MIGRATION"
    supabase migration repair --status reverted "$REPAIR_MIGRATION"
fi

# Pull again after repairing, automatically answering "Y" to the prompt
echo "⬇️  Pulling schema after repairs..."
echo "y" | supabase db pull

echo "✨ Migration reset complete!"

# Generate types
echo "🔄 Generating TypeScript types..."
npm run generate:types --workspace=packages/shared

echo "🎉 All done! The database schema and types have been updated." 
