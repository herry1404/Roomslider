import "./Terms.css";

export default function Terms() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Terms of Use & Conditions</h1>
        <p className="legal-updated"><em>Last Updated: August 12, 2026</em></p>

        <p>Welcome to RoomSlider ("Platform", "we", "us", "our"), a rental property marketplace connecting Property Owners and Tenants in Indore. By accessing or using roomslider.in (the "Site") or our mobile application, you ("User") agree to be bound by these Terms of Use ("Terms"). If you do not agree, please do not use the Platform.</p>

        <h2>1. Definitions</h2>
        <ul>
          <li><strong>"Platform"</strong> means the RoomSlider website, mobile app, and all related services.</li>
          <li><strong>"Owner"</strong> means a property owner or manager onboarded by RoomSlider's Super Admin to list and manage rental rooms/properties.</li>
          <li><strong>"Tenant"</strong> means any registered user who browses, inquires about, or rents a room/property through the Platform.</li>
          <li><strong>"User"</strong> means any Owner, Tenant, or visitor of the Platform.</li>
          <li><strong>"Listing"</strong> means a room or property posted by an Owner on the Platform.</li>
          <li><strong>"Content"</strong> means text, images, documents, and data submitted by Users.</li>
        </ul>

        <h2>2. Nature of the Platform (Important)</h2>
        <p>RoomSlider is an <strong>intermediary technology platform</strong> that facilitates discovery, communication, rent tracking, and payment collection between Owners and Tenants. <strong>RoomSlider is not a landlord, tenant, broker, or party to any rental/lease agreement.</strong> We do not own, manage, or inspect any property listed on the Platform.</p>
        <p>Any rental agreement, lease, deposit arrangement, or tenancy created as a result of using the Platform is <strong>strictly between the Owner and the Tenant</strong>. RoomSlider is not responsible for verifying the legal ownership of a property, the accuracy of a Listing, or the conduct of any Owner or Tenant, though we may take reasonable steps to reduce fraud.</p>

        <h2>3. Eligibility & Account Registration</h2>
        <ul>
          <li>Users must be at least 18 years old and capable of entering into a legally binding contract under Indian law.</li>
          <li><strong>Owner accounts are created only by RoomSlider's Super Admin</strong> after verification; Owners cannot self-register.</li>
          <li>Tenants may self-register and are responsible for keeping their login credentials confidential.</li>
          <li>Users must provide accurate, current, and complete information during registration and keep it updated.</li>
        </ul>

        <h2>4. Owner Obligations</h2>
        <p>By listing a property, the Owner represents and warrants that:</p>
        <ul>
          <li>They have full legal right, title, or authorization to lease/rent the listed property.</li>
          <li>The Listing (photos, rent, deposit, availability, amenities) is accurate and not misleading.</li>
          <li>The property complies with applicable municipal, building safety, and local housing regulations (e.g., Indore Municipal Corporation rules).</li>
          <li>They will honor the terms disclosed to Tenants (rent amount, deposit, notice period) once a tenancy is confirmed.</li>
          <li>They are solely responsible for issuing rent receipts, handling deposits fairly, and complying with any applicable tenancy/rent control laws.</li>
          <li>Any tenant verification (ID proof, police verification where locally required) is the Owner's responsibility, not RoomSlider's.</li>
        </ul>

        <h2>5. Tenant Obligations</h2>
        <p>By using the Platform, the Tenant agrees that:</p>
        <ul>
          <li>Information provided (identity, contact details, payment details) is accurate.</li>
          <li>They will pay rent, deposits, and utility charges as agreed with the Owner through the Platform in a timely manner.</li>
          <li>They will not use the Platform to harass, defraud, or misrepresent themselves to any Owner.</li>
          <li>Any damage to property, violation of house rules, or breach of the rental agreement is a matter between the Tenant and the Owner.</li>
        </ul>

        <h2>6. Payments</h2>
        <ul>
          <li>RoomSlider uses third-party payment gateways (currently Razorpay) to facilitate rent, deposit, and utility payments.</li>
          <li>We do not store card/bank credentials; these are handled directly by the payment gateway under its own security standards (PCI-DSS).</li>
          <li>RoomSlider is not liable for payment gateway downtime, transaction failures, or delays caused by banks/payment processors.</li>
          <li>Refunds of security deposits or rent are the Owner's responsibility unless RoomSlider explicitly agrees in writing to mediate a specific refund.</li>
          <li>Any service fee or commission charged by RoomSlider (if applicable) will be clearly disclosed before a transaction.</li>
        </ul>

        <h2>7. Prohibited Activities</h2>
        <p>Users shall not:</p>
        <ul>
          <li>Post false, fraudulent, or duplicate Listings.</li>
          <li>Circumvent the Platform to avoid applicable fees (where fees exist).</li>
          <li>Use the Platform for any unlawful purpose, including harassment, discrimination, or fraud.</li>
          <li>Upload content that is obscene, defamatory, or infringes another person's rights.</li>
          <li>Attempt to hack, scrape, reverse-engineer, or disrupt the Platform's systems.</li>
        </ul>
        <p>RoomSlider reserves the right to suspend or terminate any account found violating these Terms, without prior notice, in serious cases.</p>

        <h2>8. Intellectual Property</h2>
        <p>All Platform branding, logos, design, and software are the property of RoomSlider. Users retain ownership of the Content they upload (e.g., property photos) but grant RoomSlider a non-exclusive, royalty-free license to display that Content on the Platform for the purpose of operating the service.</p>

        <h2>9. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law:</p>
        <ul>
          <li>RoomSlider is not liable for any dispute, loss, injury, or damage arising from a tenancy, rental agreement, or interaction between an Owner and a Tenant.</li>
          <li>RoomSlider is not liable for indirect, incidental, or consequential damages arising from use of the Platform.</li>
          <li>RoomSlider's total liability for any claim relating to the Platform shall not exceed the service fee (if any) paid by the User in the preceding 3 months.</li>
          <li>The Platform is provided on an "as is" and "as available" basis without warranties of uninterrupted or error-free operation.</li>
        </ul>

        <h2>10. Indemnification</h2>
        <p>Users agree to indemnify and hold harmless RoomSlider, its founders, and employees from any claims, damages, or legal costs arising from: (a) a User's breach of these Terms, (b) inaccurate Listing information, or (c) any dispute between an Owner and a Tenant.</p>

        <h2>11. Suspension & Termination</h2>
        <p>RoomSlider may suspend or terminate a User's access to the Platform for violation of these Terms, fraudulent activity, or at its reasonable discretion, with or without notice where necessary to protect the Platform or other Users.</p>

        <h2>12. Grievance Officer</h2>
        <p>In accordance with the Information Technology Act, 2000 and the Intermediary Guidelines and Digital Media Ethics Code Rules, 2021, the details of the Grievance Officer are:</p>
        <p>
          <strong>Name:</strong> Hariom Choudhary<br />
          <strong>Email:</strong> roomslider.in@gmail.com<br />
          <strong>Address:</strong> Indore, Madhya Pradesh, India<br />
          <strong>Response Time:</strong> Complaints will be acknowledged within 24 hours and resolved within 15 days.
        </p>

        <h2>13. Governing Law & Jurisdiction</h2>
        <p>These Terms are governed by the laws of India. Any disputes arising out of or in connection with these Terms shall be subject to the <strong>exclusive jurisdiction of the competent courts in Indore, Madhya Pradesh</strong>.</p>

        <h2>14. Changes to These Terms</h2>
        <p>RoomSlider may update these Terms from time to time. Continued use of the Platform after changes are posted constitutes acceptance of the revised Terms. Material changes will be notified via the Platform or registered email/contact.</p>

        <h2>15. Contact Us</h2>
        <p>
          <strong>Email:</strong> roomslider.in@gmail.com<br />
          <strong>Address:</strong> Indore, Madhya Pradesh, India
        </p>

        <p className="legal-disclaimer"><em>This document is a general template and does not constitute legal advice.</em></p>
      </div>
    </div>
  );
}
