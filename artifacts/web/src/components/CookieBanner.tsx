import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "./ui/button";
import { X } from "lucide-react";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-card border border-card-border shadow-2xl rounded-lg p-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className="text-sm font-semibold mb-1">Cookies & Privacy</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We use essential cookies to manage your authentication. By using our service, you agree to our{" "}
            <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link>.
          </p>
        </div>
        <button onClick={() => setIsVisible(false)} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-3">
        <Button size="sm" className="w-full h-8 text-xs" onClick={accept}>
          Accept
        </Button>
      </div>
    </div>
  );
}
