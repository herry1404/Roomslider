import { ExternalLink, MapPin, Utensils } from "lucide-react";
import { Link } from "react-router-dom";
import cafes from "../../data/cafes";
import "../../styles/admin/theme.css";
import "../../styles/admin/cafe-menus.css";

export default function CafeMenus() {
  return (
    <main className="admin-page cafe-menus-page">
      <header className="admin-page-header">
        <div>
          <span className="cafe-menus-eyebrow"><Utensils size={15} /> CAFE DIRECTORY</span>
          <h1>Cafe Menus</h1>
          <p>All public cafe menus and their locations in one place.</p>
          <Link className="admin-btn" to="/admin/analytics/menus">Direct menu analytics</Link>
        </div>
      </header>

      <section className="admin-analytics-card cafe-menus-table-card" aria-label="Cafe menus">
        <div className="cafe-menus-table-wrap">
          <table className="cafe-menus-table">
            <thead>
              <tr>
                <th scope="col">Cafe</th>
                <th scope="col">Location</th>
                <th scope="col">Address</th>
                <th scope="col">Menu</th>
                <th scope="col">Analytics</th>
              </tr>
            </thead>
            <tbody>
              {cafes.map((cafe) => (
                <tr key={cafe.id}>
                  <td data-label="Cafe"><strong>{cafe.name}</strong></td>
                  <td data-label="Location"><span className="cafe-menus-location"><MapPin size={14} />{cafe.area}</span></td>
                  <td data-label="Address">{cafe.address}</td>
                  <td data-label="Menu">
                    <a href={cafe.menuUrl} target="_blank" rel="noopener noreferrer">
                      Open menu <ExternalLink size={14} />
                    </a>
                  </td>
                  <td data-label="Analytics"><Link to={`/admin/analytics/cafe/${encodeURIComponent(cafe.id)}`}>View analytics</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
