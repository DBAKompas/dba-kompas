import { LinkedInInsightTag } from '@/components/analytics/LinkedInInsightTag'
import { ScrollToTopOnMount } from '@/components/marketing/shared/ScrollToTopOnMount'
import { MarketingModalsRoot } from '@/components/marketing/MarketingModalsRoot'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LinkedInInsightTag />
      <ScrollToTopOnMount />
      <MarketingModalsRoot>{children}</MarketingModalsRoot>
    </>
  )
}
