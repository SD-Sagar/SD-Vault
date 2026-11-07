Add-Type -AssemblyName System.Drawing

function Generate-VaultIcon([int]$size, [string]$outputPath) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.Clear([System.Drawing.Color]::Transparent)

    $center = [float]($size / 2.0)
    $scale = [float]($size / 512.0)

    # 12 Cog Teeth
    $teethBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.PointF(0.0, 0.0)),
        (New-Object System.Drawing.PointF(0.0, [float]$size)),
        [System.Drawing.Color]::FromArgb(251, 191, 36),
        [System.Drawing.Color]::FromArgb(217, 119, 6)
    )

    for ($i = 0; $i -lt 12; $i++) {
        $angle = [float]($i * 30.0)
        $state = $g.Save()
        $g.TranslateTransform($center, $center)
        $g.RotateTransform($angle)

        [System.Drawing.PointF[]]$pts = @(
            (New-Object System.Drawing.PointF([float](-22.0 * $scale), [float](-242.0 * $scale))),
            (New-Object System.Drawing.PointF([float](22.0 * $scale), [float](-242.0 * $scale))),
            (New-Object System.Drawing.PointF([float](18.0 * $scale), [float](-205.0 * $scale))),
            (New-Object System.Drawing.PointF([float](-18.0 * $scale), [float](-205.0 * $scale)))
        )
        $g.FillPolygon($teethBrush, $pts)
        $g.Restore($state)
    }

    # Outer Blast Ring (Steel with Gold border)
    $outerRadius = [float](215.0 * $scale)
    $steelBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.PointF(0.0, 0.0)),
        (New-Object System.Drawing.PointF([float]$size, [float]$size)),
        [System.Drawing.Color]::FromArgb(40, 52, 71),
        [System.Drawing.Color]::FromArgb(15, 23, 42)
    )
    $goldPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(245, 158, 11), [float][Math]::Max(1.0, 12.0 * $scale))

    $g.FillEllipse($steelBrush, ($center - $outerRadius), ($center - $outerRadius), ($outerRadius * 2.0), ($outerRadius * 2.0))
    $g.DrawEllipse($goldPen, ($center - $outerRadius), ($center - $outerRadius), ($outerRadius * 2.0), ($outerRadius * 2.0))

    # Inner Core
    $innerRadius = [float](165.0 * $scale)
    $coreBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(10, 14, 23))
    $innerGoldPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(245, 185, 76), [float][Math]::Max(1.0, 5.0 * $scale))

    $g.FillEllipse($coreBrush, ($center - $innerRadius), ($center - $innerRadius), ($innerRadius * 2.0), ($innerRadius * 2.0))
    $g.DrawEllipse($innerGoldPen, ($center - $innerRadius), ($center - $innerRadius), ($innerRadius * 2.0), ($innerRadius * 2.0))

    # 8 Hex Rivets
    $rivetBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
    $rivetPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(251, 191, 36), [float][Math]::Max(1.0, 3.0 * $scale))
    $rivetDist = [float](138.0 * $scale)
    $rivetR = [float][Math]::Max(2.0, 9.0 * $scale)

    for ($a = 0; $a -lt 8; $a++) {
        $rad = $a * [Math]::PI / 4.0
        $rx = [float]($center + $rivetDist * [Math]::Cos($rad))
        $ry = [float]($center + $rivetDist * [Math]::Sin($rad))
        $g.FillEllipse($rivetBrush, ($rx - $rivetR), ($ry - $rivetR), ($rivetR * 2.0), ($rivetR * 2.0))
        $g.DrawEllipse($rivetPen, ($rx - $rivetR), ($ry - $rivetR), ($rivetR * 2.0), ($rivetR * 2.0))
    }

    # Central Hub
    $hubRadius = [float](105.0 * $scale)
    $hubBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(6, 9, 15))
    $hubPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(245, 158, 11), [float][Math]::Max(1.0, 6.0 * $scale))
    $g.FillEllipse($hubBrush, ($center - $hubRadius), ($center - $hubRadius), ($hubRadius * 2.0), ($hubRadius * 2.0))
    $g.DrawEllipse($hubPen, ($center - $hubRadius), ($center - $hubRadius), ($hubRadius * 2.0), ($hubRadius * 2.0))

    # Text: "SD"
    $fontSize = [float][Math]::Max(8.0, 90.0 * $scale)
    $font = New-Object System.Drawing.Font('Arial', $fontSize, [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.PointF(0.0, [float]($center - 60.0 * $scale))),
        (New-Object System.Drawing.PointF(0.0, [float]($center + 50.0 * $scale))),
        [System.Drawing.Color]::FromArgb(253, 224, 71),
        [System.Drawing.Color]::FromArgb(217, 119, 6)
    )
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $g.DrawString('SD', $font, $textBrush, $center, [float]($center - (10.0 * $scale)), $sf)

    # Subtext: "VAULT"
    if ($size -ge 128) {
        $subFontSize = [float][Math]::Max(6.0, 18.0 * $scale)
        $subFont = New-Object System.Drawing.Font('Arial', $subFontSize, [System.Drawing.FontStyle]::Bold)
        $subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(148, 163, 184))
        $g.DrawString('VAULT', $subFont, $subBrush, $center, [float]($center + (52.0 * $scale)), $sf)
    }

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Successfully generated: $outputPath ($size x $size)"
}

Generate-VaultIcon 192 "public\icon-192.png"
Generate-VaultIcon 512 "public\icon-512.png"
Generate-VaultIcon 180 "public\apple-touch-icon.png"
