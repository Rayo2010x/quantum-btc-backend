
import geoip from 'geoip-lite';

const ips = ['103.4.250.27', '146.70.123.105', '202.8.42.136', '180.149.28.139', '95.177.180.82'];

ips.forEach(ip => {
    const geo = geoip.lookup(ip);
    console.log(`IP: ${ip} -> Country: ${geo ? geo.country : 'Unknown'} (${geo ? JSON.stringify(geo) : ''})`);
});
