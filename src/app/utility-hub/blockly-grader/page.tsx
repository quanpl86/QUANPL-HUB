'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Blocks,
  Loader2,
  Play,
  Plus,
  Trash2,
  Maximize2,
  Minimize2,
  TerminalSquare,
} from 'lucide-react';
import { BlocklyWorkspace } from 'react-blockly';
import Blockly from 'blockly';
import { pythonGenerator } from 'blockly/python';

type TestStatus = 'idle' | 'running' | 'passed' | 'failed' | 'error';

type TestCase = {
  id: string;
  input: string;
  expected: string;
  actual?: string;
  status: TestStatus;
  note?: string;
};

type ProblemDef = {
  id: string;
  title: string;
  testCases: TestCase[];
};

const SAMPLE_PROBLEMS: ProblemDef[] = [
  {
    id: 'factorial',
    title: 'Bài 1: Tính giai thừa (n!)',
    testCases: [
      { id: 'c1', input: '5', expected: '120', status: 'idle' },
      { id: 'c2', input: '6', expected: '720', status: 'idle' },
      { id: 'c3', input: '10', expected: '3628800', status: 'idle' }
    ]
  },
  {
    id: 'sum_digits',
    title: 'Bài 2: Tổng các chữ số',
    testCases: [
      { id: 'c1', input: '1234', expected: '10', status: 'idle' },
      { id: 'c2', input: '987', expected: '24', status: 'idle' },
      { id: 'c3', input: '999999', expected: '54', status: 'idle' }
    ]
  },
  {
    id: 'prime',
    title: 'Bài 3: Kiểm tra số nguyên tố',
    testCases: [
      { id: 'c1', input: '7', expected: 'YES', status: 'idle' },
      { id: 'c2', input: '10', expected: 'NO', status: 'idle' },
      { id: 'c3', input: '97', expected: 'YES', status: 'idle' },
      { id: 'c4', input: '1', expected: 'NO', status: 'idle' }
    ]
  },
  {
    id: 'fibonacci',
    title: 'Bài 4: Số Fibonacci thứ N',
    testCases: [
      { id: 'c1', input: '5', expected: '5', status: 'idle' },
      { id: 'c2', input: '10', expected: '55', status: 'idle' },
      { id: 'c3', input: '20', expected: '6765', status: 'idle' }
    ]
  },
  {
    id: 'max_array',
    title: 'Bài 5: Số lớn nhất trong mảng',
    testCases: [
      { id: 'c1', input: '5\n1 4 2 8 5', expected: '8', status: 'idle' },
      { id: 'c2', input: '4\n-1 -5 -2 -9', expected: '-1', status: 'idle' },
      { id: 'c3', input: '1\n100', expected: '100', status: 'idle' }
    ]
  }
];

const INITIAL_XML = '<xml xmlns="https://developers.google.com/blockly/xml"></xml>';

declare global {
  interface Window {
    loadPyodide: (config: { indexURL: string }) => Promise<any>;
    pyodide: any;
  }
}

export default function BlocklyGraderPage() {
  const [selectedProblemId, setSelectedProblemId] = useState<string>(SAMPLE_PROBLEMS[0].id);
  const currentProblem = useMemo(() => SAMPLE_PROBLEMS.find(p => p.id === selectedProblemId) || SAMPLE_PROBLEMS[0], [selectedProblemId]);

  const [xml, setXml] = useState(INITIAL_XML);
  const [pythonCode, setPythonCode] = useState('');
  const [testCases, setTestCases] = useState<TestCase[]>(currentProblem.testCases);
  const [isRunning, setIsRunning] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isPyodideReady, setIsPyodideReady] = useState(false);
  const [pyodideInstance, setPyodideInstance] = useState<any>(null);
  
  const [consoleInput, setConsoleInput] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('');
  const [isRunningConsole, setIsRunningConsole] = useState(false);
  
  const [isFullscreenEditor, setIsFullscreenEditor] = useState(false);
  const [isConsoleVisible, setIsConsoleVisible] = useState(true);

  const handleProblemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedProblemId(newId);
    const problem = SAMPLE_PROBLEMS.find(p => p.id === newId);
    if (problem) {
      setTestCases(problem.testCases);
      setConsoleOutput('');
    }
  };

  const summary = useMemo(() => {
    const passed = testCases.filter((test) => test.status === 'passed').length;
    const failed = testCases.filter((test) => test.status === 'failed' || test.status === 'error').length;
    return { passed, failed, total: testCases.length };
  }, [testCases]);

  useEffect(() => {
    setIsMounted(true);
    const loadPyodideEnvironment = async () => {
      try {
        if (!window.loadPyodide) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
          script.async = true;
          document.body.appendChild(script);
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = (e) => reject(new Error('Lỗi khi tải script Pyodide: ' + String(e)));
          });
        }
        
        const pyodide = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
        });
        
        setPyodideInstance(pyodide);
        setIsPyodideReady(true);
      } catch (error) {
        console.error('Lỗi khởi tạo Pyodide:', error);
      }
    };
    
    loadPyodideEnvironment();
  }, []);

  const createCase = (): TestCase => {
    return {
      id: `case-${Date.now()}`,
      input: '',
      expected: '',
      status: 'idle',
    };
  };

  const updateCase = <K extends keyof TestCase>(id: string, key: K, value: TestCase[K]) => {
    setTestCases((current) => current.map((test) => (
      test.id === id ? { ...test, [key]: value } : test
    )));
  };

  const normalizeOutput = (value: unknown) => {
    return String(value ?? '')
      .normalize('NFC')
      .replace(/\\r\\n/g, '\\n')
      .trim();
  };

  const onWorkspaceChange = (workspace: Blockly.WorkspaceSvg) => {
    try {
      const code = pythonGenerator.workspaceToCode(workspace);
      setPythonCode(code);
    } catch (e) {
      console.error("Lỗi khi generate code", e);
    }
  };

  const runOneCase = async (pyodide: any, test: TestCase, pCode: string): Promise<TestCase> => {
    const startedAt = performance.now();
    let stdoutData = '';
    
    try {
      pyodide.setStdout({ batched: (msg: string) => { stdoutData += msg + '\n'; } });
      
      const runnerCode = `
import sys
from io import StringIO
import builtins

sys.stdin = StringIO("""${test.input}""")

def custom_input(prompt=""):
    try:
        return sys.stdin.readline().strip()
    except:
        return ""
        
builtins.input = custom_input

${pCode}
`;

      await pyodide.runPythonAsync(runnerCode);
      
      const actual = normalizeOutput(stdoutData);
      const expected = normalizeOutput(test.expected);
      const passed = actual === expected;
      
      return {
        ...test,
        actual: actual || '(không có output)',
        status: passed ? 'passed' : 'failed',
        note: passed ? `${Math.round(performance.now() - startedAt)}ms` : 'Khác expected output',
      };
    } catch (error) {
      return {
        ...test,
        actual: '',
        status: 'error',
        note: error instanceof Error ? error.message.substring(0, 150) + '...' : 'Lỗi runtime Python',
      };
    }
  };

  const runConsole = async () => {
    if (!isPyodideReady || !pyodideInstance) return;
    if (!pythonCode.trim()) {
      alert('Không có mã nguồn để chạy. Vui lòng kéo thả khối lệnh.');
      return;
    }
    
    setIsRunningConsole(true);
    setConsoleOutput('Đang chạy...\n');
    let stdoutData = '';
    
    try {
      pyodideInstance.setStdout({ batched: (msg: string) => { stdoutData += msg + '\n'; } });
      const runnerCode = `
import sys
from io import StringIO
import builtins

sys.stdin = StringIO("""${consoleInput}""")

def custom_input(prompt=""):
    try:
        return sys.stdin.readline().strip()
    except:
        return ""
        
builtins.input = custom_input

${pythonCode}
`;
      await pyodideInstance.runPythonAsync(runnerCode);
      setConsoleOutput(stdoutData || '(Chương trình thực thi thành công không có output)');
    } catch (error) {
      setConsoleOutput(error instanceof Error ? error.message : 'Lỗi runtime Python');
    } finally {
      setIsRunningConsole(false);
    }
  };

  const runAllTests = async () => {
    if (!isPyodideReady || !pyodideInstance) {
      alert('Đang tải môi trường chấm điểm, vui lòng chờ...');
      return;
    }
    if (!pythonCode.trim()) {
      alert('Không có mã nguồn để chạy. Vui lòng kéo thả khối lệnh.');
      return;
    }

    setIsRunning(true);
    setTestCases((current) => current.map((test) => ({ ...test, status: 'running', actual: '', note: '' })));

    const nextResults: TestCase[] = [];

    for (const test of testCases) {
      const result = await runOneCase(pyodideInstance, test, pythonCode);
      nextResults.push(result);
      setTestCases((current) => current.map((item) => (item.id === result.id ? result : item)));
    }

    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="border-b border-foreground/10 bg-foreground/[0.02]">
        <div className="container mx-auto px-6 py-8">
          <Link href="/utility-hub" className="inline-flex items-center gap-2 text-sm font-bold text-foreground/60 hover:text-brand-orange">
            <ArrowLeft size={16} aria-hidden="true" />
            Quay lại Utility Hub
          </Link>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border-blue-500/20 bg-blue-500/5 px-3 py-1">
                <Blocks size={14} className="text-blue-500" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-500">Blockly Judge</span>
              </div>
              <h1 className="font-[family-name:var(--font-inter)] text-4xl font-black tracking-tight md:text-5xl">
                Chấm bài thi Kéo thả Khối
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground/70">
                Lập trình bằng cách kéo thả khối lệnh Blockly. Khối lệnh sẽ được dịch sang Python và chạy kiểm thử tự động với Test Case.
              </p>
            </div>

            <div className="grid min-w-[360px] grid-cols-3 gap-3 rounded-2xl border border-foreground/10 bg-background p-5 shadow-sm">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-foreground/40">Pass</p>
                <p className="mt-1 text-xl font-black text-emerald-600">{summary.passed}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-foreground/40">Fail</p>
                <p className="mt-1 text-xl font-black text-red-600">{summary.failed}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-foreground/40">Test</p>
                <p className="mt-1 text-xl font-black">{summary.total}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-6 py-10">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          
          {isFullscreenEditor && <div className="fixed inset-0 z-40 bg-background/90 backdrop-blur-md" onClick={() => setIsFullscreenEditor(false)} />}
          
          <div className={isFullscreenEditor ? "fixed inset-4 z-50 flex flex-col gap-4 bg-background p-4 rounded-2xl shadow-2xl border border-foreground/10" : "flex flex-col h-[800px] gap-4"}>
            <section className="flex flex-col rounded-2xl border border-foreground/10 bg-background overflow-hidden flex-1 min-h-0">
               <div className="flex items-center justify-between border-b border-foreground/10 bg-foreground/[0.02] px-6 py-4">
                 <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-black uppercase tracking-wider text-blue-500">Đề bài (Tin học trẻ)</p>
                    <select
                      className="bg-transparent text-lg font-black outline-none cursor-pointer hover:text-blue-500 transition-colors"
                      value={selectedProblemId}
                      onChange={handleProblemChange}
                    >
                      {SAMPLE_PROBLEMS.map(p => (
                        <option key={p.id} value={p.id} className="text-sm font-normal text-black bg-white">{p.title}</option>
                      ))}
                    </select>
                 </div>
                 
                 <div className="flex items-center gap-3">
                    <button
                      onClick={runConsole}
                      disabled={isRunningConsole || !isPyodideReady || !pythonCode.trim()}
                      className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-600 hover:bg-blue-500/20 disabled:opacity-50"
                    >
                      {isRunningConsole ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Run / Debug
                    </button>
                    <div className="w-px h-4 bg-foreground/10 mx-1"></div>
                    <button
                      onClick={() => setIsConsoleVisible(!isConsoleVisible)}
                      className={`p-1.5 rounded-md transition-colors ${isConsoleVisible ? 'bg-blue-500/10 text-blue-500' : 'text-foreground/40 hover:text-foreground hover:bg-foreground/5'}`}
                      title={isConsoleVisible ? "Ẩn Terminal" : "Hiện Terminal"}
                    >
                      <TerminalSquare size={16} />
                    </button>
                    <button
                      onClick={() => setIsFullscreenEditor(!isFullscreenEditor)}
                      className="p-1.5 text-foreground/40 hover:text-foreground rounded-md hover:bg-foreground/5 transition-colors"
                      title={isFullscreenEditor ? "Thu nhỏ" : "Phóng to"}
                    >
                      {isFullscreenEditor ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                 </div>
               </div>
               
               <div className="flex-1 relative">
                  {isMounted && (
                    <BlocklyWorkspace
                      className="w-full h-full" 
                      toolboxConfiguration={{
                        kind: 'categoryToolbox',
                        contents: [
                          { kind: 'category', name: 'Logic', categorystyle: 'logic_category', contents: [ { kind: 'block', type: 'controls_if' }, { kind: 'block', type: 'logic_compare' }, { kind: 'block', type: 'logic_operation' }, { kind: 'block', type: 'logic_boolean' } ] },
                          { kind: 'category', name: 'Vòng lặp', categorystyle: 'loop_category', contents: [ { kind: 'block', type: 'controls_repeat_ext' }, { kind: 'block', type: 'controls_whileUntil' }, { kind: 'block', type: 'controls_for' } ] },
                          { kind: 'category', name: 'Toán học', categorystyle: 'math_category', contents: [ { kind: 'block', type: 'math_number' }, { kind: 'block', type: 'math_arithmetic' }, { kind: 'block', type: 'math_modulo' } ] },
                          { kind: 'category', name: 'Văn bản', categorystyle: 'text_category', contents: [ { kind: 'block', type: 'text' }, { kind: 'block', type: 'text_print' }, { kind: 'block', type: 'text_prompt_ext' } ] },
                          { kind: 'category', name: 'Biến', categorystyle: 'variable_category', custom: 'VARIABLE' },
                          { kind: 'category', name: 'Hàm', categorystyle: 'procedure_category', custom: 'PROCEDURE' }
                        ]
                      }}
                      workspaceConfiguration={{
                        grid: {
                          spacing: 20,
                          length: 3,
                          colour: '#ccc',
                          snap: true
                        },
                        zoom: {
                          controls: true,
                          wheel: true,
                          startScale: 1.0,
                          maxScale: 3,
                          minScale: 0.3,
                          scaleSpeed: 1.2
                        }
                      }}
                      initialXml={INITIAL_XML}
                      onXmlChange={(xml) => setXml(xml)}
                      onWorkspaceChange={onWorkspaceChange}
                    />
                  )}
               </div>
            </section>
            
            {isConsoleVisible && (
              <section className="flex flex-col rounded-2xl border border-foreground/10 bg-background h-56 overflow-hidden shrink-0">
                 <div className="flex items-center justify-between border-b border-foreground/10 bg-foreground/[0.02] px-4 py-2">
                   <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Terminal / Console</p>
                   <button onClick={() => setConsoleOutput('')} className="text-[10px] font-bold text-foreground/40 hover:text-foreground">Clear Console</button>
                 </div>
                 <div className="flex-1 grid grid-cols-2 divide-x divide-foreground/10">
                   <div className="flex flex-col p-2 bg-foreground/[0.01]">
                     <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-foreground/40">Custom Input (stdin)</p>
                     <textarea
                       value={consoleInput}
                       onChange={(e) => setConsoleInput(e.target.value)}
                       placeholder="Nhập input tùy chỉnh cho chương trình (nếu có)..."
                       className="flex-1 resize-none bg-transparent px-2 py-1 text-xs font-mono outline-none text-foreground/80 placeholder:text-foreground/30"
                     />
                   </div>
                   <div className="flex flex-col p-2 bg-[#1e1e1e] text-white">
                     <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-white/40">Output Console</p>
                     <div className="flex-1 overflow-auto px-2 py-1 text-xs font-mono whitespace-pre-wrap text-white/80">
                       {consoleOutput || <span className="text-white/30 italic">Nhấn Run để xem kết quả...</span>}
                     </div>
                   </div>
                 </div>
              </section>
            )}
          </div>

          <section className="flex flex-col min-w-0 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6 h-[800px]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-blue-500">Test suite</p>
                <h2 className="mt-1 text-2xl font-black">Danh sách Test Case</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setTestCases((current) => [...current, createCase()])}
                  className="inline-flex items-center gap-2 rounded-full border border-foreground/10 px-4 py-3 text-sm font-black hover:border-blue-500 hover:text-blue-500"
                >
                  <Plus size={16} aria-hidden="true" />
                  Thêm test
                </button>
                <button
                  type="button"
                  onClick={() => void runAllTests()}
                  disabled={isRunning || !isPyodideReady}
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-black text-background transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRunning ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                  {isRunning ? 'Đang chạy...' : 'Chấm điểm (Run All)'}
                </button>
              </div>
            </div>

            <div className="mt-6 flex-1 overflow-y-auto rounded-2xl border border-foreground/10 bg-background">
              <div className="sticky top-0 grid grid-cols-[50px_minmax(100px,1fr)_minmax(100px,1fr)_minmax(120px,1fr)_90px_54px] gap-3 border-b border-foreground/10 bg-background/95 backdrop-blur px-4 py-3 text-[10px] font-black uppercase tracking-wider text-foreground/45 z-10">
                <span>#</span>
                <span>Input</span>
                <span>Expected</span>
                <span>Actual</span>
                <span>Trạng thái</span>
                <span />
              </div>

              <div className="divide-y divide-foreground/10">
                {testCases.map((test, index) => (
                  <div key={test.id} className="grid grid-cols-[50px_minmax(100px,1fr)_minmax(100px,1fr)_minmax(120px,1fr)_90px_54px] gap-3 px-4 py-4">
                    <div className="text-xs font-black text-foreground/45">#{index + 1}</div>
                    <textarea
                      value={test.input}
                      onChange={(event) => updateCase(test.id, 'input', event.target.value)}
                      rows={2}
                      className="resize-none rounded-xl border border-foreground/10 bg-foreground/[0.02] px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                    <textarea
                      value={test.expected}
                      onChange={(event) => updateCase(test.id, 'expected', event.target.value)}
                      rows={2}
                      className="resize-none rounded-xl border border-foreground/10 bg-foreground/[0.02] px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                    <div className="min-h-16 rounded-xl border border-foreground/10 bg-foreground/[0.02] px-3 py-2 text-sm">
                      <p className="whitespace-pre-wrap font-bold text-xs font-mono">{test.actual || '--'}</p>
                      {test.note && <p className="mt-1 text-[10px] text-foreground/45">{test.note}</p>}
                    </div>
                    <div className="flex items-start">
                      {test.status === 'passed' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-black text-emerald-600">
                           PASS
                        </span>
                      )}
                      {(test.status === 'failed' || test.status === 'error') && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-[10px] font-black text-red-600">
                           FAIL
                        </span>
                      )}
                      {test.status === 'running' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-1 text-[10px] font-black text-blue-500">
                          RUN
                        </span>
                      )}
                      {test.status === 'idle' && (
                        <span className="inline-flex rounded-full bg-foreground/5 px-2 py-1 text-[10px] font-black text-foreground/45">IDLE</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setTestCases((current) => current.filter((item) => item.id !== test.id))}
                      disabled={testCases.length <= 1}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-foreground/10 text-foreground/45 hover:border-red-400 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-foreground/10 bg-foreground/[0.02]">
                <div className="bg-foreground/[0.05] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-foreground/50 border-b border-foreground/10">
                    Mã Python sinh ra tự động
                </div>
                <div className="p-3 text-xs font-mono text-foreground/70 h-32 overflow-y-auto whitespace-pre-wrap">
                    {pythonCode || "# Kéo thả khối lệnh để xem code Python"}
                </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
