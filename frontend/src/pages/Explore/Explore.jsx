import ComingSoonServices from "../../components/explore/ComingSoonServices";
import SEO, { PAGE_SEO } from "../../components/SEO";

function Explore() {
  return (
    <div className="container" style={{ padding: "24px 0 40px" }}>
      <SEO
        {...PAGE_SEO.explore}
        breadcrumbs={[{ name: "Home", path: "/" }, { name: "Explore Indore", path: "/explore" }]}
      />

      <h1 style={{ marginBottom: "16px" }}>Explore Rentals and Services in Indore</h1>

      <ComingSoonServices />
    </div>
  );
}

export default Explore;
