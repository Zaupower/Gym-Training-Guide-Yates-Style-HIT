import AuthForm from "@/components/AuthForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  return <AuthForm mode="login" nextUrl={sp.next ?? "/"} />;
}
