Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Mohit Yadav\.gemini\antigravity\brain\ff8a9437-f6f2-42f5-9a1f-6b684e1d13f0\.user_uploaded\media_1786966119051.jpg"
$srcImg = [System.Drawing.Image]::FromFile($srcPath)

function Resize-SaveImage($destPath, $width, $height) {
    $destBmp = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($destBmp)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($srcImg, 0, 0, $width, $height)
    $destBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $destBmp.Dispose()
    Write-Host "Generated: $destPath ($width x $height)"
}

Resize-SaveImage "android\app\src\main\res\mipmap-mdpi\ic_launcher.png" 48 48
Resize-SaveImage "android\app\src\main\res\mipmap-mdpi\ic_launcher_round.png" 48 48
Resize-SaveImage "android\app\src\main\res\mipmap-mdpi\ic_launcher_foreground.png" 108 108

Resize-SaveImage "android\app\src\main\res\mipmap-hdpi\ic_launcher.png" 72 72
Resize-SaveImage "android\app\src\main\res\mipmap-hdpi\ic_launcher_round.png" 72 72
Resize-SaveImage "android\app\src\main\res\mipmap-hdpi\ic_launcher_foreground.png" 162 162

Resize-SaveImage "android\app\src\main\res\mipmap-xhdpi\ic_launcher.png" 96 96
Resize-SaveImage "android\app\src\main\res\mipmap-xhdpi\ic_launcher_round.png" 96 96
Resize-SaveImage "android\app\src\main\res\mipmap-xhdpi\ic_launcher_foreground.png" 216 216

Resize-SaveImage "android\app\src\main\res\mipmap-xxhdpi\ic_launcher.png" 144 144
Resize-SaveImage "android\app\src\main\res\mipmap-xxhdpi\ic_launcher_round.png" 144 144
Resize-SaveImage "android\app\src\main\res\mipmap-xxhdpi\ic_launcher_foreground.png" 324 324

Resize-SaveImage "android\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png" 192 192
Resize-SaveImage "android\app\src\main\res\mipmap-xxxhdpi\ic_launcher_round.png" 192 192
Resize-SaveImage "android\app\src\main\res\mipmap-xxxhdpi\ic_launcher_foreground.png" 432 432

# Also save to public for web logo
Resize-SaveImage "public\logo.png" 512 512

$srcImg.Dispose()
