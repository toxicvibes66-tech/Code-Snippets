const CURATED_TEMPLATES = [
  {
    id: 'seed-responsive-hero',
    title: 'Responsive Product Hero',
    category: 'landing',
    description: 'A responsive product introduction with a clear call to action.',
    code: '<section class="hero"><div><p class="eyebrow">New release</p><h1>Build something people love.</h1><p>Bring your next idea to life with a calmer workflow.</p><a href="#features">Explore the product</a></div></section>'
  },
  {
    id: 'seed-pricing-table',
    title: 'Three-Tier Pricing',
    category: 'saas',
    description: 'A compact pricing comparison for growing software teams.',
    code: '<section class="pricing"><article><h2>Starter</h2><p>For trying a new workflow.</p><strong>$0</strong></article><article><h2>Studio</h2><p>For teams ready to grow.</p><strong>$24</strong></article><article><h2>Scale</h2><p>For established teams.</p><strong>Let’s talk</strong></article></section>'
  },
  {
    id: 'seed-feature-grid',
    title: 'Product Feature Grid',
    category: 'landing',
    description: 'Three concise product benefits in a responsive grid.',
    code: '<section class="features"><article><h2>Move faster</h2><p>Start with proven building blocks.</p></article><article><h2>Stay focused</h2><p>Keep the important work in view.</p></article><article><h2>Ship with care</h2><p>Polish the details before launch.</p></article></section>'
  },
  {
    id: 'seed-signup-form',
    title: 'Accessible Signup Form',
    category: 'forms',
    description: 'A labelled email signup form with native validation.',
    code: '<form action="/subscribe" method="post"><label for="email">Work email</label><input id="email" name="email" type="email" autocomplete="email" required><button type="submit">Join the list</button></form>'
  },
  {
    id: 'seed-testimonial',
    title: 'Customer Testimonial',
    category: 'marketing',
    description: 'A quote and attribution block for customer stories.',
    code: '<figure class="quote"><blockquote>“The new workflow gave our team room to focus on the product.”</blockquote><figcaption><strong>Jordan Lee</strong><span>Product lead, Northstar</span></figcaption></figure>'
  },
  {
    id: 'seed-dashboard-stats',
    title: 'Analytics Stat Row',
    category: 'dashboard',
    description: 'A responsive set of high-signal product metrics.',
    code: '<section class="stats"><article><span>Active users</span><strong>12,480</strong><small>+8.2% this month</small></article><article><span>Conversion</span><strong>4.86%</strong><small>+0.6 points</small></article><article><span>Revenue</span><strong>$38.2k</strong><small>+12.4% this month</small></article></section>'
  },
  {
    id: 'seed-faq-list',
    title: 'FAQ Accordion',
    category: 'content',
    description: 'Native disclosure elements for accessible FAQs.',
    code: '<section class="faq"><details><summary>Can I change my plan?</summary><p>Yes. You can update your plan from account settings.</p></details><details><summary>Can I invite my team?</summary><p>Invite collaborators from your workspace.</p></details></section>'
  },
  {
    id: 'seed-newsletter-cta',
    title: 'Newsletter Callout',
    category: 'marketing',
    description: 'A focused newsletter signup with a short value statement.',
    code: '<section class="newsletter"><div><h2>Useful notes, occasionally.</h2><p>Product ideas and practical interface patterns, sent monthly.</p></div><form><label for="newsletter-email">Email address</label><input id="newsletter-email" type="email" required><button>Subscribe</button></form></section>'
  },
  {
    id: 'seed-team-cards',
    title: 'Team Profile Cards',
    category: 'content',
    description: 'A simple team directory with clear names and roles.',
    code: '<section class="team"><article><img src="/img.jpeg" alt="Portrait of Alex Morgan"><h2>Alex Morgan</h2><p>Design lead</p></article><article><img src="/Example.png.png" alt="Portrait of Sam Rivera"><h2>Sam Rivera</h2><p>Engineer</p></article></section>'
  },
  {
    id: 'seed-modal-dialog',
    title: 'Native Dialog Modal',
    category: 'components',
    description: 'A keyboard-accessible browser dialog with an explicit close action.',
    code: '<dialog id="confirm-dialog"><form method="dialog"><h2>Save changes?</h2><p>Your edits will be available to your team.</p><button value="cancel">Cancel</button><button value="confirm">Save changes</button></form></dialog><button onclick="document.querySelector(\'#confirm-dialog\').showModal()">Open dialog</button>'
  },
  {
    id: 'seed-comparison-table',
    title: 'Feature Comparison Table',
    category: 'saas',
    description: 'A semantic plan comparison with clear feature rows.',
    code: '<table><caption>Plan features</caption><thead><tr><th scope="col">Feature</th><th scope="col">Studio</th><th scope="col">Scale</th></tr></thead><tbody><tr><th scope="row">Projects</th><td>10</td><td>Unlimited</td></tr><tr><th scope="row">Team seats</th><td>5</td><td>Unlimited</td></tr></tbody></table>'
  },
  {
    id: 'seed-empty-state',
    title: 'Helpful Empty State',
    category: 'dashboard',
    description: 'A clear next step for a newly created workspace.',
    code: '<section class="empty-state"><span aria-hidden="true">□</span><h2>Your workspace is ready</h2><p>Create a project to see activity and progress here.</p><a href="/projects/new">Create a project</a></section>'
  }
];

module.exports = { CURATED_TEMPLATES };
