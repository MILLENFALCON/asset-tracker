export { auth as middleware } from "@/auth";
export const config = {
  matcher: ["/((?!api/auth|login|register|_next|favicon.ico).*)"],
};
