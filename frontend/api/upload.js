import { IncomingForm } from 'formidable'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { readFile } from 'xlsx'

export const config = {
  api: {
    bodyParser: false,
  },
}

async function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const records = parse(content, { columns: true })
  return records
}

async function parseExcel(filePath, sheetName) {
  const workbook = readFile(filePath)
  const worksheet = workbook.Sheets[sheetName]
  const data = []
  
  const range = worksheet['!ref']
  if (!range) return data
  
  const rangeArray = range.split(':')
  const endCell = rangeArray[1]
  const endRow = parseInt(endCell.match(/\d+/)[0])
  
  for (let row = 1; row <= endRow; row++) {
    const rowData = {}
    let isEmpty = true
    for (let col = 65; col <= 90; col++) {
      const cell = worksheet[String.fromCharCode(col) + row]
      if (cell) {
        isEmpty = false
        rowData[String.fromCharCode(col)] = cell.v
      }
    }
    if (!isEmpty) data.push(rowData)
  }
  
  return data
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const form = new IncomingForm()
  
  try {
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        resolve([fields, files])
      })
    })

    if (!files.csvFile || !files.excelFiles) {
      return res.status(400).json({ error: 'Missing required files' })
    }

    // Parse CSV (Inventory Snapshot)
    const csvPath = Array.isArray(files.csvFile) ? files.csvFile[0].filepath : files.csvFile.filepath
    const csvData = await parseCSV(csvPath)
    
    // Build snapshot from CSV
    const snapshot = {}
    csvData.forEach(row => {
      const sku = row.SKU?.trim()
      if (sku) {
        snapshot[sku] = {
          onHand: parseInt(row.OnHand) || 0,
          available: parseInt(row.Available) || 0,
          casePack: parseInt(row.CasePack) || 1,
          availableEaches: parseInt(row.Available_Eaches) || 0,
          inbound: parseInt(row.Inbound) || 0
        }
      }
    })

    res.json({
      success: true,
      skuCount: Object.keys(snapshot).length,
      message: 'Files uploaded and parsed successfully'
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: error.message })
  }
}
