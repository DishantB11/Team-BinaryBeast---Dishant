import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { importFromClassroom } from '../../api/client';
import { Sparkles, Import, ShieldAlert, Check } from 'lucide-react';

export const ClassroomView: React.FC = () => {
  const { tasks, setTasks } = useStore();
  const [classroomInput, setClassroomInput] = useState(
    'Computer Networks Assignment, 2026-08-03\nDatabase Exam Prep, 2026-08-08\nLinear Algebra homework, 2026-08-11'
  );
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleClassroomImport = async () => {
    if (!classroomInput.trim()) {
      setImportStatus('Please input valid CSV/JSON assignment details first.');
      return;
    }

    setIsImporting(true);
    setImportStatus('Connecting to Google Classroom sandbox workspace...');

    try {
      const response = await importFromClassroom(classroomInput);
      
      // Update state with newly imported tasks
      setTasks([...tasks, ...response.tasks]);
      setImportStatus(`Successfully synced and mapped ${response.tasks.length} classroom tasks.`);
    } catch (e: any) {
      console.error(e);
      setImportStatus(`Sync integration error: ${e.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Classroom Integrations</h1>
        <p className="text-sm text-[#a0a0a0]">Paste assignments manually or sync Google Classroom schemas to update schedules.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Import Terminal Panel */}
        <div className="lg:col-span-2 bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-5 flex flex-col gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-white tracking-tight uppercase">📥 Sync Assignments Schema</h2>
            <p className="text-xs text-[#6b6b6b]">Format as "Assignment Title, YYYY-MM-DD" (one row per assignment).</p>
          </div>

          <textarea
            value={classroomInput}
            onChange={(e) => setClassroomInput(e.target.value)}
            className="w-full bg-[#1e1e1e] border border-[#3d3d3d] rounded-lg p-4 font-mono text-xs text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#fbbf24] transition-colors"
            rows={8}
            placeholder="Network Routing Lab, 2026-08-04"
          />

          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-[#a0a0a0]">
              <ShieldAlert className="w-4 h-4 text-[#fbbf24] shrink-0" />
              <span>Mock OAuth sandbox mode enabled for speed development.</span>
            </div>
            <button
              onClick={handleClassroomImport}
              disabled={isImporting}
              className="flex items-center gap-2 px-4 py-2 bg-[#fbbf24] text-black font-semibold text-sm rounded-md transition-all hover:opacity-90 disabled:opacity-50"
            >
              <Import className="w-4 h-4" />
              <span>Import Scheme</span>
            </button>
          </div>
        </div>

        {/* Right Help Sidebar */}
        <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white tracking-tight uppercase border-b border-[#3d3d3d] pb-2">
            📡 Integration Log
          </h2>

          {importStatus ? (
            <div className="bg-[#1e1e1e] border border-[#3d3d3d] p-4 rounded-lg flex gap-3 items-start animate-fadeIn">
              <Sparkles className="w-5 h-5 text-[#fbbf24] shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-[#fbbf24] tracking-widest uppercase block">Engine Response</span>
                <p className="text-xs text-gray-200 mt-1 leading-relaxed">{importStatus}</p>
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#6b6b6b] text-center py-8">
              System is listening... Sync assignments to populate logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
