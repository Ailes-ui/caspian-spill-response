import { createFileRoute } from "@tanstack/react-router";
import { Radar, BrainCircuit, Send, MapPinned } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "О платформе — OilWatch AI" },
      { name: "description", content: "Как работает OilWatch AI: обнаружение, анализ, диспетчеризация, отслеживание. Кто платит." },
      { property: "og:title", content: "О платформе — OilWatch AI" },
      { property: "og:description", content: "Обнаружение → Анализ → Диспетчеризация → Отслеживание." },
    ],
  }),
  component: About,
});

const STEPS = [
  { icon: Radar, t: "Обнаружение", d: "Спутники и дроны клиента фиксируют пятно." },
  { icon: BrainCircuit, t: "Анализ", d: "Оценка площади, объёма и приоритета." },
  { icon: Send, t: "Диспетчеризация", d: "Выбор ближайшего подходящего средства." },
  { icon: MapPinned, t: "Отслеживание", d: "Статусы, журнал и отчёт по операции." },
];

function About() {
  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-xl font-bold">О платформе OilWatch AI</h1>
      <p className="text-muted-foreground">Программная платформа, которая координирует уже существующие средства реагирования клиента (суда, роботы-скиммеры, дроны). Мы не продаём роботов.</p>
      <ol className="grid gap-3 sm:grid-cols-4">
        {STEPS.map(({ icon: Icon, t, d }, n) => (
          <li key={t} className="rounded-lg border bg-card p-4">
            <Icon className="mb-2 h-6 w-6 text-primary" />
            <div className="font-semibold">{n + 1}. {t}</div>
            <p className="text-sm text-muted-foreground">{d}</p>
          </li>
        ))}
      </ol>
      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-2 font-semibold">Кто платит</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Нефтегазовые операторы на Каспии</li>
          <li>Региональные власти (Атырауская и Мангистауская области)</li>
          <li>Подрядчики по ликвидации разливов</li>
        </ul>
      </section>
    </div>
  );
}
