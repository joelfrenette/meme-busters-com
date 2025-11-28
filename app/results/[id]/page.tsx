import { ResultsView } from "@/components/results-view"

export default function ResultsPage({ params }: { params: { id: string } }) {
  return <ResultsView resultId={params.id} />
}
