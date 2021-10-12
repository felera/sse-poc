const express = require('express');
const bodyParser = require('body-parser');
//const cors = require('cors');
const app = express();
const PORT = 8080;
let clients = [];
let facts = [];

//app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/status', (request, response) => response.json({ clients: clients.length }));

function eventsHandler(request, response, next) {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    response.writeHead(200, headers);

    const data = `data: ${JSON.stringify(facts)}\n\n`;

    response.write(data);

    const deviceId = request.params['deviceId']; //Date.now();

    const newClient = {
        deviceId,
        response
    };

    clients.push(newClient);

    request.on('close', () => {
        console.log(`${deviceId} Connection closed`);
        clients = clients.filter(client => client.deviceId !== deviceId);
    });
}

app.get('/events/:deviceId', eventsHandler);

function sendEventsToAll(newFact) {
    clients.forEach(client => client.response.write(`data: ${JSON.stringify(newFact)}\n\n`))
}

async function addFact(request, respsonse, next) {
    const newFact = request.body;
    console.log('Adding fact: ' + request.body.id);
    facts.push(newFact);
    respsonse.json(newFact)
    return sendEventsToAll(newFact);
}

app.post('/fact', addFact);

function sendEventsToOne(newFact, deviceId) {
    target = clients.filter(device => device.deviceId == deviceId);
    target.forEach(client => client.response.write(`data: ${JSON.stringify(newFact)}\n\n`))
}

async function addSingleFact(request, respsonse, next) {
    const newFact = request.body;
    console.log('Adding fact: ' + request.body.id);
    facts.push(newFact);
    respsonse.json(newFact)
    return sendEventsToOne(newFact, request.body.deviceId);
}

app.post('/singleFact/:id', addSingleFact);

app.listen(PORT, () => {
    console.log(`Facts Events service listening at http://localhost:${PORT}`)
});