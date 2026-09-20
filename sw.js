/* अंक पत्रक — Marks Folio | service worker
   यह फाइल index.html के साथ रखने पर ऐप बिना इंटरनेट भी चलेगा
   और फोन में "इंस्टॉल" का विकल्प आएगा। न रखें तो भी ऐप चलता रहेगा।
   कोड बदलने पर नीचे CACHE का नंबर बढ़ा दें — तभी नया version पहुँचेगा। */

const CACHE = "marksfolio-v1";

const SHELL = [
  "./",
  "./index.html",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  // पेज: पहले नेटवर्क, न मिले तो कैश (ताकि update मिलता रहे)
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
    );
    return;
  }

  // बाकी सब: पहले कैश, फिर नेटवर्क
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => hit))
  );
});
