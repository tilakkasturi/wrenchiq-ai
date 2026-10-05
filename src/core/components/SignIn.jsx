import { useState } from 'react';
import { signIn } from '../harness';
import { SHOP } from '../data';

/**
 * Mock sign-in for a shop user, shown when Core opens. Prefilled with the demo shop user from
 * resources/shop/core_shop_profile.json; Log in just enters the demo. No password, nothing is sent,
 * and the social buttons are shown for the look only.
 */
export default function SignIn({ logo }) {
  const [email, setEmail] = useState((SHOP.demoUser && SHOP.demoUser.email) || '');
  const login = e => {
    e.preventDefault();
    if (!email.trim()) return;
    signIn(email.trim()); // fresh shop profile on every login
  };
  return (
    <div className="signin">
      <div className="signin-brand">
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M16 3.5 26.8 9.75v12.5L16 28.5 5.2 22.25V9.75Z" /><circle cx="16" cy="16" r="4.6" /></svg>
        <b>WrenchIQ Basic</b>
      </div>
      <h1>Your trusted Automotive AI Agent for your Shop Operations</h1>
      <form className="signin-card" onSubmit={login}>
        <button type="button" className="signin-social" disabled title="Mock sign-in: use email below">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.5Z" /><path fill="#34A853" d="M12 23.5c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3A11.5 11.5 0 0 0 12 23.5Z" /><path fill="#FBBC05" d="M5.6 14.2a6.9 6.9 0 0 1 0-4.4v-3H1.8a11.5 11.5 0 0 0 0 10.4l3.8-3Z" /><path fill="#EA4335" d="M12 5.1c1.7 0 3.2.6 4.4 1.7l3.3-3.3A11.5 11.5 0 0 0 1.8 6.8l3.8 3C6.5 7.1 9 5.1 12 5.1Z" /></svg>
          Continue with Google
        </button>
        <button type="button" className="signin-social" disabled title="Mock sign-in: use email below">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9a4.8 4.8 0 0 0-3.8-2c-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9a5 5 0 0 0-4.2 2.6c-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.5 1.3 0 1.8-.8 3.3-.8 1.5 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5a11 11 0 0 0 1.4-2.9 4.4 4.4 0 0 1-2.6-4Zm-2.6-7.7A4.5 4.5 0 0 0 14.9 1.5a4.6 4.6 0 0 0-3 1.6 4.3 4.3 0 0 0-1.1 3.2 3.8 3.8 0 0 0 3-1.4Z" /></svg>
          Continue with Apple
        </button>
        <div className="signin-or">OR</div>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" aria-label="Email" autoComplete="off" />
        <button type="submit" className="signin-go" disabled={!email.trim()}>Log in</button>
        <p className="signin-fine">Demo sign-in for {SHOP.name}. No password, and nothing is sent anywhere.</p>
      </form>
      {logo && <div className="signin-predii"><span>by</span><span className="predii-mark" role="img" aria-label="Predii"><img src={logo} alt="" /></span></div>}
    </div>
  );
}
