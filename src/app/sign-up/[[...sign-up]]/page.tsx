
import { SignUp } from "@clerk/nextjs";
import { Logo } from "@/components/talkzi/Logo";
import Link from "next/link";

export default function Page() {
  // After sign-up, you might redirect users to a page to collect additional info like gender
  // or instruct them to update it in their Clerk-managed profile.
  // For now, this will be the standard Clerk sign-up.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Link href="/" passHref className="mb-8">
        <Logo width={144} height={48} />
      </Link>
      <SignUp 
         appearance={{
          elements: {
            card: "shadow-xl neumorphic-shadow-soft",
            formButtonPrimary: "gradient-button",
          }
        }}
      />
    </div>
  );
}
