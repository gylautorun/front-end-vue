const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3200 });

console.log('服务运行在 http://localhost:3200/');

wss.on('connection', (ws) => {
    console.log('[服务器]：客官您来了~里边请');
    ws.send(`[websocket云端]您已经连接云端!数据推送中!`);
    ws.on('message', (message) => {
        console.log('message', message);
        ws.send('推送数据');
    });
    let index = 1;
    const interval = setInterval(() => {
        ws.send(`[websocket]数据推送第${index}次`);
        index ++
    }, 1000 * 10);

    ws.on('close', () => {
        clearInterval(interval); // 清除定时器
        console.log('[服务器]：客官下次再来呢~');
    });
});