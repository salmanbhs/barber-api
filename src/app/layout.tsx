import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Barber API",
  description: "A barbershop management API with SMS OTP authentication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
