"use client";

import { signIn } from "next-auth/react";

export function LoginButton() {
  return (
    <button className="pill primary" onClick={() => signIn("google")}>
      Logga in med Google
    </button>
  );
}
