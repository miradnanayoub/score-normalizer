import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, FileDown, Calculator, Info, Home, Heart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const ScoreNormalizer = () => {
  // --- Navigation State ---
  const [activeTab, setActiveTab] = useState('calculator'); // 'calculator' or 'about'

  // --- Calculator State ---
  const [maxMarks, setMaxMarks] = useState(100);
  const [targetMeanPercent, setTargetMeanPercent] = useState(75);
  const [method, setMethod] = useState('robust'); 
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
        if (stats.rawMean === 0) adjusted = raw;
        else adjusted = raw * (stats.targetMeanPoints / stats.rawMean);
      } else {
        adjusted = stats.targetMeanPoints + (sdScaling * (raw - stats.rawMean));
      }
      adjusted = Math.min(maxMarks, Math.max(0, adjusted));
      return { ...student, adjusted: parseFloat(adjusted.toFixed(2)) };
    });
  }, [students, stats, method, sdScaling, maxMarks]);

  // --- Handlers ---
  const addStudent = () => {
    const newId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
    setStudents([...students, { id: newId, name: `Student ${newId}`, raw: 0 }]);
  };

  const removeStudent = (id) => setStudents(students.filter(s => s.id !== id));
  const updateStudent = (id, field, value) => {
    setStudents(students.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const downloadCSV = () => {
    const headers = ["Student Name", "Raw Score", "Adjusted Score"];
    const rows = normalizedData.map(s => [s.name, s.raw, s.adjusted]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "normalized_scores.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      
      {/* Navigation Bar */}
      <nav className="bg-indigo-700 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Calculator className="w-6 h-6" />
            <span>Score Normalizer</span>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'calculator' ? 'bg-white text-indigo-700 font-semibold' : 'text-indigo-100 hover:bg-indigo-600'}`}
            >
              <Home className="w-4 h-4" /> Home
            </button>
            <button 
              onClick={() => setActiveTab('about')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'about' ? 'bg-white text-indigo-700 font-semibold' : 'text-indigo-100 hover:bg-indigo-600'}`}
            >
              <Info className="w-4 h-4" /> About
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area - Flex Grow ensures footer pushes down */}
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 flex-grow w-full">
        
        {/* === ABOUT PAGE === */}
        {activeTab === 'about' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
              <h1 className="text-3xl font-bold text-indigo-800 mb-6">Fair Score Normalization</h1>
              
              <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-semibold text-slate-800 mb-2">Purpose</h2>
                  <p className="text-slate-600 leading-relaxed">
                    This tool helps teachers and college authorities instantly adjust student scores to meet a required class average (e.g., 75%) without complex manual calculations. It ensures your grading meets university regulations while remaining statistically sound and fair to every student.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-slate-800 mb-4">Select the Right Method</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-100">
                      <h3 className="font-bold text-indigo-700 mb-2">Robust Linear Shift (Recommended)</h3>
                      <p className="text-sm text-slate-700">
                        Best for maintaining fairness. It shifts the class average up but <strong>locks in the gap</strong> between students. This ensures that the relative difficulty of the exam is accounted for without compressing top scorers.
                      </p>
                    </div>
                    <div className="bg-slate-100 p-5 rounded-lg border border-slate-200">
                      <h3 className="font-bold text-slate-700 mb-2">Simple Ratio</h3>
                      <p className="text-sm text-slate-700">
                        A standard multiplier method. Every score is multiplied by the same percentage to reach the new target. Good for quick, proportional scaling.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-slate-800 mb-2">Rewarding Hard Work</h2>
                  <p className="text-slate-600 leading-relaxed">
                    Most importantly, this system <strong>protects high achievers</strong>. Unlike arbitrary curves that might penalize top students to lower the average, our algorithm preserves the <strong>Rank Order</strong>. If a student worked hard to score the highest raw mark, they remain the top scorer with their lead intact—no compromises.
                  </p>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* === CALCULATOR PAGE (Original Logic) === */}
        {activeTab === 'calculator' && (
          <div className="space-y-6 animate-fade-in">
             {/* Header Actions */}
             <div className="flex justify-end">
                <button 
                  onClick={downloadCSV}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                  <FileDown className="w-4 h-4" />
                  Export CSV
                </button>
             </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Settings */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">Configuration</h2>
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
                            type="range" min="0.5" max="1.5" step="0.1" value={sdScaling}
                            onChange={(e) => setSdScaling(parseFloat(e.target.value))}
                            className="w-full accent-indigo-600"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h2 className="font-semibold text-lg mb-4">Batch Statistics</h2>
                  <div className="space-y-4">
                    <StatRow label="Raw Mean" value={stats.rawMean.toFixed(2)} />
                    <StatRow label="Raw Std Dev" value={stats.rawSD.toFixed(2)} />
                    <div className="border-t border-slate-100 my-2"></div>
                    <StatRow label="Target Mean" value={stats.targetMeanPoints.toFixed(2)} highlight />
                  </div>
                </div>
              </div>

              {/* Middle/Right: Chart & Data Table */}
              <div className="lg:col-span-2 space-y-6">
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
                                className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none"
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
                            <td className="p-4 font-bold text-indigo-700 bg-indigo-50">{student.adjusted}</td>
                            <td className="p-4 text-center">
                              <button onClick={() => removeStudent(student.id)} className="text-slate-300 hover:text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-slate-400 text-sm mt-auto border-t border-slate-200 bg-white">
        <p className="flex items-center justify-center gap-1.5">
          Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> by 
          <a 
            href="https://www.linkedin.com/in/miradnanayoub" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
          >
            @miradnanayoub
          </a>
        </p>
      </footer>

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

export default ScoreNormalizer;