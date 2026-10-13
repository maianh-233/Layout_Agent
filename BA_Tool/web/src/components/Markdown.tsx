// Hiển thị markdown SRS: bảng (GFM), sơ đồ Mermaid, tô nổi bật [CẦN XÁC NHẬN] và [ĐỀ XUẤT].
import { useEffect, useId, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'neutral',
  fontFamily: 'Be Vietnam Pro, sans-serif',
  // Không để mermaid tự chèn hình báo lỗi vào cuối trang; component tự hiển thị lỗi
  suppressErrorRendering: true,
});

function Mermaid({ code }: { code: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    mermaid
      .render(`m${id}`, code)
      .then((r) => alive && (setSvg(r.svg), setError('')))
      .catch((e: unknown) => {
        document.getElementById(`dm${id}`)?.remove(); // phần tử tạm mermaid để lại khi lỗi
        if (alive) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      alive = false;
    };
  }, [code, id]);
  if (error)
    return (
      <div className="my-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
        <p className="font-semibold text-amber-900">Sơ đồ Mermaid lỗi cú pháp — hiển thị mã gốc:</p>
        <pre className="mt-2 !bg-white !text-stone-700">{code}</pre>
      </div>
    );
  return <div className="my-4 overflow-x-auto rounded-lg border border-line bg-white p-4" dangerouslySetInnerHTML={{ __html: svg }} />;
}

// ---- Plugin rehype nhỏ: tách text node chứa nhãn thành <span class="tag-…"> ----
type HastNode = { type: string; value?: string; tagName?: string; properties?: Record<string, unknown>; children?: HastNode[] };
const TAG_RE = /(\[CẦN XÁC NHẬN\]|\[ĐỀ XUẤT\])/;

function splitTags(node: HastNode) {
  if (!node.children || node.tagName === 'code' || node.tagName === 'pre') return;
  const out: HastNode[] = [];
  for (const child of node.children) {
    if (child.type === 'text' && child.value && TAG_RE.test(child.value)) {
      for (const part of child.value.split(TAG_RE)) {
        if (!part) continue;
        if (part === '[CẦN XÁC NHẬN]' || part === '[ĐỀ XUẤT]') {
          out.push({
            type: 'element',
            tagName: 'span',
            properties: { className: [part === '[ĐỀ XUẤT]' ? 'tag-propose' : 'tag-confirm'] },
            children: [{ type: 'text', value: part }],
          });
        } else out.push({ type: 'text', value: part });
      }
    } else {
      splitTags(child);
      out.push(child);
    }
  }
  node.children = out;
}
const rehypeTags = () => (tree: HastNode) => splitTags(tree);

const components: Components = {
  code({ className, children }) {
    const lang = /language-(\w+)/.exec(className || '')?.[1];
    const text = String(children).replace(/\n$/, '');
    if (lang === 'mermaid') return <Mermaid code={text} />;
    return <code className={className}>{children}</code>;
  },
  pre({ children, node }) {
    // Khối mermaid đã được render thành <div>, không bọc trong <pre>
    const first = node?.children?.[0] as { tagName?: string; properties?: { className?: string[] } } | undefined;
    if (first?.tagName === 'code' && first.properties?.className?.includes('language-mermaid')) return <>{children}</>;
    return <pre>{children}</pre>;
  },
  table({ children }) {
    return (
      <div className="table-wrap">
        <table>{children}</table>
      </div>
    );
  },
};

export function Markdown({ source }: { source: string }) {
  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeTags]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
