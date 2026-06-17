// NOTE: Replace with content reviewed by a lawyer before full public launch.
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded overflow-hidden flex items-center justify-center">
            <img src="/status-icon.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-semibold text-sm tracking-tight">One Shot Diagnoser</span>
        </Link>
        <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-14">
        <h1 className="text-2xl font-bold mb-2">Terms and Conditions</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: June 2026</p>

        <div className="space-y-7 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
            <p>By creating an account or using One Shot Diagnoser ("the Service"), you agree to be bound by these Terms. If you do not agree, please do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">2. Use of the Service</h2>
            <p>You may use the Service to monitor URLs and web endpoints that you own or have explicit permission to monitor. You must not use the Service for any illegal or unauthorized purpose.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">3. Account Responsibility</h2>
            <p>You are responsible for maintaining the security of your account via Clerk. You are responsible for all activity that occurs under your account. Notify us immediately if you suspect unauthorized access.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">4. Service Availability</h2>
            <p>One Shot Diagnoser is provided "as is". While we strive for accuracy, uptime monitoring results are not guaranteed to be 100% accurate or reflective of all user experiences. We make no guarantees regarding service availability or data retention.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">5. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, One Shot Diagnoser shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of or inability to use the Service.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">6. Termination</h2>
            <p>We reserve the right to terminate or suspend your account at any time, without prior notice, for conduct that we believe violates these Terms or is harmful to other users of the Service or third parties.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">7. Contact</h2>
            <p>For questions about these Terms, please reach out via the application.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
