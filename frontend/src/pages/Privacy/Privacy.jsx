import "./Privacy.css";

export default function Privacy() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Privacy Policy</h1>
        <p className="legal-updated"><em>Last Updated: August 12, 2026</em></p>

        <p>RoomSlider ("we", "us", "our") operates roomslider.in and the RoomSlider mobile app (the "Platform"). This Privacy Policy explains how we collect, use, store, and protect your personal data when you use the Platform, in line with India's Digital Personal Data Protection Act, 2023 ("DPDP Act") and the Information Technology Act, 2000.</p>
        <p>By using the Platform, you consent to the practices described in this Policy.</p>

        <h2>1. Information We Collect</h2>
        <p><strong>From all Users:</strong></p>
        <ul>
          <li>Name, phone number, email address</li>
          <li>Login credentials (password stored in encrypted/hashed form)</li>
          <li>Device/browser information, IP address, usage logs</li>
        </ul>
        <p><strong>From Tenants:</strong></p>
        <ul>
          <li>Booking and tenancy history</li>
          <li>Rent payment records and payment status</li>
          <li>Communication with Owners via the Platform</li>
          <li>Documents uploaded (e.g., ID proof, lease documents) where applicable</li>
        </ul>
        <p><strong>From Owners:</strong></p>
        <ul>
          <li>Property details, address, ownership/listing documents</li>
          <li>Bank/payout details (where required for receiving payments)</li>
          <li>Tenant management data they input (occupancy, payment records, expenses)</li>
        </ul>
        <p><strong>Payment Data:</strong></p>
        <p>Payments are processed via Razorpay. RoomSlider does <strong>not</strong> store your card, UPI, or bank credentials — these are handled directly by Razorpay under its own security and compliance standards.</p>

        <h2>2. How We Use Your Information</h2>
        <p>We use collected data to:</p>
        <ul>
          <li>Create and manage your account</li>
          <li>Match Tenants with Owner listings</li>
          <li>Process rent, deposit, and utility payments</li>
          <li>Send booking confirmations, rent reminders, and maintenance updates (including via WhatsApp links you initiate)</li>
          <li>Improve Platform performance and troubleshoot issues</li>
          <li>Comply with legal obligations and respond to lawful requests from authorities</li>
          <li>Prevent fraud and misuse of the Platform</li>
        </ul>
        <p>We do <strong>not</strong> sell your personal data to third parties.</p>

        <h2>3. Sharing of Information</h2>
        <p>We may share your information with:</p>
        <ul>
          <li><strong>Owners/Tenants</strong>, as necessary to facilitate a booking or tenancy (e.g., a Tenant's contact details shared with the Owner they're renting from, and vice versa)</li>
          <li><strong>Payment processors</strong> (Razorpay) to complete transactions</li>
          <li><strong>Cloud/hosting service providers</strong> (e.g., MongoDB Atlas, Render, Cloudinary) strictly for operating the Platform</li>
          <li><strong>Law enforcement or regulators</strong>, where required by Indian law</li>
        </ul>
        <p>We do not share your data with advertisers or unrelated third parties.</p>

        <h2>4. Data Storage & Security</h2>
        <ul>
          <li>Data is stored on secure cloud infrastructure (MongoDB Atlas) with access restricted to authorized personnel.</li>
          <li>Passwords are stored using industry-standard hashing (bcrypt).</li>
          <li>Despite reasonable security measures, no online system is 100% secure; RoomSlider cannot guarantee absolute security of data transmitted over the internet.</li>
        </ul>

        <h2>5. Your Rights</h2>
        <p>Under the DPDP Act, 2023, you have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate or outdated data</li>
          <li>Request deletion of your data (subject to legal/record-keeping requirements, e.g., active tenancy or payment records)</li>
          <li>Withdraw consent for non-essential processing at any time</li>
        </ul>
        <p>To exercise these rights, contact us at roomslider.in@gmail.com.</p>

        <h2>6. Data Retention</h2>
        <p>We retain personal data for as long as your account is active or as needed to provide services (e.g., tenancy history, payment records for accounting/legal purposes). Data may be retained longer where required by law.</p>

        <h2>7. Cookies & Tracking</h2>
        <p>The Platform may use cookies or local storage to keep you logged in and improve your experience. You can disable cookies in your browser, though this may affect Platform functionality.</p>

        <h2>8. Children's Privacy</h2>
        <p>The Platform is not intended for individuals under 18 years of age. We do not knowingly collect data from minors.</p>

        <h2>9. Grievance Officer</h2>
        <p>As required under the IT Rules, 2021, for any privacy-related complaints, contact:</p>
        <p>
          <strong>Name:</strong> Hariom Choudhary<br />
          <strong>Email:</strong> roomslider.in@gmail.com<br />
          <strong>Address:</strong> Indore, Madhya Pradesh, India<br />
          <strong>Response Time:</strong> Acknowledged within 24 hours, resolved within 15 days.
        </p>

        <h2>10. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. Material changes will be notified via the Platform or registered email. Continued use after changes constitutes acceptance.</p>

        <h2>11. Contact Us</h2>
        <p>
          <strong>Email:</strong> roomslider.in@gmail.com<br />
          <strong>Address:</strong> Indore, Madhya Pradesh, India
        </p>

        <p className="legal-disclaimer"><em>This document is a general template and does not constitute legal advice.</em></p>
      </div>
    </div>
  );
}
