import { Button } from "../components";

export function ButtonDemo() {
  return (
    <div>
      <Button type="button" onClick={() => alert("Pressed")}>
        Press me
      </Button>
    </div>
  );
}
