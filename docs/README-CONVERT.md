# How to Convert Markdown to Word

## Method 1: Quick Convert (Pandoc)

### Install Pandoc

**Option A: Using Chocolatey**
```powershell
# Install chocolatey first (if not installed)
# See: https://chocolatey.org/install

# Then install pandoc
choco install pandoc
```

**Option B: Direct Download**
1. Go to https://pandoc.org/installing.html
2. Download the Windows installer
3. Run the installer
4. Restart your terminal

### Convert to Word

```powershell
# Simple conversion
pandoc docs\project-summary.md -o docs\project-summary.docx

# With table of contents
pandoc docs\project-summary.md -o docs\project-summary.docx --toc --toc-depth=3

# With all formatting options
pandoc docs\project-summary.md `
  -o docs\project-summary.docx `
  --toc `
  --toc-depth=3 `
  --standalone `
  --highlight-style=tango
```

### Or Use the Script

```powershell
# Run the PowerShell script
.\scripts\convert-to-docx.ps1

# Convert a different file
.\scripts\convert-to-docx.ps1 -InputFile "docs\quick-reference.md" -OutputFile "docs\quick-reference.docx"
```

---

## Method 2: Open in Word Directly

```powershell
# Open markdown in Word
Start-Process winword.exe "docs\project-summary.md"

# Then:
# 1. File → Save As
# 2. Format: Word Document (*.docx)
# 3. Click Save
```

---

## Method 3: Online Converter

1. Copy content from `docs\project-summary.md`
2. Go to: https://cloudconvert.com/md-to-docx
3. Paste content
4. Download .docx file

---

## Files to Convert

- `docs\project-summary.md` → Full detailed summary
- `docs\quick-reference.md` → Daily commands guide
- `docs\manual-workflow-guide.md` → Workflow documentation
- `docs\architecture.md` → System architecture
- `docs\coding-standards.md` → Code conventions

---

## Tips

**For best formatting:**
1. Use pandoc with `--toc` flag for table of contents
2. Create a reference Word template for consistent styling
3. Review and adjust formatting in Word after conversion

**Common issues:**
- Code blocks: May need manual formatting in Word
- Tables: Usually convert well but verify alignment
- Links: Convert to Word hyperlinks automatically
- Images: If any, need to be in the same directory
