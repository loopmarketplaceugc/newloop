import Link from "next/link";

export const metadata = {
  title: "Legal — Loop",
  description: "Privacy Policy and Terms & Conditions for Loop.",
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

        {/* Nav */}
        <nav className="mb-12 flex gap-6 border-b-2 border-ink/10 pb-4 text-sm font-bold">
          <a href="#privacy" className="text-ink hover:text-[#d6409f] transition-colors">Privacy Policy</a>
          <a href="#terms" className="text-ink hover:text-[#d6409f] transition-colors">Terms &amp; Conditions</a>
        </nav>

        {/* ── PRIVACY POLICY ── */}
        <section id="privacy" className="scroll-mt-8">
          <h1 className="font-serif text-4xl font-extrabold text-ink">Privacy Policy</h1>
          <p className="mt-2 text-xs font-medium text-ink/40">Last updated: June 30, 2026</p>

          <div className="prose-loop mt-8 space-y-8 text-[14px] leading-relaxed text-ink/80">

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">1. Who We Are</h2>
              <p>
                Loop (&ldquo;<strong>Loop</strong>,&rdquo; &ldquo;<strong>we</strong>,&rdquo; &ldquo;<strong>us</strong>,&rdquo; or &ldquo;<strong>our</strong>&rdquo;) operates the creator-brand marketplace and associated services accessible through our website and applications. We are headquartered in the United States. This Privacy Policy explains how we collect, use, disclose, retain, and protect information about you when you access or use our platform, create an account, or otherwise interact with our services (&ldquo;<strong>Services</strong>&rdquo;). By accessing or using the Services, you acknowledge that you have read, understood, and agree to the practices described in this Privacy Policy.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">2. Information We Collect</h2>
              <p className="mb-2">We collect information you provide directly, information we collect automatically, and information from third parties.</p>
              <h3 className="mb-1 font-serif text-base font-bold text-ink">2.1 Information You Provide</h3>
              <ul className="ml-5 list-disc space-y-1 mb-3">
                <li><strong>Account data</strong> — your name, email address, password (stored in hashed form only), and role (creator or brand) when you register.</li>
                <li><strong>Profile data</strong> — your creator name, handle, biography, location, social media platform handles and follower counts, niche categories, portfolio items, base rates, compensation preferences, and profile photo.</li>
                <li><strong>Business data</strong> — for brand accounts: company name, website URL, industry niches, and monthly UGC budget range.</li>
                <li><strong>Payment data</strong> — billing information submitted during balance top-ups and Stripe Connect onboarding. Full card numbers are never stored by Loop; all payment data is processed and stored by Stripe, Inc. under their own privacy and security standards.</li>
                <li><strong>Communications</strong> — messages, offers, scripts, attachments, and other content you send or receive through the in-platform gig workspace chat.</li>
                <li><strong>Contracts and deliverables</strong> — signed contract terms, uploaded content files, revision notes, and approval or rejection decisions tied to each gig.</li>
                <li><strong>Support interactions</strong> — any correspondence you send to us by email or through support channels.</li>
              </ul>
              <h3 className="mb-1 font-serif text-base font-bold text-ink">2.2 Information Collected Automatically</h3>
              <ul className="ml-5 list-disc space-y-1 mb-3">
                <li><strong>Usage data</strong> — pages and features accessed, session duration, button clicks, search queries, and navigation paths within the platform.</li>
                <li><strong>Device and technical data</strong> — IP address, browser type and version, operating system, device identifiers, screen resolution, language preferences, and referring URL.</li>
                <li><strong>Log data</strong> — server logs automatically recording requests made to our infrastructure, including timestamps, HTTP methods, and response codes.</li>
                <li><strong>Session data</strong> — authentication tokens and session identifiers stored in cookies or browser local storage to keep you logged in.</li>
              </ul>
              <h3 className="mb-1 font-serif text-base font-bold text-ink">2.3 Information from Third Parties</h3>
              <ul className="ml-5 list-disc space-y-1">
                <li><strong>Stripe</strong> — payment status, payout account verification outcomes, and Stripe Connect account identifiers.</li>
                <li><strong>Email delivery providers</strong> — bounce and delivery status information for transactional emails we send you.</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">3. How We Use Your Information</h2>
              <ul className="ml-5 list-disc space-y-1">
                <li>Provide, operate, maintain, and improve the platform and its features.</li>
                <li>Create and manage your account, and verify your identity.</li>
                <li>Match creators and brands based on niche, platform, follower reach, budget, and other preferences.</li>
                <li>Facilitate gig creation, contracting, deliverable review, funding holds, and payouts.</li>
                <li>Process payments and send payment confirmations, payout notifications, and invoices through Stripe.</li>
                <li>Send transactional emails including account confirmation, password resets, offer alerts, contract updates, dispute notices, and payout confirmations.</li>
                <li>Respond to support requests, feedback, and dispute resolutions.</li>
                <li>Detect, investigate, and prevent fraudulent activity, abuse, and violations of our Terms &amp; Conditions.</li>
                <li>Enforce our legal rights and comply with applicable laws, regulations, court orders, and government requests.</li>
                <li>Analyze aggregate, anonymized usage trends to improve platform features and design.</li>
                <li>Communicate product updates, feature announcements, and policy changes (you may opt out of non-transactional communications).</li>
              </ul>
              <p className="mt-3">
                We do <strong>not</strong> sell your personal data to third parties. We do <strong>not</strong> use your data to serve third-party advertising. We do <strong>not</strong> share your data with any party except as described in this Policy.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">4. Legal Bases for Processing (EEA / UK Users)</h2>
              <p className="mb-2">If you are located in the European Economic Area or the United Kingdom, we process your personal data under the following legal bases:</p>
              <ul className="ml-5 list-disc space-y-1">
                <li><strong>Contract performance</strong> — processing necessary to provide the Services you signed up for, including account creation, gig management, and payment processing.</li>
                <li><strong>Legitimate interests</strong> — fraud detection, security, product improvement, and direct marketing to existing users (subject to your right to object).</li>
                <li><strong>Legal obligation</strong> — tax record-keeping, anti-money-laundering checks, and responding to lawful government requests.</li>
                <li><strong>Consent</strong> — where we rely on consent (e.g., optional marketing emails), you may withdraw consent at any time without affecting the lawfulness of prior processing.</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">5. How We Share Your Information</h2>
              <ul className="ml-5 list-disc space-y-1">
                <li><strong>Between users</strong> — creator profile data (name, handle, bio, niche, platforms, portfolio) is visible to brand users on the Discover page and in gig workspaces. Brand profile data (company name, website, niche) is visible to creator users. Messages and deliverables shared within a gig workspace are visible to both parties of that gig.</li>
                <li><strong>Supabase</strong> — we host our database and authentication system on Supabase, which stores data in the United States. Supabase is contractually prohibited from using your data for any purpose other than providing infrastructure services to Loop.</li>
                <li><strong>Stripe, Inc.</strong> — payment processing, creator payouts, and Stripe Connect onboarding. Data shared with Stripe is governed by Stripe&rsquo;s own Privacy Policy.</li>
                <li><strong>Resend</strong> — transactional email delivery. Email addresses and message content are transmitted to Resend solely to deliver emails on our behalf.</li>
                <li><strong>Legal and safety disclosures</strong> — we may disclose your information to law enforcement, regulatory bodies, or other third parties if required by law or if we reasonably believe disclosure is necessary to (a) comply with a legal obligation, (b) protect the rights, property, or safety of Loop, our users, or the public, or (c) detect and prevent fraud or security threats.</li>
                <li><strong>Business transfers</strong> — if Loop is involved in a merger, acquisition, asset sale, or bankruptcy, your personal data may be transferred as part of that transaction. We will notify you via email and/or a prominent notice on the platform before your data becomes subject to a different privacy policy.</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">6. Cookies and Tracking Technologies</h2>
              <p className="mb-2">We use the following types of cookies and local storage technologies:</p>
              <ul className="ml-5 list-disc space-y-1">
                <li><strong>Strictly necessary cookies</strong> — session authentication tokens required to keep you logged in. These cannot be disabled without breaking core functionality.</li>
                <li><strong>Functional local storage</strong> — Zustand store data persisted to your browser&rsquo;s localStorage to preserve your session state and in-progress onboarding data across page reloads.</li>
              </ul>
              <p className="mt-3">
                We do <strong>not</strong> use advertising cookies, cross-site tracking pixels, or third-party analytics tools such as Google Analytics. You may disable cookies in your browser settings, but doing so will prevent you from logging in to the platform.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">7. Data Retention</h2>
              <p className="mb-2">We retain your data for as long as your account is active and for a limited period thereafter:</p>
              <ul className="ml-5 list-disc space-y-1">
                <li><strong>Account and profile data</strong> — retained while your account is active. Deleted or anonymized within 30 days of account deletion, except where legal retention obligations apply.</li>
                <li><strong>Transaction and financial records</strong> — retained for 7 years from the transaction date to comply with applicable tax and accounting laws.</li>
                <li><strong>Gig contracts and deliverables</strong> — retained for 5 years from gig completion to support dispute resolution and legal compliance.</li>
                <li><strong>Communications (messages)</strong> — retained for 3 years from the date of the message to support dispute resolution.</li>
                <li><strong>Server logs</strong> — retained for up to 90 days for security and debugging purposes, then deleted.</li>
              </ul>
              <p className="mt-3">
                After the applicable retention period, data is permanently deleted or irreversibly anonymized so that it can no longer be associated with you as an individual.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">8. Data Security</h2>
              <p>
                We implement industry-standard security measures including TLS encryption for data in transit, AES-256 encryption for data at rest on Supabase infrastructure, bcrypt password hashing, row-level security (RLS) policies enforcing per-user data access in our database, and periodic security reviews. However, no security system is impenetrable. We cannot guarantee absolute security, and we encourage you to use a strong, unique password and to log out of shared devices.
              </p>
              <p className="mt-3">
                In the event of a data breach that affects your personal data and poses a high risk to your rights and freedoms, we will notify you and, where required, the relevant supervisory authority within 72 hours of becoming aware of the breach.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">9. International Data Transfers</h2>
              <p>
                Loop is based in the United States. If you access our Services from outside the United States, your personal data will be transferred to and processed in the United States, which may have different data protection laws than your country. Where we transfer data from the EEA or UK to the United States, we rely on Standard Contractual Clauses approved by the European Commission or equivalent transfer mechanisms recognized under applicable law.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">10. Your Rights</h2>
              <p className="mb-2">Depending on your jurisdiction, you may have the following rights with respect to your personal data:</p>
              <ul className="ml-5 list-disc space-y-1">
                <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
                <li><strong>Rectification</strong> — request correction of inaccurate or incomplete data.</li>
                <li><strong>Erasure</strong> — request deletion of your account and personal data, subject to legal retention requirements.</li>
                <li><strong>Restriction</strong> — request that we restrict processing of your data in certain circumstances.</li>
                <li><strong>Data portability</strong> — receive a machine-readable copy of data you provided to us.</li>
                <li><strong>Objection</strong> — object to processing based on legitimate interests or for direct marketing purposes.</li>
                <li><strong>Withdraw consent</strong> — where processing is based on consent, withdraw it at any time without affecting the lawfulness of prior processing.</li>
                <li><strong>Complaint</strong> — lodge a complaint with a supervisory authority. EU/EEA residents: your local Data Protection Authority. UK residents: the Information Commissioner&rsquo;s Office (ICO). California residents: the California Privacy Protection Agency (CPPA).</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, email us at{" "}
                <a href="mailto:legal@loop.so" className="underline underline-offset-2">legal@loop.so</a>. We will respond within 30 days. We may ask you to verify your identity before fulfilling your request.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">11. California Privacy Rights (CCPA / CPRA)</h2>
              <p className="mb-2">
                If you are a California resident, you have the following additional rights under the California Consumer Privacy Act (CCPA) as amended by the California Privacy Rights Act (CPRA):
              </p>
              <ul className="ml-5 list-disc space-y-1">
                <li>The right to know what personal information we collect, use, disclose, or sell.</li>
                <li>The right to delete personal information we have collected from you, subject to certain exceptions.</li>
                <li>The right to correct inaccurate personal information we maintain about you.</li>
                <li>The right to opt out of the sale or sharing of your personal information. <strong>We do not sell or share personal information.</strong></li>
                <li>The right to limit our use and disclosure of sensitive personal information.</li>
                <li>The right to non-discrimination for exercising your privacy rights.</li>
              </ul>
              <p className="mt-3">
                To submit a California privacy request, email <a href="mailto:legal@loop.so" className="underline underline-offset-2">legal@loop.so</a> with the subject line &ldquo;California Privacy Request.&rdquo;
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">12. Children&rsquo;s Privacy</h2>
              <p>
                Loop is not directed to individuals under the age of 18. We do not knowingly collect personal data from minors. If you are a parent or guardian and believe your child has created an account or provided us with personal data, please contact us immediately at <a href="mailto:legal@loop.so" className="underline underline-offset-2">legal@loop.so</a> and we will delete the account and associated data promptly.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">13. Third-Party Links</h2>
              <p>
                Our platform may contain links to third-party websites, including creator social media profiles, brand websites, and external tools. This Privacy Policy does not apply to those third-party sites. We encourage you to review the privacy policies of any third-party sites you visit. We have no control over and assume no responsibility for the content, privacy practices, or policies of third-party websites.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">14. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or for other operational reasons. Material changes will be communicated by email to the address associated with your account and by a prominent notice on the platform at least 14 days before the changes take effect. The &ldquo;Last updated&rdquo; date at the top of this page will reflect the most recent revision. Continued use of Loop after the effective date of any change constitutes your acceptance of the revised Privacy Policy.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">15. Contact Us</h2>
              <p>
                If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact:
              </p>
              <p className="mt-2">
                Loop · Privacy &amp; Data Protection<br />
                <a href="mailto:legal@loop.so" className="underline underline-offset-2">legal@loop.so</a>
              </p>
            </div>

          </div>
        </section>

        <hr className="my-20 border-ink/10" />

        {/* ── TERMS & CONDITIONS ── */}
        <section id="terms" className="scroll-mt-8">
          <h1 className="font-serif text-4xl font-extrabold text-ink">Terms &amp; Conditions</h1>
          <p className="mt-2 text-xs font-medium text-ink/40">Last updated: June 30, 2026</p>

          <div className="mt-8 space-y-8 text-[14px] leading-relaxed text-ink/80">

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">1. Acceptance of Terms</h2>
              <p>
                By creating an account, clicking &ldquo;I agree,&rdquo; or otherwise accessing or using Loop and any of its associated services, applications, or tools (collectively, the &ldquo;<strong>Platform</strong>&rdquo;), you (&ldquo;<strong>User</strong>,&rdquo; &ldquo;<strong>you</strong>,&rdquo; or &ldquo;<strong>your</strong>&rdquo;) agree to be bound by these Terms &amp; Conditions (&ldquo;<strong>Terms</strong>&rdquo;), our Privacy Policy, and any additional guidelines, policies, or rules posted on the Platform, all of which are incorporated herein by reference. These Terms form a legally binding agreement between you and Loop. If you do not agree to these Terms in their entirety, you must not access or use the Platform.
              </p>
              <p className="mt-3">
                If you are agreeing to these Terms on behalf of a company or other legal entity, you represent and warrant that you have the authority to bind that entity to these Terms, in which case &ldquo;you&rdquo; will refer to that entity. If you do not have such authority, you must not accept these Terms or use the Platform on behalf of that entity.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">2. Eligibility</h2>
              <p>
                To use the Platform, you must: (a) be at least 18 years of age; (b) have the legal capacity to enter into binding contracts under applicable law; (c) not be barred from using the Platform under the laws of the United States or any other applicable jurisdiction; and (d) not have had a previous Loop account suspended or terminated for violations of these Terms. By registering, you represent and warrant that you satisfy all of the foregoing requirements. Loop reserves the right to request proof of age or identity at any time and to suspend accounts where eligibility cannot be confirmed.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">3. Description of the Platform</h2>
              <p>
                Loop is a two-sided marketplace that facilitates introductions, negotiations, contracting, content delivery, funds holding, and payment between content creators (&ldquo;<strong>Creators</strong>&rdquo;) and brands, businesses, and marketing teams (&ldquo;<strong>Brands</strong>&rdquo;). Loop provides the technology infrastructure and support services that enable these interactions but is not a party to any underlying agreement between a Creator and a Brand. Loop does not produce, commission, endorse, or guarantee any content, campaign outcome, return on investment, engagement rate, or other result.
              </p>
              <p className="mt-3">
                Loop reserves the right, at its sole discretion, to modify, suspend, discontinue, or restrict access to any feature or portion of the Platform at any time, with or without notice, and without liability to you. We are not obligated to provide any specific feature or maintain any feature in its current form.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">4. Accounts and Registration</h2>
              <ul className="ml-5 list-disc space-y-1">
                <li>You must provide accurate, current, and complete information during registration and keep your account information updated at all times.</li>
                <li>You are solely responsible for maintaining the confidentiality of your account credentials, including your password. You agree to notify Loop immediately at <a href="mailto:legal@loop.so" className="underline underline-offset-2">legal@loop.so</a> if you become aware of any unauthorized access to your account.</li>
                <li>You may not share your account with any other person or allow any other person to access the Platform on your behalf, except with Loop&rsquo;s express written consent.</li>
                <li>You may not create more than one account of the same role (Creator or Brand) per person or entity. Creating duplicate accounts to circumvent suspensions, restrictions, or reviews is a material breach of these Terms.</li>
                <li>Loop may, at its sole discretion, refuse to register an account, suspend or terminate an account, or reassign a username or handle at any time.</li>
                <li>You acknowledge that Loop may verify your identity, business registration, or social media accounts as part of account review processes.</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">5. Platform Transactions and Mandatory Use of Loop</h2>
              <p>
                This section governs one of the most fundamental obligations of all Loop users and must be read carefully.
              </p>
              <p className="mt-3">
                <strong>5.1 All Connections Must Transact Through Loop.</strong> Any connection, introduction, match, or communication between a Creator and a Brand that originates on or through the Platform — including connections made through the Discover feature, Loop-generated proposals, Loop tag scans, messages initiated on the Platform, or any referral or introduction traceable to Loop — must result in all associated paid work, content production, licensing, usage rights, sponsorships, and payments being completed exclusively through the Platform. You may not use the Platform merely to identify counterparties and then conduct business outside of it. Doing so (&ldquo;<strong>circumvention</strong>&rdquo;) is a material breach of these Terms and may result in legal liability.
              </p>
              <p className="mt-3">
                <strong>5.2 Mandatory Use of Loop Payment and Funds-Hold Systems.</strong> All financial transactions arising from a Creator-Brand relationship that originated on Loop must be funded, held, and released through Loop&rsquo;s payment and funds-hold infrastructure, powered by Stripe. You may not arrange, accept, request, or facilitate payments outside Loop&rsquo;s payment system for any work that falls within the scope of a Loop-originated relationship, regardless of the medium through which such payments are made (including but not limited to bank transfer, cash, cryptocurrency, gift cards, barter, or third-party payment applications).
              </p>
              <p className="mt-3">
                <strong>5.3 Twelve-Month Non-Circumvention Period.</strong> The prohibition on circumvention applies during the active term of any gig and for a period of <strong>twelve (12) calendar months</strong> following the completion, cancellation, or expiration of the most recent gig between a given Creator and Brand pair. During this period, you may not engage, contract, hire, or otherwise work with any counterparty you first encountered through Loop for any paid content, marketing, or sponsorship work outside of the Platform.
              </p>
              <p className="mt-3">
                <strong>5.4 Consequences of Circumvention.</strong> If Loop determines, in its reasonable judgment, that circumvention has occurred, Loop may, without limitation: (a) immediately suspend or permanently terminate the accounts of all parties involved; (b) forfeit any held funds in accordance with the applicable cancellation policy; (c) pursue damages, including Loop&rsquo;s lost service fees calculated at the standard rate on the estimated value of the off-platform transaction, plus reasonable attorneys&rsquo; fees; and (d) report the conduct to relevant regulatory or law enforcement authorities where applicable.
              </p>
              <p className="mt-3">
                <strong>5.5 Reporting Circumvention.</strong> If you become aware of or are solicited to engage in circumvention, you are encouraged to report it to Loop at <a href="mailto:legal@loop.so" className="underline underline-offset-2">legal@loop.so</a>. Loop will investigate all credible reports and may offer protections to good-faith reporters.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">6. Gig Contracts and Binding Obligations</h2>
              <p>
                <strong>6.1 Legally Binding Contracts.</strong> Every gig entered into through the Platform is governed by a contract (&ldquo;<strong>Gig Contract</strong>&rdquo;) that is legally binding on both the Creator and the Brand. The Gig Contract, as presented and signed within the gig workspace, constitutes the entire agreement between the parties with respect to the specific deliverable and supersedes any prior oral or written communications between them regarding that deliverable.
              </p>
              <p className="mt-3">
                <strong>6.2 Mandatory Compliance with Contract Terms.</strong> Both Creators and Brands must comply in full with all terms of their signed Gig Contracts, including but not limited to deliverable specifications, creative brief requirements, timelines and deadlines, revision rounds, post-lifetime requirements, usage rights granted, compensation amounts, and FTC and advertising disclosure obligations. No party may unilaterally modify, waive, or deviate from the signed Gig Contract terms without the express written agreement of the counterparty and acknowledgment by Loop.
              </p>
              <p className="mt-3">
                <strong>6.3 Contract Formation.</strong> A Gig Contract is formed when: (a) a Brand posts a gig or sends an offer; (b) the Creator accepts the offer within the Platform; and (c) the Brand funds the hold in full. No Gig Contract is enforceable until all three conditions are met. Loop is not a party to the Gig Contract but provides the technology infrastructure through which it is formed and executed.
              </p>
              <p className="mt-3">
                <strong>6.4 Modification of Contract Terms.</strong> Requests to modify a Gig Contract&rsquo;s scope, timeline, or compensation must be initiated and accepted through the Platform&rsquo;s offer amendment features. Verbal or off-platform agreements to modify a Gig Contract are not recognized by Loop and will not affect dispute resolution outcomes.
              </p>
              <p className="mt-3">
                <strong>6.5 Contract Enforcement.</strong> In the event of a dispute regarding compliance with a Gig Contract, Loop&rsquo;s dispute resolution team will assess the dispute based solely on the written Gig Contract terms and evidence submitted through the Platform. Loop&rsquo;s decision regarding release of held funds in a dispute is final and binding. Users are encouraged to document all material communications and deliverable submissions within the Platform.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">7. Payments, Funds Holds, and Fees</h2>
              <p>
                <strong>7.1 Funds-Hold Model.</strong> All gig payments are processed through Loop&rsquo;s funds-hold system. When a Brand funds a gig, the payment is held securely by Loop and not released to the Creator until the Brand approves the deliverable or the auto-approval deadline passes without action. For the avoidance of doubt, Loop is not a bank, trust company, or licensed escrow agent, and the holding of funds described here does not constitute an escrow service in any regulated sense; it is a contractual payment-holding arrangement operated through Loop&rsquo;s payment processor. This protects both parties: Brands are assured funds are held until work is delivered; Creators are assured payment is secured before production begins.
              </p>
              <p className="mt-3">
                <strong>7.2 Fee Structure.</strong> Loop charges a platform service fee on each transaction. The exact fee amount applicable to your account type and transaction is displayed in full on the deal summary screen before you confirm a gig. Fees are non-refundable except as expressly stated in these Terms or required by applicable law.
              </p>
              <p className="mt-3">
                <strong>7.3 Payment Processing.</strong> All payments are processed by Stripe, Inc. under Stripe&rsquo;s Terms of Service. By using the Platform, you agree to be bound by Stripe&rsquo;s applicable terms. Loop is not responsible for errors, delays, or failures caused by Stripe&rsquo;s systems or bank processing times.
              </p>
              <p className="mt-3">
                <strong>7.4 Creator Payouts.</strong> Creators must complete Stripe Connect onboarding to receive payouts. Loop initiates payout transfers promptly upon gig approval or auto-approval, but actual receipt of funds depends on Stripe and the Creator&rsquo;s financial institution. Loop is not liable for delays in payout caused by Stripe verification processes, bank processing times, or errors in the Creator&rsquo;s payout account information.
              </p>
              <p className="mt-3">
                <strong>7.5 Refunds and Cancellations.</strong> Refund eligibility on gig cancellation depends on the gig&rsquo;s current status at the time of cancellation. The applicable refund schedule is displayed to you at the time you initiate a cancellation. Once a deliverable has been approved and a payout has been released, no refund is available except in cases of demonstrable fraud or where required by applicable consumer protection law.
              </p>
              <p className="mt-3">
                <strong>7.6 Taxes.</strong> You are solely responsible for determining and satisfying all tax obligations arising from your use of the Platform, including income tax on earnings, VAT, GST, sales tax, and any withholding obligations. Loop may be required by law to report certain payment amounts to tax authorities. Loop does not provide tax advice, and you are encouraged to consult a qualified tax professional.
              </p>
              <p className="mt-3">
                <strong>7.7 Brand Balance.</strong> Brands may pre-load a platform balance, which can be applied toward future gig funding. Pre-loaded balances are non-refundable and non-transferable except as required by applicable law or in the event of account termination by Loop without cause.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">8. Creator Obligations</h2>
              <ul className="ml-5 list-disc space-y-2">
                <li><strong>Deliver conforming content.</strong> Creators must deliver content that materially conforms to the agreed brief, creative direction, and Gig Contract specifications within the agreed timeline.</li>
                <li><strong>FTC and advertising disclosure compliance.</strong> Creators must include clear and conspicuous disclosures (&ldquo;#ad,&rdquo; &ldquo;#sponsored,&rdquo; or equivalent language) on all sponsored content in compliance with the U.S. Federal Trade Commission&rsquo;s Guides Concerning Endorsements and Testimonials, the UK Advertising Standards Authority rules, and any other applicable local advertising disclosure laws.</li>
                <li><strong>Original content and rights ownership.</strong> Creators must only submit original content to which they hold all necessary rights, or for which they have obtained all required licenses, including with respect to third-party music, footage, trademarks, logos, and likeness rights. Creators represent and warrant that submitted content does not infringe any third-party intellectual property rights.</li>
                <li><strong>Post lifetime.</strong> Creators must maintain posted sponsored content on their social media channels for the minimum post lifetime specified in the Gig Contract.</li>
                <li><strong>Accurate profile information.</strong> Creators must maintain accurate follower counts, platform links, and profile data. Misrepresentation of audience size, engagement rates, or platform presence is a material breach and may result in account termination and reversal of payouts.</li>
                <li><strong>Professionalism.</strong> Creators must engage professionally with Brand counterparties, respond to messages within reasonable timeframes, and communicate proactively if deadlines cannot be met.</li>
                <li><strong>No artificial inflation.</strong> Creators may not purchase followers, engagement, views, or any other metric that misrepresents their organic audience or performance to Brands.</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">9. Brand Obligations</h2>
              <ul className="ml-5 list-disc space-y-2">
                <li><strong>Lawful and clear briefs.</strong> Brands must provide creative briefs that are clear, lawful, and free of misleading, defamatory, or illegal content. Briefs may not instruct Creators to make false claims about a product or to omit required disclosures.</li>
                <li><strong>Timely funding.</strong> Brands must fund the hold in full before a gig enters active production. Loop will not permit production to commence until the hold is fully funded.</li>
                <li><strong>Timely review.</strong> Brands must review submitted deliverables within the review window specified in the Gig Contract. Failure to approve or request revision within the auto-approval period constitutes acceptance of the deliverable, and the held funds will be released to the Creator.</li>
                <li><strong>Reasonable revision requests.</strong> Revision requests must be materially consistent with the original creative brief. Brands may not use the revision process to impose new requirements not contemplated by the Gig Contract.</li>
                <li><strong>Accurate brand information.</strong> Brands must provide accurate information about their company, website, and budget range. Misrepresentation of brand identity or intent is a material breach.</li>
                <li><strong>Non-circumvention.</strong> Brands may not contact, engage, negotiate with, or transact with any Creator they discovered through Loop outside of the Platform during the active gig period or within the 12-month non-circumvention period described in Section 5.</li>
                <li><strong>Lawful use of content.</strong> Brands may only use Creator content in accordance with the usage rights explicitly granted in the signed Gig Contract. Use of content beyond the scope of granted rights constitutes copyright infringement.</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">10. Intellectual Property Rights</h2>
              <p>
                <strong>10.1 Creator Ownership.</strong> Creators retain full ownership of all content they produce until the usage rights specified in the Gig Contract take effect. The existence of a Gig Contract does not by itself transfer any intellectual property rights to the Brand.
              </p>
              <p className="mt-3">
                <strong>10.2 Usage Rights.</strong> Upon completion of a gig and release of payment, the Brand receives only the specific usage rights explicitly defined in the signed Gig Contract (e.g., specified platforms, territories, durations, and permitted uses). All rights not expressly granted remain with the Creator.
              </p>
              <p className="mt-3">
                <strong>10.3 Loop Platform License.</strong> You grant Loop a limited, non-exclusive, royalty-free, worldwide license to: (a) display your profile data, name, handle, and portfolio items on the Platform to other users; (b) reproduce, distribute, and display your content within the Platform for the purpose of facilitating gig workflows; and (c) feature your name, handle, and publicly shared content in Loop&rsquo;s own marketing materials and case studies, subject to your prior consent for specific promotional uses.
              </p>
              <p className="mt-3">
                <strong>10.4 Loop Intellectual Property.</strong> All software, design, text, graphics, logos, icons, and technology comprising the Platform are owned by or licensed to Loop and are protected by applicable intellectual property laws. You may not copy, modify, distribute, sell, or create derivative works of any Loop intellectual property without our express written consent.
              </p>
              <p className="mt-3">
                <strong>10.5 DMCA Takedown.</strong> If you believe that content on the Platform infringes your copyright, please submit a notice to <a href="mailto:legal@loop.so" className="underline underline-offset-2">legal@loop.so</a> including: (a) a description of the copyrighted work; (b) the URL of the allegedly infringing content; (c) your contact information; (d) a statement of good faith belief; and (e) a statement of accuracy and authority under penalty of perjury.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">11. Prohibited Conduct</h2>
              <p className="mb-2">You agree not to:</p>
              <ul className="ml-5 list-disc space-y-1">
                <li>Circumvent, bypass, or attempt to bypass Loop&rsquo;s payment, funds-hold, or fee systems in any way.</li>
                <li>Take any Loop-originated creator-brand relationship off-platform in violation of Section 5.</li>
                <li>Post false, misleading, deceptive, or fraudulent information on your profile or in any gig communication.</li>
                <li>Misrepresent your identity, credentials, audience size, engagement rates, or affiliation with any brand or organization.</li>
                <li>Harass, threaten, intimidate, discriminate against, or abuse any other user, Loop employee, or third party.</li>
                <li>Upload, transmit, or link to malware, spyware, ransomware, or any other malicious or harmful code.</li>
                <li>Scrape, crawl, spider, or otherwise extract data from the Platform using automated tools without Loop&rsquo;s express written permission.</li>
                <li>Attempt to gain unauthorized access to any account, system, or network associated with the Platform.</li>
                <li>Reverse engineer, decompile, disassemble, or attempt to derive the source code of any part of the Platform.</li>
                <li>Use the Platform for any unlawful purpose, including but not limited to money laundering, fraud, or violation of any applicable export control laws.</li>
                <li>Create multiple accounts to evade suspension, circumvent usage limits, or manipulate review scores.</li>
                <li>Artificially inflate follower counts, engagement metrics, or deliverable performance data.</li>
                <li>Solicit other users&rsquo; personal information or passwords.</li>
                <li>Interfere with or disrupt the integrity or performance of the Platform or the data contained therein.</li>
                <li>Post or transmit content that is defamatory, obscene, pornographic, hateful, or otherwise objectionable.</li>
                <li>Use another user&rsquo;s content, profile data, or Loop tag without their consent.</li>
              </ul>
              <p className="mt-3">
                Violations of this section may result in immediate account suspension or permanent termination, forfeiture of any balance or held funds, civil or criminal liability, and referral to law enforcement where applicable. Loop may pursue all available legal and equitable remedies for prohibited conduct.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">12. Loop Tag and Creator Certification</h2>
              <p>
                Upon completing creator onboarding, each Creator receives a unique Loop tag (in the format LOOP-XXXX-XXXX) and an associated QR code. The Loop tag is issued as a certification of the Creator&rsquo;s verified platform presence and onboarding status and functions as a portable credential that Brands may scan to access the Creator&rsquo;s verified profile. Loop tags are personal to the Creator and may not be transferred, shared, or resold. Loop reserves the right to revoke or reassign a Loop tag if the associated account is suspended, terminated, or found to be fraudulent.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">13. Disputes Between Users</h2>
              <p>
                <strong>13.1 Dispute Initiation.</strong> Either party to a gig may initiate a dispute through the gig workspace if they believe the counterparty has failed to comply with the Gig Contract. Disputes must be initiated within 14 days of the event giving rise to the dispute.
              </p>
              <p className="mt-3">
                <strong>13.2 Loop&rsquo;s Role.</strong> Loop will review dispute submissions and may request additional evidence, documentation, or statements from either or both parties. Loop will endeavor to issue a dispute decision within 10 business days of receiving all required information.
              </p>
              <p className="mt-3">
                <strong>13.3 Finality of Funds-Hold Decisions.</strong> Loop&rsquo;s decision regarding the release, partial release, or return of held funds in a dispute is final and binding on all parties. Loop&rsquo;s liability in any dispute is limited to the amount held at the time the dispute is initiated.
              </p>
              <p className="mt-3">
                <strong>13.4 User-to-User Claims.</strong> Any legal claims arising between a Creator and a Brand that go beyond held amounts must be pursued independently between those parties. Loop is not a party to Gig Contracts and is not liable for damages arising from a counterparty&rsquo;s breach of a Gig Contract beyond the held amount.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">14. Content Standards and Moderation</h2>
              <p>
                Loop does not pre-screen content submitted through the Platform but reserves the right to remove any content that violates these Terms or our Content Standards. Content Standards prohibit: hate speech; content sexualizing minors; content that promotes violence or illegal activity; content that infringes third-party intellectual property rights; and content that is deceptive or fraudulent. Repeated violations of Content Standards will result in account termination. Users whose accounts are terminated for Content Standards violations will not be eligible for refunds of any kind.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">15. Disclaimers</h2>
              <p>
                THE PLATFORM IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. LOOP DOES NOT WARRANT THAT: (A) THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS; (B) THE RESULTS OBTAINED FROM USING THE PLATFORM WILL BE ACCURATE OR RELIABLE; (C) ANY CONTENT ON THE PLATFORM IS ACCURATE, COMPLETE, OR UP TO DATE; OR (D) ANY DEFECTS WILL BE CORRECTED. YOUR USE OF THE PLATFORM IS AT YOUR OWN RISK.
              </p>
              <p className="mt-3">
                LOOP MAKES NO WARRANTIES OR REPRESENTATIONS REGARDING THE QUALITY, SUITABILITY, OR PERFORMANCE OF ANY CREATOR OR BRAND ON THE PLATFORM. LOOP DOES NOT GUARANTEE THAT YOU WILL FIND SUITABLE COUNTERPARTIES, REACH AGREEMENT ON GIGS, OR ACHIEVE ANY SPECIFIC BUSINESS RESULTS FROM YOUR USE OF THE PLATFORM.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">16. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL LOOP, ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, LICENSORS, OR SERVICE PROVIDERS BE LIABLE FOR ANY: (A) INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES; (B) LOSS OF PROFITS, REVENUE, BUSINESS, OR GOODWILL; (C) LOSS OF DATA OR DATA CORRUPTION; (D) COST OF SUBSTITUTE GOODS OR SERVICES; OR (E) ANY OTHER LOSSES ARISING OUT OF OR RELATED TO THESE TERMS OR YOUR USE OF THE PLATFORM, EVEN IF LOOP HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
              <p className="mt-3">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, LOOP&rsquo;S AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR YOUR USE OF THE PLATFORM IS LIMITED TO THE GREATER OF: (A) THE TOTAL FEES PAID BY YOU TO LOOP IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM; OR (B) ONE HUNDRED U.S. DOLLARS ($100 USD).
              </p>
              <p className="mt-3">
                SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES. IN SUCH JURISDICTIONS, LOOP&rsquo;S LIABILITY WILL BE LIMITED TO THE GREATEST EXTENT PERMITTED BY APPLICABLE LAW.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">17. Indemnification</h2>
              <p>
                You agree to defend, indemnify, and hold harmless Loop, its affiliates, and their respective officers, directors, employees, agents, licensors, and service providers from and against any and all claims, damages, judgments, awards, losses, liabilities, costs, and expenses (including reasonable attorneys&rsquo; fees) arising out of or relating to: (a) your use or misuse of the Platform; (b) your violation of these Terms; (c) your violation of any applicable law, regulation, or third-party right; (d) any content you submit, post, or transmit through the Platform; (e) any dispute between you and another user; or (f) any circumvention of the Platform&rsquo;s payment systems. Loop reserves the right to assume the exclusive defense and control of any matter subject to indemnification by you, in which case you agree to cooperate with Loop&rsquo;s defense.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">18. Term and Termination</h2>
              <p>
                <strong>18.1 Term.</strong> These Terms are effective from the date you first access or use the Platform and continue until terminated.
              </p>
              <p className="mt-3">
                <strong>18.2 Termination by You.</strong> You may close your account at any time by contacting <a href="mailto:legal@loop.so" className="underline underline-offset-2">legal@loop.so</a>. Closing your account does not relieve you of any obligations arising prior to the date of closure, including payment obligations under active Gig Contracts.
              </p>
              <p className="mt-3">
                <strong>18.3 Termination by Loop.</strong> Loop may suspend or permanently terminate your account immediately, without notice or liability, if: (a) you breach any provision of these Terms; (b) we are required to do so by applicable law or a government order; (c) we reasonably believe that your account has been used for fraudulent or illegal activity; or (d) we discontinue the Platform. Where practicable, Loop will provide notice of termination and the reason therefor.
              </p>
              <p className="mt-3">
                <strong>18.4 Effect of Termination.</strong> Upon termination: (a) your right to access and use the Platform immediately ceases; (b) Loop may delete your account data in accordance with the Privacy Policy&rsquo;s retention schedule; (c) all payment obligations under active Gig Contracts remain in effect; and (d) provisions of these Terms that by their nature should survive termination — including Sections 5, 6, 7, 10, 15, 16, 17, 19, 20, and 21 — will survive and remain in full force.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">19. Governing Law</h2>
              <p>
                These Terms are governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict-of-law principles. The United Nations Convention on Contracts for the International Sale of Goods does not apply to these Terms.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">20. Dispute Resolution and Arbitration</h2>
              <p>
                <strong>20.1 Informal Resolution.</strong> Before initiating formal dispute resolution, you agree to first contact Loop at <a href="mailto:legal@loop.so" className="underline underline-offset-2">legal@loop.so</a> and attempt to resolve the dispute informally. Loop will attempt to resolve the dispute within 30 days of receiving your notice.
              </p>
              <p className="mt-3">
                <strong>20.2 Binding Arbitration.</strong> If informal resolution is unsuccessful, any dispute, claim, or controversy arising out of or relating to these Terms or the Platform that cannot be resolved informally will be resolved by binding arbitration administered by the American Arbitration Association (&ldquo;AAA&rdquo;) under its Consumer Arbitration Rules (available at www.adr.org), except as provided in Section 20.4 below. The arbitration will be conducted in English, and the arbitrator&rsquo;s decision will be final and binding and may be entered as a judgment in any court of competent jurisdiction.
              </p>
              <p className="mt-3">
                <strong>20.3 Class Action Waiver.</strong> TO THE EXTENT PERMITTED BY LAW, YOU AGREE THAT ANY DISPUTE RESOLUTION PROCEEDINGS WILL BE CONDUCTED ONLY ON AN INDIVIDUAL BASIS AND NOT IN A CLASS, CONSOLIDATED, OR REPRESENTATIVE ACTION. YOU WAIVE YOUR RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION.
              </p>
              <p className="mt-3">
                <strong>20.4 Exceptions.</strong> Either party may bring an individual action in small claims court. Either party may seek emergency injunctive or other equitable relief in any court of competent jurisdiction to prevent imminent harm to its rights, pending resolution through arbitration.
              </p>
              <p className="mt-3">
                <strong>20.5 Jury Trial Waiver.</strong> BY AGREEING TO THESE TERMS, YOU AND LOOP EACH WAIVE THE RIGHT TO A JURY TRIAL WITH RESPECT TO ANY CLAIM SUBJECT TO ARBITRATION.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">21. General Provisions</h2>
              <ul className="ml-5 list-disc space-y-1">
                <li><strong>Entire agreement.</strong> These Terms, together with the Privacy Policy and any Gig Contracts entered into through the Platform, constitute the entire agreement between you and Loop with respect to the Platform and supersede all prior and contemporaneous agreements, representations, and understandings.</li>
                <li><strong>Severability.</strong> If any provision of these Terms is held to be invalid, illegal, or unenforceable, the remaining provisions will continue in full force and effect, and the invalid provision will be modified to the minimum extent necessary to make it enforceable.</li>
                <li><strong>No waiver.</strong> Loop&rsquo;s failure to enforce any provision of these Terms on any occasion does not waive Loop&rsquo;s right to enforce that provision on any other occasion.</li>
                <li><strong>Assignment.</strong> You may not assign or transfer your rights or obligations under these Terms without Loop&rsquo;s prior written consent. Loop may assign these Terms freely, including in connection with a merger, acquisition, or sale of all or substantially all of its assets.</li>
                <li><strong>Force majeure.</strong> Loop will not be liable for any failure or delay in performance resulting from causes beyond its reasonable control, including natural disasters, war, terrorism, riots, civil unrest, government actions, internet disruptions, or third-party service failures.</li>
                <li><strong>Notices.</strong> Loop may provide notices to you via email to the address associated with your account or by posting notices on the Platform. You may provide notices to Loop at <a href="mailto:legal@loop.so" className="underline underline-offset-2">legal@loop.so</a>.</li>
                <li><strong>Language.</strong> These Terms are written in English, which is the governing language. Any translation provided for convenience does not affect the meaning or interpretation of these Terms.</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">22. Changes to These Terms</h2>
              <p>
                Loop reserves the right to revise these Terms at any time. We will provide at least 14 days&rsquo; advance notice of material changes by email and by a prominent notice on the Platform. The revised Terms will be effective on the date specified in the notice. Your continued use of the Platform after the effective date of any revision constitutes your acceptance of the revised Terms. If you do not agree to the revised Terms, you must stop using the Platform and may close your account before the effective date.
              </p>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-xl font-extrabold text-ink">23. Contact</h2>
              <p>
                For all legal inquiries, including questions about these Terms, the Privacy Policy, dispute filings, DMCA notices, and account termination requests, please contact:
              </p>
              <p className="mt-2">
                Loop · Legal Department<br />
                <a href="mailto:legal@loop.so" className="underline underline-offset-2">legal@loop.so</a>
              </p>
              <p className="mt-3 text-xs text-ink/50">
                Please include your account email and a brief description of your inquiry to help us route your request appropriately. We aim to respond to all legal inquiries within 5 business days.
              </p>
            </div>

          </div>
        </section>

        {/* Bottom */}
        <div className="mt-20 border-t border-ink/10 pt-8 text-center text-xs font-medium text-ink/30">
          © 2026 Loop · All rights reserved · <a href="mailto:legal@loop.so" className="underline underline-offset-2 hover:text-ink/60 transition-colors">legal@loop.so</a>
        </div>
      </div>
    </div>
  );
}
