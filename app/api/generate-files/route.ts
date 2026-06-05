import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'

function toSafeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'project'
}

export async function POST(req: NextRequest) {
  try {
    const { files, projectName } = await req.json()

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'Files array is required' }, { status: 400 })
    }

    // Derive ZIP name: prefer explicit projectName, fallback to name field on first file
    const rawName = projectName || files[0]?.name || 'project'
    const zipName = toSafeFilename(rawName)

    const zip = new JSZip()
    // Put all files inside a folder named after the project
    const folder = zip.folder(zipName) as JSZip

    files.forEach((file: { path: string; content: string; name?: string }) => {
      const normalizedPath = file.path.replace(/\\/g, '/').replace(/^\/+/, '')
      const parts = normalizedPath.split('/').filter(Boolean)

      if (parts.length > 1) {
        let current: JSZip = folder
        for (let i = 0; i < parts.length - 1; i++) {
          current = current.folder(parts[i]) as JSZip
        }
        current.file(parts[parts.length - 1], file.content)
      } else {
        folder.file(normalizedPath, file.content)
      }
    })

    const buffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipName}.zip"`,
        'Content-Length': String(buffer.length),
      },
    })
  } catch (error) {
    console.error('Generate files error:', error)
    return NextResponse.json({ error: 'Failed to generate ZIP' }, { status: 500 })
  }
}
