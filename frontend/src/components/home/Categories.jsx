import { optimizeCloudinaryImage } from "../../utils/optimizeCloudinaryImage";
import { Link } from "react-router-dom";

import rooms from "../../assets/categories/rooms.webp";
import pg from "../../assets/categories/pg.webp";
import hostels from "../../assets/categories/hostels.webp";
import flats from "../../assets/categories/flats.webp";

const categories = [
  {
    id: 1,
    title: "Rooms",
    image: rooms,
    bg: "#eef8f1",
    path: "/rooms",
  },
  {
    id: 2,
    title: "PG",
    image: pg,
    bg: "#eef5ff",
    path: "/pg",
  },
  {
    id: 3,
    title: "Hostels",
    image: hostels,
    bg: "#f7efff",
    path: "/hostels",
  },
  {
    id: 4,
    title: "Flats",
    image: flats,
    bg: "#fff4ea",
    path: "/flats",
  },
];

function Categories() {
  return (
    <section className="categories" data-tour="categories">
      <div className="container">
        <div className="categories-grid">
          {categories.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className="category-card"
              style={{
                background: item.bg,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div className="category-image">
                <img src={optimizeCloudinaryImage(item.image, 960)} alt={item.title} loading="lazy" />
              </div>

              <div className="category-info">
                <h3>{item.title}</h3>
              </div>

              <span className="category-btn" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Categories;