const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fileUpload = require('express-fileupload');
const axios = require('axios');
const mime = require('mime-types');
const port = process.env.PORT || 8082;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

function delay(t, v) {
  return new Promise(function(resolve) { 
      setTimeout(resolve.bind(null, v), t)
  });
}

app.use(express.json());
app.use(express.urlencoded({
extended: true
}));
app.use(fileUpload({
debug: true
}));
app.use("/", express.static(__dirname + "/"))

app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: __dirname
  });
});

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'bot-zdg' }),
  puppeteer: { headless: true,
    executablePath: "/usr/bin/chromium-browser",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu'
    ] }
});

client.initialize();

io.on('connection', function(socket) {
  socket.emit('message', '© BOT-ZDG - Iniciado');
  socket.emit('qr', './icon.svg');

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', '© BOT-ZDG QRCode recebido, aponte a câmera  seu celular!');
    });
});

client.on('ready', () => {
    socket.emit('ready', '© BOT-ZDG Dispositivo pronto!');
    socket.emit('message', '© BOT-ZDG Dispositivo pronto!');
    socket.emit('qr', './check.svg')	
    console.log('© BOT-ZDG Dispositivo pronto');
});

client.on('authenticated', () => {
    socket.emit('authenticated', '© BOT-ZDG Autenticado!');
    socket.emit('message', '© BOT-ZDG Autenticado!');
    console.log('© BOT-ZDG Autenticado');
});

client.on('auth_failure', function() {
    socket.emit('message', '© BOT-ZDG Falha na autenticação, reiniciando...');
    console.error('© BOT-ZDG Falha na autenticação');
});

client.on('change_state', state => {
  console.log('© BOT-ZDG Status de conexão: ', state );
});

client.on('disconnected', (reason) => {
  socket.emit('message', '© BOT-ZDG Cliente desconectado!');
  console.log('© BOT-ZDG Cliente desconectado', reason);
  client.initialize();
});
});

// Send message
app.post('/zdg-message', [
  body('number').notEmpty(),
  body('message').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const number = req.body.number;
  const numberDDI = number.substr(0, 2);
  const numberDDD = number.substr(2, 2);
  const numberUser = number.substr(-8, 8);
  const message = req.body.message;

  // if (numberDDI !== "55") {
  //   const numberZDG = number + "@c.us";
  //   client.sendMessage(numberZDG, message).then(response => {
  //   res.status(200).json({
  //     status: true,
  //     message: 'BOT-ZDG Mensagem enviada',
  //     response: response
  //   });
  //   }).catch(err => {
  //   res.status(500).json({
  //     status: false,
  //     message: 'BOT-ZDG Mensagem não enviada',
  //     response: err.text
  //   });
  //   });
  // }
  // else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
  //   const numberZDG = "55" + numberDDD + "9" + numberUser + "@c.us";
  //   client.sendMessage(numberZDG, message).then(response => {
  //   res.status(200).json({
  //     status: true,
  //     message: 'BOT-ZDG Mensagem enviada',
  //     response: response
  //   });
  //   }).catch(err => {
  //   res.status(500).json({
  //     status: false,
  //     message: 'BOT-ZDG Mensagem não enviada',
  //     response: err.text
  //   });
  //   });
  // }
  // else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
  //   const numberZDG = "55" + numberDDD + numberUser + "@c.us";
  //   client.sendMessage(numberZDG, message).then(response => {
  //   res.status(200).json({
  //     status: true,
  //     message: 'BOT-ZDG Mensagem enviada',
  //     response: response
  //   });
  //   }).catch(err => {
  //   res.status(500).json({
  //     status: false,
  //     message: 'BOT-ZDG Mensagem não enviada',
  //     response: err.text
  //   });
  //   });
  // }
});


// Send media
app.post('/zdg-media', [
  body('number').notEmpty(),
  body('caption').notEmpty(),
  body('file').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const number = req.body.number;
  const numberDDI = number.substr(0, 2);
  const numberDDD = number.substr(2, 2);
  const numberUser = number.substr(-8, 8);
  const caption = req.body.caption;
  const fileUrl = req.body.file;

  let mimetype;
  const attachment = await axios.get(fileUrl, {
    responseType: 'arraybuffer'
  }).then(response => {
    mimetype = response.headers['content-type'];
    return response.data.toString('base64');
  });

  const media = new MessageMedia(mimetype, attachment, 'Media');

  if (numberDDI !== "55") {
    const numberZDG = number + "@c.us";
    client.sendMessage(numberZDG, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-ZDG Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-ZDG Imagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const numberZDG = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberZDG, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-ZDG Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-ZDG Imagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const numberZDG = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberZDG, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-ZDG Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-ZDG Imagem não enviada',
      response: err.text
    });
    });
  }
});

client.on('message', async msg => {

  const nomeContato = msg._data.notifyName;
  let groupChat = await msg.getChat();

  let json = ({
    "query": [
      {
        "query": "",
        "queryContext": "",
        "start": 0,
        "numResults": 10,
        "contextConfig": {
          "charsBefore": 0,
          "charsAfter": 0,
          "sentencesBefore": 2,
          "sentencesAfter": 2,
          "startTag": "%START_SNIPPET%",
          "endTag": "%END_SNIPPET%"
        },
        "corpusKey": [
          {
            "customerId": 3678166325,
            "corpusId": 1,
            "semantics": 0,
            "metadataFilter": "",
            "lexicalInterpolationConfig": {
              "lambda": 0.025
            },
            "dim": []
          }
        ],
        "summary": [
          {
           
            "maxSummarizedResults": 5,
            "responseLang": "por",
            "summarizerPromptName": "vectara-summary-ext-v1.2.0"
          }
        ]
      }
    ]
  })

  apiKey = "zut_2zxdNcx3Sl4WilZZZCwL3-KMXll0r73bsL0Rsg"
  id = "3678166325"

  headers = {
    'x-api-key': apiKey,
     "customer-id": id,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
}

  array = ["Oi",  "oi", "ola", "Olá", "Bom dia", "Boa tarde", "Boa noite", "Obrigado", "Até logo", "Tchau"]

  if(array.includes(msg.body))
    return  msg.reply("“Olá, sou o Assiste Virtual da Secretaria Geral de Controle Externo do TCE-AM. Como posso ajudá-lo?”")


  json.query[0].query = msg.body
  

  let response = await fetch("https://api.vectara.io/v1/query",{
    method: "POST",
    body: JSON.stringify(json),
    headers: headers
  })
  
  .then(response => response.json()) 
  .then(json => msg.reply(json.responseSet[0].summary[0].text));


  // .then(json => msg.reply(response));
  
  // if (groupChat.isGroup) return null;

  if (msg.type.toLowerCase() == "e2e_notification") return null;
  

});

console.log("\nA Comunidade ZDG é a oportunidade perfeita para você aprender a criar soluções incríveis usando as APIs, sem precisar de experiência prévia com programação. Com conteúdo exclusivo e atualizado, você terá tudo o que precisa para criar robôs, sistemas de atendimento e automações do zero. O curso é projetado para iniciantes e avançados, e oferece um aprendizado prático e passo a passo para que você possa criar soluções incríveis.")
console.log("\nIncreva-se agora acessando link: comunidadezdg.com.br\n")
    
server.listen(port, function() {
        console.log('Aplicação rodando na porta *: ' + port + ' . Acesse no link: http://localhost:' + port);
});
