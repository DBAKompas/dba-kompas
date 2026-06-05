import { LinkedInInsightTag } from '@/components/analytics/LinkedInInsightTag'
import { ScrollToTopOnMount } from '@/components/marketing/shared/ScrollToTopOnMount'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LinkedInInsightTag />
      <ScrollToTopOnMount />
      {children}
    </>
  )
}
