import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Document, Packer, Table, TableRow, TableCell, Paragraph, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { Download } from 'lucide-react';
import { INVENTORY_DATA } from '../api/inventory-data.js';

export default function App() {
  const [inventoryFile, setInventoryFile] = useState(null);
  const [weeklyFile, setWeeklyFile] = useState(null);
  const [poFile, setPoFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({ inventory: [], weekly: [], po: [] });
  const [selectedFactory, setSelectedFactory] = useState('AIM');
  const [alertData, setAlertData] = useState(null);
  const [dataMismatches, setDataMismatches] = useState([]);
  const [displayColumns, setDisplayColumns] = useState([]);

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
    
    const reader = new FileReader();
    reader.onload = (e) => {
      let fileContent = e.target.result;
      // For Excel files, read as binary
      if (file.name.toLowerCase().includes('.xlsx') || file.name.toLowerCase().includes('.xlsm')) {
        const binaryString = e.target.result;
        fileContent = binaryString;
      }
      const fileData = { name: file.name, data: fileContent, date: new Date().toLocaleDateString() };
      setUploadedFiles(prev => ({ ...prev, [fileType]: [...prev[fileType], fileData] }));
      if (fileType === 'inventory') setInventoryFile(e.target.result);
      if (fileType === 'weekly') setWeeklyFile(e.target.result);
      if (fileType === 'po') setPoFile(e.target.result);
    };
    if (file.name.toLowerCase().includes('.xlsx') || file.name.toLowerCase().includes('.xlsm')) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  };

  const parseFileData = (fileContent, fileName = '') => {
    if (!fileContent) return { data: [], columns: [] };
    
    // Check if it's an Excel file (binary data or .xlsx/.xlsm)
    const isExcel = fileName.toLowerCase().includes('.xlsx') || fileName.toLowerCase().includes('.xlsm') || fileContent.charCodeAt(0) === 80; // 80 = 'P' (PK header)
    
    if (isExcel) {
      try {
        const wb = XLSX.read(fileContent, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws);
        const columns = Object.keys(jsonData[0] || {});
        return { data: jsonData, columns };
      } catch (e) {
        console.error('Excel parse error:', e);
        return { data: [], columns: [] };
      }
    }
    
    // CSV parsing
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
    return { data, columns: header };
  };

  const isValidSKU = (sku) => {
    if (!sku) return false;
    const skuStr = String(sku).trim();
    if (skuStr === '__EMPTY' || skuStr === 'Total' || skuStr.includes('__EMPTY')) return false;
    if (skuStr.toLowerCase().includes('total') || skuStr.toLowerCase().includes('summary')) return false;
    return skuStr.length > 0 && skuStr !== 'SKU';
  };

  const detectMismatches = (invData, weeklyData, poData) => {
    const mismatches = [];
    const invSKUs = invData.filter(r => isValidSKU(r.SKU || r.sku)).map(r => r.SKU || r.sku);
    const weeklySKUs = weeklyData.filter(r => isValidSKU(r.SKU || r.sku)).map(r => r.SKU || r.sku);
    const poSKUs = poData.filter(r => isValidSKU(r.SKU || r.sku)).map(r => r.SKU || r.sku);
    weeklySKUs.forEach(sku => {
      if (!invSKUs.includes(sku)) mismatches.push({ message: 'SKU ' + sku + ' in Weekly but NOT in Inventory' });
    });
    poSKUs.forEach(sku => {
      if (!invSKUs.includes(sku)) mismatches.push({ message: 'SKU ' + sku + ' in PO Log but NOT in Inventory' });
    });
    return mismatches;
  };

  const handleCheckAlerts = () => {
    if (!inventoryFile || !weeklyFile || !poFile) {
      alert('Please upload all three files');
      return;
    }

    const invParsed = parseFileData(inventoryFile, 'inventory.csv');
    const weeklyParsed = parseFileData(weeklyFile, 'weekly.xlsx');
    const poParsed = parseFileData(poFile, 'po.xlsx');

    const mismatches = detectMismatches(invParsed.data, weeklyParsed.data, poParsed.data);
    setDataMismatches(mismatches);

    if (mismatches.length > 0) {
      alert('DATA ISSUES:\n\n' + mismatches.map(m => m.message).join('\n') + '\n\nPlease fix and re-upload');
      return;
    }

    // Use fixed INVENTORY_DATA columns for display (ignore parsed file junk)
    const displayCols = ['sku', 'description', 'onHand', 'available', 'avgMonthlySales', 'mos', 'amountToSafetyStock'];
    setDisplayColumns(displayCols);

    const factoryConfig = factories[selectedFactory];
    const threshold = factoryConfig.threshold;
    const prodField = factoryConfig.prodField;

    const alertSkus = INVENTORY_DATA.filter(sku => {
      if (!sku.factoryFlag || !sku.factoryFlag[selectedFactory]) return false;
      if (sku.mos === undefined || sku.mos === null || sku.mos <= 0 || sku.mos > threshold) return false;
      if (!sku.plannedProdEaches || sku.plannedProdEaches <= 0) return false;
      if (sku.exclude === 'X') return false;
      if (!isValidSKU(sku.sku)) return false;
      const factoryProd = sku[prodField] || 0;
      return factoryProd > 0;
    }).sort((a, b) => a.mos - b.mos);

    setAlertData({ factory: selectedFactory, count: alertSkus.length, data: alertSkus, columns: allCols, timestamp: new Date().toLocaleString() });
  };

  const handleGenerateWord = () => {
    if (!alertData || !alertData.data || alertData.data.length === 0) {
      alert('No alert data to download');
      return;
    }
    try {
      // Use only SKU, Description, MOS columns from INVENTORY_DATA
      const keyCols = ['sku', 'description', 'onHand', 'available', 'avgMonthlySales', 'mos', 'amountToSafetyStock'];
      const colHeaders = ['SKU', 'Description', 'OnHand', 'Available', 'Avg Monthly Sales', 'MOS', 'Amount to Safety Stock'];
      
      const rows = [
        new TableRow({
          children: colHeaders.map(col => new TableCell({ 
            children: [new Paragraph({ text: col, bold: true })] 
          }))
        }),
        ...alertData.data.map(sku => 
          new TableRow({
            children: keyCols.map(key => new TableCell({
              children: [new Paragraph({ text: String(sku[key] || '') })]
            }))
          })
        )
      ];
      
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({ text: 'Benebone Intelligence', bold: true, size: 32 }),
            new Paragraph({ text: 'Alert Report', size: 24 }),
            new Paragraph({ text: 'Generated: ' + alertData.timestamp, size: 12 }),
            new Paragraph({ text: 'Factory: ' + alertData.factory, size: 12 }),
            new Paragraph({ text: 'Total Alerts: ' + alertData.count, size: 12 }),
            new Paragraph({ text: '' }),
            new Table({ width: { size: 100, type: 'pct' }, rows })
          ]
        }]
      });
      
      Packer.toBlob(doc).then(blob => {
        saveAs(blob, 'Benebone_Alert_' + alertData.factory + '.docx');
      });
    } catch (error) {
      console.error('Document generation error:', error);
      alert('Error generating document. Please try again.');
    }
  };

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
        {/* UPLOAD SECTION - Always visible */}
        <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload Your Data</h2>
          
          <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold text-lg mb-3">Inventory Snapshot</h3>
            <label className="inline-block bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700 mr-2">
              Choose File
              <input type="file" accept=".csv" onChange={(e) => handleFileSelect('inventory', e)} className="hidden" />
            </label>
            {uploadedFiles.inventory.length > 0 && (
              <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                <p className="text-green-700 font-semibold text-sm">✓ {uploadedFiles.inventory.length} file(s)</p>
                {uploadedFiles.inventory.map((f, i) => (<p key={i} className="text-xs text-gray-600">• {f.name} ({f.date})</p>))}
              </div>
            )}
          </div>

          <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold text-lg mb-3">Weekly Inventory Report</h3>
            <label className="inline-block bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700 mr-2">
              Choose File
              <input type="file" accept=".xlsx,.xls,.xlsm" onChange={(e) => handleFileSelect('weekly', e)} className="hidden" />
            </label>
            {uploadedFiles.weekly.length > 0 && (
              <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                <p className="text-green-700 font-semibold text-sm">✓ {uploadedFiles.weekly.length} file(s)</p>
                {uploadedFiles.weekly.map((f, i) => (<p key={i} className="text-xs text-gray-600">• {f.name} ({f.date})</p>))}
              </div>
            )}
          </div>

          <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold text-lg mb-3">PO & Receiving Log</h3>
            <label className="inline-block bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700 mr-2">
              Choose File
              <input type="file" accept=".xlsx,.xls,.xlsm" onChange={(e) => handleFileSelect('po', e)} className="hidden" />
            </label>
            {uploadedFiles.po.length > 0 && (
              <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                <p className="text-green-700 font-semibold text-sm">✓ {uploadedFiles.po.length} file(s)</p>
                {uploadedFiles.po.map((f, i) => (<p key={i} className="text-xs text-gray-600">• {f.name} ({f.date})</p>))}
              </div>
            )}
          </div>
        </div>

        {/* ALERTS SECTION - Only after files uploaded + checked */}
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

          {/* ONLY SHOW RESULTS AFTER ALERTS ARE CHECKED */}
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
                      {displayColumns.map((col, i) => (<th key={i} className="border px-2 py-2 text-left font-semibold">{col}</th>))}
                    </tr>
                  </thead>
                  <tbody>
                    {alertData.data.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {displayColumns.map((col, j) => (<td key={j} className="border px-2 py-2">{row[col] || ''}</td>))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-sm text-gray-600 mt-2">Showing {Math.min(10, alertData.data.length)} of {alertData.count}. Download Word for all.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
