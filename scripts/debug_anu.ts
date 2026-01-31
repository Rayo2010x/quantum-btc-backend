
import "dotenv/config";

async function testAnu() {
    const urls = [
        "https://api.quantumnumbers.anu.edu.au/?length=1&type=hex16&size=1", // Minimal
        "https://api.quantumnumbers.anu.edu.au/?length=5&type=uint8",        // Simple uint8
        "https://api.quantumnumbers.anu.edu.au/?length=5&type=hex8&size=2",  // Hex8 test
    ];

    for (const url of urls) {
        console.log(`\n🔎 Testing: ${url}`);
        try {
            const headers: any = {};
            if (process.env.ANU_API_KEY) {
                headers["x-api-key"] = process.env.ANU_API_KEY;
            }

            const res = await fetch(url, { headers });
            console.log(`Status: ${res.status}`);
            if (res.ok) {
                const data = await res.json();
                console.log("Response:", JSON.stringify(data).substring(0, 100) + "...");
            } else {
                console.log("Text:", await res.text());
            }
        } catch (err) {
            console.error("Error:", err.message);
        }
    }
}

testAnu();
