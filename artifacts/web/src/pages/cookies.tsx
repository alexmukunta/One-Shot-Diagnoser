// NOTE: Replace with content reviewed by a lawyer before full public launch.
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function CookiePolicyPage() {
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
        <h1 className="text-2xl font-bold mb-2">Cookie Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: June 2026</p>

        <div className="space-y-7 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">1. What are cookies?</h2>
            <p>Cookies are small text files stored on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to the owners of the site.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">2. How we use cookies</h2>
            <p>We use cookies strictly for functional purposes. Specifically:</p>
            <ul className="mt-2 space-y-2 list-disc list-inside">
              <li>
                <strong className="text-foreground">Authentication:</strong> We use cookies via Clerk to manage your login session. These cookies allow us to recognize you as you move between pages and keep you signed in.
              </li>
              <li>
                <strong className="text-foreground">Security:</strong> Cookies help us detect and prevent security risks, ensuring your account remains safe.
              </li>
              <li>
                <strong className="text-foreground">Preferences:</strong> We may use cookies to remember your display preferences, such as your consent to this Cookie Policy.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">3. Third-party cookies</h2>
            <p>We do not use third-party tracking, advertising, or analytics cookies. Our authentication provider, Clerk, may set cookies necessary for the authentication process.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">4. Managing cookies</h2>
            <p>Most web browsers allow you to control cookies through their settings. However, if you disable strictly necessary cookies (like those used for authentication), you will not be able to sign in or use the core features of One Shot Diagnoser.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">5. Changes to this policy</h2>
            <p>We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated "Last updated" date.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">6. Contact</h2>
            <p>If you have any questions about our use of cookies, please contact us through the application.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
