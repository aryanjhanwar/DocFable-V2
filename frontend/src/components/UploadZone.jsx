import { useCallback, useState } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { uploadPDF } from '../services/api';

export default function UploadZone({ onUploadSuccess }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadInfo, setUploadInfo] = useState(null);

  const handleFile = useCallback(async (selected) => {
    if (!selected) return;

    if (selected.type !== 'application/pdf') {
      setErrorMsg('Only PDF files are supported.');
      setStatus('error');
      return;
    }

    if (selected.size > 20 * 1024 * 1024) {
      setErrorMsg('File size exceeds 20 MB limit.');
      setStatus('error');
      return;
    }

    setFile(selected);
    setStatus('uploading');
    setProgress(0);
    setErrorMsg('');

    try {
      const data = await uploadPDF(selected, setProgress);
      setUploadInfo(data);
      setStatus('success');
      onUploadSuccess?.(data);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Upload failed';
      setErrorMsg(msg);
      setStatus('error');
    }
  }, [onUploadSuccess]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, [handleFile]);

  const onInputChange = (e) => {
    const selected = e.target.files[0];
    if (selected) handleFile(selected);
  };

  const handleRemove = () => {
    setFile(null);
    setStatus('idle');
    setProgress(0);
    setUploadInfo(null);
    setErrorMsg('');
    onUploadSuccess?.(null);
  };

  return (
    <div className="w-full">
      {status === 'success' && uploadInfo ? (
        /* Success State */
        <div className="glass-card p-5 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(100,112,241,0.2))' }}>
              <CheckCircle className="w-6 h-6 text-accent-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{uploadInfo.filename}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="badge">{uploadInfo.pageCount} pages</span>
                <span className="badge">{(uploadInfo.wordCount || 0).toLocaleString()} words</span>
                <span className="badge-green badge">Ready</span>
              </div>
              {uploadInfo.truncated && (
                <p className="text-xs text-yellow-400/80 mt-2">
                  ⚠️ Document was truncated to fit the AI context window.
                </p>
              )}
            </div>
            <button
              onClick={handleRemove}
              className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
              title="Remove PDF"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Upload Zone */
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`relative flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed
            cursor-pointer transition-all duration-300 group ${
            dragging
              ? 'border-brand-400 bg-brand-600/10 scale-[1.01]'
              : status === 'error'
                ? 'border-red-500/40 bg-red-500/5'
                : 'border-brand-600/30 bg-surface-800/30 hover:border-brand-500/50 hover:bg-brand-600/5'
          }`}
        >
          <input
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={onInputChange}
            id="pdf-upload-input"
          />

          {status === 'uploading' ? (
            <>
              <Loader2 className="w-12 h-12 text-brand-400 animate-spin" />
              <div className="text-center">
                <p className="text-white font-medium">Uploading & Parsing PDF…</p>
                <p className="text-gray-400 text-sm mt-1">{progress}% complete</p>
              </div>
              <div className="w-full max-w-xs h-1.5 bg-surface-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #6470f1, #34d399)',
                  }}
                />
              </div>
            </>
          ) : status === 'error' ? (
            <>
              <AlertCircle className="w-12 h-12 text-red-400" />
              <div className="text-center">
                <p className="text-red-400 font-medium">{errorMsg}</p>
                <p className="text-gray-400 text-sm mt-1">Click to try again</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300
                group-hover:scale-110"
                style={{ background: 'linear-gradient(135deg, rgba(100,112,241,0.2), rgba(52,211,153,0.1))' }}>
                {dragging ? (
                  <Upload className="w-8 h-8 text-brand-400" />
                ) : (
                  <FileText className="w-8 h-8 text-brand-400" />
                )}
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-lg">
                  {dragging ? 'Drop your PDF here' : 'Upload Research Paper'}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Drag & drop or <span className="text-brand-400 font-medium">browse files</span>
                </p>
                <p className="text-gray-600 text-xs mt-2">PDF only · Max 20 MB</p>
              </div>
            </>
          )}
        </label>
      )}
    </div>
  );
}
