Add-Type -AssemblyName System.Drawing
$iconDirectory = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../public/icons'))
foreach ($entry in @(@{ Size = 192; Name = 'icon-192.png' }, @{ Size = 512; Name = 'icon-512.png' }, @{ Size = 512; Name = 'icon-maskable-512.png' }, @{ Size = 180; Name = 'apple-touch-icon.png' })) {
  $bitmap = [Drawing.Bitmap]::new($entry.Size, $entry.Size)
  $graphics = [Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([Drawing.ColorTranslator]::FromHtml('#047857'))
  $scale = [single]($entry.Size / 512)
  $graphics.ScaleTransform($scale, $scale)
  $pen = [Drawing.Pen]::new([Drawing.Color]::White, 16)
  $pen.StartCap = [Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [Drawing.Drawing2D.LineCap]::Round
  $path = [Drawing.Drawing2D.GraphicsPath]::new()
  $path.AddBezier(256, 368, 256, 300, 242, 272, 204, 240)
  $graphics.DrawPath($pen, $path)
  $path.Reset()
  $path.AddBezier(246, 283, 180, 286, 152, 237, 157, 194)
  $path.AddBezier(157, 194, 211, 195, 248, 226, 246, 283)
  $graphics.DrawPath($pen, $path)
  $path.Reset()
  $path.AddBezier(252, 310, 252, 263, 273, 237, 307, 209)
  $graphics.DrawPath($pen, $path)
  $path.Reset()
  $path.AddBezier(260, 266, 256, 194, 293, 158, 358, 153)
  $path.AddBezier(358, 153, 359, 220, 324, 266, 260, 266)
  $graphics.DrawPath($pen, $path)
  $bitmap.Save((Join-Path $iconDirectory $entry.Name), [Drawing.Imaging.ImageFormat]::Png)
  $path.Dispose(); $pen.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}

