// Kiểm tra cú pháp các khối Mermaid. Chạy trong tiến trình riêng (window giả của jsdom
// không lọt vào server). Vào: JSON [{ id, code }] qua stdin. Ra: JSON [{ id, error }] (chỉ khối lỗi).
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const { default: mermaid } = await import('mermaid');
mermaid.initialize({ startOnLoad: false, suppressErrorRendering: true });

let input = '';
for await (const chunk of process.stdin) input += chunk;
const blocks = JSON.parse(input);
const errors = [];
for (const b of blocks) {
  try {
    await mermaid.parse(b.code);
  } catch (e) {
    errors.push({ id: b.id, error: String(e?.message ?? e).split('\n').slice(0, 3).join(' ').slice(0, 300) });
  }
}
process.stdout.write(JSON.stringify(errors));
