import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

/**
 * O PDF devolve fragmentos soltos com coordenadas. Reagrupamos por linha
 * (mesma altura) para que o texto volte a parecer o documento original.
 */
export async function extractPdfLines(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise
  const lines: string[] = []

  try {
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
      const page = await doc.getPage(pageNumber)
      const content = await page.getTextContent()
      const rows = new Map<number, { x: number; str: string }[]>()

      for (const raw of content.items) {
        const item = raw as TextItem
        if (typeof item.str !== 'string' || !item.str.trim()) continue
        const y = Math.round(item.transform[5] / 3) * 3
        const row = rows.get(y) ?? []
        row.push({ x: item.transform[4], str: item.str })
        rows.set(y, row)
      }

      const ordered = [...rows.entries()].sort((a, b) => b[0] - a[0])
      for (const [, row] of ordered) {
        const text = row
          .sort((a, b) => a.x - b.x)
          .map((cell) => cell.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()
        if (text) lines.push(text)
      }
      page.cleanup()
    }
  } finally {
    await doc.destroy()
  }

  return lines
}
