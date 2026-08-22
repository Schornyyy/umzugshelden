import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#2563eb",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}>
        <div
          style={{
            alignItems: "center",
            border: "24px solid white",
            borderRadius: 96,
            color: "white",
            display: "flex",
            fontSize: 236,
            fontWeight: 800,
            height: 352,
            justifyContent: "center",
            lineHeight: 1,
            width: 352,
          }}>
          U
        </div>
      </div>
    ),
    size
  );
}