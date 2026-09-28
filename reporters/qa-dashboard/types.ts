import type { FullResult } from '@playwright/test/reporter';

export type DashboardStatus = 'pass' | 'fail' | 'skip' | 'flaky';

export type AttachmentKind = 'image' | 'video' | 'trace' | 'text' | 'file';

export interface DashboardAttachment {
    name: string;
    contentType: string;
    kind: AttachmentKind;
    /** Path relative to the dashboard folder */
    href: string;
    /** Inlined content for text attachments, empty otherwise */
    text: string;
}

export interface DashboardStep {
    title: string;
    category: string;
    duration: number;
    depth: number;
    error: string;
}

export interface DashboardTest {
    id: string;
    title: string;
    describePath: string;
    group: string;
    file: string;
    line: number;
    project: string;
    tags: string[];
    annotations: string[];
    status: DashboardStatus;
    duration: number;
    retry: number;
    errors: string[];
    steps: DashboardStep[];
    stdout: string;
    stderr: string;
    attachments: DashboardAttachment[];
}

export interface DashboardSummary {
    total: number;
    pass: number;
    fail: number;
    skip: number;
    flaky: number;
    successRate: number;
}

export interface DashboardMeta {
    title: string;
    startTime: Date;
    duration: number;
    overallStatus: FullResult['status'];
    environment: string;
    playwrightVersion: string;
    workers: number;
    /** Relative link to the native HTML report, empty if not configured */
    nativeReportHref: string;
    /** Dashboard folder relative to the project root (POSIX separators) */
    reportDir: string;
    hasTraceViewer: boolean;
}

export interface DashboardData {
    meta: DashboardMeta;
    summary: DashboardSummary;
    tests: DashboardTest[];
}
