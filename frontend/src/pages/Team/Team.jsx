import { Helmet } from "react-helmet-async";

import "../../styles/team.css";

const teamMembers = [
  {
    name: "Hariom",
    role: "CEO & Founder",
    bio: "Building RoomSlider to make room hunting simple for every student and professional in Indore.",
    image: "/team/hariom.jpg",
  },
];

function Team() {
  return (
    <>
      <Helmet>
        <title>Our Team | RoomSlider</title>
        <meta
          name="description"
          content="Meet the team behind RoomSlider — a student-built rental marketplace helping people find rooms, PGs, hostels and flats in Indore."
        />
      </Helmet>

      <section className="team-page">
        <div className="team-hero">
          <h1>Meet Our Team</h1>
          <p>The people building RoomSlider, one room at a time.</p>
        </div>

        <div className="team-grid">
          {teamMembers.map((member) => (
            <div className="team-card" key={member.name}>
              <div className="team-avatar">
                <img
                  src={member.image}
                  alt={member.name}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
              <h3>{member.name}</h3>
              <span className="team-role">{member.role}</span>
              <p>{member.bio}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export default Team;
