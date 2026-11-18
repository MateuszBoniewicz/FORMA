import { redirect } from 'next/navigation'

export const instant = false

export default async function TrainingEvaluationAlias({
  params,
}: PageProps<'/trainings/[trainingId]/evaluate'>) {
  const { trainingId } = await params
  redirect(`/trener/${trainingId}`)
}