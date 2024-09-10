import TerserPlugin from 'terser-webpack-plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {
    poweredByHeader: false,
    webpack: (config, options) => {
        config.optimization.minimizer = [
            new TerserPlugin({
                terserOptions: {
                    keep_fnames: true
                }
            })
        ]
        return config;
    }
};

export default nextConfig;
