import DoodleCanvas from "./components/doodle-canvas";
import styles from "./page.module.css";

function WavyDivider() {
  return (
    <div className={styles.divider}>
      <svg
        className={styles.dividerSvg}
        viewBox="0 0 120 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 10 C15 0, 25 20, 40 10 C55 0, 65 20, 80 10 C95 0, 105 20, 120 10"
          stroke="#FF6B6B"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
      </svg>
    </div>
  );
}

function StepCard({
  number,
  title,
  desc,
}: {
  number: number;
  title: string;
  desc: string;
}) {
  const colors = ["#FF6B6B", "#4ECDC4", "#A06CD5"];
  return (
    <div className={styles.stepCard}>
      <div className={styles.stepNumber} style={{ color: colors[number - 1] }}>
        {String(number).padStart(2, "0")}
      </div>
      <h3 className={styles.stepTitle}>{title}</h3>
      <p className={styles.stepDesc}>{desc}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureIcon}>{icon}</div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDesc}>{desc}</p>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <DoodleCanvas />
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="6" />
                <circle cx="8" cy="8" r="4" fill="var(--yellow)" />
              </svg>
              Real-time drawing game
            </div>

            <h1 className={styles.heroTitle}>
              Doodle
              <span className={styles.heroTitleAccent}>Dot</span>
            </h1>

            <p className={styles.heroSubtitle}>
              Draw wacky prompts, guess your friends&apos; doodles in real-time,
              and laugh until the timer runs out.
            </p>

            <div className={styles.heroCta}>
              <a href="/auth" className={styles.primaryBtn}>
                Start Drawing
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <a href="#how-it-works" className={styles.secondaryBtn}>
                How It Works
              </a>
            </div>
          </div>

          <div className={styles.scrollIndicator}>
            <div className={styles.scrollDot} />
          </div>
        </section>

        <WavyDivider />

        <section id="how-it-works" className={styles.section}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <p className={styles.sectionSubtitle}>
            Three simple steps to start the fun
          </p>

          <div className={styles.steps}>
            <StepCard
              number={1}
              title="Create a Room"
              desc="Start a new game room and share the code with your friends. No account needed to play."
            />
            <StepCard
              number={2}
              title="Draw the Prompt"
              desc="Get a surprise word and doodle it on the canvas before time runs out. Let your creativity loose."
            />
            <StepCard
              number={3}
              title="Guess & Win"
              desc="Watch your friends draw and type your guesses in real-time. First correct guess wins the round."
            />
          </div>
        </section>

        <WavyDivider />

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Why DoodleDot?</h2>
          <p className={styles.sectionSubtitle}>
            Everything you need for the perfect game night
          </p>

          <div className={styles.features}>
            <FeatureCard
              icon="🎨"
              title="Real-time Drawing"
              desc="Every stroke appears instantly on all players' screens. Smooth, lag-free doodling experience."
            />
            <FeatureCard
              icon="⚡"
              title="Quick Rounds"
              desc="Fast-paced rounds keep everyone engaged. No waiting around — the fun never stops."
            />
            <FeatureCard
              icon="🎯"
              title="Creative Prompts"
              desc="Hundreds of fun and unexpected prompts. From simple shapes to outrageous concepts."
            />
            <FeatureCard
              icon="👥"
              title="Party with Friends"
              desc="Supports 2-8 players per room. Perfect for game nights, icebreakers, or just hanging out."
            />
          </div>
        </section>

        <section className={styles.ctaSection}>
          <h2 className={styles.ctaTitle}>Ready to Doodle?</h2>
          <p className={styles.ctaSubtitle}>
            Join thousands of players and discover the joy of drawing badly with friends.
          </p>
          <a href="/auth" className={styles.ctaBtn}>
            Join the Fun
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </section>

        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <span className={styles.footerLogo}>DoodleDot</span>
            <div className={styles.footerLinks}>
              <a href="https://github.com/Vivek-103/DoodleDot" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </div>
            <span>&copy; {new Date().getFullYear()} DoodleDot. All rights reserved.</span>
          </div>
        </footer>
      </div>
    </>
  );
}
