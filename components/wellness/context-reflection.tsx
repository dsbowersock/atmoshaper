"use client"

import { CONTEXT_PROMPTS } from "@/lib/wellness-reflection"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

/** Mounted native fields retain an unfinished reflection across category/tool
 * navigation. The payload adapter admits only the active category's values. */
export function ContextReflection({ category, disabled }: { category: string; disabled: boolean }) {
  const field = (name: string, label: string, hint: string) => <div className="min-w-0 space-y-2"><Label htmlFor={`reflection-${name}`}>{label}</Label><Textarea id={`reflection-${name}`} name={`reflection-${name}`} maxLength={400} placeholder={hint} /></div>
  const prompts = (group: "work" | "home" | "care") => <div className="flex min-w-0 flex-wrap gap-2">{CONTEXT_PROMPTS[group].map((prompt) => <label key={prompt} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm"><input type="checkbox" name={`${group}Prompts`} value={`${group}: ${prompt.toLowerCase()}`} />{prompt}</label>)}</div>
  return <fieldset disabled={disabled} className="grid min-w-0 gap-4" data-context-reflection>
    <div hidden={category !== "work_context"} className="space-y-4"><h3 className="font-semibold">Notice your work situation</h3><p className="text-sm text-muted-foreground">Choose a prompt or use your own words. You can record what feels comfortable, different or less comfortable, without deciding what caused it.</p>{prompts("work")}</div>
    <div hidden={category !== "home_care"} className="space-y-4"><h3 className="font-semibold">Home routines and surroundings</h3><p className="text-sm text-muted-foreground">Think about a favorite chair, floor time with family, an older desk chair or a kitchen counter. What do you notice while you use that space?</p>{prompts("home")}</div>
    <details><summary className="min-h-11 cursor-pointer content-center font-medium">Describe the situation (optional)</summary><div className="mt-3 grid gap-4">
    {field("activity", "What were you doing?", "The task, movement or routine you want to remember.")}
    {field("posture", "How were you positioned?", "Sitting, leaning, reaching, lying on the floor, or holding a position.")}
    {field("repetition", "How often or for how long?", "Repeated throughout a shift, after 20 minutes, or occasionally.")}
    {field("surroundings", "What about the setup stood out?", "Chair support, screen height, tools, counter height or where you place things.")}
    {field("noticed", "What did you notice, and when?", "Describe what felt different. Did changing position or taking a break make a difference?")}
    </div></details>
    <details hidden={category !== "home_care"} data-self-care><summary className="min-h-11 cursor-pointer content-center font-medium">Care you give yourself at home (optional)</summary><div className="mt-3 grid gap-4"><p className="text-sm text-muted-foreground">Record something you chose to do for yourself and how it felt afterward.</p>{prompts("care")}<div className="space-y-2"><Label htmlFor="reflection-careAction">What did you do for yourself?</Label><Input id="reflection-careAction" name="reflection-careAction" maxLength={400} placeholder="A walk, rest, movement, self-massage or another routine" /></div>{field("careEffect", "How did it feel afterward?", "Better, unchanged, less comfortable, or anything else you noticed.")}</div></details>
  </fieldset>
}
