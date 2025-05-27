import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function DebugSupabasePage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: user, error } = await supabase.auth.getUser();

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">🔍 Supabase User Debug</h1>
      {error ? (
        <pre className="text-red-600">Error: {JSON.stringify(error, null, 2)}</pre>
      ) : (
        <pre className="text-green-700">{JSON.stringify(user, null, 2)}</pre>
      )}
    </div>
  );
}
