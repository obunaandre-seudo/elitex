/** @type {import('next').NextConfig} */
const nextConfig = {
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