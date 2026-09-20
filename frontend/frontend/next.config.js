/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '**.alicdn.com' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/webmail',
        destination: 'https://mail.privateemail.com',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
