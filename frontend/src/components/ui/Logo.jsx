import { Link } from "react-router-dom";

function Logo() {
  return (
    <Link to="/" className="logo" aria-label="RoomSlider Home">
      <div className="logo-icon">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 10.5L12 4L20 10.5V20H4V10.5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9.5 20V14H14.5V20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <span className="logo-text">
        <span className="logo-room">Room</span>
        <span className="logo-slider">Slider</span>
      </span>
    </Link>
  );
}

export default Logo;
