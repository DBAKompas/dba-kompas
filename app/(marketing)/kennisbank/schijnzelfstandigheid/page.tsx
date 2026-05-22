import type { Metadata } from "next";
import { KennisbankPage } from "@/components/marketing/kennisbank/KennisbankPage";
import { findKennisbankPage } from "@/content/kennisbank";

const SLUG = "schijnzelfstandigheid";
const page = findKennisbankPage(SLUG)!;

export const metadata: Metadata = {
  title: `${page.title} | Kennisbank | DBA Kompas`,
  description: page.answerBlock.slice(0, 160),
};

export default function ArticlePage() {
  return <KennisbankPage page={page} />;
}
