const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = 8080;
let orderCount = 0;

// Загружаем продукты из JSON файла
let products = JSON.parse(fs.readFileSync(path.join(__dirname, 'products.json'), 'utf8')).products;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client.html'));
});

// Маршрут получения продуктов
app.get('/products', (req, res) => {
    res.json({products});
});

io.on('connection', (socket) => {
    console.log('Клиент подключен');

    socket.on('makeOrder', (order) => {
        const currentOrderId = ++orderCount;
        console.log(`Получен заказ №${currentOrderId}:`);

        // Лог продуктов заказа
        order.items.forEach(item => {
            console.log(`- ${item.name}, количество: ${item.quantity}`);
        });

        let totalCost = 0;
        // Рассчет общей стоимости заказа
        order.items.forEach((item) => {
            const product = products.find(p => p.name === item.name);
            if (product) {
                totalCost += product.price * item.quantity;
            }
        });

        // Отправка сообщения клиенту, "заказ принят и готовится"
        socket.emit('orderReceived', {
            orderId: currentOrderId,
            message: `Ваш заказ №${currentOrderId} принят. Стоимость: ${totalCost} грн.`,
            items: order.items
        });

        // Через 3 секунды отправка сообщения - "заказ готов"
        setTimeout(() => {
            console.log(`Заказ №${currentOrderId} готов.`);
            socket.emit('orderReady', {
                orderId: currentOrderId,
                message: `Ваш заказ №${currentOrderId} готов.`,
                items: order.items
            });
        }, 3000);
    });

    socket.on('disconnect', () => {
        console.log('Клиент отключен');
    });
});

server.listen(port, () => {
    console.log(`Сервер работает на порту ${port}`);
});
