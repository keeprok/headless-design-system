import { ButtonDemo } from "./demo/ButtonDemo";

export function App() {
  return (
    <main style={{ padding: "24px", fontFamily: "system-ui, sans-serif" }}>
      <h1>Headless Design System</h1>
      <p>Demo pages for headless components.</p>
      <section aria-label="Button demo">
        <ButtonDemo />
      </section>
    </main>
  );
}
