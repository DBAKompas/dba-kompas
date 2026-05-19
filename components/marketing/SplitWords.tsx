"use client";

export function SplitWords({
  text,
  dataAttr,
  className,
}: {
  text: string;
  dataAttr: string;
  className?: string;
}) {
  const tokens = text.split(/(\s+)/);
  return (
    <>
      {tokens.map((tok, i) =>
        /\s+/.test(tok) ? (
          tok
        ) : (
          <span
            key={i}
            className={`inline-block ${className ?? ""}`}
            {...{ [dataAttr]: "" }}
          >
            {tok}
          </span>
        ),
      )}
    </>
  );
}
