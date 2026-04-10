/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.vercel-storage.com',
                port: '',
            },
            {
                protocol: 'https',
                hostname: '**.ibb.co',
                port: '',
            }
        ],
    },
};

export default nextConfig;
