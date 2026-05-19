import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h1>How this example works</h1>
      <p>
        Reaching this page is itself a tracked event: Angular's router navigates
        with the History API (<code>history.pushState</code>), which the Formo
        SDK wraps on init — so client-side route changes are captured as
        <code>page</code> events with no extra code.
      </p>

      <h2>Integration points</h2>
      <ul>
        <li>
          <strong>FormoAnalyticsService</strong> wraps the vanilla
          <code>FormoAnalytics.init()</code> core. The SDK's React provider and
          <code>useFormo()</code> hook are not used.
        </li>
        <li>
          <strong>provideAppInitializer</strong> runs <code>init()</code> before
          bootstrap, so autocapture wraps <code>window.ethereum</code> before
          any wallet interaction.
        </li>
        <li>
          <strong>WalletService</strong> connects over the bare EIP-1193
          provider and uses viem for <code>signMessage</code> /
          <code>sendTransaction</code>.
        </li>
      </ul>

      <h2>What is captured automatically</h2>
      <p>
        Page views, wallet connect / disconnect, chain switches, signatures and
        transactions are all autocaptured. The only manual SDK calls are
        <code>identify()</code> after a wallet connects and <code>track()</code>
        for the custom event button.
      </p>

      <p><a routerLink="/">← Back to the demo</a></p>
    </section>
  `,
  styles: `
    :host {
      display: block;
      max-width: 640px;
      margin: 0 auto;
    }
    h1 {
      font-size: 1.5rem;
      margin: 0 0 0.75rem;
    }
    h2 {
      font-size: 1.05rem;
      margin: 1.5rem 0 0.5rem;
    }
    p {
      color: var(--text-dim);
      line-height: 1.6;
    }
    ul {
      color: var(--text-dim);
      line-height: 1.7;
      padding-left: 1.1rem;
    }
    a {
      color: var(--accent);
    }
  `,
})
export class About {}
