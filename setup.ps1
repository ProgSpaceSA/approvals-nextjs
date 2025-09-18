# Setup script for the Approvals System

Write-Host "Setting up Approvals System..." -ForegroundColor Green

# Check if .env exists, if not create it
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    # Update the database URL to use port 5433
    (Get-Content ".env") -replace "localhost:5432", "localhost:5433" | Set-Content ".env"
}

# Check if PostgreSQL container is running
$postgres = docker ps --filter "name=approvals-postgres" --filter "status=running" --quiet
if (-not $postgres) {
    Write-Host "Starting PostgreSQL container..." -ForegroundColor Yellow
    docker run --name approvals-postgres -e POSTGRES_USER=approvals_user -e POSTGRES_PASSWORD=approvals_password -e POSTGRES_DB=approvals_db -p 5433:5432 -d postgres:15-alpine
    Start-Sleep -Seconds 10
}

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Run migrations
Write-Host "Running database migrations..." -ForegroundColor Yellow
npx prisma migrate deploy

# Seed database
Write-Host "Seeding database..." -ForegroundColor Yellow
npm run seed

Write-Host "Setup complete! You can now run 'npm run dev' to start the application." -ForegroundColor Green
Write-Host ""
Write-Host "Demo accounts:" -ForegroundColor Cyan
Write-Host "CEO: ceo@example.com / Passw0rd!" -ForegroundColor White
Write-Host "Executive: exec@example.com / Passw0rd!" -ForegroundColor White
