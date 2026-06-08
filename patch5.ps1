$lines = Get-Content 'src\pages\BulkJobImportPage.tsx' -Encoding UTF8

$newLines = [System.Collections.Generic.List[string]]::new()

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]

    # 1. Add aiEnhanced field to ParsedJob interface after "raw: string;"
    if ($line -match "^\s+raw: string;$") {
        $newLines.Add($line)
        $newLines.Add("  aiEnhanced?: boolean;")
        continue
    }

    # 2. Fix aiEnhanceDescription to decode HTML entities and strip markdown bold
    if ($line -match "return reply\.trim\(\);") {
        $indent = ($line -replace "return.*", "")
        $newLines.Add("${indent}return reply.trim()")
        $newLines.Add("${indent}  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '\"').replace(/&#39;/g, `"'`")")
        $newLines.Add("${indent}  .replace(/\*\*([^*]+)\*\*/g, '`$`1').replace(/\*([^*]+)\*/g, '`$`1');")
        continue
    }

    # 3. In bulkEnhance, mark job as aiEnhanced after enhancing
    if ($line -match "return \{ \.\.\.job, jobDescription: newDesc \};") {
        $indent = ($line -replace "return.*", "")
        $newLines.Add("${indent}return { ...job, jobDescription: newDesc, aiEnhanced: true };")
        continue
    }

    # 4. Fix buildFullDescription - decode desc HTML entities too
    if ($line -match "if \(desc && desc\.length > 300\) return desc;") {
        $indent = ($line -replace "if.*", "")
        $newLines.Add("${indent}const cleanDesc = desc ? desc.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '`"`').replace(/&#39;/g, `"'`") : '';")
        $newLines.Add("${indent}if (cleanDesc && cleanDesc.length > 300) return cleanDesc;")
        continue
    }

    # 5. Fix buildFullDescription - use cleanDesc in Additional Details
    if ($line -match '\$\{desc \? `Additional Details') {
        $indent = ($line -replace "\$.*", "")
        $newLines.Add("${indent}`${cleanDesc ? `"Additional Details\n`${cleanDesc}`" : ''}`.trim();")
        continue
    }

    $newLines.Add($line)
}

$newLines | Set-Content 'src\pages\BulkJobImportPage.tsx' -Encoding UTF8
Write-Host "Done. Total lines: $($newLines.Count)"
