import type {
    FullConfig,
    FullResult,
    Reporter,
    Suite,
    TestCase,
    TestResult,
    TestStep,
} from '@playwright/test/reporter';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ReportPaths } from '../../enums/util/reporting';
import { buildDashboardHtml } from './template';
import type {
    AttachmentKind,
    DashboardAttachment,
    DashboardStatus,
    DashboardStep,
    DashboardSummary,
    DashboardTest,
} from './types';

/** Options accepted by the reporter in playwright.config.ts */
export interface QaDashboardOptions {
    outputFolder?: string;
    title?: string;
    /** Environment name shown in the header (ENVIRONMENT in playwright.config.ts) */
    environment?: string;
}

type Attachment = TestResult['attachments'][number];

const OUTCOME_TO_STATUS: Record<
    ReturnType<TestCase['outcome']>,
    DashboardStatus
> = {
    expected: 'pass',
    unexpected: 'fail',
    flaky: 'flaky',
    skipped: 'skip',
};

const HIDDEN_STEP_CATEGORIES = new Set(['fixture', 'test.attach']);
const TEXT_CONTENT_TYPES = ['text/', 'application/json'];
const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
    'application/json': '.json',
    'application/zip': '.zip',
    'image/jpeg': '.jpeg',
    'image/png': '.png',
    'text/html': '.html',
    'text/markdown': '.md',
    'text/plain': '.txt',
    'video/webm': '.webm',
};
const ANSI_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

function stripAnsi(value: string): string {
    return value.replace(ANSI_PATTERN, '');
}

function toPosix(value: string): string {
    return value.split(path.sep).join('/');
}

function sanitizeFileName(value: string): string {
    return value.replace(/[^\w.-]+/g, '_');
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isTextContent(contentType: string): boolean {
    return TEXT_CONTENT_TYPES.some((prefix) => contentType.startsWith(prefix));
}

function getAttachmentKind(attachment: Attachment): AttachmentKind {
    if (attachment.name === 'trace') return 'trace';
    if (attachment.contentType.startsWith('image/')) return 'image';
    if (attachment.contentType.startsWith('video/')) return 'video';
    if (isTextContent(attachment.contentType)) return 'text';
    return 'file';
}

function stdioToText(chunks: Array<string | Buffer>): string {
    return stripAnsi(chunks.map((chunk) => chunk.toString()).join('')).trim();
}

function flattenSteps(steps: TestStep[], depth: number): DashboardStep[] {
    return steps.flatMap((step) => {
        if (HIDDEN_STEP_CATEGORIES.has(step.category)) return [];

        const children = flattenSteps(step.steps, depth + 1);
        if (step.category === 'hook' && children.length === 0 && !step.error) {
            return [];
        }

        return [
            {
                title: step.title,
                category: step.category,
                duration: step.duration,
                depth,
                error: stripAnsi(step.error?.message ?? ''),
            },
            ...children,
        ];
    });
}

function formatError(error: TestResult['errors'][number]): string {
    const location = error.location
        ? `at ${error.location.file}:${error.location.line}:${error.location.column}`
        : '';

    return stripAnsi(
        [error.message ?? error.value ?? '', error.snippet ?? '', location]
            .filter(Boolean)
            .join('\n\n')
    );
}

function buildSummary(tests: DashboardTest[]): DashboardSummary {
    const count = (status: DashboardStatus): number =>
        tests.filter((test) => test.status === status).length;

    const summary = {
        total: tests.length,
        pass: count('pass'),
        fail: count('fail'),
        skip: count('skip'),
        flaky: count('flaky'),
    };
    const executed = summary.total - summary.skip;
    const successful = summary.pass + summary.flaky;

    return {
        ...summary,
        successRate: executed ? Math.round((successful / executed) * 100) : 0,
    };
}

/**
 * Custom Playwright reporter that writes a self-contained QA dashboard
 * (index.html + copied evidences + bundled Trace Viewer) after each run.
 */
export default class QaDashboardReporter implements Reporter {
    private readonly outputFolder: string;
    private readonly title: string;
    private readonly environment: string;
    private readonly attachmentsByTest = new Map<
        string,
        DashboardAttachment[]
    >();
    /** Folder of playwright.config.ts (config.rootDir points to testDir) */
    private projectDir = process.cwd();
    private outputDir = '';
    private dataDir = '';
    private config: FullConfig | undefined;
    private rootSuite: Suite | undefined;

    constructor(options: QaDashboardOptions = {}) {
        this.outputFolder = options.outputFolder ?? ReportPaths.QA_DASHBOARD;
        this.title = options.title ?? 'QA Dashboard';
        this.environment = options.environment ?? '-';
    }

    onBegin(config: FullConfig, suite: Suite): void {
        this.config = config;
        this.rootSuite = suite;
        this.projectDir = config.configFile
            ? path.dirname(config.configFile)
            : process.cwd();
        this.outputDir = path.resolve(this.projectDir, this.outputFolder);
        this.dataDir = path.join(this.outputDir, 'data');

        // The folder is wiped on every run: never allow the project root or a parent
        const relativeToRoot = path.relative(this.outputDir, this.projectDir);
        if (!relativeToRoot.startsWith('..')) {
            throw new Error(
                `QA Dashboard: outputFolder "${this.outputFolder}" cannot be the project folder or one of its parents.`
            );
        }

        fs.rmSync(this.outputDir, { recursive: true, force: true });
        fs.mkdirSync(this.dataDir, { recursive: true });
    }

    onTestEnd(test: TestCase, result: TestResult): void {
        // Overwritten on every retry: only the evidences of the last attempt are kept
        this.attachmentsByTest.set(test.id, this.copyAttachments(test, result));
    }

    onEnd(result: FullResult): void {
        if (!this.config || !this.rootSuite) return;

        const tests = this.rootSuite
            .allTests()
            .map((test) => this.buildTest(test));
        const hasTraces = tests.some((test) =>
            test.attachments.some((attachment) => attachment.kind === 'trace')
        );

        const html = buildDashboardHtml({
            meta: {
                title: this.title,
                startTime: result.startTime,
                duration: result.duration,
                overallStatus: result.status,
                environment: this.environment,
                playwrightVersion: this.config.version,
                workers: this.config.workers,
                nativeReportHref: this.getNativeReportHref(this.config),
                reportDir: toPosix(
                    path.relative(this.projectDir, this.outputDir)
                ),
                hasTraceViewer: hasTraces && this.copyTraceViewer(),
            },
            summary: buildSummary(tests),
            tests,
        });

        const indexFile = path.join(this.outputDir, 'index.html');
        fs.writeFileSync(indexFile, html, 'utf8');
        process.stdout.write(
            `\n  QA Dashboard generado en ${path.relative(process.cwd(), indexFile)} (npm run report:dashboard para abrirlo)\n`
        );
    }

    printsToStdio(): boolean {
        return false;
    }

    private buildTest(test: TestCase): DashboardTest {
        const result = test.results.at(-1);
        const project = test.parent.project();
        const testDir = project?.testDir ?? this.projectDir;

        return {
            id: test.id,
            title: test.title,
            describePath: test.titlePath().slice(3, -1).join(' › '),
            group: toPosix(path.relative(testDir, test.location.file)).replace(
                /(\.(spec|test))?\.[cm]?[jt]sx?$/,
                ''
            ),
            file: toPosix(path.relative(this.projectDir, test.location.file)),
            line: test.location.line,
            project: project?.name || '-',
            tags: test.tags,
            annotations: test.annotations.map((annotation) =>
                annotation.description
                    ? `${annotation.type}: ${annotation.description}`
                    : annotation.type
            ),
            status: OUTCOME_TO_STATUS[test.outcome()],
            duration: result?.duration ?? 0,
            retry: result?.retry ?? 0,
            errors: (result?.errors ?? []).map(formatError),
            steps: flattenSteps(result?.steps ?? [], 0),
            stdout: stdioToText(result?.stdout ?? []),
            stderr: stdioToText(result?.stderr ?? []),
            attachments: this.attachmentsByTest.get(test.id) ?? [],
        };
    }

    private copyAttachments(
        test: TestCase,
        result: TestResult
    ): DashboardAttachment[] {
        const testDataDir = path.join(this.dataDir, sanitizeFileName(test.id));
        fs.rmSync(testDataDir, { recursive: true, force: true });
        fs.mkdirSync(testDataDir, { recursive: true });

        return result.attachments.flatMap((attachment, index) => {
            const baseName = attachment.path
                ? path.basename(attachment.path)
                : path.extname(attachment.name)
                  ? attachment.name
                  : `${attachment.name}${EXTENSION_BY_CONTENT_TYPE[attachment.contentType] ?? ''}`;
            const target = path.join(
                testDataDir,
                `${index}-${sanitizeFileName(baseName)}`
            );

            if (attachment.path && fs.existsSync(attachment.path)) {
                fs.copyFileSync(attachment.path, target);
            } else if (attachment.body) {
                fs.writeFileSync(target, attachment.body);
            } else {
                return [];
            }

            const kind = getAttachmentKind(attachment);
            return [
                {
                    name: attachment.name,
                    contentType: attachment.contentType,
                    kind,
                    href: toPosix(path.relative(this.outputDir, target)),
                    text:
                        kind === 'text'
                            ? stripAnsi(fs.readFileSync(target, 'utf8'))
                            : '',
                },
            ];
        });
    }

    private getNativeReportHref(config: FullConfig): string {
        const htmlReporter = config.reporter.find(([name]) => name === 'html');
        if (!htmlReporter) return '';

        const options: unknown = (htmlReporter as readonly unknown[])[1];
        const folder =
            isRecord(options) && typeof options.outputFolder === 'string'
                ? options.outputFolder
                : (process.env.PLAYWRIGHT_HTML_OUTPUT_DIR ??
                  ReportPaths.PLAYWRIGHT_HTML);

        return toPosix(
            path.relative(
                this.outputDir,
                path.resolve(this.projectDir, folder, 'index.html')
            )
        );
    }

    /**
     * Copies the Trace Viewer bundled with playwright-core (the same one the
     * native HTML report ships) so traces open offline from the dashboard.
     *
     * @returns {boolean} True when the viewer is available in the dashboard.
     */
    private copyTraceViewer(): boolean {
        try {
            const source = path.join(
                path.dirname(require.resolve('playwright-core')),
                'lib',
                'vite',
                'traceViewer'
            );
            const target = path.join(this.outputDir, 'trace');

            fs.cpSync(source, target, {
                recursive: true,
                filter: (file) => !file.endsWith('.map'),
            });
            return fs.existsSync(path.join(target, 'index.html'));
        } catch {
            return false;
        }
    }
}
