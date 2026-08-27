import { createFileRoute } from "@tanstack/react-router";
import { LibraryApp } from "@/components/library/library-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <LibraryApp />;
}
