const express = require('express');
const app = express();
const port = 3000;

// ==========================================
// KONFIGURASI AGAR JSON RAPI
// ==========================================
// Ini membuat output JSON di browser otomatis turun ke bawah (indentasi)
app.set('json spaces', 2);

// Middleware untuk membaca data JSON dari request body
app.use(express.json());

// Database Sementara (Array)
let books = [];
let orders = [];

// ==========================================
// 1. ROOT ENDPOINT (Cek Status Server)
// ==========================================
app.get('/', (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Server API Katalog Buku Berjalan",
        info: "Gunakan endpoint /books atau /orders"
    });
});

// ==========================================
// 2. GET /books (Lihat & Cari Buku)
// ==========================================
app.get('/books', (req, res) => {
    const { search } = req.query;
    let result = books;

    // Logika Pencarian
    if (search) {
        result = books.filter(book => 
            book.title.toLowerCase().includes(search.toLowerCase())
        );
    }

    res.status(200).json({
        status: "success",
        total: result.length,
        data: result
    });
});

// ==========================================
// 3. POST /books (Tambah Buku)
// ==========================================
app.post('/books', (req, res) => {
    const { title, author, stock } = req.body;

    // Validasi Input [cite: 77]
    if (!title || !author || stock === undefined) {
        return res.status(400).json({
            status: "error",
            message: "Gagal: Judul, Penulis, dan Stok wajib diisi!"
        });
    }

    // Validasi Tipe Data Stok [cite: 78]
    if (typeof stock !== 'number' || stock <= 0) {
        return res.status(400).json({
            status: "error",
            message: "Gagal: Stok harus berupa angka dan lebih dari 0"
        });
    }

    const newBook = {
        id: Date.now(),
        title,
        author,
        stock
    };

    books.push(newBook);

    // Response 201 Created [cite: 41]
    res.status(201).json({
        status: "success",
        message: "Buku berhasil ditambahkan",
        data: newBook
    });
});

// ==========================================
// 4. PUT /books/:id/stock (Update Stok)
// ==========================================
app.put('/books/:id/stock', (req, res) => {
    const bookId = parseInt(req.params.id);
    const { newStock } = req.body;

    const bookIndex = books.findIndex(b => b.id === bookId);

    // Error Handling jika buku tidak ketemu [cite: 42]
    if (bookIndex === -1) {
        return res.status(404).json({
            status: "error",
            message: "Buku tidak ditemukan"
        });
    }

    // Update stok
    books[bookIndex].stock = newStock;

    res.status(200).json({
        status: "success",
        message: "Stok berhasil diperbarui",
        data: books[bookIndex]
    });
});

// ==========================================
// 5. GET /orders (Lihat Daftar Pesanan)
// ==========================================
app.get('/orders', (req, res) => {
    res.status(200).json({
        status: "success",
        total: orders.length,
        data: orders
    });
});

// ==========================================
// 6. POST /orders (Buat Pesanan)
// ==========================================
app.post('/orders', (req, res) => {
    const { bookId, quantity } = req.body;

    // Validasi Input
    if (!bookId || !quantity || quantity <= 0) {
        return res.status(400).json({
            status: "error",
            message: "ID Buku wajib diisi dan Quantity harus lebih dari 0"
        });
    }

    const book = books.find(b => b.id === bookId);
    
    // Validasi apakah buku ada
    if (!book) {
        return res.status(404).json({
            status: "error",
            message: "Buku tidak ditemukan"
        });
    }

    const newOrder = {
        id: Date.now(),
        bookId,
        bookTitle: book.title,
        quantity,
        status: "pending" // Default status sesuai soal [cite: 1413]
    };

    orders.push(newOrder);

    res.status(201).json({
        status: "success",
        message: "Pesanan dibuat, menunggu konfirmasi",
        data: newOrder
    });
});

// ==========================================
// 7. POST /orders/:id/confirm (Konfirmasi Pesanan)
// ==========================================
app.post('/orders/:id/confirm', (req, res) => {
    const orderId = parseInt(req.params.id);
    const orderIndex = orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
        return res.status(404).json({
            status: "error",
            message: "Pesanan tidak ditemukan"
        });
    }

    // Ubah status menjadi confirmed [cite: 1413]
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