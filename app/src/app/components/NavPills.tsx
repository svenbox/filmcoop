"use client";

import { useSession } from "next-auth/react";

/** Länkar till projektlistan och (för admin) adminsidan, för topbarens pill-bar. */
export function NavPills() {
  const { data: session } = useSession();

  return (
    <>
      <a href="/projekt" className="pill">
        Projekt
      </a>
      {session?.user?.isAdmin && (
        <a href="/admin" className="pill">
          Admin
        </a>
      )}
    </>
  );
}
