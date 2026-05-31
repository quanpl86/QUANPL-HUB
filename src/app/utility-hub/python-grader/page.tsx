'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Code2,
  Loader2,
  Play,
  Plus,
  Trash2,
  Maximize2,
  Minimize2,
  TerminalSquare,
} from 'lucide-react';
import Editor from '@monaco-editor/react';

type TestStatus = 'idle' | 'running' | 'passed' | 'failed' | 'error';

type TestCase = {
  id: string;
  input: string;
  expected: string;
  actual?: string;
  status: TestStatus;
  note?: string;
};

const defaultCases: TestCase[] = [
  { id: 'case-1', input: '5', expected: '120', status: 'idle' },
  { id: 'case-2', input: '6', expected: '720', status: 'idle' },
  { id: 'case-3', input: '10', expected: '3628800', status: 'idle' },
];

const DEFAULT_CODE = `# Viết chương trình tính giai thừa của n
import sys

def factorial(n):
    if n == 0 or n == 1:
        return 1
    return n * factorial(n - 1)

if __name__ == "__main__":
    # Đọc input từ stdin
    lines = sys.stdin.read().split()
    if lines:
        n = int(lines[0])
        print(factorial(n))
`;

declare global {
  interface Window {
    loadPyodide: (config: { indexURL: string }) => Promise<any>;
    pyodide: any;
  }
}

export default function PythonGraderPage() {
  const [problemTitle, setProblemTitle] = useState('Tính giai thừa');
  const [code, setCode] = useState(DEFAULT_CODE);
  const [testCases, setTestCases] = useState<TestCase[]>(defaultCases);
  const [isRunning, setIsRunning] = useState(false);
  const [isPyodideReady, setIsPyodideReady] = useState(false);
  const [pyodideInstance, setPyodideInstance] = useState<any>(null);
  
  const [consoleInput, setConsoleInput] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('');
  const [isRunningConsole, setIsRunningConsole] = useState(false);
  
  const [isFullscreenEditor, setIsFullscreenEditor] = useState(false);
  const [isConsoleVisible, setIsConsoleVisible] = useState(true);

  const summary = useMemo(() => {
    const passed = testCases.filter((test) => test.status === 'passed').length;
    const failed = testCases.filter((test) => test.status === 'failed' || test.status === 'error').length;
    return { passed, failed, total: testCases.length };
  }, [testCases]);

  useEffect(() => {
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

  const runOneCase = async (pyodide: any, test: TestCase, pythonCode: string): Promise<TestCase> => {
    const startedAt = performance.now();
    let stdoutData = '';
    
    try {
      pyodide.setStdout({ batched: (msg: string) => { stdoutData += msg + '\n'; } });
      
      const runnerCode = `
import sys
from io import StringIO

sys.stdin = StringIO("""${test.input}""")

${pythonCode}
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
    setIsRunningConsole(true);
    setConsoleOutput('Đang chạy...\n');
    let stdoutData = '';
    
    try {
      pyodideInstance.setStdout({ batched: (msg: string) => { stdoutData += msg + '\n'; } });
      const runnerCode = `
import sys
from io import StringIO
sys.stdin = StringIO("""${consoleInput}""")

${code}
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
      alert('Đang tải môi trường Python, vui lòng chờ...');
      return;
    }

    setIsRunning(true);
    setTestCases((current) => current.map((test) => ({ ...test, status: 'running', actual: '', note: '' })));

    const nextResults: TestCase[] = [];

    for (const test of testCases) {
      const result = await runOneCase(pyodideInstance, test, code);
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
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/5 px-3 py-1">
                <Code2 size={14} className="text-sky-500" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wider text-sky-500">Python Judge</span>
              </div>
              <h1 className="font-[family-name:var(--font-inter)] text-4xl font-black tracking-tight md:text-5xl">
                Chấm bài thi Python
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground/70">
                Lập trình và biên dịch mã nguồn Python trực tiếp trên trình duyệt. Hỗ trợ đầy đủ stdin/stdout để kiểm thử các bài toán thuật toán với Test Case.
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
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-sky-500">Trình soạn thảo</p>
                    <h2 className="text-lg font-black">{problemTitle}</h2>
                 </div>
                 
                 <div className="flex items-center gap-3">
                    <button
                      onClick={runConsole}
                      disabled={isRunningConsole || !isPyodideReady}
                      className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-black text-sky-600 hover:bg-sky-500/20 disabled:opacity-50"
                    >
                      {isRunningConsole ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Run / Debug
                    </button>
                    {!isPyodideReady && (
                      <span className="inline-flex items-center gap-2 text-xs font-bold text-foreground/50">
                        <Loader2 size={14} className="animate-spin" /> Đang tải Compiler...
                      </span>
                    )}
                    {isPyodideReady && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-600">
                        <CheckCircle2 size={14} /> Ready
                      </span>
                    )}
                    <div className="w-px h-4 bg-foreground/10 mx-1"></div>
                    <button
                      onClick={() => setIsConsoleVisible(!isConsoleVisible)}
                      className={`p-1.5 rounded-md transition-colors ${isConsoleVisible ? 'bg-sky-500/10 text-sky-500' : 'text-foreground/40 hover:text-foreground hover:bg-foreground/5'}`}
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
                  <Editor
                    height="100%"
                    defaultLanguage="python"
                    theme="vs-dark"
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      padding: { top: 16 },
                      scrollBeyondLastLine: false,
                      smoothScrolling: true,
                      cursorBlinking: "smooth",
                      cursorSmoothCaretAnimation: "on",
                      formatOnPaste: true,
                    }}
                  />
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
                <p className="text-[10px] font-black uppercase tracking-wider text-sky-500">Test suite</p>
                <h2 className="mt-1 text-2xl font-black">Danh sách Test Case</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setTestCases((current) => [...current, createCase()])}
                  className="inline-flex items-center gap-2 rounded-full border border-foreground/10 px-4 py-3 text-sm font-black hover:border-sky-500 hover:text-sky-500"
                >
                  <Plus size={16} aria-hidden="true" />
                  Thêm test
                </button>
                <button
                  type="button"
                  onClick={() => void runAllTests()}
                  disabled={isRunning || !isPyodideReady}
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-black text-background transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
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
                      className="resize-none rounded-xl border border-foreground/10 bg-foreground/[0.02] px-3 py-2 text-sm outline-none focus:border-sky-500"
                    />
                    <textarea
                      value={test.expected}
                      onChange={(event) => updateCase(test.id, 'expected', event.target.value)}
                      rows={2}
                      className="resize-none rounded-xl border border-foreground/10 bg-foreground/[0.02] px-3 py-2 text-sm outline-none focus:border-sky-500"
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
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-1 text-[10px] font-black text-sky-500">
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

            <div className="mt-6 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5 text-sm leading-relaxed text-foreground/70">
              <p className="font-black text-foreground">Cách viết code Python:</p>
              <p className="mt-2 text-xs">
                Sử dụng <code className="bg-foreground/10 px-1 py-0.5 rounded">import sys</code> và <code className="bg-foreground/10 px-1 py-0.5 rounded">sys.stdin.read()</code> hoặc <code className="bg-foreground/10 px-1 py-0.5 rounded">input()</code> để đọc Test Case Input.
                Kết quả in ra bằng <code className="bg-foreground/10 px-1 py-0.5 rounded">print()</code> sẽ được hệ thống tự động so khớp với Expected Output.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
