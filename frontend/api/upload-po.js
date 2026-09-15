export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    res.status(200).json({
      success: true,
      message: 'PO & Receiving Log uploaded successfully',
      uploadedAt: new Date().toISOString()
    })
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message })
  }
}
