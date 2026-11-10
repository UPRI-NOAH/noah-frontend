import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestError,
  TestResult,
} from '@playwright/test/reporter';

/**
 * Writes a Markdown summary of every Playwright run, by default to
 * `test-results/e2e-report.md` (replaced on each run). On GitHub Actions the
 * same summary is also added to the job page ($GITHUB_STEP_SUMMARY).
 *
 * Every test result (one test in one project) lands in one category:
 *
 *   Passed        passed on the first attempt
 *   Failed        unexpected failure, timeout or crash: needs attention
 *   Flaky         failed, then passed on a retry
 *   Known issue   a `knownIssue()` test that still fails: the defect is still there
 *   Now passing   a `knownIssue()` test that passed: the defect looks fixed,
 *                 remove the `knownIssue()` line
 *   Skipped       test.skip() / test.fixme()
 *   Not run       the run was stopped before the test finished
 *
 * Options (playwright.config.ts):
 *   ['./tests/support/markdown-reporter.ts', { outputFile: 'test-results/e2e-report.md' }]
 * The E2E_REPORT_MD environment variable overrides `outputFile`.
 */

export interface MarkdownReporterOptions {
  /** Report path, relative to the directory of playwright.config.ts. */
  outputFile?: string;
  /** Heading of the report. */
  title?: string;
}

type Category =
  | 'passed'
  | 'failed'
  | 'flaky'
  | 'knownIssue'
  | 'nowPassing'
  | 'skipped'
  | 'notRun';

/** Summary table columns; optional ones only appear when non-zero. */
const COLUMNS: Array<{ category: Category; label: string; always: boolean }> = [
  { category: 'passed', label: 'Passed', always: true },
  { category: 'failed', label: 'Failed', always: true },
  { category: 'flaky', label: 'Flaky', always: true },
  { category: 'knownIssue', label: 'Known issues', always: true },
  { category: 'nowPassing', label: 'Known issue now passing', always: false },
  { category: 'skipped', label: 'Skipped', always: true },
  { category: 'notRun', label: 'Not run', always: false },
];

/** Annotation type used by `knownIssue()` in tests/support/helpers.ts. */
const KNOWN_ISSUE = 'known issue';
const DEFAULT_OUTPUT = 'test-results/e2e-report.md';
const MAX_ERROR_LINES = 40;

/** One test in one project. */
interface Run {
  test: TestCase;
  project: string;
  category: Category;
}

/** One test across every project it ran in. */
interface Group {
  title: string;
  file: string;
  line: number;
  runs: Run[];
}

interface RenderOptions {
  /** Directory of the Markdown file, for relative links; omitted = no links. */
  linkBase?: string;
}

class MarkdownReporter implements Reporter {
  private config?: FullConfig;
  private suite?: Suite;
  private readonly runErrors: TestError[] = [];

  constructor(private readonly options: MarkdownReporterOptions = {}) {}

  printsToStdio(): boolean {
    return false;
  }

  onBegin(config: FullConfig, suite: Suite): void {
    this.config = config;
    this.suite = suite;
  }

  /** Errors outside tests: web server failed to start, global setup, ... */
  onError(error: TestError): void {
    this.runErrors.push(error);
  }

  onEnd(result: FullResult): void {
    const runs = (this.suite?.allTests() ?? []).map(
      (test): Run => ({
        test,
        project: test.parent.project()?.name ?? '',
        category: categorize(test),
      })
    );

    // `playwright test --list` runs nothing; keep the previous report.
    const listingOnly =
      runs.length > 0 &&
      runs.every((run) => run.test.results.length === 0) &&
      this.runErrors.length === 0 &&
      result.status === 'passed';
    if (listingOnly) return;

    const configDir = this.config?.configFile
      ? path.dirname(this.config.configFile)
      : process.cwd();
    const outputFile = path.resolve(
      configDir,
      process.env.E2E_REPORT_MD || this.options.outputFile || DEFAULT_OUTPUT
    );

    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(
      outputFile,
      this.render(result, runs, configDir, {
        linkBase: path.dirname(outputFile),
      })
    );
    const shown = path.relative(process.cwd(), outputFile);
    console.log(
      `\n  Markdown report: ${shown.startsWith('..') ? outputFile : shown}\n`
    );

    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        this.render(result, runs, configDir, {}) + '\n'
      );
    }
  }

  // ---------------------------------------------------------------- render

  private render(
    result: FullResult,
    runs: Run[],
    configDir: string,
    options: RenderOptions
  ): string {
    const groups = groupByTest(runs, configDir);
    const projects = this.projectOrder(runs);
    const count = (category: Category, project?: string) =>
      runs.filter(
        (run) =>
          run.category === category && (!project || run.project === project)
      ).length;

    const out: string[] = [];
    out.push(`# ${this.options.title ?? 'E2E test report'}`, '');

    // Overview
    const firstProject = this.config?.projects[0];
    const git = gitInfo();
    const overview: Array<[string, string]> = [
      ['Result', verdict(result, count, this.runErrors.length)],
      ['Started', formatDate(result.startTime)],
      ['Duration', formatDuration(result.duration)],
    ];
    if (git) overview.push(['Branch', git]);
    overview.push(
      ['Projects', projects.join(', ') || '–'],
      [
        'Tests',
        `${groups.length} tests, ${runs.length} results (one per test per project)`,
      ]
    );
    if (firstProject?.use?.baseURL) {
      overview.push(['Base URL', String(firstProject.use.baseURL)]);
    }
    overview.push([
      'Workers / retries',
      `${this.config?.workers ?? '–'} / ${firstProject?.retries ?? 0}`,
    ]);
    if (this.config?.version) {
      overview.push(['Playwright', this.config.version]);
    }
    out.push('| | |', '|---|---|');
    for (const [key, value] of overview) {
      out.push(`| **${key}** | ${cell(value)} |`);
    }
    out.push('');

    // Errors outside tests
    if (this.runErrors.length) {
      out.push(`## Run errors (${this.runErrors.length})`, '');
      out.push(
        'These happened outside any test (for example the web server or the build failed).',
        ''
      );
      for (const error of this.runErrors) {
        out.push(codeBlock(errorText(error)), '');
      }
    }

    // Summary per project
    if (runs.length) {
      const columns = COLUMNS.filter((c) => c.always || count(c.category));
      out.push('## Summary', '');
      out.push(
        `| Project | Total | ${columns.map((c) => c.label).join(' | ')} |`,
        `|---|---:|${columns.map(() => '---:').join('|')}|`
      );
      for (const project of projects) {
        const total = runs.filter((run) => run.project === project).length;
        out.push(
          `| ${project} | ${total} | ${columns
            .map((c) => count(c.category, project))
            .join(' | ')} |`
        );
      }
      out.push(
        `| **All** | **${runs.length}** | ${columns
          .map((c) => `**${count(c.category)}**`)
          .join(' | ')} |`,
        ''
      );
    }

    // Failures
    const failed = groups.filter((g) => has(g, 'failed'));
    if (failed.length) {
      out.push(`## Failures (${failed.length})`, '');
      out.push(
        'Unexpected failures. Each one is either a new defect or a test that needs updating.',
        ''
      );
      failed.forEach((group, i) =>
        out.push(...failureSection(group, 'failed', i + 1, configDir, options))
      );
    }

    // Known issues that passed
    const nowPassing = groups.filter((g) => has(g, 'nowPassing'));
    if (nowPassing.length) {
      out.push(`## Known issues now passing (${nowPassing.length})`, '');
      out.push(
        'These tests document a defect but passed. If the fix was intended, remove the ' +
          '`knownIssue()` line from the test; Playwright reports them as failures until then.',
        ''
      );
      out.push(
        ...groupTable(nowPassing, 'nowPassing', configDir, options, true)
      );
    }

    // Flaky
    const flaky = groups.filter((g) => has(g, 'flaky'));
    if (flaky.length) {
      out.push(`## Flaky (${flaky.length})`, '');
      out.push('Failed at first and passed on a retry.', '');
      flaky.forEach((group, i) =>
        out.push(...failureSection(group, 'flaky', i + 1, configDir, options))
      );
    }

    // Known issues
    const known = groups.filter((g) => has(g, 'knownIssue'));
    if (known.length) {
      out.push(`## Known issues (${known.length})`, '');
      out.push(
        'Documented defects. These tests assert the correct behaviour and still fail, as expected.',
        ''
      );
      out.push(...groupTable(known, 'knownIssue', configDir, options, true));
    }

    // Skipped and not run
    for (const [category, heading] of [
      ['skipped', 'Skipped'],
      ['notRun', 'Not run'],
    ] as Array<[Category, string]>) {
      const list = groups.filter((g) => has(g, category));
      if (!list.length) continue;
      out.push(`## ${heading} (${list.length})`, '');
      out.push('<details><summary>Show tests</summary>', '');
      out.push(...groupTable(list, category, configDir, options, false));
      out.push('</details>', '');
    }

    out.push(
      '---',
      '',
      '_Generated by `tests/support/markdown-reporter.ts`. Traces, screenshots and videos: ' +
        '`npm run test:e2e:report`._',
      ''
    );
    return out.join('\n');
  }

  /** Projects in config order, followed by any others that produced results. */
  private projectOrder(runs: Run[]): string[] {
    const ran = new Set(runs.map((run) => run.project));
    const ordered = (this.config?.projects ?? [])
      .map((p) => p.name)
      .filter((name) => ran.has(name));
    return [...ordered, ...[...ran].filter((name) => !ordered.includes(name))];
  }
}

// ------------------------------------------------------------------ helpers

function categorize(test: TestCase): Category {
  const results = test.results.filter((r) => r.status !== 'interrupted');
  if (!results.length) return 'notRun';
  switch (test.outcome()) {
    case 'skipped':
      return 'skipped';
    case 'flaky':
      return 'flaky';
    case 'expected':
      return test.expectedStatus === 'failed' ? 'knownIssue' : 'passed';
    default:
      // Expected to fail (knownIssue) but passed: the defect looks fixed.
      return test.expectedStatus === 'failed' &&
        results[results.length - 1].status === 'passed'
        ? 'nowPassing'
        : 'failed';
  }
}

function groupByTest(runs: Run[], configDir: string): Group[] {
  const groups = new Map<string, Group>();
  for (const run of runs) {
    const title = testTitle(run.test);
    const file = path.relative(configDir, run.test.location.file);
    const key = `${file}\n${title}`;
    if (!groups.has(key)) {
      groups.set(key, { title, file, line: run.test.location.line, runs: [] });
    }
    groups.get(key)!.runs.push(run);
  }
  return [...groups.values()].sort(
    (a, b) => a.file.localeCompare(b.file) || a.line - b.line
  );
}

/** "describe › describe › test" (without project and file). */
function testTitle(test: TestCase): string {
  const parts = [test.title];
  for (let s = test.parent; s && s.type === 'describe'; s = s.parent) {
    parts.unshift(s.title);
  }
  return parts.join(' › ');
}

const has = (group: Group, category: Category) =>
  group.runs.some((run) => run.category === category);

const projectsIn = (group: Group, category: Category) =>
  group.runs.filter((r) => r.category === category).map((r) => r.project);

function location(group: Group, configDir: string, options: RenderOptions) {
  const text = `${group.file}:${group.line}`;
  if (!options.linkBase) return `\`${text}\``;
  const target = path
    .relative(options.linkBase, path.join(configDir, group.file))
    .split(path.sep)
    .join('/');
  return `[${text}](<${target}#L${group.line}>)`;
}

/** The attempt whose error explains the outcome. */
function failingResult(run: Run): TestResult | undefined {
  const results = run.test.results;
  if (run.category === 'flaky') {
    return results.find((r) => r.status !== 'passed' && r.status !== 'skipped');
  }
  return results[results.length - 1];
}

function failureSection(
  group: Group,
  category: 'failed' | 'flaky',
  index: number,
  configDir: string,
  options: RenderOptions
): string[] {
  const runs = group.runs.filter((r) => r.category === category);
  const attempts = Math.max(...runs.map((r) => r.test.results.length));
  const out = [
    `### ${index}. ${escapeMd(group.title)}`,
    '',
    `${location(group, configDir, options)} · ${
      category === 'flaky' ? 'flaky' : 'failed'
    } in ` +
      `**${runs.map((r) => r.project).join(', ')}**` +
      (attempts > 1 ? ` · ${attempts} attempts` : ''),
    '',
  ];

  // Projects often fail the same way: show each distinct error once.
  const byError = new Map<string, Run[]>();
  for (const run of runs) {
    const text = resultErrorText(failingResult(run));
    byError.set(text, [...(byError.get(text) ?? []), run]);
  }
  for (const [text, sameError] of byError) {
    const prefix =
      byError.size > 1
        ? `**${sameError.map((r) => r.project).join(', ')}:** `
        : '';
    out.push(`${prefix}\`${firstLine(text)}\``, '');
    if (text.trim().includes('\n')) {
      out.push(
        '<details><summary>Error details</summary>',
        '',
        codeBlock(text),
        '',
        '</details>',
        ''
      );
    }
  }

  if (options.linkBase) {
    const artifacts = runs
      .map((run) => {
        const links = (failingResult(run)?.attachments ?? [])
          .filter((a) => a.path && fs.existsSync(a.path))
          .map((a) => {
            const target = path
              .relative(options.linkBase!, a.path!)
              .split(path.sep)
              .join('/');
            return `[${a.name}](<${target}>)`;
          });
        return links.length ? `${run.project}: ${links.join(', ')}` : '';
      })
      .filter(Boolean);
    if (artifacts.length) {
      out.push(`Artifacts: ${artifacts.join(' · ')}`, '');
    }
  }
  return out;
}

function groupTable(
  groups: Group[],
  category: Category,
  configDir: string,
  options: RenderOptions,
  describeIssue: boolean
): string[] {
  const out = [
    `| # | Test | Location | Projects | ${
      describeIssue ? 'Known issue' : 'Reason'
    } |`,
    '|---:|---|---|---|---|',
  ];
  groups.forEach((group, i) => {
    const run = group.runs.find((r) => r.category === category)!;
    const note = describeIssue ? knownIssueText(run) : skipReason(run);
    out.push(
      `| ${i + 1} | ${cell(escapeMd(group.title))} | ${location(
        group,
        configDir,
        options
      )} | ${projectsIn(group, category).join(', ')} | ${cell(note ?? '')} |`
    );
  });
  out.push('');
  return out;
}

function annotationsOf(run: Run) {
  const last = run.test.results[run.test.results.length - 1];
  return [...(last?.annotations ?? []), ...run.test.annotations];
}

const knownIssueText = (run: Run) =>
  annotationsOf(run).find((a) => a.type === KNOWN_ISSUE)?.description;

const skipReason = (run: Run) =>
  annotationsOf(run).find((a) => a.type === 'skip' || a.type === 'fixme')
    ?.description;

function verdict(
  result: FullResult,
  count: (category: Category) => number,
  runErrors: number
): string {
  const notes: string[] = [];
  const note = (n: number, what: string) => {
    if (n) notes.push(`${n} ${what}${n === 1 ? '' : 's'}`);
  };
  note(count('failed'), 'failure');
  if (count('nowPassing')) {
    const n = count('nowPassing');
    notes.push(`${n} known issue${n === 1 ? '' : 's'} now passing`);
  }
  note(runErrors, 'run error');
  note(count('flaky'), 'flaky test');
  note(count('knownIssue'), 'known issue');
  const detail = notes.length ? ` (${notes.join(', ')})` : '';
  switch (result.status) {
    case 'passed':
      return `✅ Passed${detail}`;
    case 'interrupted':
      return `⏹️ Interrupted${detail}`;
    case 'timedout':
      return `⏱️ Timed out (global timeout)${detail}`;
    default:
      return `❌ Failed${detail}`;
  }
}

// ------------------------------------------------------------- formatting

const ANSI = /\u001b\[[0-9;]*[A-Za-z]/g;
const clean = (text: string) => text.replace(ANSI, '');

function errorText(error?: TestError): string {
  const message = clean(error?.message ?? error?.value ?? '').trimEnd();
  const snippet = clean(error?.snippet ?? '').trimEnd();
  return [message, snippet].filter(Boolean).join('\n\n');
}

function resultErrorText(result?: TestResult): string {
  if (!result) return 'No result';
  const error = result.errors[0] ?? result.error;
  return error ? errorText(error) : `Test ended with status "${result.status}"`;
}

function firstLine(text: string): string {
  const line =
    text
      .split('\n')
      .map((l) => l.trim())
      .find(Boolean) ?? '';
  return (line.length > 200 ? `${line.slice(0, 199)}…` : line).replace(
    /`/g,
    "'"
  );
}

function codeBlock(text: string): string {
  const lines = text.split('\n');
  const shown =
    lines.length > MAX_ERROR_LINES
      ? [
          ...lines.slice(0, MAX_ERROR_LINES),
          `… ${lines.length - MAX_ERROR_LINES} more lines`,
        ]
      : lines;
  const fence = text.includes('```') ? '````' : '```';
  return `${fence}text\n${shown.join('\n')}\n${fence}`;
}

/** Text safe inside a table cell. */
const cell = (text: string) =>
  text
    .replace(/\|/g, '\\|')
    .replace(/\s*\n\s*/g, ' ')
    .trim();

const escapeMd = (text: string) => text.replace(/([\\`*_[\]<>])/g, '\\$1');

function formatDate(date: Date): string {
  const text = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Manila',
  }).format(date);
  return `${text} (PHT)`;
}

function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${(ms / 1000).toFixed(1)} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ${seconds % 60} s`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

function git(args: string): string | undefined {
  try {
    return (
      execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim() || undefined
    );
  } catch {
    return undefined; // not a git checkout (e.g. Docker without .git access)
  }
}

function gitInfo(): string | undefined {
  const branch =
    process.env.GITHUB_HEAD_REF ||
    process.env.GITHUB_REF_NAME ||
    git('rev-parse --abbrev-ref HEAD');
  const sha = (process.env.GITHUB_SHA || git('rev-parse HEAD'))?.slice(0, 8);
  if (!branch && !sha) return undefined;
  return [branch, sha && `\`${sha}\``].filter(Boolean).join(' @ ');
}

export default MarkdownReporter;
