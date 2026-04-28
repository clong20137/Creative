import { FiArrowRight, FiCheckCircle, FiLayers, FiLock, FiMonitor, FiRepeat, FiShield, FiSmartphone, FiZap } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

const coreBenefits = [
  {
    icon: FiLayers,
    title: 'Built for fast client work',
    text: 'Create pages quickly with reusable sections, synced blocks, demos, and responsive editing controls that keep projects moving.'
  },
  {
    icon: FiSmartphone,
    title: 'Responsive without guesswork',
    text: 'Tune sections for desktop, tablet, and mobile so each site feels polished before it ever goes live.'
  },
  {
    icon: FiLock,
    title: 'Private previews and approvals',
    text: 'Share unpublished preview links with clients so they can review a site safely before purchase or launch.'
  },
  {
    icon: FiRepeat,
    title: 'Designed for repeatable systems',
    text: 'Use templates, synced content, plugins, backups, and release tools to run website delivery like a product, not a scramble.'
  }
]

const featureBands = [
  {
    title: 'Everything needed to launch with confidence',
    points: [
      'Page builder with columns, sections, image cards, CTA blocks, and custom forms',
      'CRM, booking, events, protected content, blog, real estate, restaurant, and more',
      'SEO diagnostics, theme controls, media management, demos, and client previews',
      'Audit logs, backup tools, onboarding wizard, licensing, and client portal flows'
    ]
  },
  {
    title: 'Flexible enough for agencies or in-house teams',
    points: [
      'White-label controls for portal naming, branding, and powered-by messaging',
      'Client portal for billing, updates, plugin visibility, tickets, and license access',
      'Reusable layouts and synced blocks for faster builds across multiple projects',
      'Hosted model support today, with room for self-hosted licensed installs later'
    ]
  }
]

const useCases = [
  'Agencies that want to sell sites with recurring support',
  'Studios that need a faster client-preview and revision workflow',
  'Businesses that want one platform for marketing pages, plugins, leads, and updates'
]

const stats = [
  { label: 'Reusable layouts', value: 'Fast starts' },
  { label: 'Synced blocks', value: 'One edit, everywhere' },
  { label: 'Private previews', value: 'Client-ready' },
  { label: 'Plugin demos', value: 'Sales-friendly' }
]

function softwareSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'CreativeCMS',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    description: 'CreativeCMS is a website builder and client-delivery platform for selling, previewing, managing, and launching modern websites.'
  }
}

export default function CreativeCmsSalesPage() {
  return (
    <div className="site-theme bg-[var(--theme-background)] text-[var(--theme-heading)]">
      <SEO
        title="CreativeCMS"
        description="CreativeCMS is a client-ready website platform for building, previewing, managing, and selling modern websites with demos, plugins, SEO tools, and recurring service workflows."
        path="/creativecms-platform"
        image="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80"
        structuredData={softwareSchema()}
      />

      <section className="relative min-h-[82vh] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80"
          alt="Creative team planning a website project on a large display"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/72" />
        <div className="container relative flex min-h-[82vh] items-center py-24">
          <div className="max-w-4xl">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-blue-300">CreativeCMS</p>
            <h1 className="max-w-4xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              A website platform built to help us sell, preview, launch, and manage client sites faster.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
              CreativeCMS gives us the builder, demos, plugins, client portal, SEO tools, backup controls, and private preview flow needed to turn websites into a repeatable product.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/contact" className="btn-primary inline-flex items-center gap-2">
                Talk About CreativeCMS <FiArrowRight />
              </Link>
              <Link to="/plugins" className="btn-secondary inline-flex items-center gap-2">
                Explore the Plugin Stack
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((item) => (
                <div key={item.label} className="rounded-lg border border-white/15 bg-white/8 px-4 py-4 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-blue-200">{item.label}</p>
                  <p className="mt-2 text-lg font-bold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--theme-link)]">Why it works</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">CreativeCMS brings the sales side and the delivery side into one workflow.</h2>
            <p className="mt-4 text-lg leading-8 text-[var(--theme-body)]">
              Instead of patching together a page builder, client messaging, demos, plugins, previews, and launch tools, we can run the whole process from one system that was shaped around real client work.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {coreBenefits.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="rounded-lg border bg-[var(--theme-surface)] p-6 shadow-[var(--theme-shadow)]">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-blue-100 p-3 text-blue-700">
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{item.title}</h3>
                      <p className="mt-3 leading-7 text-[var(--theme-body)]">{item.text}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="container">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--theme-link)]">What’s inside</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">A productized website workflow, not just a pretty editor.</h2>
              <div className="mt-8 space-y-6">
                {featureBands.map((band) => (
                  <div key={band.title}>
                    <h3 className="text-xl font-bold">{band.title}</h3>
                    <ul className="mt-4 space-y-3">
                      {band.points.map((point) => (
                        <li key={point} className="flex items-start gap-3 text-[var(--theme-body)]">
                          <FiCheckCircle className="mt-1 shrink-0 text-green-600" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border bg-[var(--theme-surface)] shadow-[var(--theme-shadow)]">
              <img
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1400&q=80"
                alt="Website team reviewing layouts and launch details at a desk"
                className="h-full min-h-[420px] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="overflow-hidden rounded-lg border bg-[var(--theme-surface)] shadow-[var(--theme-shadow)]">
              <img
                src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80"
                alt="Modern workspace with screens and collaborative planning tools"
                className="h-full min-h-[420px] w-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--theme-link)]">Best fit</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">CreativeCMS is strongest when websites are part of an ongoing relationship.</h2>
              <p className="mt-4 text-lg leading-8 text-[var(--theme-body)]">
                It works especially well when we want to show demos, collect leads, share private previews, manage updates, and keep clients inside a branded portal after the build is done.
              </p>
              <div className="mt-8 space-y-4">
                {useCases.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <FiZap className="mt-1 shrink-0 text-blue-600" />
                    <p className="text-[var(--theme-body)]">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border bg-[var(--theme-surface)] p-5">
                  <FiMonitor className="text-blue-600" size={24} />
                  <h3 className="mt-3 text-lg font-bold">Demos that sell</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--theme-body)]">Show niche-specific examples before a client commits.</p>
                </div>
                <div className="rounded-lg border bg-[var(--theme-surface)] p-5">
                  <FiShield className="text-blue-600" size={24} />
                  <h3 className="mt-3 text-lg font-bold">Safer workflows</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--theme-body)]">Backups, audit logs, autosave, and private previews reduce risk.</p>
                </div>
                <div className="rounded-lg border bg-[var(--theme-surface)] p-5">
                  <FiRepeat className="text-blue-600" size={24} />
                  <h3 className="mt-3 text-lg font-bold">Recurring value</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--theme-body)]">Licensing, updates, and client portal access support subscription work.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-950 py-20 text-white">
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-300">Ready to use it</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">CreativeCMS is built to help us sell websites with more clarity and deliver them with less friction.</h2>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              If the goal is to package websites as a better product, this gives us the system, presentation, and client workflow to do it in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/contact" className="btn-primary inline-flex items-center gap-2">
                Start a CreativeCMS Conversation <FiArrowRight />
              </Link>
              <Link to="/plugins" className="btn-secondary inline-flex">
                See the Plugin Lineup
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
