import type { Metadata } from "next";
import { PublicMenuView } from "@/components/public-menu/public-menu-view";
import { DEMO_MENU_ITEMS, DEMO_RESTAURANT } from "@/lib/demo-menu";

export const metadata: Metadata = {
  title: "Le Bistrot du Coin — Menu démo",
  description: "Découvrez un exemple de menu digital Smart Menu",
};

export default function DemoMenuPage() {
  return (
    <PublicMenuView
      restaurant={DEMO_RESTAURANT}
      items={DEMO_MENU_ITEMS}
      demoMode
    />
  );
}
