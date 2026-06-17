// NOTE: Replace with content reviewed by a lawyer before full public launch.
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
        <h1 className="text-2xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: June 2026</p>

        <div className="space-y-7 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">1. What We Collect</h2>
            <p>When you use One Shot Diagnoser, we collect:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li><strong className="text-foreground">Account information</strong> — email address and authentication data via Clerk</li>
              <li><strong className="text-foreground">Monitor configuration</strong> — URLs, check intervals, and notification settings</li>
              <li><strong className="text-foreground">Check results</strong> — response times, SSL data, and availability history</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">2. How We Store Data</h2>
            <p>Your account information and monitor data are stored in a secure PostgreSQL database (Supabase). We do not share your monitoring data with third parties except as required by law.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">3. Third-Party Services</h2>
            <p>We use the following third-party services to operate:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li><strong className="text-foreground">Clerk</strong> for authentication and user management</li>
              <li><strong className="text-foreground">Resend</strong> for sending email notifications</li>
              <li><strong className="text-foreground">Supabase</strong> for database hosting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">4. Your Rights</h2>
            <p>You have the right to access, export, or delete your personal data. You can delete your monitors or your entire account at any time within the application settings.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">5. Cookies</h2>
            <p>We use session cookies via Clerk strictly for authentication. We do not use tracking or advertising cookies. See our <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link> for details.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">6. Contact</h2>
            <p>For privacy-related questions, please contact us through the application.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
