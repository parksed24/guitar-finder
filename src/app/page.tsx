import { allListingResults } from "@/lib/catalog-presenter";
import FinderExperience from "./finder-experience";

export default function Home() {
  return <FinderExperience initialListings={allListingResults()} />;
}
