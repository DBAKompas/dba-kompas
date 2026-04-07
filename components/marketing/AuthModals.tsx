'use client'

import { useState } from "react";
import { X, Mail, Lock, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/marketing/BrandLogo";
import Link from "next/link";

interface AuthModalProps {
  mode: "login" | "register";
  onClose: () => void;
  onSwitch: () => void;
  onSuccess?: (plan?: "monthly" | "yearly") => void;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, scale: 0.97, y: 10, transition: { duration: 0.2, ease: [0.42, 0, 0.58, 1] } },
};

const INPUT_CLASS = "w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all";

export function AuthModal({ mode, onClose, onSwitch }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const isLogin = mode === "login";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isLogin) {
      // Redirect naar app met email in URL
      window.location.href = `/login?email=${encodeURIComponent(email)}`;
    } else {
      // Ga naar register tab
      window.location.href = `/login?tab=register`;
    }
    onClose();
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          variants={backdropVariants}
          onClick={onClose}
        />
        <motion.div
          className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border/60 overflow-hidden"
          variants={modalVariants}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
            <BrandLogo variant="flatDark" className="h-6 w-auto" />
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 py-8">
            <h2 className="text-xl font-bold mb-2">
              {isLogin ? "Log in op je account" : "Maak een account aan"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {isLogin
                ? "Voer je email in om door te gaan naar DBA Kompas"
                : "Maak een account aan om aan de slag te gaan"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="je@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={INPUT_CLASS}
                />
              </div>

              <Button type="submit" className="w-full gap-2">
                Doorgaan
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {isLogin ? (
                <>
                  Nog geen account?{" "}
                  <button
                    onClick={onSwitch}
                    className="text-primary hover:underline font-medium"
                  >
                    Registreer hier
                  </button>
                </>
              ) : (
                <>
                  Heb je al een account?{" "}
                  <button
                    onClick={onSwitch}
                    className="text-primary hover:underline font-medium"
                  >
                    Log in
                  </button>
                </>
              )}
            </div>

            <div className="mt-4 text-xs text-muted-foreground text-center">
              Door door te gaan accepteer je onze{" "}
              <Link href="/algemene-voorwaarden" className="text-primary hover:underline">
                Algemene Voorwaarden
              </Link>
              {" "}en{" "}
              <Link href="/privacy-en-cookiebeleid" className="text-primary hover:underline">
                Privacybeleid
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
