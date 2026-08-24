import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Ngopi Tegal, direktori kedai kopi dan tempat nongkrong";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 24,
          padding: 96,
          background: "#16211d",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 28,
            letterSpacing: 6,
            color: "#9db3a7",
            textTransform: "uppercase",
          }}
        >
          Direktori kedai
        </div>
        <div style={{ display: "flex", fontSize: 104, fontWeight: 700, color: "#eef3ec" }}>
          Ngopi
          <span style={{ color: "#d98324" }}>.</span>
          Tegal
        </div>
        <div style={{ display: "flex", fontSize: 40, color: "#d98324" }}>
          105 kedai kopi &amp; tempat nongkrong di Tegal
        </div>
      </div>
    ),
    size
  );
}
