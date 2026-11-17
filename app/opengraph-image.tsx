import { ImageResponse } from "next/og";

import { SITE_NAME } from "@/lib/site";

export const alt = "Openfield: free help for disabled people and their families";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default share image for every page (calm navy card, no photo).
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: "linear-gradient(135deg, #141c52 0%, #1f2a7a 100%)",
        color: "white",
      }}
    >
      <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: "-0.03em" }}>{SITE_NAME}</div>
      <div style={{ marginTop: 24, fontSize: 40, opacity: 0.9, maxWidth: 900, lineHeight: 1.3 }}>
        Free courses, devices to borrow, events and guides for families.
      </div>
    </div>,
    size,
  );
}
