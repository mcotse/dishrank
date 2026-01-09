import { Layout } from '../components/layout'
import { ComparisonView } from '../components/comparison'

export function ComparePage() {
  return (
    <Layout title="Compare Dishes" showNav={false}>
      <ComparisonView />
    </Layout>
  )
}
