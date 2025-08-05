"use client";

type Props = {
  html: string;
};

export default function SafeHtml({ html }: Props) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
