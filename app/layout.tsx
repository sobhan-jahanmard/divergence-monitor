import type { Metadata } from "next";
import { Toaster } from "sonner";
import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/500.css";
import "@fontsource/vazirmatn/600.css";
import "@fontsource/vazirmatn/700.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "خانه‌نما | روند قیمت‌ها",
  description:
    "ثبت و مقایسه روند قیمت موارد مختلف با تتر و طلای ۱۸ عیار",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        {children}
        <Toaster
          dir="rtl"
          position="bottom-left"
          richColors
          closeButton
          containerAriaLabel="اعلان‌ها"
          customAriaLabel="اعلان"
          toastOptions={{ closeButtonAriaLabel: "بستن اعلان" }}
        />
      </body>
    </html>
  );
}
