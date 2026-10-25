import { useState } from "react"
import { createRoot } from "react-dom/client"
import { FlashcardSurface } from "@/app/education/flashcards/flashcard-runner"
import type { FlashcardPrompt } from "@/lib/anatomy-study"

// Invented credits exercise the actual component without media, accounts, or persistence.
const prompt: FlashcardPrompt = {
  id: "invented-prompt", type: "muscle_action", typeLabel: "Action", cardId: "invented-card",
  entityType: "muscle", entitySlug: "invented-muscle", name: "Invented muscle", aliases: [],
  category: "muscle", categoryLabel: "Muscle", regions: [], regionLabels: [], difficulty: "easy",
  front: { mode: "text", title: "Invented prompt", instruction: "Recall the action" },
  answerFields: [{ id: "action", label: "Action", answer: "Invented answer", acceptedAnswers: [] }],
  answerSummary: "Invented answer", citations: [],
  sources: [{ id: "invented-source", label: "Invented reference", usageScope: "open_reuse", license: "Invented license", attribution: "Invented full credit text." }],
}

function Surface({ review }: { review: boolean }) {
  const [flipped, setFlipped] = useState(true), [count, setCount] = useState(0)
  return <section data-testid={review ? "review" : "typed"}>
    <output aria-label="Flip count">{count}</output>
    <FlashcardSurface prompt={prompt} isFlipped={flipped} isReviewMode={review} result={null}
      onFlip={() => { setFlipped(value => !value); setCount(value => value + 1) }} />
  </section>
}
createRoot(document.getElementById("root")!).render(<><Surface review /><Surface review={false} /></>)
