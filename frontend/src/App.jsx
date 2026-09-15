import React, { useState } from 'react';
import { MessageSquare, Download, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { INVENTORY_DATA } from '../api/inventory-data.js';

export default function App() {
  const [selectedFactory, setSelectedFactory] = useState('AIM');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [showConfirmPopup, setShowConfirmPopup] = useState(null);
  const [currentFileToUpload, setCurrentFileToUpload] = useState(null);
  const [generatingWord, setGeneratingWord] = useState(false);

  const factories = ['AIM', 'Midbury', 'LTM', '201', 'Bennett', 'DMG', 'Coltoys', 'Loving Pets'];
  const thresholds = { AIM: 1.5, Midbury: 2.0, LTM: 2.0, '201': 2.0, Bennett: 2.0, DMG: 2.0, Coltoys: 2.0, 'Loving Pets': 2.0 };
  
  const factoryEmails = {
    AIM: { to: ['JAyers@AluminumInjectionMold.com', 'SRoloson@AluminumInjectionMold.com', 'TSwanson@AluminumInjectionMold.com'], cc: 'punam@benebone.com' },
    Midbury: { to: 'benebone@midbury.com', cc: 'punam@benebone.com' },
    LTM: { to: 'eric@ltmplastics.com', cc: 'punam@benebone.com' },
    '201': { to: 'emilio.otero@201oficial.com.mx', cc: 'punam@benebone.com, salvador@201oficial.com.mx' },
    Bennett: { to: 'jmattox@bpkc.com', cc: 'punam@benebone.com' },
    DMG: { to: 'monique.brunson@dmgincusa.com', cc: 'punam@benebone.com' },
    Coltoys: { to: 'jparra@coltoys.com', cc: 'punam@benebone.com' },
    'Loving Pets': { to: 'aaron@lovingpetsproducts.com', cc: 'punam@benebone.com, zach@benebone.com, carly@benebone.com' }
  };

  const handleFileUploadClick = (fileType) => {
    setCurrentFileToUpload(fileType);
    setShowConfirmPopup(null);
    document.getElementById(`file-${fileType}`)?.click();
  };

  const handleFileSelect = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      setCurrentFileToUpload(fileType);
      setShowConfirmPopup({
        type: 'upload',
        fileType,
        fileName: file.name,
        message: `Do you want to upload ${file.name}?`
      });
    }
  };

  const confirmUpload = () => {
    if (showConfirmPopup && showConfirmPopup.type === 'upload') {
      setUploadedFiles(prev => ({
        ...prev,
        [showConfirmPopup.fileType]: showConfirmPopup.fileName
      }));
      setShowConfirmPopup(null);
    }
  };

  const deleteFile = (fileType) => {
    setShowConfirmPopup({
      type: 'delete',
      fileType,
      message: `Delete ${uploadedFiles[fileType]}?`
    });
  };

  const confirmDelete = () => {
    if (showConfirmPopup && showConfirmPopup.type === 'delete') {
      setUploadedFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[showConfirmPopup.fileType];
        return newFiles;
      });
      setShowConfirmPopup(null);
    }
  };

  const checkAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/get-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factory: selectedFactory })
      });
      const data = await res.json();
      setAlerts(data.skus || []);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const generateWord = async () => {
    setGeneratingWord(true);
    try {
      const res = await fetch('/api/generate-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factory: selectedFactory })
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Benebone_Alert_${selectedFactory}_${new Date().toISOString().split('T')[0]}.docx`;
      a.click();
    } catch (error) {
      console.error('Error:', error);
    }
    setGeneratingWord(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <header className="sticky top-0 z-50" style={{ backgroundColor: '#1a4d2e', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.avif" alt="Benebone" className="h-8" />
            <div>
              <h1 className="text-xl font-bold text-white">Benebone Intelligence</h1>
              <p className="text-xs text-green-100">Inventory Management System</p>
            </div>
          </div>
          <div className="text-xs text-green-100">
            Last sync: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </header>

      {/* Popup Modal */}
      {showConfirmPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-orange-600" />
              <h2 className="text-lg font-bold">Confirm Action</h2>
            </div>
            <p className="text-gray-700 mb-6">{showConfirmPopup.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmPopup(null)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={showConfirmPopup.type === 'upload' ? confirmUpload : confirmDelete}
                style={{ backgroundColor: '#1a4d2e' }}
                className="px-4 py-2 rounded text-white font-medium hover:opacity-90"
              >
                {showConfirmPopup.type === 'upload' ? 'Upload' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#1a4d2e' }}>Upload Your Data</h2>
          <p className="text-gray-600 mb-6">Keep your inventory alerts fresh by uploading your latest data files.</p>

          {/* Inventory Snapshot */}
          <div className="mb-6 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">Inventory Snapshot</h3>
                <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: '#1a4d2e', color: 'white' }}>WEEKLY</span>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded mb-3 text-sm">
              <p><strong>File Format:</strong> BeneBone Inventory Snapshot [DATE].csv</p>
              <p><strong>Example:</strong> BeneBone Inventory Snapshot 20260917.csv</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-4 text-sm">
              <strong>Requirements:</strong>
              <ul className="list-disc list-inside mt-2 text-gray-700">
                <li>File format: .csv</li>
                <li>Contains all 782 SKUs</li>
                <li>Columns: SKU, OnHand, Available, Avg Monthly Sales, etc.</li>
              </ul>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="file-snapshot"
                type="file"
                accept=".csv"
                onChange={(e) => handleFileSelect(e, 'snapshot')}
                className="hidden"
              />
              <button
                onClick={() => handleFileUploadClick('snapshot')}
                className="px-4 py-2 rounded border border-gray-300 hover:border-gray-400 text-gray-700 font-medium"
              >
                Choose File
              </button>
              <span className="text-gray-600">
                {uploadedFiles.snapshot ? uploadedFiles.snapshot : 'No file chosen'}
              </span>
              {uploadedFiles.snapshot && (
                <button
                  onClick={() => deleteFile('snapshot')}
                  className="ml-auto px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                  title="Delete file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {uploadedFiles.snapshot && (
              <div className="mt-3 flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Success! Loaded 345 SKUs</span>
              </div>
            )}
          </div>

          {/* Weekly Inventory Report */}
          <div className="mb-6 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">Weekly Inventory Report</h3>
                <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: '#1a4d2e', color: 'white' }}>MONTHLY</span>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded mb-3 text-sm">
              <p><strong>File Format:</strong> Weekly Inventory Report [M-DD-YYYY].xlsx</p>
              <p><strong>Example:</strong> Weekly Inventory Report 9-17-2026.xlsx</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-4 text-sm">
              <strong>Requirements:</strong>
              <ul className="list-disc list-inside mt-2 text-gray-700">
                <li>File format: .xlsx or .xls</li>
                <li>Contains MOS calculations and trends</li>
                <li>File size: Max 50MB</li>
              </ul>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="file-weekly"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => handleFileSelect(e, 'weekly')}
                className="hidden"
              />
              <button
                onClick={() => handleFileUploadClick('weekly')}
                className="px-4 py-2 rounded border border-gray-300 hover:border-gray-400 text-gray-700 font-medium"
              >
                Choose File
              </button>
              <span className="text-gray-600">
                {uploadedFiles.weekly ? uploadedFiles.weekly : 'No file chosen'}
              </span>
              {uploadedFiles.weekly && (
                <button
                  onClick={() => deleteFile('weekly')}
                  className="ml-auto px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                  title="Delete file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {uploadedFiles.weekly && (
              <div className="mt-3 flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Success! Loaded report</span>
              </div>
            )}
          </div>

          {/* PO & Receiving Log */}
          <div className="mb-6 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">PO & Receiving Log</h3>
                <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: '#1a4d2e', color: 'white' }}>WEEKLY</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="file-po"
                type="file"
                accept=".xlsm,.xlsx"
                onChange={(e) => handleFileSelect(e, 'po')}
                className="hidden"
              />
              <button
                onClick={() => handleFileUploadClick('po')}
                className="px-4 py-2 rounded border border-gray-300 hover:border-gray-400 text-gray-700 font-medium"
              >
                Choose File
              </button>
              <span className="text-gray-600">
                {uploadedFiles.po ? uploadedFiles.po : 'No file chosen'}
              </span>
              {uploadedFiles.po && (
                <button
                  onClick={() => deleteFile('po')}
                  className="ml-auto px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                  title="Delete file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {uploadedFiles.po && (
              <div className="mt-3 flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Success! Loaded PO log</span>
              </div>
            )}
          </div>
        </div>

        {/* Generate Alerts Section */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#1a4d2e' }}>Generate Alerts</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1a4d2e' }}>Select Factory</label>
              <select
                value={selectedFactory}
                onChange={(e) => setSelectedFactory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                style={{ borderColor: '#1a4d2e' }}
              >
                {factories.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 mb-8">
            <button
              onClick={checkAlerts}
              disabled={loading}
              style={{ backgroundColor: '#1a4d2e' }}
              className="px-6 py-2 rounded text-white font-medium hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check Alerts'}
            </button>

            <button
              onClick={generateWord}
              disabled={generatingWord || alerts.length === 0}
              style={{ backgroundColor: '#2d6a4f' }}
              className="px-6 py-2 rounded text-white font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {generatingWord ? 'Generating...' : 'Download Word'}
            </button>
          </div>

          {alerts.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-4">
                Weekly Alert - {selectedFactory} ({alerts.length} SKUs)
              </h3>

              <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm">
                <p className="font-semibold mb-2">Email Recipients:</p>
                <p><strong>To:</strong> {Array.isArray(factoryEmails[selectedFactory].to) ? factoryEmails[selectedFactory].to.join(', ') : factoryEmails[selectedFactory].to}</p>
                <p><strong>CC:</strong> {factoryEmails[selectedFactory].cc}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: '#e8f5e9' }}>
                      <th className="border border-gray-300 p-2 text-left">SKU</th>
                      <th className="border border-gray-300 p-2 text-left">Description</th>
                      <th className="border border-gray-300 p-2 text-right">OnHand</th>
                      <th className="border border-gray-300 p-2 text-right">Available</th>
                      <th className="border border-gray-300 p-2 text-right">Avg Monthly</th>
                      <th className="border border-gray-300 p-2 text-right">MOS</th>
                      <th className="border border-gray-300 p-2 text-right">Amt to SS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.slice(0, 10).map((sku, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 p-2 font-mono">{sku.sku}</td>
                        <td className="border border-gray-300 p-2">{sku.description}</td>
                        <td className="border border-gray-300 p-2 text-right">{sku.onHand}</td>
                        <td className="border border-gray-300 p-2 text-right">{sku.available?.toFixed(0)}</td>
                        <td className="border border-gray-300 p-2 text-right">{sku.avgMonthlySales?.toFixed(0)}</td>
                        <td className="border border-gray-300 p-2 text-right font-bold" style={{ color: '#d32f2f' }}>{sku.mos?.toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 text-right">{sku.amtToSS?.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {alerts.length > 10 && (
                <p className="text-sm text-gray-600 mt-3">Showing 10 of {alerts.length} SKUs. Download Word document to see all.</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
