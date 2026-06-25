import { describe, it, expect } from "vitest";
import { metadata } from "@/app/layout";

describe("SEO & Metadata Configuration", () => {
  it("should configure correct metadataBase for nostress.online", () => {
    expect(metadata.metadataBase?.toString()).toBe("https://nostress.online/");
  });

  it("should configure proper default title and title template", () => {
    expect(metadata.title).toBeDefined();
    if (typeof metadata.title === "object" && metadata.title !== null) {
      expect(metadata.title.default).toBe("No Stress | Immersive 3D Stress Relief Simulator");
      expect(metadata.title.template).toBe("%s | No Stress");
    } else {
      throw new Error("metadata.title is not an object");
    }
  });

  it("should configure keyword search terms for indexing", () => {
    expect(metadata.keywords).toContain("stress relief");
    expect(metadata.keywords).toContain("relaxation");
    expect(metadata.keywords).toContain("3d simulator");
    expect(metadata.keywords).toContain("zen");
  });

  it("should configure OpenGraph metadata matching specification", () => {
    expect(metadata.openGraph).toBeDefined();
    expect(metadata.openGraph?.title).toBe("No Stress | Immersive 3D Stress Relief Simulator");
    expect(metadata.openGraph?.url).toBe("https://nostress.online");
    expect(metadata.openGraph?.siteName).toBe("No Stress");

    const image = metadata.openGraph?.images?.[0];
    expect(image).toBeDefined();
    if (typeof image === "object" && image !== null) {
      expect(image.url).toBe("/og-image.png");
    } else {
      throw new Error("OG image metadata is invalid");
    }
  });

  it("should configure Twitter Card elements", () => {
    expect(metadata.twitter).toBeDefined();
    expect(metadata.twitter?.card).toBe("summary_large_image");
    expect(metadata.twitter?.creator).toBe("@nostress_online");
  });
});
