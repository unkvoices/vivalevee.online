const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. SECURITY MIDDLEWARES
// Helmet para proteção de headers e Content Security Policy (CSP)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://unpkg.com", "'unsafe-inline'"], // Permite scripts locais e Phosphor Icons
            styleSrc: ["'self'", "https://fonts.googleapis.com", "https://unpkg.com", "'unsafe-inline'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://images.unsplash.com"],
            connectSrc: ["'self'"]
        },
    },
}));

// CORS: Restringir origens
const allowedOrigins = ['http://localhost:3000', 'https://vivalevee.online'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Não permitido por CORS'));
        }
    }
}));

// Rate Limiting para rotas críticas (Checkout)
const checkoutLimiter = rateLimit({
    windowMs: 15 * 1000, // 15 segundos
    max: 5, // Limite de 5 requisições por IP
    message: { error: "Muitas tentativas de checkout. Aguarde alguns segundos." }
});

app.use(express.json());

// 2. ROTAS DA API
const paymentRoutes = require('./frontend/js/payment');
const downloadRoutes = require('./frontend/js/download');

// Aplicar limitador apenas na rota de checkout
app.use('/api/checkout', checkoutLimiter);

app.use('/api', paymentRoutes);
app.use('/api', downloadRoutes);

// 3. ARQUIVOS ESTÁTICOS E FALLBACK
// Servir o frontend (assumindo que o server.js está na raiz e o frontend em /public ou conforme sua estrutura)
app.use(express.static(path.join(__dirname, 'frontend')));

// Rota específica para servir páginas de forma limpa (ex: /product)
app.get('/product', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/pages/product.html'));
});

// Fallback para Single Page Behavior ou Erros 404
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`
    🚀 VIVA LEVE SERVER RUNNING
    --------------------------
    URL: http://localhost:${PORT}
    Modo: ${process.env.NODE_ENV || 'development'}
    `);
});