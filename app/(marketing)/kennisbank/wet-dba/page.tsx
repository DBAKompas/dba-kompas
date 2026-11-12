import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { KennisbankPage } from "@/components/marketing/kennisbank/KennisbankPage";
import { findKennisbankPage } from "@/content/kennisbank";

const SLUG = "wet-dba";
const page = findKennisbankPage(SLUG)!;

export const metadata: Metadata = pageMeta({
  title: `${page.title} — Kennisbank`,
  description: page.shortDescription,
  path: "/kennisbank/wet-dba",
});

export default function ArticlePage() {
  return <KennisbankPage page={page} />;
}
