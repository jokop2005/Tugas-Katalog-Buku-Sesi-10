 const express = require('express');
const app = express();
const port = 3000;

// ==========================================
// KONFIGURASI AGAR TAMPILAN RAPI
// ==========================================

// 1. Agar JSON otomatis rapi (indentasi) di browser
app.set('json spaces', 2);

// 2. Middleware untuk membaca data JSON dari Postman
app.use(express.json());

// ==========================================
// DATABASE SEMENTARA (ARRAY)
// ==========================================
let books = [];
let orders = [];

// ==========================================
// HALAMAN UTAMA (WEBSITE SEDERHANA)
// ==========================================
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Katalog Buku API</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background-color: #f4f4f9; }
                    .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); max-width: 800px; margin: auto; }
                    h1 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    th { background-color: #3498db; color: white; }
                    tr:nth-child(even) { background-color: #f2f2f2; }
                    .tag { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
                    .tag-stock { background-color: #27ae60; color: white; }
                    .info { margin-top: 20px; padding: 15px; background-color: #e8f6f3; border-left: 5px solid #27ae60; color: #155724; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>📚 API Katalog Buku</h1>
                    <p>Status Server: <span style="color: green; font-weight: bold;">● Online</span></p>
                    
                    <h2>Daftar Buku Tersedia</h2>
                    ${books.length === 0 ? '<p><em>Belum ada buku. Silakan tambahkan lewat Postman.</em></p>' : ''}
                    
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Judul Buku</th>
                                <th>Penulis</th>
                                <th>Stok</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${books.map(b => `
                                <tr>
                                    <td><code>${b.id}</code></td>
                                    <td><strong>${b.title}</strong></td>
                                    <td>${b.author}</td>
                                    <td><span class="tag tag-stock">${b.stock} unit</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="info">
                        <strong>Tips:</strong> Gunakan <code>Postman</code> untuk mengakses endpoint:<br>
                        - POST /books (Tambah Buku)<br>
                        - PUT /books/:id/stock (Update Stok)<br>
                        - POST /orders (Buat Pesanan)
                    </div>
                </div>
            </body>
        </html>
    `);
});

// ==========================================
// 1. ENDPOINT: TAMBAH BUKU (POST)
// ==========================================
app.post('/books', (req, res) => {
    const { title, author, stock } = req.body;

    // Validasi Input
    if (!title || !author || stock === undefined) {
        return res.status(400).json({ 
            status: "error", 
            message: "Judul, Penulis, dan Stok wajib diisi!" 
        });
    }

    // Validasi Stok harus angka positif
    if (typeof stock !== 'number' || stock <= 0) {
        return res.status(400).json({ 
            status: "error", 
            message: "Stok harus berupa angka dan lebih dari 0" 
        });
    }

    const newBook = {
        id: Date.now(), // ID unik otomatis dari waktu sekarang
        title,
        author,
        stock
    };

    books.push(newBook);
    
    // Response 201 Created
    res.status(201).json({
        status: "success",
        message: "Buku berhasil ditambahkan",
        data: newBook
    });
});

// ==========================================
// 2. ENDPOINT: LIHAT / CARI BUKU (GET)
// ==========================================
app.get('/books', (req, res) => {
    const { search } = req.query;
    let result = books;

    // Jika ada pencarian ?search=Judul
    if (search) {
        result = books.filter(book => 
            book.title.toLowerCase().includes(search.toLowerCase())
        );
    }

    res.status(200).json({
        status: "success",
        data: result
    });
});

// ==========================================
// 3. ENDPOINT: UPDATE STOK (PUT)
// ==========================================
app.put('/books/:id/stock', (req, res) => {
    const bookId = parseInt(req.params.id);
    const { newStock } = req.body;

    const bookIndex = books.findIndex(b => b.id === bookId);

    if (bookIndex === -1) {
        return res.status(404).json({ 
            status: "error", 
            message: "Buku tidak ditemukan" 
        });
    }

    // Update data stok
    books[bookIndex].stock = newStock;

    res.status(200).json({
        status: "success",
        message: "Stok berhasil diperbarui",
        data: books[bookIndex]
    });
});

// ==========================================
// 4. ENDPOINT: BUAT PESANAN (POST)
// ==========================================
app.post('/orders', (req, res) => {
    const { bookId, quantity } = req.body;

    // Validasi
    if (!bookId || !quantity || quantity <= 0) {
        return res.status(400).json({ 
            status: "error", 
            message: "ID Buku dan Jumlah pesanan (harus > 0) wajib diisi" 
        });
    }

    const book = books.find(b => b.id === bookId);
    if (!book) {
        return res.status(404).json({ message: "Buku tidak ditemukan" });
    }

    const newOrder = {
        id: Date.now(),
        bookId,
        bookTitle: book.title,
        quantity,
        status: "pending" // Default status sesuai soal
    };

    orders.push(newOrder);

    res.status(201).json({
        status: "success",
        message: "Pesanan dibuat, menunggu konfirmasi",
        data: newOrder
    });
});

// ==========================================
// 5. ENDPOINT: KONFIRMASI PESANAN (POST)
// ==========================================
app.post('/orders/:id/confirm', (req, res) => {
    const orderId = parseInt(req.params.id);
    const orderIndex = orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
        return res.status(404).json({ message: "Pesanan tidak ditemukan" });
    }

    // Ubah status
    orders[orderIndex].status = "confirmed";

    res.status(200).json({
        status: "success",
        message: "Pesanan berhasil dikonfirmasi",
        data: orders[orderIndex]
    });
});

// Jalankan Server
app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});