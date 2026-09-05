import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aapda Saarthi — Emergency SOS",
    short_name: "Aapda Saarthi",

    description:
      "Emergency SOS application for citizens during disasters and emergencies.",

    /*
     * IMPORTANT:
     * The installed PWA opens directly to the
     * Citizen SOS interface.
     */
    start_url: "/citizen",

    scope: "/",

    display: "standalone",
    orientation: "portrait-primary",

    background_color: "#F5F9FD",
    theme_color: "#0788D1",

    categories: [
      "emergency",
      "safety",
      "utilities",
    ],

    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}