import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizeListingImages, safeImageUrl } from "../src/lib/listing-images";

describe("listing image normalization and rendering fallback", () => {
  it("accepts safe external image URLs and rejects malformed, empty, non-https, local, and tracking-pixel URLs", () => {
    expect(safeImageUrl("https://images.reverb.com/listing.jpg")).toBe("https://images.reverb.com/listing.jpg");
    expect(safeImageUrl("https://rvb-img.reverb.com/image/upload/s--abc123--/t_card-square/v1700000000/listing")).toBe("https://rvb-img.reverb.com/image/upload/s--abc123--/t_card-square/v1700000000/listing");
    expect(safeImageUrl("https://unknown-retailer-cdn.example/assets/listing-image?signature=abc123&expires=999")).toBe("https://unknown-retailer-cdn.example/assets/listing-image?signature=abc123&expires=999");
    expect(safeImageUrl("https://img.search-provider.example/thumbnail?id=abc&sig=keep-me")).toBe("https://img.search-provider.example/thumbnail?id=abc&sig=keep-me");
    expect(safeImageUrl("")).toBeUndefined();
    expect(safeImageUrl("not a url")).toBeUndefined();
    expect(safeImageUrl("http://images.reverb.com/listing.jpg")).toBeUndefined();
    expect(safeImageUrl("https://localhost/listing.jpg")).toBeUndefined();
    expect(safeImageUrl("https://192.168.0.1/listing.jpg")).toBeUndefined();
    expect(safeImageUrl("https://example.com/tracking-pixel.gif")).toBeUndefined();
    expect(safeImageUrl("https://example.com/page.html")).toBeUndefined();
  });

  it("deduplicates gallery images and keeps source-backed image metadata", () => {
    const images = normalizeListingImages([
      { url: "https://images.reverb.com/a.jpg", source: "json-ld", alt: "A", isSourceBacked: true },
      { url: "https://images.reverb.com/a.jpg", source: "open-graph", alt: "A duplicate", isSourceBacked: true },
      { url: "https://images.reverb.com/b.webp", source: "open-graph", alt: "B", isSourceBacked: true }
    ], "Guitar");

    expect(images).toHaveLength(2);
    expect(images.every(image => image.isSourceBacked)).toBe(true);
    expect(images[0].validationStatus).toBe("unchecked");
  });

  it("uses a reusable direct img component with onError placeholder fallback across listing surfaces", () => {
    const clientCode = readFileSync("src/app/finder-experience.tsx", "utf8");

    expect(clientCode).toContain("function ListingImageView");
    expect(clientCode).toContain("decoding=\"async\"");
    expect(clientCode).toContain("loading=\"lazy\"");
    expect(clientCode).toContain("onError={() =>");
    expect(clientCode).toContain("setIndex(currentIndex => currentIndex + 1)");
    expect(clientCode).toContain("<SourcePlaceholder listing={listing} />");
    expect(clientCode).toContain("<ListingImageView images={imageCandidatesForListing(listing)} listing={listing} />");
    expect(clientCode).toContain("<ListingImageView images={imageCandidatesForListing(item)} listing={item} />");
    expect(clientCode).toContain("<ListingImageView image={gallery[galleryIndex]} listing={listing} />");
    expect(clientCode).toContain("<ListingImageView image={image} listing={listing} />");
    expect(clientCode).not.toContain("next/image");
    expect(clientCode).not.toContain("/api/image");
    expect(clientCode).not.toContain("HEAD");
    expect(clientCode).not.toContain("webResultFallbackImage");
  });
});
