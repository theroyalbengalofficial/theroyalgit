import React, { useState, useEffect } from 'react';
import {
  X,
  Server,
  Folder,
  FolderCheck,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  HardDrive,
  Code2,
  Sliders,
  ChevronRight,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';
import { storeService } from '../services/storeService';

interface ServerStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshProducts?: () => void;
}

interface StorageFolderFile {
  name: string;
  size: number;
  modified: string;
  url: string;
}

interface StorageFolderItem {
  name: string;
  path: string;
  files: StorageFolderFile[];
  hasProductJson: boolean;
  productPreview: {
    id: string;
    name: string;
    price: number;
    styleCode: string;
    stock: number;
    category: string;
  } | null;
  modified: string;
}

export const ServerStorageModal: React.FC<ServerStorageModalProps> = ({
  isOpen,
  onClose,
  onRefreshProducts,
}) => {
  const [activeTab, setActiveTab] = useState<'folders' | 'connect' | 'scripts'>('folders');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [folders, setFolders] = useState<StorageFolderItem[]>([]);
  const [storageInfo, setStorageInfo] = useState<any>(null);

  // External server configuration state
  const [serverType, setServerType] = useState<string>('php_webhook');
  const [serverUrl, setServerUrl] = useState<string>('');
  const [authToken, setAuthToken] = useState<string>('');
  const [remoteBasePath, setRemoteBasePath] = useState<string>('storage/products');
  const [autoSyncOnCreate, setAutoSyncOnCreate] = useState<boolean>(true);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);

  // Testing & Status
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    statusCode?: number;
    details?: any;
  } | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);
  const [syncAllMessage, setSyncAllMessage] = useState<string | null>(null);

  // Inspector state for viewing JSON files
  const [viewingJson, setViewingJson] = useState<{ folder: string; json: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Load storage data on modal open
  useEffect(() => {
    if (isOpen) {
      loadStorageData();
    }
  }, [isOpen]);

  const loadStorageData = async () => {
    setIsLoading(true);
    try {
      const [info, folderData, config] = await Promise.all([
        storeService.getStorageInfo(),
        storeService.getStorageFolders(),
        storeService.getStorageConfig(),
      ]);

      if (info) setStorageInfo(info);
      if (folderData?.folders && Array.isArray(folderData.folders)) {
        const normalized: StorageFolderItem[] = folderData.folders.map((f: any) => {
          if (typeof f === 'string') {
            return {
              name: f,
              path: `/storage/products/${f}`,
              files: [
                {
                  name: 'product.json',
                  size: 512,
                  modified: new Date().toISOString(),
                  url: `/storage/products/${f}/product.json`,
                },
              ],
              hasProductJson: true,
              productPreview: null,
              modified: new Date().toISOString(),
            };
          }
          const rawFiles = Array.isArray(f?.files) ? f.files : [];
          return {
            name: f?.name || f?.folder || f?.styleCode || f?.id || 'product_folder',
            path: f?.path || `/storage/products/${f?.name || f?.folder || 'product'}`,
            files: rawFiles.map((fl: any) => ({
              name: fl?.name || 'file',
              size: typeof fl?.size === 'number' ? fl.size : 0,
              modified: fl?.modified || new Date().toISOString(),
              url: fl?.url || '',
            })),
            hasProductJson:
              typeof f?.hasProductJson === 'boolean'
                ? f.hasProductJson
                : rawFiles.some((fl: any) => fl?.name === 'product.json'),
            productPreview: f?.productPreview || null,
            modified: f?.modified || new Date().toISOString(),
          };
        });
        setFolders(normalized);
      } else {
        setFolders([]);
      }

      if (config) {
        setIsEnabled(!!config.enabled);
        setServerType(config.serverType || 'php_webhook');
        setServerUrl(config.serverUrl || '');
        setAuthToken(config.authToken || '');
        setRemoteBasePath(config.remoteBasePath || 'storage/products');
        setAutoSyncOnCreate(config.autoSyncOnCreate !== false);
      }
    } catch (err) {
      console.warn('Error loading server storage data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!serverUrl) {
      setTestResult({
        success: false,
        message: 'Please enter your purchased server or webhook URL first.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await storeService.testServerConnection({
        serverUrl,
        authToken,
        serverType,
      });

      setTestResult({
        success: !!res.success,
        message: res.message || (res.success ? 'Connection successful!' : 'Connection failed'),
        latencyMs: res.latencyMs,
        statusCode: res.statusCode,
        details: res.data,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network request failed. Is the server online?',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsLoading(true);
    try {
      const updated = {
        enabled: isEnabled,
        serverType,
        serverUrl: serverUrl.trim(),
        authToken: authToken.trim(),
        remoteBasePath: remoteBasePath.trim(),
        autoSyncOnCreate,
      };

      const res = await storeService.saveStorageConfig(updated);
      if (res.success) {
        setSaveSuccessNotice(true);
        setTimeout(() => setSaveSuccessNotice(false), 3000);
        await loadStorageData();
      }
    } catch (err) {
      console.error('Failed to save storage config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncAllProducts = async () => {
    setIsSyncingAll(true);
    setSyncAllMessage(null);
    try {
      const res = await storeService.syncAllFoldersToServer();
      if (res.success) {
        setSyncAllMessage(res.message || 'All product folders created on server storage.');
        await loadStorageData();
        if (onRefreshProducts) onRefreshProducts();
      } else {
        setSyncAllMessage('Error: ' + (res.error || 'Failed to sync all products'));
      }
    } catch (err: any) {
      setSyncAllMessage('Failed to sync: ' + err.message);
    } finally {
      setIsSyncingAll(false);
    }
  };

  const copyToClipboard = async (text: string, keyName: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedKey(keyName);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-4xl bg-neutral-950 border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.95)] my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-[#F25C05]/10 border border-[#F25C05]/40 flex items-center justify-center text-[#F25C05]">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-medium tracking-[0.15em] uppercase text-white">
                  Server Storage & Product Folders
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-[#F25C05]/20 text-[#F25C05] border border-[#F25C05]/30">
                  Purchased Hosting
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Every registered product automatically creates a dedicated folder with JSON & images on your server.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-2 hover:bg-white/5 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/20 px-4 sm:px-6">
          <button
            onClick={() => setActiveTab('folders')}
            className={`flex items-center gap-2 py-3 px-4 text-xs uppercase tracking-wider font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'folders'
                ? 'border-[#F25C05] text-[#F25C05]'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <FolderCheck className="w-4 h-4" />
            <span>Created Product Folders ({(folders || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('connect')}
            className={`flex items-center gap-2 py-3 px-4 text-xs uppercase tracking-wider font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'connect'
                ? 'border-[#F25C05] text-[#F25C05]'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Connect Purchased Server</span>
            {isEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('scripts')}
            className={`flex items-center gap-2 py-3 px-4 text-xs uppercase tracking-wider font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'scripts'
                ? 'border-[#F25C05] text-[#F25C05]'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>1-Click Deploy Script (PHP)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* ============================================================== */}
          {/* TAB 1: PRODUCT FOLDERS EXPLORER */}
          {/* ============================================================== */}
          {activeTab === 'folders' && (
            <div className="space-y-6">
              {/* Storage Status Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-white/5 border border-white/10">
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wider">
                    Server Folder Engine
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-sm font-medium text-white">Active (Auto-Creates)</span>
                  </div>
                  <div className="text-[11px] font-mono text-neutral-400 mt-1">
                    Path: storage/products/&lt;SKU&gt;/
                  </div>
                </div>

                <div className="p-3.5 bg-white/5 border border-white/10">
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wider">
                    Folders Stored On Server
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Folder className="w-4 h-4 text-[#F25C05]" />
                    <span className="text-sm font-medium text-white">{(folders || []).length} Folders</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1">
                    Contains product.json & images
                  </div>
                </div>

                <div className="p-3.5 bg-white/5 border border-white/10">
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wider">
                    Purchased Remote Server
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isEnabled && serverUrl ? 'bg-emerald-500' : 'bg-neutral-600'
                      }`}
                    ></span>
                    <span className="text-sm font-medium text-white">
                      {isEnabled && serverUrl ? 'Configured & Linked' : 'Local Node Storage'}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1 truncate">
                    {serverUrl ? serverUrl.slice(0, 32) + '...' : 'Connect in tab 2'}
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-neutral-400">
                  Each product registered in the admin panel gets its own folder containing full specs,
                  JSON metadata, and images.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadStorageData}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 transition-all uppercase tracking-wider cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>

                  <button
                    onClick={handleSyncAllProducts}
                    disabled={isSyncingAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-[#F25C05] hover:bg-[#ff6811] transition-all uppercase tracking-wider cursor-pointer font-medium"
                    title="Generate physical folders for any existing products that do not have them yet"
                  >
                    <FolderCheck className="w-3.5 h-3.5" />
                    <span>{isSyncingAll ? 'Generating Folders...' : 'Re-create All Folders'}</span>
                  </button>
                </div>
              </div>

              {syncAllMessage && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{syncAllMessage}</span>
                </div>
              )}

              {/* Folders List */}
              <div className="space-y-3">
                <div className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                  Directory Tree: <span className="font-mono text-neutral-300">/storage/products/</span>
                </div>

                {isLoading && (!folders || folders.length === 0) ? (
                  <div className="py-12 text-center text-neutral-500 text-xs">
                    Loading server product folders...
                  </div>
                ) : !folders || folders.length === 0 ? (
                  <div className="p-8 border border-white/10 bg-white/[0.02] text-center space-y-3">
                    <Folder className="w-10 h-10 text-neutral-600 mx-auto" />
                    <div className="text-sm text-neutral-300 font-medium">No Product Folders Yet</div>
                    <p className="text-xs text-neutral-500 max-w-md mx-auto">
                      Click &quot;Re-create All Folders&quot; above to immediately generate folders for your
                      existing products, or create a new product in the admin panel.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {(folders || []).map((folder, folderIdx) => {
                      if (!folder) return null;
                      const folderName = folder.name || `folder_${folderIdx}`;
                      const folderFiles = Array.isArray(folder.files) ? folder.files : [];
                      return (
                        <div
                          key={folderName || folderIdx}
                          className="p-3.5 bg-black/40 border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 bg-neutral-900 border border-[#F25C05]/30 flex items-center justify-center text-[#F25C05] shrink-0 mt-0.5">
                              <Folder className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-mono font-medium text-white">
                                  {folderName}/
                                </span>
                                {folder.productPreview?.name && (
                                  <span className="text-xs text-neutral-300">
                                    — {folder.productPreview.name}
                                  </span>
                                )}
                                <span className="text-[10px] px-1.5 py-0.5 bg-white/5 border border-white/10 text-neutral-400 font-mono">
                                  {folderFiles.length} files
                                </span>
                              </div>

                              {/* Files badges */}
                              {folderFiles.length > 0 && (
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  {folderFiles.map((file, fileIdx) => (
                                    <div
                                      key={file?.name || fileIdx}
                                      className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 bg-white/5 border border-white/10 text-neutral-300"
                                    >
                                      {file?.name?.endsWith('.json') ? (
                                        <FileText className="w-3 h-3 text-amber-400" />
                                      ) : file?.name?.endsWith('.txt') ? (
                                        <FileText className="w-3 h-3 text-sky-400" />
                                      ) : (
                                        <ImageIcon className="w-3 h-3 text-emerald-400" />
                                      )}
                                      <span>{file?.name || 'file'}</span>
                                      <span className="text-[9px] text-neutral-500">
                                        ({formatFileSize(file?.size || 0)})
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            {folder.hasProductJson && (
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/storage/products/${encodeURIComponent(folderName)}/product.json`);
                                    if (res.ok) {
                                      const text = await res.text();
                                      setViewingJson({ folder: folderName, json: text });
                                    }
                                  } catch (e) {
                                    console.warn('Could not load JSON file:', e);
                                  }
                                }}
                                className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 transition-all cursor-pointer font-mono"
                              >
                                View product.json
                              </button>
                            )}

                            <a
                              href={`/storage/products/${encodeURIComponent(folderName)}/product.json`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-neutral-400 hover:text-white bg-white/5 border border-white/10 transition-all"
                              title="Open raw JSON in new tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: CONNECT PURCHASED SERVER */}
          {/* ============================================================== */}
          {activeTab === 'connect' && (
            <div className="space-y-6">
              {/* Guidance Banner */}
              <div className="p-4 bg-amber-950/20 border border-amber-500/30 text-xs text-neutral-300 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-medium uppercase tracking-wider">
                  <Server className="w-4 h-4" />
                  <span>Where is your purchased server? Connect it here!</span>
                </div>
                <p>
                  You purchased external server storage (like cPanel, VPS, Apache, Nginx, or an API server).
                  By entering your server URL below, every time you click <strong>&quot;Create Product&quot;</strong> in
                  the admin panel, the system sends the product information to your server to create a folder
                  and save the files on <em>your</em> machine.
                </p>
              </div>

              {/* Settings Form */}
              <div className="space-y-4">
                {/* Enable Switch */}
                <div className="flex items-center justify-between p-3.5 bg-black/40 border border-white/10">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-white font-medium">
                      Enable Purchased Server Sync
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      When enabled, product folders are mirrored to your purchased external server
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => setIsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none border border-white/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F25C05]"></div>
                  </label>
                </div>

                {/* Server Type */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">
                    Purchased Server Type
                  </label>
                  <select
                    value={serverType}
                    onChange={(e) => setServerType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-black/60 border border-white/20 text-white text-xs focus:outline-none focus:border-[#F25C05]"
                  >
                    <option value="php_webhook">
                      cPanel / PHP Webhook (Hostinger, Namecheap, Bluehost, GoDaddy, etc.)
                    </option>
                    <option value="rest_api">Custom VPS / REST API Endpoint (Node.js, Python, Go)</option>
                    <option value="ftp">FTP / SFTP Directory Endpoint</option>
                  </select>
                </div>

                {/* Server URL */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">
                    Your Server Storage URL / Webhook
                  </label>
                  <input
                    type="url"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    placeholder="https://yourdomain.com/product_storage_handler.php"
                    className="w-full px-3 py-2.5 bg-black/60 border border-white/20 text-white text-xs font-mono focus:outline-none focus:border-[#F25C05]"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    e.g. Upload the script from Tab 3 to your hosting, then enter its URL here.
                  </p>
                </div>

                {/* API Auth Token */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">
                    Secret API Key / Bearer Token (Optional)
                  </label>
                  <input
                    type="password"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    placeholder="Leave empty if your server script does not require a secret token"
                    className="w-full px-3 py-2.5 bg-black/60 border border-white/20 text-white text-xs font-mono focus:outline-none focus:border-[#F25C05]"
                  />
                </div>

                {/* Remote Folder Path */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">
                    Target Folder on Your Server
                  </label>
                  <input
                    type="text"
                    value={remoteBasePath}
                    onChange={(e) => setRemoteBasePath(e.target.value)}
                    placeholder="storage/products"
                    className="w-full px-3 py-2.5 bg-black/60 border border-white/20 text-white text-xs font-mono focus:outline-none focus:border-[#F25C05]"
                  />
                </div>

                {/* Auto sync on product creation */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="autoSync"
                    checked={autoSyncOnCreate}
                    onChange={(e) => setAutoSyncOnCreate(e.target.checked)}
                    className="accent-[#F25C05] w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="autoSync" className="text-xs text-neutral-300 cursor-pointer">
                    Automatically create remote folder every time a product is created or edited
                  </label>
                </div>
              </div>

              {/* Test Connection Results */}
              {testResult && (
                <div
                  className={`p-4 border text-xs space-y-2 ${
                    testResult.success
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      : 'bg-red-950/30 border-red-500/40 text-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-medium uppercase tracking-wider">
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span>
                        {testResult.success
                          ? 'Connection Verified: Ready to Store Products!'
                          : 'Connection Test Failed'}
                      </span>
                    </div>
                    {testResult.latencyMs !== undefined && (
                      <span className="font-mono text-[11px] opacity-75">
                        Latency: {testResult.latencyMs}ms
                      </span>
                    )}
                  </div>
                  <p>{testResult.message}</p>
                  {testResult.details && (
                    <pre className="p-2 bg-black/60 border border-white/10 overflow-x-auto text-[10px] font-mono text-neutral-300 max-h-32">
                      {JSON.stringify(testResult.details, null, 2)}
                    </pre>
                  )}
                </div>
              )}

              {saveSuccessNotice && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Configuration saved successfully!</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !serverUrl}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-neutral-200 hover:text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-all uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  <Server className={`w-3.5 h-3.5 ${isTesting ? 'animate-pulse text-[#F25C05]' : ''}`} />
                  <span>{isTesting ? 'Testing Connection...' : 'Test Connection & Verify'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={isLoading}
                  className="px-6 py-2 bg-[#F25C05] hover:bg-[#ff6811] text-white tracking-[0.15em] uppercase text-xs font-medium transition-all shadow-[0_0_15px_rgba(242,92,5,0.4)] cursor-pointer"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: 1-CLICK DEPLOY SCRIPT */}
          {/* ============================================================== */}
          {activeTab === 'scripts' && (
            <div className="space-y-6">
              <div className="p-4 bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-white uppercase tracking-wider">
                  <Code2 className="w-4 h-4 text-[#F25C05]" />
                  <span>How to deploy the folder storage script to your purchased server</span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  If you bought shared hosting or a server with cPanel, Apache, Nginx, or PHP (like
                  Hostinger, Bluehost, GoDaddy, Namecheap):
                </p>

                <ol className="text-xs text-neutral-300 space-y-2 list-decimal list-inside">
                  <li>
                    Download both <strong>product_storage_handler.php</strong> and <strong>.htaccess</strong> using the buttons below.
                  </li>
                  <li>
                    Open your hosting control panel (cPanel &gt; File Manager) and upload them into your
                    <code className="text-[#F25C05] bg-black px-1.5 py-0.5 ml-1">public_html/</code> directory.
                  </li>
                  <li>
                    Your webhook URL will be:{' '}
                    <code className="text-amber-300 bg-black px-1.5 py-0.5">
                      https://your-domain.com/product_storage_handler.php
                    </code>
                  </li>
                  <li>
                    Copy that URL into <strong>Tab 2 (Connect Purchased Server)</strong> and click{' '}
                    <strong>Test Connection</strong>.
                  </li>
                  <li>
                    Done! Now every product registered in your admin panel will create its folder{' '}
                    <code className="text-[#F25C05] bg-black px-1.5 py-0.5">products/&lt;SKU&gt;/</code>, and every customer order will be saved into{' '}
                    <code className="text-[#F25C05] bg-black px-1.5 py-0.5">orders/&lt;ORDER_ID&gt;/</code> with an official invoice receipt on your server!
                  </li>
                </ol>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <a
                    href="/product_storage_handler.php"
                    download="product_storage_handler.php"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#F25C05] hover:bg-[#ff6811] text-white text-xs uppercase tracking-wider font-medium cursor-pointer transition-all shadow-[0_0_15px_rgba(242,92,5,0.3)]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download product_storage_handler.php</span>
                  </a>

                  <a
                    href="/.htaccess"
                    download=".htaccess"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-white/20 text-white text-xs uppercase tracking-wider font-medium cursor-pointer transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Download .htaccess</span>
                  </a>

                  <button
                    onClick={() => {
                      copyToClipboard(
                        'https://yourdomain.com/product_storage_handler.php',
                        'sampleUrl'
                      );
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-neutral-300 text-xs uppercase tracking-wider cursor-pointer"
                  >
                    {copiedKey === 'sampleUrl' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copy Example URL</span>
                  </button>
                </div>
              </div>

              {/* What the script does */}
              <div className="border border-white/10 p-4 space-y-3 bg-black/40">
                <div className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                  What Gets Created On Your Purchased Server Hosting:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white/5 border border-white/10 space-y-1">
                    <div className="font-mono text-[#F25C05] font-medium">📁 products/&lt;SKU&gt;/</div>
                    <p className="text-neutral-400 text-[11px]">
                      A separate folder is created for each individual product SKU with product.json & image.
                    </p>
                  </div>

                  <div className="p-3 bg-white/5 border border-white/10 space-y-1">
                    <div className="font-mono text-emerald-400 font-medium">📁 orders/&lt;ID&gt;/</div>
                    <p className="text-neutral-400 text-[11px]">
                      Each customer order creates a dedicated folder with order.json & formatted invoice receipt.txt.
                    </p>
                  </div>

                  <div className="p-3 bg-white/5 border border-white/10 space-y-1">
                    <div className="font-mono text-amber-400 font-medium">📄 orders.json</div>
                    <p className="text-neutral-400 text-[11px]">
                      Central master database of all customer orders for instant loading & order status tracking.
                    </p>
                  </div>

                  <div className="p-3 bg-white/5 border border-white/10 space-y-1">
                    <div className="font-mono text-cyan-400 font-medium">📄 customers.json</div>
                    <p className="text-neutral-400 text-[11px]">
                      Auto-accumulated customer directory with phone, shipping addresses, and total spent.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* JSON Inspector Modal */}
        {viewingJson && (
          <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-neutral-950 border border-white/20 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#F25C05]" />
                  <span className="font-mono text-xs text-white uppercase tracking-wider">
                    {viewingJson.folder} / product.json
                  </span>
                </div>
                <button
                  onClick={() => setViewingJson(null)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <pre className="p-3 bg-black border border-white/10 text-[11px] font-mono text-neutral-300 max-h-[60vh] overflow-y-auto">
                {viewingJson.json}
              </pre>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => copyToClipboard(viewingJson.json, 'jsonContent')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs text-white uppercase tracking-wider cursor-pointer"
                >
                  {copiedKey === 'jsonContent' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Copy JSON</span>
                </button>
                <button
                  onClick={() => setViewingJson(null)}
                  className="px-4 py-1.5 bg-[#F25C05] text-white text-xs uppercase tracking-wider cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <div className="text-[11px] text-neutral-500 font-mono">
            Physical Server Engine: <span className="text-neutral-300">storage/products/</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs uppercase tracking-wider text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
