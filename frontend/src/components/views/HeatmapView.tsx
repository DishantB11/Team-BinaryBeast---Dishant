import React, { useState } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { useStore } from '../../store/useStore';
import { uploadPDF } from '../../api/client';
import { Activity, BookOpen, Flame, Sparkles, FileText, Upload, RefreshCw } from 'lucide-react';

export const HeatmapView: React.FC = () => {
  const { heatmapData, subjects, tasks, setTasks, setSubjects } = useStore();
  const [modulesVal, setModulesVal] = useState('5');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseLog, setParseLog] = useState<string | null>(null);

  // Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const activeFlameCount = heatmapData.length; // Active calendar days

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
        <h1 className="text-2xl font-bold text-white tracking-tight">Analytics & Syllabus Ingestion</h1>
        <p className="text-sm text-[#a0a0a0]">Ingest PDF syllabi files and review daily task completion indexes.</p>
      </div>

      {/* Stats row details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-[#3d3d3d] rounded-full flex items-center justify-center border border-[#4d4d4d]">
            <Flame className="w-5 h-5 text-[#fbbf24] fill-[#fbbf24]" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#6b6b6b] tracking-wider uppercase block">Focus Streak</span>
            <span className="text-xl font-bold text-white block mt-0.5">{activeFlameCount} active days</span>
          </div>
        </div>

        <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-[#3d3d3d] rounded-full flex items-center justify-center border border-[#4d4d4d]">
            <Activity className="w-5 h-5 text-[#fbbf24]" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#6b6b6b] tracking-wider uppercase block">Efficiency Rating</span>
            <span className="text-xl font-bold text-white block mt-0.5">
              {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% completion
            </span>
          </div>
        </div>

        <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-[#3d3d3d] rounded-full flex items-center justify-center border border-[#4d4d4d]">
            <BookOpen className="w-5 h-5 text-[#fbbf24]" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#6b6b6b] tracking-wider uppercase block">Ingested Subjects</span>
            <span className="text-xl font-bold text-white block mt-0.5">{subjects.length} modules</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Heatmap Calendar visualization */}
        <div className="lg:col-span-2 bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white tracking-tight uppercase border-b border-[#3d3d3d] pb-3">
            🗓️ Session Heatmap
          </h2>

          <div className="pt-2">
            <CalendarHeatmap
              startDate={new Date('2026-07-01')}
              endDate={new Date('2026-08-30')}
              values={heatmapData}
              classForValue={(value) => {
                if (!value || value.count === 0) {
                  return 'color-empty';
                }
                const cap = Math.min(value.count, 4);
                return `color-scale-${cap}`;
              }}
              tooltipDataAttrs={(value: any) => {
                return {
                  'data-tip': value.date ? `${value.date}: ${value.count} study sessions completed` : 'No sessions completed',
                };
              }}
            />
          </div>

          <div className="flex items-center justify-end gap-2 text-[11px] text-[#6b6b6b]">
            <span>Less</span>
            <div className="w-2.5 h-2.5 bg-[#2d2d2d] border border-[#3d3d3d] rounded" />
            <div className="w-2.5 h-2.5 bg-[#423d2b] rounded" />
            <div className="w-2.5 h-2.5 bg-[#736235] rounded" />
            <div className="w-2.5 h-2.5 bg-[#b39547] rounded" />
            <div className="w-2.5 h-2.5 bg-[#fbbf24] rounded" />
            <span>More</span>
          </div>
        </div>

        {/* Right Column: PDF Ingestion */}
        <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-5 flex flex-col justify-between">
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
      </div>
    </div>
  );
};
