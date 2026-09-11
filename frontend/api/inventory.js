export default function handler(req, res) {
  try {
    const mockInventoryData = [
      { sku: '111244', description: 'Benebone Rubber Bone Small', available: 714, casePack: 24 },
      { sku: '111244ML', description: 'ML Benebone Rubber Bone Small', available: 262, casePack: 24 },
      { sku: '112244', description: 'Benebone Rubber Bone Medium', available: 792, casePack: 24 },
      { sku: '112244ML', description: 'ML Benebone Rubber Bone Medium', available: 221, casePack: 24 },
      { sku: '113244', description: 'Benebone Rubber Bone Large', available: 391, casePack: 24 },
      { sku: '113244ML', description: 'ML Benebone Rubber Bone Large', available: 320, casePack: 24 },
      { sku: '121244', description: 'Benebone Rubber Ball', available: 419, casePack: 24 },
      { sku: '121244ML', description: 'ML Benebone Rubber Ball', available: 198, casePack: 24 },
      { sku: '130244', description: 'Benebone Rubber Tug (Flat)', available: 747, casePack: 24 }
    ]

    res.status(200).json({
      skus: mockInventoryData,
      lastUpdate: new Date().toISOString()
    })
  } catch (error) {
    console.error('Inventory API error:', error)
    res.status(500).json({ error: 'Failed to load inventory data' })
  }
}
