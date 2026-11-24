
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bakmie Al-Ridha",
    short_name: "Bakmie Al-Ridha",
    description: "Aplikasi Kasir Digital Bakmie Al-Ridha",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#b91c1c",
  };
}
