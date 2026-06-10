"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * If Supabase ever redirects auth tokens to a page other than /auth/callback
 * (e.g. the Site URL root), forward them to the callback so login completes.
 */
export function AuthHashCatcher() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/auth/callback") || pathname.startsWith("/update-password")) return;
    const hash = window.location.hash;
    const search = window.location.search;
    const hashParams = new URLSearchParams(hash.slice(1));
    const type = hashParams.get("type");
    const hasToken =
      hash.includes("access_token=") ||
      hash.includes("error_description=") ||
      /[?&]code=/.test(search);
    if (hasToken) {
      const target = type === "recovery" ? "/update-password" : "/auth/callback";
      router.replace(`${target}${search}${hash}`);
    }
  }, [pathname, router]);

  return null;
}
