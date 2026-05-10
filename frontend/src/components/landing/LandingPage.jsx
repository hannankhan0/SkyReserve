import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarCheck, CreditCard, Plane, ShieldCheck, Ticket, Zap } from 'lucide-react';
import AnimatedThemeToggler from '../ui/AnimatedThemeToggler';

const routeRows = [
  { from: 'LHR', to: 'NYC', time: '08:30', gate: 'A2', status: 'Boarding' },
  { from: 'KHI', to: 'ISB', time: '12:45', gate: 'B7', status: 'On time' },
  { from: 'ISB', to: 'JED', time: '19:10', gate: 'C1', status: 'Open' },
];

const featureCards = [
  { icon: Plane, title: 'Flight Search', copy: 'Find available routes, schedules, cabin classes, and live seat counts.' },
  { icon: CalendarCheck, title: 'Seat Holds', copy: 'Reserve selected seats temporarily before final booking confirmation.' },
  { icon: CreditCard, title: 'Payments', copy: 'Confirm bookings only when the payment matches the booking total.' },
  { icon: Ticket, title: 'Tickets', copy: 'Generate boarding passes and downloadable PDF tickets after payment.' },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link to="/" className="landing-brand" aria-label="SkyReserve home">
          <span className="brand-mark"><Plane size={18} /></span>
          <span>SkyReserve</span>
        </Link>
        <nav className="landing-nav-links" aria-label="Landing navigation">
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <Link to="/admin-login">Admin</Link>
          <AnimatedThemeToggler />
        </nav>
      </header>

      <section className="landing-hero" aria-label="SkyReserve landing hero">
        <div className="landing-hero-bg" aria-hidden="true">
          <span className="hero-grid"></span>
          <span className="hero-flight-path"></span>
          <span className="hero-orbit orbit-one"></span>
          <span className="hero-orbit orbit-two"></span>
        </div>

        <div className="landing-hero-content">
          <div className="hero-badge">
            <Zap size={13} aria-hidden="true" />
            Flight Reservation System
          </div>

          <h1>
            Book smarter.
            <br />
            Fly sooner.
          </h1>

          <p>
            Search flights, reserve seats, pay securely, and download your ticket in minutes.
          </p>

          <div className="landing-cta-row">
            <button className="landing-primary-cta" onClick={() => navigate('/login')}>
              Login to Book
              <ArrowRight size={18} aria-hidden="true" />
            </button>
            <button className="landing-secondary-cta" onClick={() => navigate('/register')}>
              Create Account
            </button>
          </div>

          <div className="landing-trust-row">
            <span><ShieldCheck size={15} /> JWT protected user and admin flows</span>
            <span><Ticket size={15} /> PDF ticket download after payment</span>
          </div>
        </div>

        <div className="landing-showcase" aria-label="Live flight board preview">
          <div className="showcase-toolbar">
            <span></span><span></span><span></span>
            <strong>Live Route Board</strong>
          </div>
          <div className="flight-ticket-preview">
            <div>
              <span className="muted-small">Next flight</span>
              <h2>LHR to NYC</h2>
              <p>SkyReserve 702 | Business seat selected</p>
            </div>
            <div className="ticket-price">Rs 74,000</div>
          </div>
          <div className="route-board">
            {routeRows.map((route) => (
              <div className="route-board-row" key={`${route.from}-${route.to}`}>
                <strong>{route.from}</strong>
                <span className="route-line"></span>
                <strong>{route.to}</strong>
                <em>{route.time}</em>
                <span>Gate {route.gate}</span>
                <i>{route.status}</i>
              </div>
            ))}
          </div>
          <div className="seat-preview">
            {Array.from({ length: 18 }).map((_, index) => (
              <span className={index === 3 || index === 11 ? 'selected' : index > 13 ? 'booked' : ''} key={index}></span>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section" id="features">
        <div className="section-heading">
          <span className="eyebrow">Core modules</span>
          <h2>Everything your airline workflow needs.</h2>
        </div>
        <div className="landing-feature-grid">
          {featureCards.map(({ icon: Icon, title, copy }) => (
            <article className="landing-feature-card" key={title}>
              <Icon size={22} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-workflow" id="workflow">
        <div>
          <span className="eyebrow">Demo flow</span>
          <h2>From admin schedule to passenger boarding pass.</h2>
        </div>
        <div className="workflow-steps">
          <span>Admin creates aircraft and schedule</span>
          <span>User searches flight and selects seats</span>
          <span>Payment confirms booking</span>
          <span>Ticket appears in My Tickets</span>
        </div>
      </section>
    </main>
  );
};

export default LandingPage;
