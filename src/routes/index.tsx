import { createFileRoute } from "@tanstack/react-router";

interface Search {
  mode?: "gm" | "player";
}
export const Route = createFileRoute("/")({
  component: Page,
  validateSearch(search: Search) {
    if (["gm", "player"].includes(search.mode ?? "")) {
      return { mode: search.mode } as Search;
    }
    return { mode: undefined };
  },
});

function Page() {
  const query = Route.useSearch();
  const mode = query.mode;

  return <>{mode ?? "No mode specified"}</>;
}

export default Page;
