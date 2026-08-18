Add-Type -AssemblyName System.Drawing

$root = (Get-Location).Path
$srcLogoPath = Join-Path $root "public\logo.png"
$outDir = Join-Path $root "public\playstore-assets"

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir
}

$srcImg = [System.Drawing.Image]::FromFile($srcLogoPath)

# 1. 512x512 High Res Icon
$icon512 = New-Object System.Drawing.Bitmap 512, 512
$g1 = [System.Drawing.Graphics]::FromImage($icon512)
$g1.Clear([System.Drawing.Color]::White)
$g1.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g1.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

$margin = 32
$g1.DrawImage($srcImg, $margin, $margin, (512 - ($margin * 2)), (512 - ($margin * 2)))
$g1.Dispose()

$iconOut = Join-Path $outDir "icon_512x512.png"
$icon512.Save($iconOut, [System.Drawing.Imaging.ImageFormat]::Png)
$icon512.Dispose()

# 2. 1024x500 Feature Graphic
$fg = New-Object System.Drawing.Bitmap 1024, 500
$g2 = [System.Drawing.Graphics]::FromImage($fg)
$g2.Clear([System.Drawing.Color]::FromArgb(15, 23, 42))
$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

$g2.DrawImage($srcImg, 60, 100, 300, 300)

$titleFont = New-Object System.Drawing.Font("Arial", 36, [System.Drawing.FontStyle]::Bold)
$subFont = New-Object System.Drawing.Font("Arial", 18, [System.Drawing.FontStyle]::Regular)
$brushWhite = [System.Drawing.Brushes]::White
$brushSlate = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(148, 163, 184))
$brushGreen = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(52, 211, 153))

$g2.DrawString("SSSAM ACADEMY", $titleFont, $brushWhite, 400, 130)
$g2.DrawString("Student Portal & Geofenced Attendance", $subFont, $brushSlate, 400, 205)
$g2.DrawString("• 25M High-Accuracy GPS Attendance", $subFont, $brushGreen, 400, 260)
$g2.DrawString("• Live Remaining Fees & Installment Tracker", $subFont, $brushGreen, 400, 305)

$g2.Dispose()
$fgOut = Join-Path $outDir "feature_graphic_1024x500.png"
$fg.Save($fgOut, [System.Drawing.Imaging.ImageFormat]::Png)
$fg.Dispose()

$srcImg.Dispose()

Write-Host "Play Store Assets generated successfully in public/playstore-assets/:"
Write-Host "1. $iconOut (512x512 PNG)"
Write-Host "2. $fgOut (1024x500 PNG)"
