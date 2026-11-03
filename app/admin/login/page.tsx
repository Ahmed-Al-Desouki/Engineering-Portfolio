import Link from "next/link";
import { signIn } from "@/app/admin/actions";

export const instant = false;

const errorMessages: Record<string, string> = {
  missing: "Enter your email and password.",
  credentials: "The email or password is incorrect.",
  unauthorized: "This account is not on the VALEX admin list.",
};

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08111c] px-5 py-12 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101b28] p-7 shadow-2xl sm:p-9">
        <Link href="/" className="text-xs font-semibold uppercase tracking-[.22em] text-[#f5a623]">← VALEX AUTOMATION</Link>
        <h1 className="mt-9 text-3xl font-bold">Admin sign in</h1>
        <p className="mt-2 text-sm leading-6 text-white/60">Sign in with an account that has been granted website access.</p>
        {!configured ? (
          <div className="mt-7 rounded-xl border border-[#f5a623]/30 bg-[#f5a623]/10 p-4 text-sm leading-6 text-white/80">
            <strong className="block text-[#f5a623]">Dashboard setup needed</strong>
            Add the Supabase project URL and publishable key plus the Cloudinary cloud name, API key, and secret to <code>.env.local</code>. Then run the migration in <code>supabase/migrations/0001_admin_content.sql</code> and add an admin account. See <code>supabase/README.md</code>.
          </div>
        ) : (
          <>
            {error && errorMessages[error] && <p role="alert" className="mt-5 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{errorMessages[error]}</p>}
            <form action={signIn} className="mt-7 space-y-4">
              <label className="block text-sm font-medium text-white/80">Email<input required name="email" type="email" autoComplete="username" className="mt-2 min-h-12 w-full rounded-lg border border-white/15 bg-black/20 px-3 text-white outline-none focus:border-[#f5a623]" /></label>
              <label className="block text-sm font-medium text-white/80">Password<input required name="password" type="password" autoComplete="current-password" className="mt-2 min-h-12 w-full rounded-lg border border-white/15 bg-black/20 px-3 text-white outline-none focus:border-[#f5a623]" /></label>
              <button className="min-h-12 w-full rounded-lg bg-[#f5a623] px-4 font-bold text-[#08111c] transition hover:bg-[#ffc05c]">Sign in</button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
