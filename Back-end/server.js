const http=require('http')
const port = process.env.port || 3001

const app = require('./app')

const server = http.createServer(app);
server.listen(port);

console.log('Server Started on : ' + port)



