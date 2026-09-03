import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Kotihakemistossa on muitakin lockfileja; kerrotaan juuri suoraan.
    outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
}

export default nextConfig
