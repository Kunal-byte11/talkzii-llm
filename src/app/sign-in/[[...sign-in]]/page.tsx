
import { SignIn } from "@clerk/nextjs";
import { Logo } from "@/components/talkzi/Logo";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
       <Link href="/" passHref className="mb-8">
          <Logo width={144} height={48} />
        </Link>
      <SignIn 
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
