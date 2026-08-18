import { Link } from "react-router-dom";

const WHEEL_TEXT =
  "MARKET RESEARCH • NEUROMARKETING • BRANDING • PERFORMANCE MARKETING • SEO • SOCIAL MEDIA • ";

export default function ServiceWheel({ className = "" }) {
  return (
    <Link
      to="/services"
      data-testid="nav-service-wheel"
      aria-label="Explore our services"
      title="Explore our services"
      className={`relative hidden md:flex items-center justify-center w-11 h-11 shrink-0 ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full animate-[spin_16s_linear_infinite] [animation-play-state:running] hover:[animation-play-state:paused] pointer-events-none"
      >
        <defs>
          <path id="wheelCircle" d="M 50,50 m -41,0 a 41,41 0 1,1 82,0 a 41,41 0 1,1 -82,0" />
        </defs>
        <text className="fill-vermilion" style={{ fontSize: "7.6px", letterSpacing: "0.4px", fontWeight: 700 }}>
          <textPath href="#wheelCircle" startOffset="0%">
            {WHEEL_TEXT}
          </textPath>
        </text>
      </svg>
      <span className="w-[7px] h-[7px] rounded-full bg-vermilion" />
    </Link>
  );
}
