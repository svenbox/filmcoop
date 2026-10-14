/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // Gamla enprojektslänkar (innan /p/[projectId]/...) leder till projektväljaren.
  async redirects() {
    return [
      { source: "/crew", destination: "/projekt", permanent: false },
      { source: "/producer", destination: "/projekt", permanent: false },
      { source: "/print", destination: "/projekt", permanent: false },
    ];
  },
};

module.exports = nextConfig;
