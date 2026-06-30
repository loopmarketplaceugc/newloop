import Link from "next/link";

export const metadata = {
  title: "Legal — Loop",
  description: "Privacy Policy and Terms of Service for Loop.",
  robots: { index: false, follow: false },
};

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-[#faf6ef] px-5 py-16">
      <div className="mx-auto max-w-3xl">
        {/* Back */}
        <Link
          href="/"
          className="mb-10 inline-block text-xs font-bold text-ink/40 hover:text-ink transition-colors"
        >
          ← loop
        </Link>

        {/* Nav between the two */}
        <nav className="mb-12 flex gap-6 border-b-2 border-ink/10 pb-4 text-sm font-bold">
          <a href="#privacy" className="text-ink hover:text-[#d6409f] transition-colors">
            Privacy Policy
          </a>
          <a href="#terms" className="text-ink hover:text-[#d6409f] transition-colors">
            Terms of Service
          </a>
        </nav>

        {/* ── PRIVACY POLICY ── */}
        <section id="privacy" className="scroll-mt-8">
          <h1 className="font-serif text-4xl font-extrabold text-ink">Privacy Policy</h1>
          <p className="mt-2 text-xs font-medium text-ink/40">Last updated: June 28, 2026</p>

          <div className="prose-loop mt-8 space-y-8 text-[14px] leading-relaxed text-ink/80">

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">1. Who We Are</h2>
              <p>
                Loop ("<strong>Loop</strong>," "<strong>we</strong>," "<strong>us</strong>") operates the
                creator-brand marketplace at this website. We are headquartered in the United States. This
                Privacy Policy describes how we collect, use, and share information when you use our platform.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">2. Information We Collect</h2>
              <ul className="ml-5 list-disc space-y-1">
                <li>
                  <strong>Account data</strong> — name, email address, password (hashed), and role
                  (creator or brand) provided at registration.
                </li>
                <li>
                  <strong>Profile data</strong> — social media handles, follower counts, niche
                  preferences, bio, and portfolio items you voluntarily provide.
                </li>
                <li>
                  <strong>Transaction data</strong> — payment amounts, payout records, and Stripe
                  Connect account identifiers. We do not store full card numbers; payment processing
                  is handled by Stripe, Inc.
                </li>
                <li>
                  <strong>Communications</strong> — messages, offers, and files exchanged through
                  the in-platform chat.
                </li>
                <li>
                  <strong>Usage data</strong> — pages visited, features used, device type, browser,
                  IP address, and timestamps, collected automatically via server logs and cookies.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">3. How We Use Your Information</h2>
              <ul className="ml-5 list-disc space-y-1">
                <li>Provide, operate, and improve the platform.</li>
                <li>Process payments and facilitate payouts through Stripe.</li>
                <li>Match creators and brands based on niche, platform, and preferences.</li>
                <li>Send transactional emails (offer alerts, payout confirmations, password resets).</li>
                <li>Detect fraud, abuse, and violations of our Terms of Service.</li>
                <li>Comply with legal obligations.</li>
              </ul>
              <p className="mt-3">
                We do not sell your personal data to third parties. We do not use your data to serve
                third-party advertising.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">4. Third-Party Service Providers</h2>
              <p>We share data with the following service providers solely to operate Loop:</p>
              <ul className="ml-5 mt-2 list-disc space-y-1">
                <li>
                  <strong>Supabase</strong> — database hosting and authentication (data stored in
                  the United States).
                </li>
                <li>
                  <strong>Stripe, Inc.</strong> — payment processing and creator payouts. Stripe's
                  privacy policy governs data shared with Stripe.
                </li>
              </ul>
              <p className="mt-3">
                These providers are contractually prohibited from using your data for any purpose
                other than providing services to Loop.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">5. Cookies and Tracking</h2>
              <p>
                We use essential cookies to maintain your login session and prevent cross-site
                request forgery. We do not use advertising or analytics cookies. You may disable
                cookies in your browser, but doing so will prevent you from logging in.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">6. Data Retention</h2>
              <p>
                We retain your account data for as long as your account is active. If you delete
                your account, we will delete or anonymize your personal data within 30 days, except
                where we are required to retain it for legal or financial compliance (e.g.,
                transaction records retained for 7 years under tax law).
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">7. Your Rights</h2>
              <p>Depending on your jurisdiction, you may have the right to:</p>
              <ul className="ml-5 mt-2 list-disc space-y-1">
                <li>Access a copy of the personal data we hold about you.</li>
                <li>Request correction of inaccurate data.</li>
                <li>Request deletion of your account and associated data.</li>
                <li>Withdraw consent where processing is based on consent.</li>
                <li>
                  Lodge a complaint with a data protection authority (EU/UK residents: your
                  local supervisory authority; California residents: the California Privacy
                  Protection Agency).
                </li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, email us at{" "}
                <a href="mailto:legal@loop.so" className="underline underline-offset-2">
                  legal@loop.so
                </a>
                .
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">8. Children</h2>
              <p>
                Loop is not directed to children under 18. We do not knowingly collect personal
                data from anyone under 18. If you believe a minor has registered, contact us
                immediately and we will delete the account.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">9. Changes to This Policy</h2>
              <p>
                We may update this policy from time to time. Material changes will be communicated
                by email or by a prominent notice on the platform at least 14 days before taking
                effect. Continued use of Loop after the effective date constitutes acceptance.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">10. Contact</h2>
              <p>
                Loop · Privacy Inquiries ·{" "}
                <a href="mailto:legal@loop.so" className="underline underline-offset-2">
                  legal@loop.so
                </a>
              </p>
            </div>

          </div>
        </section>

        <hr className="my-20 border-ink/10" />

        {/* ── TERMS OF SERVICE ── */}
        <section id="terms" className="scroll-mt-8">
          <h1 className="font-serif text-4xl font-extrabold text-ink">Terms of Service</h1>
          <p className="mt-2 text-xs font-medium text-ink/40">Last updated: June 30, 2026</p>

          <div className="mt-8 space-y-8 text-[14px] leading-relaxed text-ink/80">

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">1. Acceptance</h2>
              <p>
                By creating an account or using Loop, you agree to these Terms of Service
                ("<strong>Terms</strong>"). If you do not agree, do not use the platform. These Terms
                form a binding legal agreement between you and Loop.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">2. Eligibility</h2>
              <p>
                You must be at least 18 years old and legally able to enter contracts to use Loop.
                By registering, you represent that you meet these requirements. Loop reserves the
                right to request proof of age at any time.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">3. The Platform</h2>
              <p>
                Loop is a marketplace that connects content creators ("<strong>Creators</strong>")
                with brands and businesses ("<strong>Brands</strong>"). Loop facilitates
                introductions, agreements, payments, and deliverable review but is not a party to
                the underlying creator-brand contract. Loop makes no guarantees regarding campaign
                performance, reach, or results.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">4. Accounts</h2>
              <ul className="ml-5 list-disc space-y-1">
                <li>You are responsible for maintaining the confidentiality of your password.</li>
                <li>
                  You may not share your account or allow others to access it on your behalf
                  without our written consent.
                </li>
                <li>
                  You must provide accurate, current information and keep it updated. Loop may
                  suspend accounts with inaccurate information.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">5. Payments and Escrow</h2>
              <p>
                Loop uses a secure escrow model. Brands fund gigs upfront; funds are held and
                released to Creators upon approval of deliverables. All payments are processed
                by Stripe, Inc. under Stripe's terms.
              </p>
              <p className="mt-3">
                Every gig shows its full Deal Value and the amount the Creator receives in the deal
                summary before you confirm. These amounts are presented in full and are binding once
                a gig is funded. Refunds on cancellation follow the stage-based policy shown to you
                at the time of cancellation.
              </p>
              <p className="mt-3">
                Creators must complete Stripe Connect onboarding to receive payouts. Loop is not
                liable for delays caused by Stripe verification processes or bank transfer times.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">6. Creator Obligations</h2>
              <ul className="ml-5 list-disc space-y-1">
                <li>Deliver content that conforms to the agreed brief and contract terms.</li>
                <li>
                  Disclose sponsored content in accordance with FTC guidelines, ASA rules, or
                  applicable local advertising disclosure law.
                </li>
                <li>
                  Only submit original content to which you own all rights, or have the necessary
                  licenses (including music, third-party trademarks, and likeness rights).
                </li>
                <li>Maintain the posted content for the minimum post lifetime agreed in the contract.</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">7. Brand Obligations</h2>
              <ul className="ml-5 list-disc space-y-1">
                <li>Provide clear, lawful briefs free from misleading claims.</li>
                <li>Fund escrow in full before a gig enters active production.</li>
                <li>
                  Review deliverables within the agreed review window. Silence past the
                  auto-approval deadline constitutes acceptance of the deliverable.
                </li>
                <li>
                  Not contact or engage Creators outside Loop in connection with any deal that
                  originated on the platform, during or within 12 months after the gig is active.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">8. Intellectual Property</h2>
              <p>
                Creators retain ownership of their content until the contract's usage rights take
                effect. Brands receive only the usage rights explicitly granted in the signed
                contract. Loop claims no ownership over Creator content.
              </p>
              <p className="mt-3">
                You grant Loop a limited, non-exclusive license to display your content and profile
                data on the platform and in promotional materials for Loop itself (e.g., case
                studies, marketing with your consent).
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">9. Prohibited Conduct</h2>
              <p>You may not:</p>
              <ul className="ml-5 mt-2 list-disc space-y-1">
                <li>Circumvent or manipulate the platform's escrow or payment systems.</li>
                <li>Post false, misleading, or fraudulent information.</li>
                <li>Harass, threaten, or abuse other users.</li>
                <li>Upload malware, scrape the platform, or attempt unauthorized access.</li>
                <li>Use Loop for any unlawful purpose.</li>
                <li>Create multiple accounts to evade suspensions or reviews.</li>
              </ul>
              <p className="mt-3">
                Violations may result in immediate account termination and, where applicable,
                referral to law enforcement.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">10. Platform Transactions and Contract Compliance</h2>
              <p>
                Any connection, introduction, or match made through Loop — whether between Creators
                and Brands or otherwise — must result in all associated work and payments being
                completed through Loop. Engaging a party you discovered through Loop for paid
                services outside the platform constitutes circumvention and is a material breach of
                these Terms.
              </p>
              <p className="mt-3">
                All deals negotiated and contracted through Loop are legally binding on both parties
                and must comply in full with the terms of the contract signed within the platform.
                Loop's contract terms govern the rights, obligations, timeline, deliverables,
                payment amounts, and usage rights for every gig. Neither party may unilaterally
                modify, waive, or circumvent those contract terms.
              </p>
              <p className="mt-3">
                Violation of this section may result in immediate account suspension, forfeiture of
                escrowed funds, and legal action for damages including, but not limited to, Loop's
                lost service fees and any harm caused to the other party.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">11. Disputes Between Users</h2>
              <p>
                Loop provides a dispute resolution process accessible through the gig workspace.
                Loop's decision in platform disputes is final with respect to escrow release.
                Loop is not liable for any amounts lost in a user dispute beyond what is held in
                escrow at the time of the dispute.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">13. Disclaimers</h2>
              <p>
                The platform is provided "<strong>as is</strong>" and "<strong>as available</strong>"
                without warranties of any kind, express or implied, including fitness for a
                particular purpose or non-infringement. Loop does not warrant that the platform
                will be uninterrupted, error-free, or free of viruses.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">14. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Loop's total liability to you for any
                claim arising out of or relating to these Terms or the platform is limited to the
                greater of (a) the total fees you paid to Loop in the 12 months preceding the
                claim, or (b) $100 USD. In no event is Loop liable for indirect, incidental,
                consequential, or punitive damages.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">15. Indemnification</h2>
              <p>
                You agree to indemnify and hold Loop, its officers, employees, and agents harmless
                from any claims, damages, or expenses (including reasonable attorneys' fees)
                arising from your use of the platform, your content, or your violation of these Terms.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">16. Termination</h2>
              <p>
                You may close your account at any time. Loop may suspend or terminate your account
                immediately if you breach these Terms or if we are required to do so by law.
                Upon termination, your right to use the platform ceases; obligations that by their
                nature survive (payment, IP, indemnification) remain in effect.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">17. Governing Law and Disputes</h2>
              <p>
                These Terms are governed by the laws of the State of Delaware, United States,
                without regard to conflict-of-law principles. Any dispute that cannot be resolved
                informally shall be submitted to binding arbitration administered by the American
                Arbitration Association under its Consumer Arbitration Rules, on an individual
                (non-class) basis. You waive the right to a jury trial and to participate in class
                actions to the extent permitted by law.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">18. Changes to These Terms</h2>
              <p>
                We may revise these Terms at any time. Material changes will be communicated by
                email at least 14 days before taking effect. Continued use after the effective date
                constitutes acceptance of the revised Terms.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">19. Contact</h2>
              <p>
                Loop · Legal ·{" "}
                <a href="mailto:legal@loop.so" className="underline underline-offset-2">
                  legal@loop.so
                </a>
              </p>
            </div>

          </div>
        </section>

        {/* Bottom spacer */}
        <div className="mt-20 border-t border-ink/10 pt-8 text-center text-xs font-medium text-ink/30">
          © 2026 Loop · All rights reserved
        </div>
      </div>
    </div>
  );
}
