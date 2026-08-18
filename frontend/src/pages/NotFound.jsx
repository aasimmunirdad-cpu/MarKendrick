import { Link } from "react-router-dom";
import { MaskLines } from "../components/motion";
import Seo from "../components/Seo";

export default function NotFound() {
  return (
    <div data-testid="not-found-page" className="min-h-[100svh] flex flex-col items-start justify-center px-5 sm:px-8 max-w-[1400px] mx-auto pt-20">
      <Seo title="404 - Lost Signal" description="This page doesn't exist. The insight does, though." />
      <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground mb-6">Error 404 - Lost Signal</p>
      <MaskLines
        lines={["THIS PAGE", "WENT OFF-BRIEF."]}
        className="font-display font-extrabold tracking-tight leading-[1.14] text-[11vw] sm:text-[7.5vw]"
      />
      <p className="text-muted-foreground mt-6 mb-10 max-w-md">The URL you followed doesn't map to anything we've published. It happens - even to research agencies.</p>
      <Link to="/" data-testid="not-found-home-button" className="inline-flex items-center gap-2 bg-vermilion hover:bg-vermilion-hover text-white font-semibold px-8 py-4 rounded-full transition-colors">
        Back to Base
      </Link>
    </div>
  );
}
