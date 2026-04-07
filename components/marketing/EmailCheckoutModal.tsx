'use client'

import { useState } from "react";
import { X, ArrowRight, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

type PlanKey = "monthly" | "yearly" | "one_time_dba";

interface EmailCheckoutModalProps {
  onClose: () => void;
  preselectedPlan?: PlanKey;
}

const backdropV = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const modalV = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, scale: 0.97, y: 10, transition: { duration: 0.2, ease: [0.42, 0, 0.58, 1] } },
};

const INPUT = "w-full h-11 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all pl-10 pr-4 placeholder:text-muted-foreground/60";

export function EmailCheckoutModal({ onClose, preselectedPlan = "yearly" }: EmailCheckoutModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Redirect naar de app met email en plan
    const params = new URLSearchParams({
      email: email.trim(),
      plan: preselectedPlan,
    });

    window.location.href = `https://app.dbakompas.nl/login?${params.toString()}`;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          variants={backdropV}
          onClick={onClose}
        />

        <motion.div
          className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border/60 overflow-hidden"
          variants={modalV}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
            <h2 className="text-lg font-bold">Aan de slag</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 py-8">
            <p className="text-sm text-muted-foreground mb-6">
              Voer je email in om je account aan te maken en met je analyse te starten.
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
                  className={INPUT}
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full gap-2"
              >
                {loading ? "Even geduld..." : "Doorgaan"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Je wordt doorgestuurd naar je account op DBA Kompas
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
