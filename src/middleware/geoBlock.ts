
import { FastifyRequest, FastifyReply } from "fastify";
// @ts-ignore
import geoip from 'fast-geoip';

export async function geoBlockMiddleware(req: FastifyRequest, reply: FastifyReply) {
    // Skip if local dev? Maybe not, we want to test it.
    // But local IP (127.0.0.1) won't be in GeoIP DB.

    // WHITELIST: Infrastructure endpoints that must never be blocked
    if (req.url.startsWith('/v1/webhooks') || req.url === '/health' || req.url === '/db-ping') {
        return;
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Normalization if IP is array/comma-separated
    let finalIp = Array.isArray(ip) ? ip[0] : ip;
    if (typeof finalIp === 'string' && finalIp.includes(',')) {
        finalIp = finalIp.split(',')[0].trim();
    }

    if (!finalIp || finalIp === '127.0.0.1' || finalIp === '::1') {
        return; // Allow local
    }

    try {
        const geo = await geoip.lookup(finalIp);
        if (geo) {
            const country = geo.country; // 2-letter ISO code
            // Block US and EU
            // EU countries list is long. I should list them or use a helper.
            // Simplified list for now (major ones): DE, FR, IT, ES, nl, etc.
            // Or just check if 'EU' is returned? fast-geoip returns country code.
            // Strict compliance: All EU 27 members + US.

            const blockedCountries = [
                'US', // USA
                // EU Members (partial list for MVP, should be comprehensive)
                'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
            ];

            if (blockedCountries.includes(country)) {
                req.log.warn({ msg: "Geo-Block Triggered", ip: finalIp, country });
                return reply.status(403).send({
                    error: "Access Denied",
                    message: "Service not available in your region."
                });
            }
        }
    } catch (err) {
        req.log.error({ msg: "GeoIP Lookup Failed", err });
        // Fail open or closed? Usually fail OPEN if error (to avoid blocking legit users on system error), 
        // but for strict compliance maybe fail CLOSED?
        // Let's fail OPEN for MVP stability creates less friction, but log error.
    }
}
