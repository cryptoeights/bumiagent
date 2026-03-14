import ReactMarkdown from 'react-markdown';

export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none
      prose-headings:font-[var(--font-display)] prose-headings:text-zinc-200 prose-headings:mt-3 prose-headings:mb-1.5
      prose-h3:text-sm prose-h4:text-xs
      prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:my-1.5
      prose-strong:text-zinc-100
      prose-code:text-[var(--celo-green)] prose-code:bg-zinc-800/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-[''] prose-code:after:content-['']
      prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800/50 prose-pre:rounded-lg prose-pre:my-2
      prose-li:text-zinc-300 prose-li:my-0.5
      prose-ul:my-1.5 prose-ol:my-1.5
      prose-hr:border-zinc-800/50 prose-hr:my-3
      prose-a:text-[var(--celo-green)] prose-a:no-underline hover:prose-a:underline
      prose-blockquote:border-[var(--celo-green)]/30 prose-blockquote:text-zinc-400
    ">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
