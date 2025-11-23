import 'dotenv/config';
import multer from 'multer'
import express from 'express'
import { uploadFile,uploadMultipleFiles } from './file-upload-util.js'
import { downloadFile } from './download-print.js'
import { db } from './db.js';


const app = express();
app.use(express.json());



const port = 3000
const multerParse = multer({ 
    dest: './uploads/'
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))


app.post('/upload',
    multerParse.array('attachment', 3), 
    async (req, res) => {
        const attachments = req.files; 
        const {order_id}  = req.body;
        if (!attachments || attachments.length === 0) {
            return res.status(400).json({ error: 'No attachments uploaded' });
        }
        if (!order_id ) {
            return res.status(400).json({ error: 'Wrong Request' })
        }
        console.log('order_id:', order_id);

        const UploadResponse = await uploadMultipleFiles(attachments);
        if (!UploadResponse || UploadResponse.length === 0) {
            return res.status(500).json({ error: 'File upload failed' });
        }
        const urls = UploadResponse;
        if (UploadResponse && UploadResponse.length !== attachments.length) { 
            return res.status(500).json({ error: 'One or more file uploads failed' });
        }
        for (let i = 1; i < urls.length+1; i++) {
            console.log('URLS:', urls[i-1]);
            const insertQuery = `
                INSERT INTO photos (order_id, link_photo, position)
                VALUES ($1, $2, $3)
                RETURNING *;
            `;
            await db.query(
                insertQuery,
                [order_id, urls[i-1], i] 
            );
        }
        const data = db.query(
            'select * from photos where order_id = $1',
            [order_id]
        );
        console.log('Data after insert:', data);
        console.log('All files uploaded successfully');
        return res.status(201).json({ 
            message: `${attachments.length} files uploaded successfully`, 
            urls: UploadResponse, // Returns array of URLs
            data: data.rows
        });
        }
);

app.get('/get-photos/:order_id', async (req, res) => {
    const { order_id } = req.params;
    const data = await db.query(
        'select * from photos where order_id = $1',
        [order_id]
    );
    return res.status(200).json({ 
        message: `Photos for Order ID: ${order_id}`, 
        data: data.rows
    });
});

app.post('/upload-photos-final/:order_id',multerParse.fields([{
    name: 'attachment',
    }]), async (req, res) => {
        const attachment = req.files?.attachment?.[0];
        const {order_id}  = req.params;
        if (!attachment) {
            return res.status(400).json({ error: 'No attachment uploaded' });
        }
        const UploadResponse = await uploadFile(attachment)

        if (UploadResponse) {
            await db.query(
                'UPDATE orders SET final_photo = $1 WHERE id = $2 RETURNING *',
                [UploadResponse, order_id]
            );
            return res.status(201).json({ message: 'File Uploaded', url: UploadResponse})
        } else {
            return res.status(500).json({ error: 'File upload failed' })
        }
})

app.get('/', (req, res) => res.send('Hello World!'))
app.post('/',async (req, res) => {
    console.log('JOSS');
    res.send('Hello from POST!')})


app.post('/print/:order_id', async (req, res) => {
    const {order_id}  = req.params;
    if (!order_id) {
        return res.status(400).json({ error: 'No URL provided' })
    } 
    const photoData = await db.query(
        'select * from orders where id = $1',
        [order_id]
    );
    const url = photoData.rows[0]?.final_photo;
    console.log('Print URL:', url);

    const PrintResponse = await downloadFile(url)
    if (PrintResponse) {
        return res.status(201).json({ message: 'File Printed'})
    } else {
        return res.status(500).json({ error: 'File print failed' })
    }
    })

app.post('/template', async (req, res) => {
    const {order_id, template_type, template_photos}  = req.body;
    if (!template_type) {
        return res.status(400).json({ error: 'Wrong Request' })
    } 
    if (!template_photos) {
        return res.status(400).json({ error: 'Wrong Request' })
    } 
    const updateQuery = `
        UPDATE orders 
        SET template_type = $2, 
        template_photos = $3
        WHERE id = $1
        RETURNING *;
    `;
    
    const result = await db.query(
        updateQuery,
        [order_id, template_type, template_photos]
    );
    return res.status(201).json({ message: `Template updated for Order ID: ${order_id}`, 
            data: result.rows[0]})

})
app.post('/start', async (req, res) => {
    const insertData = await db.query(
        'INSERT INTO orders (payment_status) VALUES (false) RETURNING *'
    );
    return res.status(201).json({ 
        message: 'Order Started',
        data: insertData.rows[0],
        order_id: insertData.rows[0].id, 
    })
})



app.post('/payment', async (req, res) => {
    const {order_id} = req.body;
    if (!order_id ) {
        return res.status(400).json({ error: 'Wrong Request' })
    }
    const SERVER_KEY = process.env.MT_SERVER_KEY;
    const NOTIFICATION_URL = process.env.MT_NOTIFICATION_URL
    const API_URL = process.env.MT_API_URL;
    const authString = `${SERVER_KEY}:`;
    const base64Auth = Buffer.from(authString).toString('base64');
    const authorizationHeader = `Basic ${base64Auth}`;

    if (!SERVER_KEY) {
        console.error("Error: MIDTRANS_SERVER_KEY is not set. Please check your .env file.");
        process.exit(1);
    }

    // console.log("Authorization Header:", authorizationHeader);
    const payload = {
        payment_type: "qris",
        transaction_details: {
            order_id: order_id.toString(),
            gross_amount: 10
        }
    };

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': authorizationHeader,
            'X-Override-Notification': NOTIFICATION_URL
        },
        body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (response.ok) {
        return res.status(201).json({ 
            message: 'Payment QR Generated',
            data: data,
        })
    } else {
        console.error("Midtrans API Error:", data);
        return res.status(500).json({ error: 'Midtrans API Error', details: data })
    }
})

app.post('/midtrans-notification', async (req, res) => {
    console.log('Midtrans Notification Received:');
    const notification = req.body;
    console.log('Midtrans JOS Received:');
    console.log(notification);

    const {order_id, transaction_status, status_code, signature_key, } = notification;

    if (!order_id || !transaction_status || !status_code || !signature_key) {
        return res.status(400).json({ error: 'Invalid notification payload' })
    }

    if (transaction_status === 'settlement' && status_code === '200') {
        const updateData = await db.query(
            'UPDATE orders SET payment_status = true WHERE id = $1 RETURNING *',
            [order_id]
        );
        console.log('Order Updated:', updateData.rows[0]);
        return res.status(200).json({
             message: 'Payment confirmed',
             order_id: order_id, 
             data: updateData.rows[0] })
    } 
});

