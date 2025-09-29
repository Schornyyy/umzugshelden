import { redirect } from "next/navigation";

export const dynamic = "force-dynamic"; // ensure fresh redirect logic if needed

// Root /blog should immediately forward to the first/main default category overview.
// We choose "unternehmen" as default (adjust if business rules change).
export default function BlogRootRedirect() {
  redirect("/blog/ratgeber");
}
