import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Acre Circle: unused land, unlimited potential. Shared micro-plots for Nova Scotia growers.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const hero = `data:image/jpeg;base64,${await readFile(join(process.cwd(), "public/images/hero-valley.jpg"), "base64")}`;
const mark = `data:image/png;base64,${await readFile(join(process.cwd(), "public/brand/acre-circle-mark.png"), "base64")}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", position: "relative", background: "#073F2B" }}>
        <img src={hero} alt="" width={1200} height={630} style={{ position: "absolute", top: 0, left: 0, objectFit: "cover", width: "100%", height: "100%" }} />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            backgroundImage: "linear-gradient(90deg, rgba(4,41,30,0.94) 0%, rgba(4,41,30,0.78) 48%, rgba(4,41,30,0.15) 100%)",
          }}
        />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <img src={mark} alt="" width={72} height={72} style={{ borderRadius: 36, background: "#FEFDF9" }} />
            <span style={{ color: "#FEFDF9", fontSize: 40, fontWeight: 700, letterSpacing: -0.5 }}>Acre Circle</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 720 }}>
            <span style={{ color: "#D8AA62", fontSize: 24, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase" }}>Nova Scotia · shared micro-plots</span>
            <span style={{ color: "#FEFDF9", fontSize: 76, fontWeight: 700, lineHeight: 1.05, marginTop: 16 }}>Unused land. Unlimited potential.</span>
            <span style={{ color: "rgba(254,253,249,0.8)", fontSize: 28, marginTop: 22, lineHeight: 1.35 }}>
              Map listings, check fit, request a plot, and plan shared land with a transparent constraint engine.
            </span>
          </div>
          <span style={{ color: "rgba(254,253,249,0.55)", fontSize: 20 }}>Hackathon prototype · all people, properties and figures are synthetic</span>
        </div>
      </div>
    ),
    size,
  );
}
