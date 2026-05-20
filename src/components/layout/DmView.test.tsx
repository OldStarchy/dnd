import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import DmView from "./DmView";

test("renders name", async () => {
  const { getByText } = await render(
    <DmView
      creatures={[
        {
          id: "1",
          name: "Jarrad",
          description: "A brave adventurer.",
        },
      ]}
    />,
  );
  await expect.element(getByText("Hello Jarrad!")).toBeInTheDocument();
});
