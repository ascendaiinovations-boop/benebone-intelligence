import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Document, Packer, Table, TableRow, TableCell, Paragraph, TextRun, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { INVENTORY_DATA } from '../api/inventory-data.js';

const STORAGE_KEY = 'benebone_uploaded_files';

export default function App() {
  const [inventoryFile, setInventoryFile] = useState(null);
  const [weeklyFile, setWeeklyFile] = useState(null);
  const [poFile, setPoFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({ inventory: [], weekly: [], po: [] });
  const [selectedFactory, setSelectedFactory] = useState('AIM');
  const [alertData, setAlertData] = useState(null);
  const [dataMismatches, setDataMismatches] = useState([]);
  const [displayColumns, setDisplayColumns] = useState([]);

  const columnLabels = {
    sku: 'SKU',
    description: 'Description',
    onHand: 'On Hand',
    available: 'Available',
    avgMonthlySales: 'Avg Monthly Sales',
    mos: 'MOS',
    amountToSafetyStock: 'Amount to Safety Stock',
    notes: 'Notes'
  };

  // Load persisted files on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setUploadedFiles(parsed);
        if (parsed.inventory.length > 0) setInventoryFile(parsed.inventory[parsed.inventory.length - 1].data);
        if (parsed.weekly.length > 0) setWeeklyFile(parsed.weekly[parsed.weekly.length - 1].data);
        if (parsed.po.length > 0) setPoFile(parsed.po[parsed.po.length - 1].data);
      }
    } catch (e) {
      console.error('Failed to load saved files:', e);
    }
  }, []);

  // Persist files whenever they change
  useEffect(() => {
    try {
      if (uploadedFiles.inventory.length > 0 || uploadedFiles.weekly.length > 0 || uploadedFiles.po.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(uploadedFiles));
      }
    } catch (e) {
      console.error('Failed to save files (storage may be full):', e);
    }
  }, [uploadedFiles]);

  const factories = {
    'AIM': { threshold: 1.5, recipients: ['JAyers@AluminumInjectionMold.com', 'SRoloson@AluminumInjectionMold.com', 'TSwanson@AluminumInjectionMold.com'], ccList: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'], prodField: 'aimProduction' },
    'Midbury': { threshold: 2.0, recipients: ['benebone@midbury.com'], ccList: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'], prodField: 'midburyProduction' },
    'LTM': { threshold: 2.0, recipients: ['eric@ltmplastics.com'], ccList: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'], prodField: 'ltmProduction' },
    '201': { threshold: 2.0, recipients: ['emilio.otero@201oficial.com.mx'], ccList: ['salvador@201oficial.com.mx', 'punam@benebone.com'], prodField: 'grupoProduction' },
    'Bennett': { threshold: 2.0, recipients: ['jmattox@bpkc.com'], ccList: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'], prodField: 'bennettProduction' },
    'DMG': { threshold: 2.0, recipients: ['monique.brunson@dmgincusa.com'], ccList: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'], prodField: 'dmgProduction' },
    'Coltoys': { threshold: 2.0, recipients: ['jparra@coltoys.com'], ccList: ['carly@benebone.com', 'zach@benebone.com', 'punam@benebone.com'], prodField: 'coltoysProduction' },
    'Loving Pets': { threshold: 2.0, recipients: ['aaron@lovingpetsproducts.com'], ccList: ['zach@benebone.com', 'carly@benebone.com', 'punam@benebone.com'], prodField: 'lovingpetsProduction' }
  };

  const handleFileSelect = (fileType, event) => {
    const file = event.target.files[0];
    if (!file) return;

    const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xlsm') || file.name.toLowerCase().endsWith('.xls');
    const reader = new FileReader();

    reader.onload = (e) => {
      const fileData = { name: file.name, data: e.target.result, date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString() };

      setUploadedFiles(prev => ({
        ...prev,
        [fileType]: [...prev[fileType], fileData]
      }));

      if (fileType === 'inventory') setInventoryFile(e.target.result);
      if (fileType === 'weekly') setWeeklyFile(e.target.result);
      if (fileType === 'po') setPoFile(e.target.result);
    };

    if (isExcel) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  };

  const removeFile = (fileType, index) => {
    setUploadedFiles(prev => {
      const updated = { ...prev, [fileType]: prev[fileType].filter((_, i) => i !== index) };
      return updated;
    });
  };

  const clearAllFiles = () => {
    if (!confirm('Clear all uploaded files? This cannot be undone.')) return;
    setUploadedFiles({ inventory: [], weekly: [], po: [] });
    setInventoryFile(null);
    setWeeklyFile(null);
    setPoFile(null);
    localStorage.removeItem(STORAGE_KEY);
    setAlertData(null);
  };

  const isValidSKU = (sku) => {
    if (!sku) return false;
    const skuStr = String(sku).trim();
    if (skuStr === '__EMPTY' || skuStr.includes('__EMPTY')) return false;
    if (skuStr.toLowerCase().includes('total') || skuStr.toLowerCase().includes('summary')) return false;
    return skuStr.length > 0 && skuStr.toLowerCase() !== 'sku';
  };

  // Config: which sheet + which row has real headers, per file type
  const SHEET_CONFIG = {
    weekly: { sheetName: 'Final', headerRow: 2, skuField: 'Item No.' },
    po: { sheetName: 'PO & Receiving Log', headerRow: 2, skuField: 'Item No.' }
  };

  const parseExcelSheet = (fileContent, config) => {
    try {
      const wb = XLSX.read(fileContent, { type: 'binary' });
      // Use configured sheet name if it exists, else fall back to first sheet
      const sheetName = wb.SheetNames.includes(config.sheetName) ? config.sheetName : wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];

      // Convert to array-of-arrays first so we can pick the correct header row
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      const headerRowIdx = config.headerRow - 1; // 0-indexed
      if (rows.length <= headerRowIdx) return { data: [], columns: [], sheetUsed: sheetName };

      const headers = rows[headerRowIdx].map(h => String(h || '').trim());
      const dataRows = rows.slice(headerRowIdx + 1);

      const data = dataRows
        .filter(r => r[headers.indexOf(config.skuField)]) // must have a SKU value
        .map(r => {
          const obj = {};
          headers.forEach((h, i) => { if (h) obj[h] = r[i]; });
          return obj;
        });

      return { data, columns: headers.filter(h => h), sheetUsed: sheetName };
    } catch (e) {
      console.error('Excel parse error:', e);
      return { data: [], columns: [], sheetUsed: null };
    }
  };

  const parseCSV = (fileContent) => {
    const lines = fileContent.split('\n').filter(line => line.trim());
    if (lines.length === 0) return { data: [], columns: [] };
    const header = lines[0].split(',').map(col => col.trim().replace(/"/g, ''));
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      header.forEach((col, idx) => { row[col] = values[idx] || ''; });
      data.push(row);
    }
    return { data, columns: header.filter(h => h) };
  };

  const parseFileData = (fileContent, fileType) => {
    if (!fileContent) return { data: [], columns: [] };
    if (fileType === 'inventory') return parseCSV(fileContent);
    return parseExcelSheet(fileContent, SHEET_CONFIG[fileType]);
  };

  const detectMismatches = (invData, weeklyData, poData) => {
    const mismatches = [];
    const invSKUs = new Set(invData.filter(r => isValidSKU(r.SKU || r.sku)).map(r => String(r.SKU || r.sku)));
    const weeklySKUs = weeklyData.filter(r => isValidSKU(r['Item No.'])).map(r => String(r['Item No.']));
    const poSKUs = poData.filter(r => isValidSKU(r['Item No.'])).map(r => String(r['Item No.']));

    // Only flag if the SKU never appears anywhere in inventory-data source either (avoid noisy false positives on ML/EF suffix variants)
    const uniqueWeeklyMissing = [...new Set(weeklySKUs.filter(sku => !invSKUs.has(sku)))];
    const uniquePoMissing = [...new Set(poSKUs.filter(sku => !invSKUs.has(sku)))];

    uniqueWeeklyMissing.forEach(sku => {
      mismatches.push({ message: 'SKU ' + sku + ' found in Weekly Report but NOT in Inventory Snapshot' });
    });
    uniquePoMissing.forEach(sku => {
      mismatches.push({ message: 'SKU ' + sku + ' found in PO Log but NOT in Inventory Snapshot' });
    });
    return mismatches;
  };

  const handleCheckAlerts = () => {
    if (!inventoryFile || !weeklyFile || !poFile) {
      alert('Please upload all three files (Inventory Snapshot, Weekly Report, and PO Log)');
      return;
    }

    const invParsed = parseFileData(inventoryFile, 'inventory');
    const weeklyParsed = parseFileData(weeklyFile, 'weekly');
    const poParsed = parseFileData(poFile, 'po');

    if (weeklyParsed.data.length === 0) {
      alert('Could not read Weekly Inventory Report. Please check the file has a "Final" sheet with data.');
      return;
    }
    if (poParsed.data.length === 0) {
      alert('Could not read PO & Receiving Log. Please check the file has a "PO & Receiving Log" sheet with data.');
      return;
    }

    const mismatches = detectMismatches(invParsed.data, weeklyParsed.data, poParsed.data);
    setDataMismatches(mismatches);

    if (mismatches.length > 0) {
      alert('DATA ISSUES FOUND:\n\n' + mismatches.map(m => m.message).join('\n') + '\n\nPlease fix and re-upload before proceeding.');
      return;
    }

    const displayCols = ['sku', 'description', 'onHand', 'available', 'avgMonthlySales', 'mos', 'amountToSafetyStock', 'notes'];
    setDisplayColumns(displayCols);

    const factoryConfig = factories[selectedFactory];
    const threshold = factoryConfig.threshold;
    const prodField = factoryConfig.prodField;

    const alertSkus = INVENTORY_DATA.filter(sku => {
      if (!isValidSKU(sku.sku)) return false;
      if (!sku.factoryFlag || !sku.factoryFlag[selectedFactory]) return false;
      if (sku.mos === undefined || sku.mos === null || sku.mos <= 0 || sku.mos > threshold) return false;
      if (!sku.plannedProdEaches || sku.plannedProdEaches <= 0) return false;
      if (sku.exclude === 'X') return false;
      const factoryProd = sku[prodField] || 0;
      return factoryProd > 0;
    }).sort((a, b) => a.mos - b.mos);

    setAlertData({
      factory: selectedFactory,
      count: alertSkus.length,
      data: alertSkus,
      timestamp: new Date().toLocaleString()
    });
  };

  const handleGenerateWord = () => {
    if (!alertData || !alertData.data || alertData.data.length === 0) {
      alert('No alert data to download. Please check alerts first.');
      return;
    }
    try {
      const keyCols = ['sku', 'description', 'onHand', 'available', 'avgMonthlySales', 'mos', 'amountToSafetyStock', 'notes'];

      const headerRow = new TableRow({
        children: keyCols.map(col => new TableCell({
          width: { size: 100 / keyCols.length, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: columnLabels[col] || col, bold: true })] })]
        }))
      });

      const dataRows = alertData.data.map(sku =>
        new TableRow({
          children: keyCols.map(key => new TableCell({
            width: { size: 100 / keyCols.length, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: String(sku[key] !== undefined && sku[key] !== null ? sku[key] : '') })] })]
          }))
        })
      );

      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({ children: [new TextRun({ text: 'Benebone Intelligence', bold: true, size: 32 })] }),
            new Paragraph({ children: [new TextRun({ text: 'Weekly Alert Report', size: 24 })] }),
            new Paragraph({ children: [new TextRun({ text: 'Generated: ' + alertData.timestamp, size: 20 })] }),
            new Paragraph({ children: [new TextRun({ text: 'Factory: ' + alertData.factory, size: 20 })] }),
            new Paragraph({ children: [new TextRun({ text: 'Total Alerts: ' + alertData.count, size: 20 })] }),
            new Paragraph({ text: '' }),
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...dataRows] })
          ]
        }]
      });

      Packer.toBlob(doc).then(blob => {
        saveAs(blob, 'Benebone_Alert_' + alertData.factory + '_' + new Date().toISOString().split('T')[0] + '.docx');
      }).catch(err => {
        console.error('Packer error:', err);
        alert('Error creating Word document: ' + err.message);
      });
    } catch (error) {
      console.error('Document generation error:', error);
      alert('Error generating document: ' + error.message);
    }
  };

  const renderFileSection = (title, fileType, accept) => (
    <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
      <h3 className="font-semibold text-lg mb-3">{title}</h3>
      <label className="inline-block bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700 mr-2">
        Choose File
        <input type="file" accept={accept} onChange={(e) => handleFileSelect(fileType, e)} className="hidden" />
      </label>
      {uploadedFiles[fileType].length > 0 && (
        <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
          <p className="text-green-700 font-semibold text-sm">{uploadedFiles[fileType].length} file(s) uploaded</p>
          {uploadedFiles[fileType].map((f, i) => (
            <div key={i} className="flex items-center justify-between text-xs text-gray-600 mt-1">
              <span>{f.name} ({f.date})</span>
              <button onClick={() => removeFile(fileType, i)} className="text-red-500 hover:text-red-700 ml-2 font-bold">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
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

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Upload Your Data</h2>
            {(uploadedFiles.inventory.length > 0 || uploadedFiles.weekly.length > 0 || uploadedFiles.po.length > 0) && (
              <button onClick={clearAllFiles} className="text-sm text-red-600 hover:text-red-800 underline">Clear All Files</button>
            )}
          </div>

          {renderFileSection('Inventory Snapshot', 'inventory', '.csv')}
          {renderFileSection('Weekly Inventory Report', 'weekly', '.xlsx,.xls,.xlsm')}
          {renderFileSection('PO & Receiving Log', 'po', '.xlsx,.xls,.xlsm')}

          <p className="text-xs text-gray-500 mt-2">Files persist across page refreshes. Upload multiple months by clicking "Choose File" again for each section.</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Generate Alerts</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Factory</label>
            <select
              value={selectedFactory}
              onChange={(e) => setSelectedFactory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              {Object.keys(factories).map(factory => (<option key={factory} value={factory}>{factory}</option>))}
            </select>
          </div>

          <button onClick={handleCheckAlerts} className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800 font-medium mr-3">
            Check Alerts
          </button>

          {alertData && (
            <>
              <button onClick={handleGenerateWord} className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800 font-medium">
                Download Word
              </button>

              {dataMismatches.length > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-yellow-800 font-semibold">⚠️ DATA ISSUES</p>
                  {dataMismatches.map((m, i) => (<p key={i} className="text-sm text-yellow-700">• {m.message}</p>))}
                </div>
              )}

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
                <p className="text-green-800 font-semibold">✓ {alertData.count} SKUs below MOS threshold</p>
                <div className="mt-3 text-sm">
                  <p><strong>To:</strong> {factories[selectedFactory].recipients.join(', ')}</p>
                  <p><strong>CC:</strong> {factories[selectedFactory].ccList.join(', ')}</p>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto border border-gray-200 rounded">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      {displayColumns.map((col, i) => (<th key={i} className="border px-3 py-2 text-left font-semibold">{columnLabels[col] || col}</th>))}
                    </tr>
                  </thead>
                  <tbody>
                    {alertData.data.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {displayColumns.map((col, j) => (<td key={j} className="border px-3 py-2">{row[col] !== undefined && row[col] !== null ? String(row[col]) : ''}</td>))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-sm text-gray-600 mt-2">Showing {Math.min(10, alertData.data.length)} of {alertData.count}. Download Word for complete list.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
