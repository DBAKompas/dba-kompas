import { LinkedInInsightTag } from '@/components/analytics/LinkedInInsightTag'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LinkedInInsightTag />
      {children}
    </>
  )
}
