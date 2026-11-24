import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#070512",
          border: "1px solid #7E49C7",
          borderRadius: "4px",
          position: "relative",
        }}
      >
        <span
          style={{
            color: "#F4F1FA",
            fontSize: 18,
            fontWeight: 700,
            fontFamily: "sans-serif",
            lineHeight: 1,
          }}
        >
          M
        </span>
        <span
          style={{
            position: "absolute",
            right: 4,
            bottom: 4,
            width: 5,
            height: 5,
            backgroundColor: "#CBB6FF",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}