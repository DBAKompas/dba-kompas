import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { KennisbankPage } from "@/components/marketing/kennisbank/KennisbankPage";
import { findKennisbankPage } from "@/content/kennisbank";

const SLUG = "schijnzelfstandigheid";
const page = findKennisbankPage(SLUG)!;

export const metadata: Metadata = pageMeta({
  title: `${page.title} — Kennisbank`,
  description: page.shortDescription,
  path: "/kennisbank/schijnzelfstandigheid",
});

export default function ArticlePage() {
  return <KennisbankPage page={page} />;
}
