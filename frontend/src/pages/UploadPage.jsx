import React, { useState, useRef } from "react";
import axios from "axios";
import { UploadCloud, Loader2, RefreshCw, FileSpreadsheet } from "lucide-react";

export default function UploadPage({ onResult }) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleFileSelect = (f) => {
    if (f && ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"].includes(f.type) || f.name.endsWith(".csv")) {
      setFile(f);
    } else {
      alert("Only Excel or CSV files are allowed");
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const upload = async () => {
    if (!file) return alert("Choose a file first");

    const form = new FormData();
    form.append("file", file);
    setLoading(true);

    try {
      const resp = await axios.post("http://localhost:8000/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });
      onResult(resp.data);
    } catch (err) {
      alert(err?.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-indigo-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-2xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">📊 Upload & Analyze</h2>
          <p className="text-gray-500 mt-2 text-sm max-w-md mx-auto">
            Drop your Excel or CSV file here and watch the magic happen. We’ll process it and give you stunning, interactive charts.
          </p>
        </div>

        {/* Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 cursor-pointer transition-all ${
            dragActive
              ? "border-indigo-500 bg-indigo-50 scale-105"
              : file
              ? "border-green-400 bg-green-50"
              : "border-gray-300 hover:border-indigo-400 hover:bg-indigo-50"
          }`}
          onClick={() => inputRef.current.click()}
        >
          {file ? (
            <div className="flex flex-col items-center">
              <FileSpreadsheet className="w-12 h-12 text-green-500 mb-3" />
              <p className="font-medium text-green-600">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          ) : (
            <>
              <UploadCloud
                className={`w-12 h-12 mb-3 ${
                  dragActive ? "text-indigo-500" : "text-indigo-400"
                }`}
              />
              <p className="text-gray-600 text-center">
                <span className="font-medium text-indigo-600">Click to browse</span> or drag & drop your file
              </p>
              <p className="text-xs text-gray-400 mt-1">Supported: .xlsx, .xls, .csv</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={upload}
            disabled={!file || loading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading {progress}%
              </>
            ) : (
              <>
                <UploadCloud className="w-5 h-5" />
                Upload & Analyze
              </>
            )}
          </button>
          <button
            onClick={() => setFile(null)}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition w-32"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
        </div>

        {/* Progress Bar */}
        {loading && (
          <div className="mt-6">
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div
                style={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center animate-pulse">
              Uploading... {progress}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
