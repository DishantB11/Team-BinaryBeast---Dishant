import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { uploadPDF } from '../../api/client';

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

      // Merge newly extracted subject tasks with existing workspace tasks (preserves other subjects)
      const newSubjectName = response.subjects[0]?.name;
      const existingOtherSubjectTasks = tasks.filter((t) => t.subject !== newSubjectName);

      setTasks([...existingOtherSubjectTasks, ...response.tasks]);
      setSubjects([...subjects.filter((s) => s.name !== newSubjectName), ...response.subjects]);
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
    <div className="space-y-6 font-body">
      {/* Header */}
      <div>
        <h2 className="font-headline font-bold text-[40px] leading-tight tracking-tight text-[#e4e2e0]">
          Syllabus Planner
        </h2>
        <p className="text-[#a0a0a0] mt-1 text-base">
          Ingest PDF syllabi files to extract subjects, modules, and schedule estimated study sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* PDF Ingestion */}
        <div className="lg:col-span-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-sm p-6 flex flex-col justify-between">
          <form onSubmit={handlePdfUpload} className="space-y-5">
            <h3 className="text-sm font-semibold text-[#e4e2e0] tracking-tight uppercase border-b border-[#2a2a2a] pb-3 flex items-center gap-2 font-label">
              <span className="material-symbols-outlined icon-sm text-[#8ea091]">description</span>
              <span>Syllabus Parsing</span>
            </h3>

            {/* Modules field */}
            <div className="space-y-1.5">
              <label className="text-xs text-[#a0a0a0] font-semibold font-label uppercase tracking-wider block">
                Number of Modules
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={modulesVal}
                onChange={(e) => setModulesVal(e.target.value)}
                className="w-full bg-[#2a2a2a] border border-[#333333] rounded-sm px-3 py-2 text-sm text-[#e4e2e0] focus:outline-none focus:border-[#8ea091] transition-colors"
                required
              />
            </div>

            {/* File Upload Drop Zone */}
            <div className="space-y-1.5">
              <label className="text-xs text-[#a0a0a0] font-semibold font-label uppercase tracking-wider block">
                Upload Syllabus PDF
              </label>
              <label className="flex flex-col items-center justify-center w-full h-32 border border-dashed border-[#333333] rounded-sm cursor-pointer bg-[#2a2a2a] hover:border-[#8ea091] transition-all">
                <div className="flex flex-col items-center justify-center gap-2">
                  <span className="material-symbols-outlined icon-lg text-[#6b6b6b]">upload_file</span>
                  <p className="text-xs text-[#6b6b6b]">
                    {pdfFile ? pdfFile.name : 'Click to select a PDF document'}
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

            <button
              type="submit"
              disabled={isParsing || !pdfFile}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-sm font-semibold text-sm bg-[#8ea091] text-[#121212] hover:bg-[#9eb0a1] transition-all disabled:opacity-50"
            >
              {isParsing ? (
                <>
                  <span className="material-symbols-outlined icon-sm animate-spin">sync</span>
                  <span>Extracting Syllabus...</span>
                </>
              ) : (
                <span>Upload &amp; Plan</span>
              )}
            </button>
          </form>

          {parseLog && (
            <div className="mt-5 bg-[#2a2a2a] border border-[#333333] p-4 rounded-sm flex gap-3 items-start">
              <span className="material-symbols-outlined icon-sm text-[#8ea091] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                smart_toy
              </span>
              <p className="text-xs text-[#c8c6c5] leading-relaxed">{parseLog}</p>
            </div>
          )}
        </div>

        {/* Status Card */}
        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[#e4e2e0] tracking-tight uppercase border-b border-[#2a2a2a] pb-3 flex items-center gap-2 font-label">
            <span className="material-symbols-outlined icon-sm text-[#8ea091]">menu_book</span>
            Status Overview
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#a0a0a0]">Ingested Modules</span>
              <span className="font-semibold text-[#e4e2e0] font-label">{subjects.length} subjects</span>
            </div>
            <div className="w-full h-px bg-[#2a2a2a]" />
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#a0a0a0]">Total Staged Tasks</span>
              <span className="font-semibold text-[#e4e2e0] font-label">{tasks.length} tasks</span>
            </div>
          </div>
          <p className="text-xs text-[#6b6b6b] leading-relaxed pt-2 border-t border-[#2a2a2a]">
            Parsing a syllabus processes modular topics and populates assignments into the workspace calendar for scheduling optimization.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TasksFocusView;
