import { Link } from "wouter";
import { Activity, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
        <h1 className="text-2xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: June 2025</p>

        <div className="space-y-7 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">1. What We Collect</h2>
            <p>When you use URL Diagnostics, we collect:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li><strong className="text-foreground">Account information</strong> — email address and authentication data via Clerk</li>
              <li><strong className="text-foreground">Monitor configuration</strong> — URLs, check intervals, and notification settings you create</li>
              <li><strong className="text-foreground">Check results</strong> — HTTP status codes, response times, SSL expiry data, and error messages from monitors you configure</li>
              <li><strong className="text-foreground">Usage data</strong> — basic server logs (IP addresses, request timestamps) retained for up to 30 days for security purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">2. How We Use Your Data</h2>
            <p>We use your data solely to:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Provide and operate the monitoring service</li>
              <li>Send alert notifications to the channels you configure</li>
              <li>Improve reliability and debug issues</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="mt-2">We do not sell, rent, or trade your personal data to any third party.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">3. Data Storage</h2>
            <p>Your data is stored in a PostgreSQL database hosted on secure infrastructure. Monitor check results are retained for 90 days by default. Account data is retained until you delete your account.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">4. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li><strong className="text-foreground">Clerk</strong> — authentication and user management. See <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Clerk's Privacy Policy</a>.</li>
            </ul>
            <p className="mt-2">Alert notifications are sent to the webhook URLs you provide. We do not store or log the content of those endpoints beyond what is needed for delivery confirmation.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">5. Your Rights</h2>
            <p>You can delete your monitors and alert channels at any time from within the app. To delete your account and all associated data, contact us and we will process your request within 7 business days.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">6. Cookies</h2>
            <p>We use session cookies strictly necessary for authentication. We do not use tracking or advertising cookies.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">7. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes by email or in-app notice.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">8. Contact</h2>
            <p>For privacy-related requests or questions, please reach out via the contact form on our website.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
