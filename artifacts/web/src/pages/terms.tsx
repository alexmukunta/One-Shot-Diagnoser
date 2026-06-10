import { Link } from "wouter";
import { Activity, ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm tracking-tight">URL Diagnostics</span>
        </Link>
        <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-14">
        <h1 className="text-2xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: June 2025</p>

        <div className="space-y-7 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
            <p>By creating an account or using URL Diagnostics ("the Service"), you agree to be bound by these Terms. If you do not agree, please do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">2. Use of the Service</h2>
            <p>You may use the Service to monitor URLs and web endpoints that you own or have explicit permission to monitor. You must not use the Service to:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Send excessive requests to third-party services without authorisation</li>
              <li>Probe or scan networks, servers, or systems you do not control</li>
              <li>Attempt to circumvent security controls or access internal network resources</li>
              <li>Resell or redistribute the Service without a written agreement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">3. Account Responsibility</h2>
            <p>You are responsible for maintaining the security of your account credentials. You are responsible for all activity that occurs under your account. Notify us immediately if you suspect unauthorised access.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">4. Data and Privacy</h2>
            <p>We store the URLs and check results associated with your account. We do not sell your data to third parties. See our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> for full details.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">5. Service Availability</h2>
            <p>URL Diagnostics is provided on a best-effort basis during the beta period. We make no guarantees of uptime or data retention. We may modify, suspend, or discontinue any part of the Service with reasonable notice.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">6. Limitation of Liability</h2>
            <p>The Service is provided "as is" without warranties of any kind. To the maximum extent permitted by law, URL Diagnostics shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">7. Changes to Terms</h2>
            <p>We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the revised Terms. We will provide notice of material changes by email or in-app notification.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">8. Contact</h2>
            <p>For questions about these Terms, please reach out via the contact form on our website.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
