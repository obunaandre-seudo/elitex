import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InstallAppButton from "@/components/InstallAppButton";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-obsidian">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
      <InstallAppButton />
      <Link
        href="/contact"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-gold/30 bg-obsidian/95 px-4 py-3 text-sm font-medium text-ivory shadow-2xl shadow-black/30 backdrop-blur-md transition-colors hover:border-gold hover:bg-gold/10 sm:bottom-6 sm:right-6"
      >
        <MessageCircle size={16} className="text-gold" />
        Contact Us
      </Link>
    </div>
  );
}
