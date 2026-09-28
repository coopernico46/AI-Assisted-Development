/**
 * Serves the QA dashboard (and the native Playwright HTML report linked from
 * it) over HTTP so the bundled Trace Viewer can load traces.
 *
 * Only the report folders are exposed; the rest of the project (env files,
 * storage states...) is never served. Bound to 127.0.0.1.
 *
 * Usage: npm run report:dashboard   (QA_DASHBOARD_PORT=9400 to change the port)
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const rootDir = process.cwd();
const host = '127.0.0.1';
const port = Number.parseInt(process.env.QA_DASHBOARD_PORT ?? '9325', 10);
const servedFolders = ['qa-dashboard-report', 'playwright-report'].map(
    (folder) => path.resolve(rootDir, folder)
);
const entryPoint = '/qa-dashboard-report/index.html';

const mimeTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ttf': 'font/ttf',
    '.txt': 'text/plain; charset=utf-8',
    '.webm': 'video/webm',
    '.webmanifest': 'application/manifest+json',
    '.zip': 'application/zip',
};

if (!fs.existsSync(path.resolve(rootDir, entryPoint.slice(1)))) {
    console.error(
        'No existe qa-dashboard-report/index.html. Ejecuta antes los tests (npm test).'
    );
    process.exit(1);
}

function resolveSafePath(pathname) {
    const absolutePath = path.resolve(rootDir, `.${pathname}`);
    const isServed = servedFolders.some(
        (folder) =>
            absolutePath === folder ||
            absolutePath.startsWith(`${folder}${path.sep}`)
    );
    if (!isServed) return null;

    if (
        fs.existsSync(absolutePath) &&
        fs.statSync(absolutePath).isDirectory()
    ) {
        return path.join(absolutePath, 'index.html');
    }
    return absolutePath;
}

function sendFile(request, response, filePath) {
    const { size } = fs.statSync(filePath);
    const headers = {
        'Content-Type':
            mimeTypes[path.extname(filePath).toLowerCase()] ??
            'application/octet-stream',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-store',
    };

    // Range support lets the <video> element seek inside the recordings
    const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range ?? '');
    if (range) {
        const start = range[1] ? Number(range[1]) : 0;
        const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
        if (start > end || start >= size) {
            response.writeHead(416, { 'Content-Range': `bytes */${size}` });
            response.end();
            return;
        }
        response.writeHead(206, {
            ...headers,
            'Content-Range': `bytes ${start}-${end}/${size}`,
            'Content-Length': end - start + 1,
        });
        fs.createReadStream(filePath, { start, end }).pipe(response);
        return;
    }

    response.writeHead(200, { ...headers, 'Content-Length': size });
    fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer((request, response) => {
    let pathname;
    try {
        pathname = decodeURIComponent(
            new URL(request.url ?? '/', `http://${host}`).pathname
        );
    } catch {
        response.writeHead(400).end('Peticion no valida.');
        return;
    }

    if (pathname === '/') {
        response.writeHead(302, { Location: entryPoint }).end();
        return;
    }

    const filePath = resolveSafePath(pathname);
    if (
        !filePath ||
        !fs.existsSync(filePath) ||
        !fs.statSync(filePath).isFile()
    ) {
        response
            .writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
            .end('No se ha encontrado el recurso solicitado.');
        return;
    }

    sendFile(request, response, filePath);
});

server.listen(port, host, () => {
    console.log(
        `QA Dashboard disponible en http://${host}:${port}${entryPoint} (Ctrl+C para salir)`
    );
});
