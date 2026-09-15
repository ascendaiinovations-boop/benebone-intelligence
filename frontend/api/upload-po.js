import formidable from 'formidable'
import fs from 'fs'
import path from 'path'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const form = formidable({ multiples: false })
    const [fields, files] = await form.parse(req)

    if (!files.file || files.file.length === 0) {
      return res.status(400).json({ error: 'No file provided' })
    }

    const file = files.file[0]
    
    if (!file.originalFilename.endsWith('.xlsm') && !file.originalFilename.endsWith('.xlsx')) {
      return res.status(400).json({ error: 'Only Excel files (.xlsm, .xlsx) are supported' })
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'po-logs')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const fileName = `PO-Receiving-Log-${new Date().getTime()}.xlsm`
    const filePath = path.join(uploadDir, fileName)

    const data = fs.readFileSync(file.filepath)
    fs.writeFileSync(filePath, data)

    fs.unlinkSync(file.filepath)

    res.json({
      success: true,
      message: 'PO & Receiving Log uploaded successfully',
      fileName: fileName,
      uploadedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: error.message })
  }
}
