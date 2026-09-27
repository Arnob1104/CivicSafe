import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Zap,
  MapPin,
  Camera,
  Brain,
  BarChart3,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Users,
  ChevronRight,
  Lock,
  Globe,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  {
    icon: Brain,
    title: "Intelligent Classification",
    description:
      "Advanced AI models analyze uploaded media to automatically classify incident types, assess severity, and generate structured reports — reducing manual effort by 90%.",
  },
  {
    icon: Camera,
    title: "Rich Media Evidence",
    description:
      "Capture and attach high-resolution photos and videos directly to incident reports, creating a comprehensive digital evidence trail for every case.",
  },
  {
    icon: MapPin,
    title: "Precision Geolocation",
    description:
      "Automatic GPS tagging with reverse geocoding ensures first responders receive exact coordinates and human-readable addresses instantly.",
  },
  {
    icon: Zap,
    title: "Live Status Tracking",
    description:
      "Real-time status updates from submission through resolution. Citizens stay informed at every stage of the response lifecycle.",
  },
  {
    icon: BarChart3,
    title: "Command Center",
    description:
      "A unified admin dashboard with analytics, priority queues, and team coordination tools for managing all reported incidents at scale.",
  },
  {
    icon: Lock,
    title: "Enterprise-Grade Security",
    description:
      "End-to-end encryption, role-based access control, and SOC 2 compliant infrastructure ensure every report remains confidential and tamper-proof.",
  },
];

const stats = [
  { label: "Incidents Reported", value: "10,000+", icon: AlertTriangle },
  { label: "Active Communities", value: "250+", icon: Users },
  { label: "Avg. Response Time", value: "< 3 min", icon: Zap },
  { label: "Resolution Rate", value: "98.5%", icon: CheckCircle },
];

const steps = [
  {
    step: "01",
    title: "Document the Scene",
    desc: "Capture a photo or video of the incident. Our platform accepts all major media formats and optimizes uploads for speed.",
    icon: Camera,
  },
  {
    step: "02",
    title: "AI-Powered Analysis",
    desc: "Our machine learning engine classifies the incident category, assesses its severity level, and auto-generates a detailed report within seconds.",
    icon: Brain,
  },
  {
    step: "03",
    title: "Track Resolution",
    desc: "Monitor your report with real-time status updates as authorities and first responders coordinate and resolve the situation.",
    icon: CheckCircle,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/20 bg-background/70 backdrop-blur-2xl">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-green flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-foreground">
              CivicSafe
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Button
                variant="hero"
                size="sm"
                onClick={() => navigate("/dashboard")}
              >
                Dashboard <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/auth")}
                >
                  Sign In
                </Button>
                <Button
                  variant="hero"
                  size="sm"
                  onClick={() => navigate("/auth")}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[100dvh] flex items-center pt-16 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/80 to-background" />

        {/* Decorative orbs */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/6 rounded-full blur-[200px]" />
        <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-primary/4 rounded-full blur-[120px]" />

        <div className="container relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-5 py-2 mb-10">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-primary tracking-wide">
                AI-Powered Civic Intelligence Platform
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-[5.5rem] font-black tracking-[-0.04em] mb-7 max-w-5xl mx-auto leading-[0.95]">
              Smarter Incident Response
              <br />
              <span className="text-gradient-green">
                for Safer Communities
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed font-light">
              CivicSafe empowers citizens and authorities with AI-driven incident
              detection, real-time coordination, and seamless emergency reporting —
              transforming how communities stay protected.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <Button
                variant="hero"
                size="lg"
                className="text-base px-10 py-7 text-lg"
                onClick={() => navigate(user ? "/report" : "/auth")}
              >
                Report an Incident
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="hero-outline"
                size="lg"
                className="text-base px-10 py-7 text-lg"
                onClick={() => {
                  document
                    .getElementById("features")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Explore Platform
              </Button>
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.45 }}
            className="max-w-4xl mx-auto"
          >
            <div className="glass-card rounded-2xl p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="h-5 w-5 text-primary mx-auto mb-2.5" />
                  <p className="text-3xl font-extrabold text-foreground tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trusted by / social proof strip */}
      <section className="py-16 border-y border-border/10">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-6">
              Trusted by organizations across the nation
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
              {["Municipal Governments", "Emergency Services", "Law Enforcement", "Community Organizations", "Campus Safety"].map(
                (org) => (
                  <span
                    key={org}
                    className="text-sm font-medium text-muted-foreground/60 tracking-wide"
                  >
                    {org}
                  </span>
                )
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28 relative">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="inline-block text-xs font-semibold tracking-[0.2em] text-primary uppercase mb-4">
              Platform Capabilities
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5">
              Built for{" "}
              <span className="text-gradient-green">Mission-Critical</span>{" "}
              Response
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-light">
              A comprehensive suite of tools designed for citizens, first
              responders, and administrators to report, coordinate, and resolve
              incidents with unmatched efficiency.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 group hover:border-primary/30 hover:bg-card/80 transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-green-soft flex items-center justify-center mb-5 group-hover:glow-green-sm transition-all duration-300">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-28 relative border-t border-border/10">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="inline-block text-xs font-semibold tracking-[0.2em] text-primary uppercase mb-4">
              How It Works
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5">
              From Incident to Resolution
              <br />
              <span className="text-gradient-green">in Three Steps</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            {steps.map((item, i) => (
              <motion.div
                key={item.step}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="relative inline-flex items-center justify-center mb-8">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-green flex items-center justify-center shadow-lg shadow-primary/20">
                    <item.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <span className="absolute -top-2 -right-2 text-[10px] font-bold text-primary bg-background border border-primary/30 rounded-full h-7 w-7 flex items-center justify-center tracking-tight">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why CivicSafe */}
      <section className="py-28 border-t border-border/10">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16 items-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block text-xs font-semibold tracking-[0.2em] text-primary uppercase mb-4">
                Why CivicSafe
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6">
                The Future of{" "}
                <span className="text-gradient-green">Public Safety</span>{" "}
                Infrastructure
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8 font-light">
                Traditional incident reporting is slow, fragmented, and error-prone.
                CivicSafe replaces legacy systems with an AI-first platform that
                accelerates response times, improves data quality, and creates
                accountability across the entire incident lifecycle.
              </p>
              <div className="space-y-4">
                {[
                  "90% faster incident classification with AI",
                  "Unified dashboard for cross-department coordination",
                  "Citizen-first design with zero learning curve",
                  "Privacy-first architecture with full audit trails",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm text-foreground/80">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { icon: Globe, label: "Nationwide Coverage", value: "50 States" },
                { icon: Zap, label: "Uptime", value: "99.99%" },
                { icon: Lock, label: "Data Encrypted", value: "AES-256" },
                { icon: Users, label: "Active Users", value: "50K+" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="glass-card rounded-xl p-6 text-center"
                >
                  <item.icon className="h-5 w-5 text-primary mx-auto mb-3" />
                  <p className="text-2xl font-extrabold text-foreground tracking-tight">
                    {item.value}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">
                    {item.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28">
        <div className="container">
          <div className="glass-card rounded-3xl p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-green-soft" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[150px]" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[120px]" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 text-foreground">
                Ready to Modernize
                <br />
                <span className="text-gradient-green">Your Safety Infrastructure?</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto font-light">
                Join thousands of communities using CivicSafe to build safer, more
                responsive neighborhoods. Get started in under two minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  variant="hero"
                  size="lg"
                  className="text-base px-10 py-7 text-lg"
                  onClick={() => navigate(user ? "/dashboard" : "/auth")}
                >
                  Start Reporting Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="hero-outline"
                  size="lg"
                  className="text-base px-10 py-7 text-lg"
                  onClick={() => navigate("/auth")}
                >
                  Request a Demo
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-green flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">CivicSafe</span>
            </div>
            <div className="flex items-center gap-8">
              <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Privacy Policy
              </span>
              <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Terms of Service
              </span>
              <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Contact
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2026 CivicSafe. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
