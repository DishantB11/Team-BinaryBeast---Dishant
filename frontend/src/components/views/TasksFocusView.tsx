import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { uploadPDF } from '../../api/client';
import { FileText, Upload, RefreshCw, Sparkles, BookOpen } from 'lucide-react';

export const TasksFocusView: React.FC = () => {
  const { tasks, setTasks, subjects, setSubjects } = useStore();
  const [modulesVal, setModulesVal] = useState('5');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseLog, setParseLog] = useState<string | null>(null);

  // Handle PDF Upload / Syllabus Extraction
  const handlePdfUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) return;

    setIsParsing(true);
    setParseLog('Initializing parser module. Decompressing PDF payload...');

    const fd = new FormData();
    fd.append('file', pdfFile);
    fd.append('modules', modulesVal);

    try {
      const response = await uploadPDF(fd);
      
      // Update app state tasks + subjects list
      setTasks([...tasks, ...response.tasks]);
      setSubjects([...subjects, ...response.subjects]);
      setParseLog(
        `Syllabus extraction complete! Registered ${response.subjects.length} new subject and calculated scheduling timeline metrics.`
      );
    } catch (error: any) {
      console.error(error);
      setParseLog(`Syllabus extraction failed: ${error.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Syllabus Planner</h1>
        <p className="text-sm text-[#a0a0a0]">Ingest PDF syllabi files to extract subjects, modules, and schedule estimated study sessions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: PDF Ingestion */}
        <div className="lg:col-span-2 bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-6 flex flex-col justify-between">
          <form onSubmit={handlePdfUpload} className="space-y-4">
            <h2 className="text-sm font-semibold text-white tracking-tight uppercase border-b border-[#3d3d3d] pb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#fbbf24]" />
              <span>Syllabus Parsing</span>
            </h2>

            {/* Modules field */}
            <div className="space-y-1">
              <label className="text-xs text-[#a0a0a0] font-semibold">Number of Modules</label>
              <input
                type="number"
                min="1"
                max="10"
                value={modulesVal}
                onChange={(e) => setModulesVal(e.target.value)}
                className="w-full bg-[#1e1e1e] border border-[#3d3d3d] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#fbbf24]"
                required
              />
            </div>

            {/* Custom file upload mock */}
            <div className="space-y-1">
              <label className="text-xs text-[#a0a0a0] font-semibold">Upload Syllabus PDF</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border border-dashed border-[#3d3d3d] rounded-lg cursor-pointer bg-[#1e1e1e] hover:border-[#fbbf24] transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-6 h-6 text-[#6b6b6b] mb-2" />
                    <p className="text-xs text-[#6b6b6b]">
                      {pdfFile ? pdfFile.name : 'Select document file'}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPdfFile(e.target.files ? e.target.files[0] : null)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isParsing || !pdfFile}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md font-semibold text-xs bg-[#fbbf24] text-black hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isParsing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Extracting Syllabus...</span>
                </>
              ) : (
                <span>Upload & Plan</span>
              )}
            </button>
          </form>

          {parseLog && (
            <div className="mt-4 bg-[#1e1e1e] border border-[#3d3d3d] p-3.5 rounded-lg flex gap-2 items-start animate-fadeIn">
              <Sparkles className="w-4 h-4 text-[#fbbf24] shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-200 leading-relaxed font-sans">{parseLog}</p>
            </div>
          )}
        </div>

        {/* Right Column: Planner details status card */}
        <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white tracking-tight uppercase border-b border-[#3d3d3d] pb-2">
            📖 Status Overview
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#a0a0a0]">Ingested Modules:</span>
              <span className="font-semibold text-white">{subjects.length} subjects</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#a0a0a0]">Total Staged Tasks:</span>
              <span className="font-semibold text-white">{tasks.length} tasks</span>
            </div>
          </div>
          <p className="text-[11px] text-[#6b6b6b] leading-relaxed">
            Parsing a syllabus processes modular topics and populates assignments into the workspace calendar for scheduling optimization.
          </p>
        </div>
      </div>
    </div>
  );
};
export default TasksFocusView;
