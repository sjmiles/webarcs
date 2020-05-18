// content of index.js
const http = require('http');
const port = 3332;

const requestHandler = (request, response) => {
  //console.log(request.url);
  response.setHeader('Access-Control-Allow-Origin', 'http://localhost');
  const [id, action] = request.url.slice(1).split('/');
  //console.log(id, action);
  if (id > 0 && id < 64) {
    console.log(id, action);
    switch(action) {
      case 'on':
        lightSwitch(response, id, true);
        break;
      case 'off':
        lightSwitch(response, id, false);
        break;
      default:
        response.end('Hello Node.js Server!');
        break;
    }
  }
};

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err);
  }
  console.log(`server is listening on ${port}`);
});

  //   const req = new Request('http://192.168.86.55/api/RK0SojwCNxyvEw8NMP430tBGGSFGdTmda7UbiteC/lights/2/state', {
  //     method: 'put',
  //     body: `{"on":${onOffBoolean}}`
  //   });

const lightSwitch = (response, id, trueForOn) => {
  const bodyData = `{"on":${trueForOn}}`;
  const options = {
    hostname: '192.168.86.55',
    port: '80',
    path: `/api/RK0SojwCNxyvEw8NMP430tBGGSFGdTmda7UbiteC/lights/${id}/state`,
    method: 'PUT'
  };
  const req = http.request(options, res => {
    let data = '';
    // A chunk of data has been recieved.
    res.on('data', (chunk) => {
      data += chunk;
    });
    // The whole response has been received. Print out the result.
    res.on('end', () => {
      console.log(JSON.parse(data));
      response.end(data);
    });
  }).on("error", (err) => {
    console.log("Error: " + err.message);
  });
  req.write(bodyData);
  req.end();
  //
  // http.get('http://192.168.86.55/api/RK0SojwCNxyvEw8NMP430tBGGSFGdTmda7UbiteC/lights/2', resp => {
  //   let data = '';
  //   // A chunk of data has been recieved.
  //   resp.on('data', (chunk) => {
  //     data += chunk;
  //   });
  //   // The whole response has been received. Print out the result.
  //   resp.on('end', () => {
  //     console.log(JSON.parse(data));
  //   });
  // }).on("error", (err) => {
  //   console.log("Error: " + err.message);
  // });
};
