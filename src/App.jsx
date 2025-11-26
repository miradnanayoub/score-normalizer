import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Download, Calculator, HelpCircle, FileDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const ScoreNormalizer = () => {
  // --- State ---
  const [maxMarks, setMaxMarks] = useState(100);
  const [targetMeanPercent, setTargetMeanPercent] = useState(75);
  const [method, setMethod] = useState('robust'); // 'robust' or 'ratio'
  
  // Advanced setting for Robust method: How much to scale the spread (Target SD / Raw SD)
  // 1.0 = Keep relative distance exactly the same (Shift only).
  // < 1.0 = Compress scores (reduce gap between top and bottom).
  const [sdScaling, setSdScaling] = useState(1.0); 

  const [students, setStudents] = useState([
    { id: 1, name: 'Student A', raw: 65 },
    { id: 2, name: 'Student B', raw: 55 },
    { id: 3, name: 'Student C', raw: 82 },
    { id: 4, name: 'Student D', raw: 40 },
    { id: 5, name: 'Student E', raw: 70 },
  ]);

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    const validScores = students.filter(s => s.raw !== '' && !isNaN(s.raw)).map(s => parseFloat(s.raw));
    const count = validScores.length;
    
    if (count === 0) return { rawMean: 0, rawSD: 0, targetMeanPoints: 0 };

    const sum = validScores.reduce((a, b) => a + b, 0);
    const rawMean = sum / count;

    const squareDiffs = validScores.map(val => Math.pow(val - rawMean, 2));
    const variance = squareDiffs.reduce((a, b) => a + b, 0) / count;
    const rawSD = Math.sqrt(variance);

    const targetMeanPoints = (targetMeanPercent / 100) * maxMarks;

    return { rawMean, rawSD, targetMeanPoints };
  }, [students, maxMarks, targetMeanPercent]);

  // --- Normalization Logic ---
  const normalizedData = useMemo(() => {
    return students.map(student => {
      const raw = parseFloat(student.raw);
      if (isNaN(raw)) return { ...student, adjusted: 0 };

      let adjusted = 0;

      if (method === 'ratio') {
        // Simple Formula: Adjusted = Raw * (TargetMean / RawMean)
        if (stats.rawMean === 0) {
            adjusted = raw;
        } else {
            adjusted = raw * (stats.targetMeanPoints / stats.rawMean);
        }
      } else {
        // Robust Formula: Adjusted = TM + (ScalingFactor) * (Raw - RM)
        // ScalingFactor here represents (TargetSD / RawSD). 
        // We let the user define the scaling multiplier directly via UI.
        adjusted = stats.targetMeanPoints + (sdScaling * (raw - stats.rawMean));
      }

      // Cap logic: Scores shouldn't typically exceed Max Marks or drop below 0
      adjusted = Math.min(maxMarks, Math.max(0, adjusted));

      return {
        ...student,
        adjusted: parseFloat(adjusted.toFixed(2)) // Round to 2 decimals
      };
    });
  }, [students, stats, method, sdScaling, maxMarks]);

  // --- Handlers ---
  const addStudent = () => {
    const newId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
    setStudents([...students, { id: newId, name: `Student ${newId}`, raw: 0 }]);
  };

  const removeStudent = (id) => {
    setStudents(students.filter(s => s.id !== id));
  };

  const updateStudent = (id, field, value) => {
    setStudents(students.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const downloadCSV = () => {
    const headers = ["Student Name", "Raw Score", "Adjusted Score"];
    const rows = normalizedData.map(s => [s.name, s.raw, s.adjusted]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "normalized_scores.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-indigo-700 flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              Score Normalizer
            </h1>
            <p className="text-slate-500 mt-1">Linear Scaling Tool for Exam Departments</p>
          </div>
          <button 
            onClick={downloadCSV}
            className="mt-4 md:mt-0 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <FileDown className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Settings & Stats */}
          <div className="space-y-6">
            
            {/* Global Settings */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <SettingsIcon /> Configuration
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Max Marks</label>
                  <input 
                    type="number" 
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(parseFloat(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target Mean (%)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={targetMeanPercent}
                      onChange={(e) => setTargetMeanPercent(parseFloat(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <span className="text-slate-500 font-bold">%</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Target Points: {stats.targetMeanPoints.toFixed(1)} / {maxMarks}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Normalization Method</label>
                  <select 
                    value={method} 
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-slate-50 mb-3"
                  >
                    <option value="robust">Robust (Linear Shift)</option>
                    <option value="ratio">Simple Ratio (Multiplier)</option>
                  </select>

                  {method === 'robust' && (
                    <div className="bg-indigo-50 p-3 rounded text-sm">
                      <div className="flex justify-between mb-1">
                        <label className="font-medium text-indigo-900">Spread Scaling</label>
                        <span className="text-indigo-700 font-mono">{sdScaling}x</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="1.5" 
                        step="0.1" 
                        value={sdScaling}
                        onChange={(e) => setSdScaling(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                      <p className="text-xs text-indigo-600 mt-1 leading-snug">
                        1.0 preserves relative rank gaps. Lower values compress the spread.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Statistics Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="font-semibold text-lg mb-4">Batch Statistics</h2>
              <div className="space-y-4">
                <StatRow label="Raw Mean" value={stats.rawMean.toFixed(2)} />
                <StatRow label="Raw Std Dev" value={stats.rawSD.toFixed(2)} />
                <div className="border-t border-slate-100 my-2"></div>
                <StatRow label="Target Mean" value={stats.targetMeanPoints.toFixed(2)} highlight />
                {method === 'robust' && (
                  <StatRow label="Adjusted SD" value={(stats.rawSD * sdScaling).toFixed(2)} />
                )}
              </div>
            </div>

          </div>

          {/* Middle/Right: Chart & Data Table */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
               <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">Performance Shift</h3>
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={normalizedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
                   <XAxis dataKey="name" tick={{fontSize: 12}} />
                   <YAxis domain={[0, maxMarks]} />
                   <Tooltip />
                   <Legend />
                   <ReferenceLine y={stats.targetMeanPoints} label="Target Avg" stroke="green" strokeDasharray="3 3" />
                   <Bar dataKey="raw" fill="#94a3b8" name="Raw Score" radius={[4, 4, 0, 0]} />
                   <Bar dataKey="adjusted" fill="#4f46e5" name="Adjusted Score" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
            </div>

            {/* Data Entry Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-semibold text-slate-700">Student Scores</h3>
                <button 
                  onClick={addStudent}
                  className="flex items-center gap-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Row
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="p-4 w-16 text-center">#</th>
                      <th className="p-4">Student Name/ID</th>
                      <th className="p-4 w-32">Raw Score</th>
                      <th className="p-4 w-32 bg-indigo-50 text-indigo-900">Adjusted</th>
                      <th className="p-4 w-16 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {normalizedData.map((student, index) => (
                      <tr key={student.id} className="hover:bg-slate-50 group transition-colors">
                        <td className="p-4 text-center text-slate-400">{index + 1}</td>
                        <td className="p-4">
                          <input 
                            type="text" 
                            value={student.name}
                            onChange={(e) => updateStudent(student.id, 'name', e.target.value)}
                            className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none transition-colors"
                            placeholder="Student Name"
                          />
                        </td>
                        <td className="p-4">
                          <input 
                            type="number" 
                            value={student.raw}
                            onChange={(e) => updateStudent(student.id, 'raw', e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </td>
                        <td className="p-4 font-bold text-indigo-700 bg-indigo-50">
                          {student.adjusted}
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => removeStudent(student.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {normalizedData.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-400">
                          No students added yet. Click "Add Row" to begin.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="p-4 bg-slate-50 text-xs text-slate-500 border-t border-slate-200">
                Formula used: {method === 'robust' 
                  ? `TargetMean + (SpreadFactor × (Raw - RawMean))`
                  : `Raw × (TargetMean / RawMean)`}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

const StatRow = ({ label, value, highlight = false }) => (
  <div className="flex justify-between items-center">
    <span className="text-slate-600 text-sm">{label}</span>
    <span className={`font-mono font-medium ${highlight ? 'text-indigo-600 text-lg' : 'text-slate-900'}`}>
      {value}
    </span>
  </div>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default ScoreNormalizer;