# Convert Markdown to Word Document
# Requires: pandoc installed

param(
    [string]$InputFile = "docs\project-summary.md",
    [string]$OutputFile = "docs\project-summary.docx"
)

Write-Host "Converting $InputFile to $OutputFile..." -ForegroundColor Cyan

# Check if pandoc is installed
$pandocInstalled = Get-Command pandoc -ErrorAction SilentlyContinue

if (-not $pandocInstalled) {
    Write-Host "ERROR: Pandoc is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install pandoc using one of these methods:" -ForegroundColor Yellow
    Write-Host "1. Chocolatey: choco install pandoc" -ForegroundColor Yellow
    Write-Host "2. Download: https://pandoc.org/installing.html" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Convert with table of contents and formatting
pandoc $InputFile `
    -o $OutputFile `
    --toc `
    --toc-depth=3 `
    --standalone `
    --reference-doc=docs\reference-template.docx `
    --highlight-style=tango

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully converted to: $OutputFile" -ForegroundColor Green
    Write-Host ""
    Write-Host "Opening Word document..." -ForegroundColor Cyan
    Start-Process $OutputFile
} else {
    Write-Host "❌ Conversion failed" -ForegroundColor Red
    exit 1
}
