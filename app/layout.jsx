import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Purwarupa Dashboard Rejofarm Integrated Farming",
  description: "Purwarupa Dashboard Rejofarm Integrated Farming - Monitoring Data Sensor IoT secara Real-time",
  icons: {
    icon: "/logo-rejofarm.jpeg",
  },
};

const themeScript = `
(function() {
  document.documentElement.classList.add('dark');
  document.documentElement.setAttribute('data-theme', 'dark');
  document.documentElement.style.colorScheme = 'dark';
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning className="dark" data-theme="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="icon" href="/logo-rejofarm.jpeg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}

