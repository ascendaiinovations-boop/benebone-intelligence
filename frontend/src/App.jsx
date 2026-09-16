import React, { useState } from 'react';
import { MessageSquare, Download, Trash2, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { INVENTORY_DATA } from '../api/inventory-data.js';

export default function App() {
  // File management state
  const [inventoryFile, setInventoryFile] = useState(null);
  const [weeklyFile, setWeeklyFile] = useState(null);
  const [poFile, setPoFile] = useState(null);
  
  // Multi-file upload state
  const [uploadedFiles, setUploadedFiles] = useState({
    inventory: [],
    weekly: [],
    po: []
  });
  
  // Historical data storage (6-12 months)
  const [historicalData, setHistoricalData] = useState([]);
  
  // Current selection
  const [selectedInventoryIndex, setSelectedInventoryIndex] = useState(null);
  const [selectedFactory, setSelectedFactory] = useState('AIM');
  const [generatingWord, setGeneratingWord] = useState(false);
  const [alertData, setAlertData] = useState(null);
  const [dataMismatches, setDataMismatches] = useState([]);
  const [allColumns, setAllColumns] = useState([]);

  // Factory configuration
  const factories = {
    'AIM': {
      threshold: 1.5,
      recipients: ['JAyers@AluminumInjectionMold.com', 'SRoloson@AluminumInjectionMold.com', 'TSwanson@AluminumInjectionMold.com'],
      ccList: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'],
      prodField: 'aimProduction'
    },
    'Midbury': {
      threshold: 2.0,
      recipients: ['benebone@midbury.com'],
      ccList: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'],
      prodField: 'midburyProduction'
    },
    'LTM': {
      threshold: 2.0,
      recipients: ['eric@ltmplastics.com'],
      ccList: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'],
      prodField: 'ltmProduction'
    },
    '201': {
      threshold: 2.0,
      recipients: ['emilio.otero@201oficial.com.mx'],
      ccList: ['salvador@201oficial.com.mx', 'punam@benebone.com'],
      prodField: 'grupoProduction'
    },
    'Bennett': {
      threshold: 2.0,
      recipients: ['jmattox@bpkc.com'],
      ccList: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'],
      prodField: 'bennettProduction'
    },
    'DMG': {
      threshold: 2.0,
      recipients: ['monique.brunson@dmgincusa.com'],
      ccList: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'],
      prodField: 'dmgProduction'
    },
    'Coltoys': {
      threshold: 2.0,
      recipients: ['jparra@coltoys.com'],
      ccList: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'],
      prodField: 'coltoysProduction'
    },
    'Loving Pets': {
      threshold: 2.0,
      recipients: ['aaron@lovingpetsproducts.com'],
      ccList: ['zach@benebone.com', 'carly@benebone.com', 'punam@benebone.com'],
      prodField: 'lovingpetsProduction'
    }
  };

  // Handle multi-file upload with date tracking
  const handleFileSelect = (fileType, event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData = {
        name: file.name,
        data: e.target.result,
        date: new Date().toISOString(),
        size: file.size
      };

      // Add to upload queue
      setUploadedFiles(prev => ({
        ...prev,
        [fileType]: [...prev[fileType], fileData]
      }));

      // Show success
      alert(`File added: ${file.name}`);
    };
    reader.readAsText(file);
  };

  // Detect data mismatches between files
  const detectMismatches = (inventoryData, weeklyData, poData) => {
    const mismatches = [];
    
    const inventorySKUs = inventoryData.map(row => row.SKU);
    const weeklySKUs = weeklyData.map(row => row.SKU);
    const poSKUs = poData.map(row => row.SKU);

    // Find SKUs in weekly/po but not in inventory
    weeklySKUs.forEach(sku => {
      if (!inventorySKUs.includes(sku)) {
        mismatches.push({
          type: 'MISSING_FROM_INVENTORY',
          sku: sku,
          message: \`SKU \${sku} found in Weekly Report but NOT in Inventory Snapshot\`
        });
      }
    });

    poSKUs.forEach(sku => {
      if (!inventorySKUs.includes(sku)) {
        mismatches.push({
          type: 'MISSING_FROM_INVENTORY',
          sku: sku,
          message: \`SKU \${sku} found in PO Log but NOT in Inventory Snapshot\`
        });
      }
    });

    return mismatches;
  };

  // Parse CSV/Excel and extract all columns dynamically
  const parseFileWithAllColumns = (fileData) => {
    const lines = fileData.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const header = lines[0].split(',').map(col => col.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row = {};
      header.forEach((col, idx) => {
        row[col] = values[idx]?.trim() || '';
      });
      data.push(row);
    }

    return { data, columns: header };
  };

  // Check alerts with all features
  const handleCheckAlerts = async () => {
    if (!inventoryFile || !weeklyFile || !poFile) {
      alert('Please upload all three files');
      return;
    }

    // Parse all files with all columns
    const { data: invData, columns: invCols } = parseFileWithAllColumns(inventoryFile);
    const { data: weeklyData, columns: weeklyCols } = parseFileWithAllColumns(weeklyFile);
    const { data: poData, columns: poCols } = parseFileWithAllColumns(poFile);

    // Combine all columns
    const allCols = [...new Set([...invCols, ...weeklyCols, ...poCols])];
    setAllColumns(allCols);

    // Detect mismatches
    const mismatches = detectMismatches(invData, weeklyData, poData);
    setDataMismatches(mismatches);

    if (mismatches.length > 0) {
      alert(\`⚠️ DATA QUALITY ISSUES DETECTED!\n\n\${mismatches.map(m => m.message).join('\n')}\n\nPlease review and correct the data before proceeding.\`);
      return;
    }

    // Get factory config
    const factoryConfig = factories[selectedFactory];
    const threshold = factoryConfig.threshold;
    const prodField = factoryConfig.prodField;

    // Filter alerts with all columns
    const alerts = invData.filter(row => {
      const mos = parseFloat(row['MOS']) || 0;
      return mos > 0 && mos <= threshold && row[prodField] === '1';
    }).sort((a, b) => parseFloat(a['MOS']) - parseFloat(b['MOS']));

    setAlertData({
      factory: selectedFactory,
      count: alerts.length,
      data: alerts,
      columns: allCols,
      timestamp: new Date().toLocaleString()
    });

    // Store in historical data
    const historicalEntry = {
      date: new Date().toISOString(),
      factory: selectedFactory,
      alertCount: alerts.length,
      alerts: alerts,
      allColumns: allCols
    };

    setHistoricalData(prev => {
      const updated = [historicalEntry, ...prev];
      // Keep only 12 months
      return updated.slice(0, 52);
    });
  };

  // Generate Word document with ALL columns
  const handleGenerateWord = async () => {
    if (!alertData) return;
    
    setGeneratingWord(true);

    try {
      const { jsPDF } = window;
      const doc = new jsPDF('l'); // landscape for more columns

      // Header
      doc.setFillColor(26, 77, 46); // Benebone green
      doc.rect(0, 0, 297, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text('Benebone Intelligence', 150, 15, { align: 'center' });
      doc.setFontSize(12);
      doc.text(\`Low SKU Alert - \${alertData.factory}\`, 150, 22, { align: 'center' });

      // Metadata
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(\`Generated: \${alertData.timestamp}\`, 15, 40);
      doc.text(\`Factory: \${alertData.factory}\`, 15, 46);
      doc.text(\`Total Alerts: \${alertData.count}\`, 15, 52);

      // Email section
      const factoryConfig = factories[selectedFactory];
      doc.text('Email Recipients:', 15, 62);
      doc.setFontSize(9);
      factoryConfig.recipients.forEach((email, idx) => {
        doc.text(\`To: \${email}\`, 20, 68 + (idx * 5));
      });
      doc.text(\`CC: \${factoryConfig.ccList.join(', ')}\`, 20, 68 + (factoryConfig.recipients.length * 5));

      // Data Quality Report (if mismatches)
      if (dataMismatches.length > 0) {
        doc.setFontSize(11);
        doc.text('⚠️ DATA QUALITY REPORT', 15, 95);
        doc.setFontSize(9);
        dataMismatches.forEach((mismatch, idx) => {
          doc.text(\`• \${mismatch.message}\`, 20, 101 + (idx * 4));
        });
      }

      // Table with ALL columns
      const tableStartY = dataMismatches.length > 0 ? 120 : 75;
      const tableData = [
        alertData.columns,
        ...alertData.data.map(row => alertData.columns.map(col => row[col] || ''))
      ];

      doc.autoTable({
        startY: tableStartY,
        head: [alertData.columns],
        body: tableData.slice(1),
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
        styles: { fontSize: 8 },
        columnStyles: { 0: { cellWidth: 15 } }
      });

      // Footer
      doc.setFontSize(9);
      doc.text('This is an automated alert. Review before sending to factory.', 15, doc.internal.pageSize.getHeight() - 10);

      // Save
      doc.save(\`Benebone_Alert_\${selectedFactory}_\${new Date().toISOString().slice(0, 10)}.pdf\`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating document');
    }

    setGeneratingWord(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-900 to-green-800 text-white py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <img src="https://www.benebone.com/cdn/shop/files/Benebone-Logo-Dark-Green.png?v=1743052787&width=500" alt="Benebone" className="h-12 w-auto" style={{ filter: 'brightness(1.2)' }} />
          <div>
            <h1 className="text-3xl font-bold">Benebone Intelligence</h1>
            <p className="text-green-100">Inventory Management System</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm">Last sync: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        
        {/* Upload Section */}
        <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload Your Data</h2>
          <p className="text-gray-600 mb-6">Keep your inventory alerts fresh by uploading your latest data files.</p>

          {/* Inventory Snapshot */}
          <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">Inventory Snapshot</h3>
                <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: '#1a4d2e', color: 'white' }}>WEEKLY</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">File Format: Benebone Inventory Snapshot [DATE].csv</p>
            <p className="text-sm text-gray-600 mb-3">Example: BeneBone Inventory Snapshot 20260917.csv</p>
            <div className="bg-blue-50 p-3 rounded mb-3">
              <p className="text-sm font-medium">Requirements:</p>
              <ul className="text-sm text-gray-700 mt-2">
                <li>• File format: .csv</li>
                <li>• Contains all SKUs with complete data</li>
                <li>• Include: SKU, OnHand, Available, Avg Monthly Sales, Notes, etc.</li>
              </ul>
            </div>
            <label className="inline-block bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700">
              Choose File
              <input type="file" accept=".csv" onChange={(e) => handleFileSelect('inventory', e)} className="hidden" />
            </label>
            {uploadedFiles.inventory.length > 0 && (
              <div className="mt-3">
                <p className="text-green-700 font-semibold">✓ {uploadedFiles.inventory.length} file(s) uploaded</p>
                <div className="mt-2">
                  {uploadedFiles.inventory.map((file, idx) => (
                    <div key={idx} className="text-sm text-gray-600 mb-1">
                      • {file.name} ({new Date(file.date).toLocaleDateString()})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Weekly Report */}
          <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">Weekly Inventory Report</h3>
                <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: '#1a4d2e', color: 'white' }}>MONTHLY</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">File Format: Weekly Inventory Report [M-DD-YYYY].xlsx</p>
            <p className="text-sm text-gray-600 mb-3">Example: Weekly Inventory Report 9-17-2026.xlsx</p>
            <div className="bg-blue-50 p-3 rounded mb-3">
              <p className="text-sm font-medium">Requirements:</p>
              <ul className="text-sm text-gray-700 mt-2">
                <li>• File format: .xlsx or .xls</li>
                <li>• Contains MOS calculations and trends</li>
                <li>• Max file size: 50MB</li>
              </ul>
            </div>
            <label className="inline-block bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700">
              Choose File
              <input type="file" accept=".xlsx,.xls" onChange={(e) => handleFileSelect('weekly', e)} className="hidden" />
            </label>
            {uploadedFiles.weekly.length > 0 && (
              <div className="mt-3">
                <p className="text-green-700 font-semibold">✓ {uploadedFiles.weekly.length} file(s) uploaded</p>
                <div className="mt-2">
                  {uploadedFiles.weekly.map((file, idx) => (
                    <div key={idx} className="text-sm text-gray-600 mb-1">
                      • {file.name} ({new Date(file.date).toLocaleDateString()})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PO & Receiving Log */}
          <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">PO & Receiving Log</h3>
                <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: '#1a4d2e', color: 'white' }}>WEEKLY</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">File Format: PO tracking and receiving data</p>
            <div className="bg-blue-50 p-3 rounded mb-3">
              <p className="text-sm font-medium">Requirements:</p>
              <ul className="text-sm text-gray-700 mt-2">
                <li>• File format: .xlsx or .xls</li>
                <li>• Contains order and receiving status</li>
                <li>• Max file size: 50MB</li>
              </ul>
            </div>
            <label className="inline-block bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700">
              Choose File
              <input type="file" accept=".xlsx,.xls" onChange={(e) => handleFileSelect('po', e)} className="hidden" />
            </label>
            {uploadedFiles.po.length > 0 && (
              <div className="mt-3">
                <p className="text-green-700 font-semibold">✓ {uploadedFiles.po.length} file(s) uploaded</p>
                <div className="mt-2">
                  {uploadedFiles.po.map((file, idx) => (
                    <div key={idx} className="text-sm text-gray-600 mb-1">
                      • {file.name} ({new Date(file.date).toLocaleDateString()})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Generate Alerts Section */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Generate Alerts</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Factory</label>
              <select 
                value={selectedFactory} 
                onChange={(e) => setSelectedFactory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                {Object.keys(factories).map(factory => (
                  <option key={factory} value={factory}>{factory}</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            onClick={handleCheckAlerts}
            className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800 font-medium mr-3"
          >
            Check Alerts
          </button>

          {alertData && (
            <button 
              onClick={handleGenerateWord}
              disabled={generatingWord}
              className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800 font-medium"
            >
              {generatingWord ? 'Generating...' : 'Download Word'}
            </button>
          )}

          {alertData && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 font-semibold">✓ {alertData.count} SKUs below MOS threshold</p>
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Email Recipients for {selectedFactory}:</h4>
                <div className="text-sm">
                  <p><strong>To:</strong> {factories[selectedFactory].recipients.join(', ')}</p>
                  <p><strong>CC:</strong> {factories[selectedFactory].ccList.join(', ')}</p>
                </div>
              </div>
            </div>
          )}

          {dataMismatches.length > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-800 font-semibold">⚠️ DATA QUALITY ISSUES DETECTED</p>
              <div className="mt-2 text-sm">
                {dataMismatches.map((mismatch, idx) => (
                  <p key={idx} className="text-yellow-700">• {mismatch.message}</p>
                ))}
              </div>
              <p className="mt-2 text-sm text-yellow-700">Please review and correct the data before proceeding.</p>
            </div>
          )}

          {historicalData.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold mb-3">Historical Data ({historicalData.length} records)</h4>
              <div className="text-sm max-h-32 overflow-y-auto">
                {historicalData.slice(0, 5).map((record, idx) => (
                  <div key={idx} className="py-1 text-blue-700">
                    {new Date(record.date).toLocaleDateString()} - {record.factory}: {record.alertCount} alerts
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
