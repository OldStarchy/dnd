import { createRootRoute } from "@tanstack/react-router";
import MainLayout from "../components/layout/MainLayout";

export const Route = createRootRoute({
  component: MainLayout,
});
