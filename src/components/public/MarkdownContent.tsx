"use client";

import ReactMarkdown from "react-markdown";

export default function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h2 className="mb-4 mt-10 font-display text-2xl font-bold text-white first:mt-0">
            {children}
          </h2>
        ),
        h2: ({ children }) => (
          <h2 className="mb-4 mt-10 font-display text-2xl font-bold text-white first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-3 mt-8 font-display text-xl font-semibold text-white first:mt-0">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="mb-2 mt-6 font-display text-lg font-semibold text-white first:mt-0">
            {children}
          </h4>
        ),
        p: ({ children }) => (
          <p className="mb-5 leading-relaxed text-(--arvesta-text-secondary)">
            {children}
          </p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-white">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-(--arvesta-text-secondary)">{children}</em>
        ),
        ul: ({ children }) => (
          <ul className="mb-5 ml-5 list-disc space-y-2 text-(--arvesta-text-secondary)">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-5 ml-5 list-decimal space-y-2 text-(--arvesta-text-secondary)">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="my-6 border-l-2 border-(--arvesta-gold)/40 pl-5 italic text-(--arvesta-text-muted)">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-8 border-t border-(--arvesta-gold)/15" />,
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-(--arvesta-gold) underline underline-offset-2 transition-colors hover:text-(--arvesta-accent)"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
