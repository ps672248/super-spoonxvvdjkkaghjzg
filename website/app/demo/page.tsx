import { redirect } from "next/navigation";

const DEMO_URL = "https://aspirant-arcade-fwa8.vercel.app/";

export const metadata = {
  title: "Try Web — Aspirant Arcade",
  description: "Try Aspirant Arcade live in your browser. Free quiz on PSU and board exam topics — no download or signup needed.",
};

export default function DemoPage() {
  redirect(DEMO_URL);
}
