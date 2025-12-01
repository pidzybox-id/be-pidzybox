import 'dotenv/config';
import multer from 'multer'
import express from 'express'
import { uploadFile,uploadMultipleFiles } from './file-upload-util.js'
import { downloadFile } from './download-print.js'
import { sendPhotoEmail } from './send-email.js'
import { db } from './db.js';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors())
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const port = process.env.PORT || 8080;
const multerParse = multer({ 
    dest: './uploads/'
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

app.post('/upload',
    multerParse.array('attachment'),
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
        const data = await db.query(
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

app.get('/get-final-photo/:order_id', async (req, res) => {
    const { order_id } = req.params;
    const data = await db.query(
        'select * from orders where id = $1',
        [order_id]
    );
    const photoUrl = data.rows[0]?.final_photo;
    return res.status(200).json({ 
        message: `Photos for Order ID: ${order_id}`, 
        data: photoUrl
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

app.post('/email/:order_id', async (req, res) => { 
    const {order_id}  = req.params;
    const {email}  = req.body;
    if (!email) {
        return res.status(400).json({ error: 'No Email provided' })
    }
    const updateQuery = `
        UPDATE orders 
        SET email = $2
        WHERE id = $1
        RETURNING *;
    `;
    const result = await db.query(
        updateQuery,
        [order_id, email])
        
    
    const photo = await db.query(
        'select * from orders where id = $1',
        [order_id]
    );
    const finalPhotoUrl = photo.rows[0].final_photo;
    console.log('Final Photo URL:', finalPhotoUrl);
    
    const emailResponse = await sendPhotoEmail(email, finalPhotoUrl);

    const UpdateEmailStatusQuery = `
        UPDATE orders 
        SET send_email_status = $2
        WHERE id = $1
        RETURNING *;
    `;
    const emailStatusResult = await db.query(
        UpdateEmailStatusQuery,
        [order_id, emailResponse])
    
    return res.status(201).json({ message: `Email sent to ${email}`, 
        data: emailStatusResult.rows[0]})
})




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

    const updatePrintStatusQuery = `
        UPDATE orders 
        SET print_status = $2
        WHERE id = $1
        RETURNING *;
    `;
    const printStatusResult = await db.query(
        updatePrintStatusQuery,
        [order_id, PrintResponse]
    );

    if (PrintResponse) {
        return res.status(201).json({ message: 'File Printed'})
    } else {
        return res.status(500).json({ error: 'File print failed' })
    }
    })

app.post('/template', async (req, res) => {
    const {order_id, template_id}  = req.body;
    if (!template_id) {
        return res.status(400).json({ error: 'Wrong Request' })
    } 
    const updateQuery = `
        UPDATE orders 
        SET template_id = $2 
        WHERE id = $1
        RETURNING *;
    `;
    
    const result = await db.query(
        updateQuery,
        [order_id, template_id]
    );
    return res.status(201).json({ message: `Template updated for Order ID: ${order_id}`, 
            data: result.rows[0]})

})

app.get('/templates', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM templates ORDER BY id ASC');
        return res.status(200).json({ 
            message: "Template list",
            data: result.rows
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
});

app.get('/order/details/:order_id', async (req, res) => {
    const { order_id } = req.params;
    
    try {
        // PERBAIKAN: Tambahkan ::integer atau ::text agar tipe datanya cocok
        // Kita ubah o.template_id (text) menjadi integer agar bisa dibandingkan dengan t.id (integer)
        
        const query = `
            SELECT t.template_photos, t.template_type
            FROM orders o
            JOIN templates t ON CAST(o.template_id AS INTEGER) = t.id
            WHERE o.id = $1
        `;
        
        // OPSI LAIN (Jika cara di atas error karena ada data kosong):
        // Gunakan: JOIN templates t ON o.template_id = CAST(t.id AS TEXT)

        const result = await db.query(query, [order_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order or Template not found' });
        }

        const requiredAmount = parseInt(result.rows[0].template_photos);

        return res.status(200).json({ 
            message: "Order details fetched",
            data: {
                required_photos: requiredAmount,
                template_type: result.rows[0].template_type
            }
        });

    } catch (error) {
        console.error("Database Error Detail:", error); // Log error lengkap
        return res.status(500).json({ error: 'Database error' });
    }
});

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
    const { order_id } = req.body; // Ini harusnya angka, misal: 8

    // Validasi input
    if (!order_id) {
        return res.status(400).json({ error: 'Wrong Request: No Order ID' })
    }

    // --- TRIK AGAR MIDTRANS TIDAK 406 ---
    // Kita buat ID palsu khusus untuk Midtrans
    // Contoh: "8-171555999" (Unik setiap milidetik)
    const midtransUniqueId = `${order_id}-${Date.now()}`;

    // Config Midtrans
    const SERVER_KEY = process.env.MT_SERVER_KEY;
    const API_URL = process.env.MT_API_URL;
    const authString = `${SERVER_KEY}:`;
    const base64Auth = Buffer.from(authString).toString('base64');

    const payload = {
        payment_type: "qris",
        transaction_details: {
            // KIRIM ID YANG ADA BUNTUTNYA KE MIDTRANS
            order_id: midtransUniqueId, 
            gross_amount: 10
        }
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Basic ${base64Auth}`
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();

        // Cek log ini di terminal backend untuk memastikan sukses
        console.log("Midtrans Response:", data); 

        return res.status(201).json({ 
            message: 'Payment QR Generated',
            data: data,
        })
    } catch (error) {
        console.error("Midtrans Error:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
})

// Endpoint untuk FE mengecek apakah user sudah bayar
app.get('/order/status/:order_id', async (req, res) => {
    const { order_id } = req.params;
    try {
        const result = await db.query(
            'SELECT payment_status FROM orders WHERE id = $1',
            [order_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        return res.status(200).json({ 
            payment_status: result.rows[0].payment_status 
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Database error' });
    }
});

app.post('/midtrans-notification', async (req, res) => {
    const notification = req.body;
    const { order_id, transaction_status, status_code } = notification;

    console.log(`Notif masuk untuk Order: ${order_id} Status: ${transaction_status}`);

    // --- BERSIHKAN ID DARI BUNTUT TIMESTAMP ---
    // order_id dari midtrans: "8-171555999"
    // Kita ambil angka depannya saja: "8"
    const realOrderId = order_id.split('-')[0]; 

    if (transaction_status === 'settlement' && status_code === '200') {
        try {
            // Update Database pakai ID ASLI (Angka)
            const updateData = await db.query(
                'UPDATE orders SET payment_status = true WHERE id = $1 RETURNING *',
                [realOrderId] 
            );
            console.log('Payment Confirmed for Order:', realOrderId);
            return res.status(200).json({ status: 'OK' });
        } catch (dbError) {
            console.error("Database Error:", dbError);
            // Tetap return 200 ke Midtrans agar dia tidak kirim notif ulang terus
            return res.status(200).json({ status: 'OK' }); 
        }
    } else {
        // Status lain (pending/expire) tetap return OK
        return res.status(200).json({ status: 'OK' });
    }
});