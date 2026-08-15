import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teacher Beta Privacy Notice | LessonCaptain',
  description: 'How LessonCaptain handles information submitted through the Founding Captain teacher beta application.',
  alternates: { canonical: '/privacy' },
};

const PRIVACY_EMAIL = 'beta@lessoncaptain.com';

export default function PrivacyPage() {
  return (
    <div className="px-5 pb-20 pt-10 sm:px-6 sm:pt-16">
      <article className="mx-auto max-w-3xl rounded-3xl border border-lc-border bg-lc-card/85 p-6 shadow-2xl backdrop-blur-md sm:p-10">
        <p className="font-instrument text-xs font-semibold uppercase tracking-[0.22em] text-lc-blue">
          Teacher beta privacy
        </p>
        <h1 className="mt-4 font-display text-4xl leading-tight text-white sm:text-5xl">
          Teacher Beta Privacy Notice
        </h1>
        <p className="mt-4 text-sm text-lc-text3">Last updated: August 15, 2026</p>
        <p className="mt-6 leading-relaxed text-lc-text2">
          This notice explains how Lesson Captain handles information submitted through the Founding Captain teacher beta application and related beta operations. Initial recruitment is open to online English teachers worldwide.
        </p>

        <Section title="Who handles your information">
          <p>
            The teacher beta is operated under the name Lesson Captain. Questions, consent withdrawals, and access, correction, or deletion requests can be sent to{' '}
            <a className="font-semibold text-lc-blue hover:text-lc-blue-hover" href={`mailto:${PRIVACY_EMAIL}`}>
              {PRIVACY_EMAIL}
            </a>.
          </p>
        </Section>

        <Section title="Information collected">
          <p>When you apply, Lesson Captain collects:</p>
          <ul>
            <li>your first name and email address;</li>
            <li>teaching format and learner levels;</li>
            <li>optional learner age band, typical class size, teaching platform, and teaching-challenge description;</li>
            <li>your beta-contact consent and its timestamp;</li>
            <li>sanitized campaign labels, the fixed <code>/beta</code> landing path, and a referring website origin and path without query strings or fragments; and</li>
            <li>a salted one-way hash derived from the request IP address for abuse prevention. The beta-attempt table does not store the raw IP address.</li>
          </ul>
          <p>
            If you continue with Google, Google sign-in creates or accesses your teacher account. Lesson Captain connects the beta application only when the signed-in email matches the application email. OAuth tokens are not stored in the beta application record.
          </p>
          <p>
            During the beta, the application record may also contain account-linking, onboarding, activity, follow-up, feedback, testimonial-permission, classroom-use confirmation, and internal support-note fields.
          </p>
        </Section>

        <Section title="How the information is used">
          <p>
            Lesson Captain uses this information to review applications, operate the Founding Captain cohort, provide onboarding and support, request optional feedback, protect the application endpoint, understand campaign effectiveness, and evaluate whether teachers reach meaningful classroom use.
          </p>
          <p>
            The required contact checkbox permits beta-access, onboarding, and feedback messages. You may withdraw that permission by emailing the address above. Withdrawal does not automatically delete an account or information needed to handle an existing request; deletion can be requested separately.
          </p>
        </Section>

        <Section title="Analytics">
          <p>
            Lesson Captain uses PostHog for limited teacher-funnel and product analytics. The four beta funnel events contain only the program name, the <code>/beta</code> landing path, and sanitized campaign labels. They do not contain applicant names, email addresses, free-text answers, student identity, or raw referrer query strings.
          </p>
          <p>
            After teacher sign-in, the teacher account identifier and email may be associated with product analytics. Students are not identified in PostHog, and PostHog session recording is disabled.
          </p>
        </Section>

        <Section title="Service providers">
          <p>Lesson Captain uses:</p>
          <ul>
            <li>Google for teacher authentication;</li>
            <li>Supabase for account, application, and beta-program data;</li>
            <li>Vercel for application hosting and infrastructure delivery; and</li>
            <li>PostHog for limited analytics.</li>
          </ul>
          <p>
            These providers may process technical and account information needed to provide their services and may maintain their own security and infrastructure logs under their applicable terms and retention practices.
          </p>
        </Section>

        <Section title="Retention and deletion">
          <p>
            Beta application and related beta-program records are kept for up to 12 months after your application or your most recent beta interaction, whichever is later. They are then deleted or anonymized unless they must be kept longer to address a security incident, legal obligation, or unresolved request.
          </p>
          <p>
            Abuse-prevention hashes older than 30 days are deleted when the application-attempt limiter next runs. If no later application attempt occurs, an expired hash may remain until the next claim triggers cleanup; Lesson Captain does not describe this as guaranteed deletion exactly on day 30.
          </p>
          <p>
            To request access, correction, or deletion, email{' '}
            <a className="font-semibold text-lc-blue hover:text-lc-blue-hover" href={`mailto:${PRIVACY_EMAIL}`}>
              {PRIVACY_EMAIL}
            </a>. Lesson Captain may need to verify that the request concerns your application or account before acting on it.
          </p>
        </Section>

        <Section title="Changes to this notice">
          <p>
            This notice will be updated when beta information practices or service providers materially change. The updated date above shows the current version.
          </p>
        </Section>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-9 space-y-4 text-sm leading-7 text-lc-text2 [&_code]:rounded [&_code]:bg-lc-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-lc-text [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}
