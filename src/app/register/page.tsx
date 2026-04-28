import AuthForm from "@/components/AuthForm";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  return <AuthForm mode="register" nextUrl={sp.next ?? "/"} />;
}
