# Expense & Budget Visualizer

Web app sederhana untuk melacak pengeluaran harian: input transaksi, daftar transaksi, total balance, dan pie chart distribusi pengeluaran per kategori.

## Tech Stack
- HTML, CSS, Vanilla JavaScript
- Chart.js (CDN) untuk pie chart
- LocalStorage untuk penyimpanan data (client-side)

## Fitur Wajib (MVP)
- Form input (Item Name, Amount, Category) + validasi semua field
- Daftar transaksi (scrollable), bisa hapus item
- Total balance otomatis update
- Pie chart spending by category, otomatis update

## Optional Challenges (3 dari 5 sudah diimplementasi)
1. Custom category — tambah kategori baru di form
2. Monthly summary view — total, jumlah transaksi, rata-rata, top kategori bulan ini
3. Sort transactions — by amount (asc/desc) atau by category
4. Highlight spending over limit — set limit, item yang melebihi limit ditandai merah
5. Dark/light mode toggle — tombol di header

## Struktur Folder
```
expense-visualizer/
├── index.html
├── css/
│   └── style.css
└── js/
    └── app.js
```

## Cara Menjalankan
Buka `index.html` langsung di browser (Chrome/Firefox/Edge/Safari), atau gunakan extension "Live Server" di VS Code.
