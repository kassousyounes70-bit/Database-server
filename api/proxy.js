export default async function handler(req, res) {
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).send('الرابط مفقود');
    }
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            return res.status(response.status).send('فشل جلب الملف من المصدر');
        }
        
        const contentType = response.headers.get('content-type');
        
        // إضافة ترويسات تخطي CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        res.status(200).send(buffer);
    } catch (error) {
        res.status(500).send('خطأ في الخادم الوسيط: ' + error.message);
    }
}
