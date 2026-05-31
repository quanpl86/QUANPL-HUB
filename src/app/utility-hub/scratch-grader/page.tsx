'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  FileArchive,
  Loader2,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  XCircle,
  Link as LinkIcon,
  Download
} from 'lucide-react';

type OutputMode = 'say' | 'variable' | 'auto';
type TestStatus = 'idle' | 'running' | 'passed' | 'failed' | 'error';

type TestCase = {
  id: string;
  input: string;
  expected: string;
  actual?: string;
  status: TestStatus;
  note?: string;
};

type ScratchVariable = {
  name: string;
  value: unknown;
  type?: string;
};

type ScratchTarget = {
  isStage?: boolean;
  variables?: Record<string, ScratchVariable>;
};

type ScratchRuntime = {
  targets?: ScratchTarget[];
  threads?: unknown[];
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  emit: (event: string, ...args: unknown[]) => void;
};

type ScratchVm = {
  runtime: ScratchRuntime;
  start: () => void;
  greenFlag: () => void;
  stopAll: () => void;
  quit?: () => void;
  setTurboMode?: (enabled: boolean) => void;
  attachStorage?: (storage: unknown) => void;
  loadProject: (input: ArrayBuffer) => Promise<void>;
};

declare global {
  interface Window {
    VirtualMachine?: new () => ScratchVm;
    ScratchStorage?: new () => unknown;
  }
}

const defaultCases: TestCase[] = [
  { id: 'case-12', input: '12', expected: '2', status: 'idle' },
  { id: 'case-14', input: '14', expected: '2', status: 'idle' },
  { id: 'case-13', input: '13', expected: '0', status: 'idle' },
  { id: 'case-81', input: '81', expected: '9', status: 'idle' },
];

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function normalizeOutput(value: unknown) {
  return String(value ?? '')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();
}

function createCase(): TestCase {
  return {
    id: `case-${Date.now()}`,
    input: '',
    expected: '',
    status: 'idle',
  };
}

function readVariable(vm: ScratchVm, variableName: string) {
  const normalizedName = variableName.trim().toLowerCase();
  if (!normalizedName) return '';

  for (const target of vm.runtime.targets || []) {
    for (const variable of Object.values(target.variables || {})) {
      if (variable.name.toLowerCase() === normalizedName) {
        return normalizeOutput(variable.value);
      }
    }
  }

  return '';
}

function setVariable(vm: ScratchVm, variableName: string, value: string) {
  const normalizedName = variableName.trim().toLowerCase();
  if (!normalizedName) return false;

  for (const target of vm.runtime.targets || []) {
    for (const variable of Object.values(target.variables || {})) {
      if (variable.name.toLowerCase() === normalizedName) {
        variable.value = value;
        return true;
      }
    }
  }

  return false;
}

function readLikelyOutput(vm: ScratchVm) {
  const candidates = ['kết quả', 'ket qua', 'result', 'output', 'answer', 'ans', 'đáp án', 'dap an'];
  for (const name of candidates) {
    const value = readVariable(vm, name);
    if (value !== '') return value;
  }
  return '';
}

function loadScriptOnce(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing?.dataset.loaded === 'true') {
      resolve();
      return;
    }

    const script = existing || document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`Không tải được runtime: ${src}`));

    if (!existing) {
      document.body.appendChild(script);
    }
  });
}

async function createScratchVm(projectBuffer: ArrayBuffer) {
  await loadScriptOnce('/vendor/scratch-storage/scratch-storage.js');
  await loadScriptOnce('/vendor/scratch-vm/scratch-vm.js');

  const VmClass = window.VirtualMachine;
  const StorageClass = window.ScratchStorage;
  if (!VmClass) {
    throw new Error('Scratch VM chưa sẵn sàng.');
  }

  const vm = new VmClass();

  if (vm.attachStorage && StorageClass) {
    vm.attachStorage(new StorageClass());
  }

  vm.setTurboMode?.(true);
  await vm.loadProject(projectBuffer);
  return vm;
}

export default function ScratchGraderPage() {
  const [projectFile, setProjectFile] = useState<File | null>(null);
  const [projectUrl, setProjectUrl] = useState('');
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [projectJson, setProjectJson] = useState<string | null>(null);
  const [problemTitle, setProblemTitle] = useState('Bảng cửu chương');
  const [inputVariableName, setInputVariableName] = useState('');
  const [outputMode, setOutputMode] = useState<OutputMode>('auto');
  const [outputVariableName, setOutputVariableName] = useState('');
  const [timeoutMs, setTimeoutMs] = useState(2500);
  const [testCases, setTestCases] = useState<TestCase[]>(defaultCases);
  const [isRunning, setIsRunning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const summary = useMemo(() => {
    const passed = testCases.filter((test) => test.status === 'passed').length;
    const failed = testCases.filter((test) => test.status === 'failed' || test.status === 'error').length;
    return { passed, failed, total: testCases.length };
  }, [testCases]);

  const updateCase = <K extends keyof TestCase>(id: string, key: K, value: TestCase[K]) => {
    setTestCases((current) => current.map((test) => (
      test.id === id ? { ...test, [key]: value } : test
    )));
  };

  const runOneCase = async (sourceData: ArrayBuffer | string, test: TestCase): Promise<TestCase> => {
    let vm: ScratchVm | null = null;
    let lastBubble = '';
    const startedAt = performance.now();

    try {
      vm = await createScratchVm(sourceData as any);
      vm.runtime.on('QUESTION', (question) => {
        if (question !== null) {
          window.setTimeout(() => vm?.runtime.emit('ANSWER', test.input), 30);
        }
      });
      vm.runtime.on('SAY', (_target, _type, text) => {
        if (text !== null && text !== undefined && String(text).trim()) {
          lastBubble = String(text);
        }
      });
      vm.runtime.on('THINK', (_target, _type, text) => {
        if (text !== null && text !== undefined && String(text).trim()) {
          lastBubble = String(text);
        }
      });

      if (inputVariableName.trim()) {
        setVariable(vm, inputVariableName, test.input);
      }

      vm.start();
      vm.greenFlag();

      const deadline = performance.now() + timeoutMs;
      while (performance.now() < deadline) {
        await wait(80);
        if ((vm.runtime.threads || []).length === 0) break;
      }

      let actual = '';
      if (outputMode === 'variable') {
        actual = readVariable(vm, outputVariableName);
      } else if (outputMode === 'say') {
        actual = normalizeOutput(lastBubble);
      } else {
        actual = normalizeOutput(lastBubble) || readVariable(vm, outputVariableName) || readLikelyOutput(vm);
      }

      const expected = normalizeOutput(test.expected);
      const passed = normalizeOutput(actual) === expected;

      return {
        ...test,
        actual: actual || '(không bắt được output)',
        status: passed ? 'passed' : 'failed',
        note: passed ? `${Math.round(performance.now() - startedAt)}ms` : 'Khác expected output',
      };
    } catch (error) {
      return {
        ...test,
        actual: '',
        status: 'error',
        note: error instanceof Error ? error.message : 'Không chạy được project Scratch.',
      };
    } finally {
      try {
        vm?.stopAll();
        vm?.quit?.();
      } catch {
        // Ignore shutdown errors from third-party Scratch VM.
      }
    }
  };

  const runAllTests = async () => {
    if (!projectFile && !projectJson) {
      alert('Vui lòng upload file .sb3 hoặc nhập link Scratch!');
      return;
    }

    setIsRunning(true);
    setTestCases((current) => current.map((test) => ({ ...test, status: 'running', actual: '', note: '' })));

    let sourceData: ArrayBuffer | string;
    if (projectFile) {
      sourceData = await projectFile.arrayBuffer();
    } else {
      sourceData = projectJson!;
    }

    const nextResults: TestCase[] = [];

    for (const test of testCases) {
      const result = await runOneCase(sourceData, test);
      nextResults.push(result);
      setTestCases((current) => current.map((item) => (item.id === result.id ? result : item)));
    }

    setTestCases(nextResults);
    setIsRunning(false);
  };

  const handleFetchUrl = async () => {
    try {
      const match = projectUrl.match(/scratch\.mit\.edu\/projects\/(\d+)/);
      if (!match) {
        alert('URL không hợp lệ. Vui lòng nhập link dạng: https://scratch.mit.edu/projects/123456789');
        return;
      }
      
      setLoadingUrl(true);
      const projectId = match[1];
      const res = await fetch(`/api/scratch-proxy?id=${projectId}`);
      if (!res.ok) {
        throw new Error('Không thể tải project từ Scratch API');
      }
      
      const json = await res.json();
      setProjectJson(JSON.stringify(json));
      setProjectFile(null); // Clear file if URL is loaded
      alert('Đã tải project thành công!');
    } catch (e) {
      alert('Lỗi tải project: ' + (e as Error).message);
    } finally {
      setLoadingUrl(false);
    }
  };

  const loadMultiplicationSample = () => {
    setProblemTitle('Bảng cửu chương');
    setInputVariableName('');
    setOutputMode('auto');
    setOutputVariableName('kết quả');
    setTimeoutMs(2500);
    setTestCases(defaultCases);
  };

  const loadFieldColorSample = () => {
    setProblemTitle('Tô màu sân trường');
    setInputVariableName('');
    setOutputMode('auto');
    setOutputVariableName('kết quả');
    setTimeoutMs(2500);
    setTestCases([
      { id: 'case-4', input: '4', expected: '6', status: 'idle' },
      { id: 'case-5', input: '5', expected: '9', status: 'idle' },
      { id: 'case-10', input: '10', expected: '30', status: 'idle' },
      { id: 'case-1000', input: '1000', expected: '3000', status: 'idle' },
    ]);
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
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-orange/20 bg-brand-orange/5 px-3 py-1">
                <ClipboardCheck size={14} className="text-brand-orange" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">Scratch Judge</span>
              </div>
              <h1 className="font-[family-name:var(--font-inter)] text-4xl font-black tracking-tight md:text-5xl">
                Chấm test case file .sb3
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground/70">
                Tải bài Scratch của học sinh, nhập input/expected output và chạy kiểm thử tự động như bài thi Tin học trẻ. Runtime chạy cục bộ trên trình duyệt.
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
        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="rounded-2xl border border-foreground/10 bg-background p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-brand-orange">Project học sinh</p>
                  <h2 className="mt-1 text-xl font-black">Upload .sb3</h2>
                </div>
                <FileArchive size={22} className="text-foreground/35" aria-hidden="true" />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".sb3"
                className="hidden"
                onChange={(event) => setProjectFile(event.target.files?.[0] || null)}
              />

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-foreground/25 p-6 text-center transition-colors hover:border-brand-orange hover:bg-brand-orange/5 ${projectFile ? 'bg-brand-orange/5 border-brand-orange' : 'bg-foreground/[0.02]'}`}
                >
                  <FileArchive size={34} className={projectFile ? 'text-brand-orange' : 'text-foreground/40'} aria-hidden="true" />
                  <span className="mt-3 text-sm font-black">{projectFile ? projectFile.name : 'Upload file .sb3'}</span>
                  <span className="mt-1 text-xs text-foreground/55">
                    {projectFile ? `${(projectFile.size / 1024 / 1024).toFixed(2)} MB` : 'Hoặc kéo thả vào đây'}
                  </span>
                </button>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-foreground/10" />
                <span className="text-xs font-bold text-foreground/40">HOẶC</span>
                <div className="h-px flex-1 bg-foreground/10" />
              </div>

              <div className="mt-4 flex gap-2">
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-foreground/40">
                    <LinkIcon size={16} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Link dự án (VD: scratch.mit.edu/projects/1234)"
                    value={projectUrl}
                    onChange={(e) => setProjectUrl(e.target.value)}
                    className="h-10 w-full rounded-xl border border-foreground/10 bg-foreground/[0.02] pl-10 pr-4 text-xs font-bold outline-none focus:border-brand-orange"
                  />
                </div>
                <button 
                  type="button"
                  onClick={handleFetchUrl}
                  disabled={loadingUrl || !projectUrl}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-xs font-bold text-background transition-colors hover:bg-brand-orange disabled:opacity-50"
                >
                  {loadingUrl ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  Tải
                </button>
              </div>
              
              {projectJson && !projectFile && (
                <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700">Đã tải dự án từ Scratch URL</span>
                  </div>
                  <button onClick={() => { setProjectJson(null); setProjectUrl(''); }} className="text-foreground/40 hover:text-red-500">
                    <XCircle size={16} />
                  </button>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-foreground/10 bg-background p-6">
              <p className="text-[10px] font-black uppercase tracking-wider text-brand-orange">Cấu hình chấm</p>
              <h2 className="mt-1 text-xl font-black">I/O và thời gian</h2>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-wider text-foreground/45">Tên đề</span>
                  <input
                    value={problemTitle}
                    onChange={(event) => setProblemTitle(event.target.value)}
                    className="mt-2 h-12 w-full rounded-xl border border-foreground/10 bg-foreground/[0.02] px-4 text-sm font-bold outline-none focus:border-brand-orange"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-wider text-foreground/45">Input biến trước khi chạy</span>
                  <input
                    value={inputVariableName}
                    onChange={(event) => setInputVariableName(event.target.value)}
                    placeholder="Để trống nếu bài dùng ask and wait"
                    className="mt-2 h-12 w-full rounded-xl border border-foreground/10 bg-foreground/[0.02] px-4 text-sm font-bold outline-none focus:border-brand-orange"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-wider text-foreground/45">Nguồn output</span>
                  <select
                    value={outputMode}
                    onChange={(event) => setOutputMode(event.target.value as OutputMode)}
                    className="mt-2 h-12 w-full rounded-xl border border-foreground/10 bg-foreground/[0.02] px-4 text-sm font-bold outline-none focus:border-brand-orange"
                  >
                    <option value="auto">Tự nhận diện: say/think rồi biến</option>
                    <option value="say">Lấy nội dung say/think cuối</option>
                    <option value="variable">Lấy biến chỉ định</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-wider text-foreground/45">Tên biến output</span>
                  <input
                    value={outputVariableName}
                    onChange={(event) => setOutputVariableName(event.target.value)}
                    placeholder="VD: kết quả, result, output"
                    className="mt-2 h-12 w-full rounded-xl border border-foreground/10 bg-foreground/[0.02] px-4 text-sm font-bold outline-none focus:border-brand-orange"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-wider text-foreground/45">Timeout mỗi test</span>
                  <input
                    type="number"
                    min="500"
                    step="100"
                    value={timeoutMs}
                    onChange={(event) => setTimeoutMs(Number(event.target.value))}
                    className="mt-2 h-12 w-full rounded-xl border border-foreground/10 bg-foreground/[0.02] px-4 text-sm font-bold outline-none focus:border-brand-orange"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-foreground/10 bg-background p-6">
              <p className="text-[10px] font-black uppercase tracking-wider text-brand-orange">Mẫu nhanh</p>
              <div className="mt-4 grid gap-3">
                <button type="button" onClick={loadMultiplicationSample} className="rounded-full border border-foreground/10 px-4 py-3 text-sm font-black hover:border-brand-orange hover:text-brand-orange">
                  Bảng cửu chương
                </button>
                <button type="button" onClick={loadFieldColorSample} className="rounded-full border border-foreground/10 px-4 py-3 text-sm font-black hover:border-brand-orange hover:text-brand-orange">
                  Tô màu sân trường
                </button>
                <button
                  type="button"
                  onClick={() => setTestCases((current) => current.map((test) => ({ ...test, status: 'idle', actual: '', note: '' })))}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-foreground/10 px-4 py-3 text-sm font-black text-foreground/60 hover:border-brand-orange hover:text-brand-orange"
                >
                  <RotateCcw size={16} aria-hidden="true" />
                  Reset kết quả
                </button>
              </div>
            </section>
          </aside>

          <section className="min-w-0 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-brand-orange">Test suite</p>
                <h2 className="mt-1 text-2xl font-black">{problemTitle}</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setTestCases((current) => [...current, createCase()])}
                  className="inline-flex items-center gap-2 rounded-full border border-foreground/10 px-4 py-3 text-sm font-black hover:border-brand-orange hover:text-brand-orange"
                >
                  <Plus size={16} aria-hidden="true" />
                  Thêm test
                </button>
                <button
                  type="button"
                  onClick={() => void runAllTests()}
                  disabled={isRunning}
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-black text-background transition-colors hover:bg-brand-orange disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRunning ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                  {isRunning ? 'Đang chấm...' : 'Chạy tất cả test'}
                </button>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-foreground/10 bg-background">
              <div className="grid grid-cols-[70px_minmax(130px,1fr)_minmax(130px,1fr)_minmax(130px,1fr)_130px_54px] gap-3 border-b border-foreground/10 bg-foreground/[0.03] px-4 py-3 text-[10px] font-black uppercase tracking-wider text-foreground/45">
                <span>#</span>
                <span>Input</span>
                <span>Expected</span>
                <span>Actual</span>
                <span>Trạng thái</span>
                <span />
              </div>

              <div className="divide-y divide-foreground/10">
                {testCases.map((test, index) => (
                  <div key={test.id} className="grid grid-cols-[70px_minmax(130px,1fr)_minmax(130px,1fr)_minmax(130px,1fr)_130px_54px] gap-3 px-4 py-4">
                    <div className="text-xs font-black text-foreground/45">#{index + 1}</div>
                    <textarea
                      value={test.input}
                      onChange={(event) => updateCase(test.id, 'input', event.target.value)}
                      rows={2}
                      className="resize-none rounded-xl border border-foreground/10 bg-foreground/[0.02] px-3 py-2 text-sm outline-none focus:border-brand-orange"
                    />
                    <textarea
                      value={test.expected}
                      onChange={(event) => updateCase(test.id, 'expected', event.target.value)}
                      rows={2}
                      className="resize-none rounded-xl border border-foreground/10 bg-foreground/[0.02] px-3 py-2 text-sm outline-none focus:border-brand-orange"
                    />
                    <div className="min-h-16 rounded-xl border border-foreground/10 bg-foreground/[0.02] px-3 py-2 text-sm">
                      <p className="whitespace-pre-wrap font-bold">{test.actual || '--'}</p>
                      {test.note && <p className="mt-1 text-xs text-foreground/45">{test.note}</p>}
                    </div>
                    <div className="flex items-start">
                      {test.status === 'passed' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-600">
                          <CheckCircle2 size={14} aria-hidden="true" /> PASS
                        </span>
                      )}
                      {(test.status === 'failed' || test.status === 'error') && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1 text-xs font-black text-red-600">
                          <XCircle size={14} aria-hidden="true" /> FAIL
                        </span>
                      )}
                      {test.status === 'running' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-orange/10 px-3 py-1 text-xs font-black text-brand-orange">
                          <Loader2 size={14} className="animate-spin" aria-hidden="true" /> RUN
                        </span>
                      )}
                      {test.status === 'idle' && (
                        <span className="inline-flex rounded-full bg-foreground/5 px-3 py-1 text-xs font-black text-foreground/45">IDLE</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setTestCases((current) => current.filter((item) => item.id !== test.id))}
                      disabled={testCases.length <= 1}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-foreground/10 text-foreground/45 hover:border-red-400 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Xóa test ${index + 1}`}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-brand-orange/20 bg-brand-orange/5 p-5 text-sm leading-relaxed text-foreground/70">
              <p className="font-black text-foreground">Cách dùng khuyến nghị cho bài thi dạng nhập/xuất:</p>
              <p className="mt-2">
                Với bài Scratch dùng block “hỏi ... và đợi”, hệ thống tự gửi input vào answer. Nếu học sinh lưu kết quả vào biến,
                chọn nguồn output là biến và nhập đúng tên biến. Nếu học sinh dùng “nói ...”, chọn output say/think hoặc để tự nhận diện.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
