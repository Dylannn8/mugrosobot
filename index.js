const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const moment = require('moment-timezone');
const colors = require('colors');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const FormData = require('form-data');
const { MessageMedia } = require('whatsapp-web.js');

const filePath = path.join(__dirname, 'video.mp4'); 

const client = new Client({
    restartOnAuthFail: true,
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: '/usr/bin/google-chrome', // Agrega la ruta de Google Chrome aquí
    },
    webVersionCache: {      
        type: 'remote',
        remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
    },
    ffmpeg: './ffmpeg.exe',
    authStrategy: new LocalAuth({ clientId: "client" })
});
const config = require('./config/config.json');

client.on('qr', (qr) => {
    console.log(`[${moment().tz(config.timezone).format('HH:mm:ss')}] Scan the QR below : `);
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.clear();
    const consoleText = './config/console.txt';
    fs.readFile(consoleText, 'utf-8', (err, data) => {
        if (err) {
            console.log(`[${moment().tz(config.timezone).format('HH:mm:ss')}] Console Text not found!`.yellow);
            console.log(`[${moment().tz(config.timezone).format('HH:mm:ss')}] ${config.name} is Already!`.green);
        } else {
            console.log(data.green);
            console.log(`[${moment().tz(config.timezone).format('HH:mm:ss')}] ${config.name} is Already!`.green);
        }
    });
});
const downloadInstagramContent = async (url) => {
    const data = new FormData();
    data.append('url', url);

    const options = {
        method: 'POST',
        url: 'https://all-media-downloader1.p.rapidapi.com/Instagram',
        headers: {
            'x-rapidapi-key': '2c71776c4amshf05e19e66926f79p112f1ajsn42b65daaf1ed',
            'x-rapidapi-host': 'all-media-downloader1.p.rapidapi.com',
            ...data.getHeaders(),
        },
        data: data
    };

    try {
        const response = await axios.request(options);
        console.log("Respuesta de la API:", response.data); // Imprime la respuesta para depuración
        return response.data;
    } catch (error) {
        console.error("Error al obtener el contenido de Instagram:", error);
        throw new Error("Error al obtener el contenido de Instagram.");
    }
};

// Función para descargar el video
const downloadVideo = async (url, filePath) => {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        writer.on('finish', () => resolve());
        writer.on('error', reject);
    });
};

client.on('message', async (message) => {
    const isGroups = message.from.endsWith('@g.us') ? true : false;
    if ((isGroups && config.groups) || !isGroups) {

        // Image to Sticker (Auto && Caption)
        if (message._data.caption == `${config.prefix}sticker`) {
            if (config.log) console.log(`[${'!'.red}] ${message.from.replace("@c.us", "").yellow} created sticker`);
            try {
                const media = await message.downloadMedia();
                client.sendMessage(message.from, media, {
                    sendMediaAsSticker: true,
                    stickerName: config.name, // Sticker Name = Edit in 'config/config.json'
                    stickerAuthor: config.author // Sticker Author = Edit in 'config/config.json'
                }).then(() => {
                    client.sendMessage(message.from, "");
                });
            } catch {
                client.sendMessage(message.from, "");
            }

        // Image to Sticker (With Reply Image)
        } else if (message.body == `${config.prefix}s`) {
            if (config.log) console.log(`[${'!'.red}] ${message.from.replace("@c.us", "").yellow} created sticker`);
            const quotedMsg = await message.getQuotedMessage(); 
            if (message.hasQuotedMsg && quotedMsg.hasMedia) {
                client.sendMessage(message.from, "");
                try {
                    const media = await quotedMsg.downloadMedia();
                    client.sendMessage(message.from, media, {
                        sendMediaAsSticker: true,
                        stickerName: config.name, // Sticker Name = Edit in 'config/config.json'
                        stickerAuthor: config.author // Sticker Author = Edit in 'config/config.json'
                    }).then(() => {
                        client.sendMessage(message.from, "");
                    });
                } catch {
                    client.sendMessage(message.from, "");
                }
            } else {
                client.sendMessage(message.from, "");
            }

        
        } 
        // Sticker to Image (With Reply Sticker)
       	  else if (message.body == `${config.prefix}img`) {
            if (config.log) console.log(`[${'!'.red}] ${message.from.replace("@c.us", "").yellow} convert sticker into image`);
            const quotedMsg = await message.getQuotedMessage(); 
            if (message.hasQuotedMsg && quotedMsg.hasMedia) {
                client.sendMessage(message.from, "");
                try {
                    const media = await quotedMsg.downloadMedia();
                    client.sendMessage(message.from, media).then(() => {
                        client.sendMessage(message.from, "");
                    });
                } catch {
                    client.sendMessage(message.from, "");
                }
            } else {
                client.sendMessage(message.from, "");
            }

        // Claim or change sticker name and sticker author
        } else if (message.body == "Oe") {
            if (config.log) console.log(`[${'!'.red}] ${message.from.replace("@c.us", "").yellow} UD se llama tines`);
	    client.sendMessage(message.from, "ud se llama oe?");
        } 
	    else if (message.body.startsWith(`${config.prefix}change`)) {
            if (config.log) console.log(`[${'!'.red}] ${message.from.replace("@c.us", "").yellow} change the author name on the sticker`);
            if (message.body.includes('|')) {
                let name = message.body.split('|')[0].replace(message.body.split(' ')[0], '').trim();
                let author = message.body.split('|')[1].trim();
                const quotedMsg = await message.getQuotedMessage(); 
                if (message.hasQuotedMsg && quotedMsg.hasMedia) {
                    client.sendMessage(message.from, "");
                    try {
                        const media = await quotedMsg.downloadMedia();
                        client.sendMessage(message.from, media, {
                            sendMediaAsSticker: true,
                            stickerName: name,
                            stickerAuthor: author
                        }).then(() => {
                            client.sendMessage(message.from, "");
                        });
                    } catch {
                        client.sendMessage(message.from, "");
                    }
                } else {
                    client.sendMessage(message.from, "");
                }
            } else {
                client.sendMessage(message.from, `*[❎]* Run the command :\n*${config.prefix}change <name> | <author>*`);
            }
        
        // Read chat
        }
		else if (message.body == "Chiste") {
		    if (config.log) {
			console.log(`[${'!'.red}] ${message.from.replace("@c.us", "").yellow} requested a joke.`);
		    }
		    
		    client.sendMessage(message.from, "");

		    try {
			// Hacer la solicitud a la API de chistes
			const response = await axios.get('https://v2.jokeapi.dev/joke/Dark?format=txt');
			const joke = response.data;

			// Enviar el chiste al usuario
			client.sendMessage(message.from, `${joke}`);
		    } catch (error) {
			console.error('Error al obtener el chiste:', error);
			client.sendMessage(message.from, "*[❎]* No se pudo obtener un chiste en este momento. Inténtalo de nuevo más tarde.");
		    }
	

	} else if (message.body == "Tu mamá") {
	    if (config.log) console.log(`[${'!'.red}] ${message.from.replace("@c.us", "").yellow} yomamajoke`);
	    
	    // Obtener chiste de Yo Mama Jokes
	    axios.get('https://www.yomama-jokes.com/api/v1/jokes/fat/random/')
		.then(response => {
		    const joke = response.data.joke;
		    client.sendMessage(message.from, joke);
		})
		.catch(error => {
		    console.error("Error al obtener el chiste:", error);
		    client.sendMessage(message.from, "Lo siento, hubo un error al obtener el chiste.");
		});
	} else if (message.body == "Hola") {
            if (config.log) console.log(`[${'!'.red}] ${message.from.replace("@c.us", "").yellow} ${message}`);
	    client.sendMessage(message.from, "oe");
       
	} else if (message.body.startsWith('!setstatus ')) {
		const newStatus = message.body.slice(11).trim();

		if (newStatus) {
		    try {
			await client.setStatus(newStatus);
			if (config.log) console.log(`[${'!'.red}] ${message.from.replace("@c.us", "").yellow} ${message.body}`);
			client.sendMessage(message.from, "Estado subido: " + newStatus);
		    } catch (error) {
			if (config.log) console.log(`[${'!'.red}] ${message.from.replace("@c.us", "").yellow} ${message.body}`);
			client.sendMessage(message.from, "Hubo un error al subir el estado.");
		    }
		}
	} else if (message.body.startsWith(",")) {
		if (config.log) console.log(`[${'!'.red}] ${message.from.replace("@c.us", "").yellow} ${message.body}`);

		const userMessage = message.body.slice(1).trim(); // Extrae el mensaje del usuario

		const options = {
		    method: 'POST',
		    url: 'https://gpts4u.p.rapidapi.com/llama2',
		    headers: {
			'x-rapidapi-key': '2c71776c4amshf05e19e66926f79p112f1ajsn42b65daaf1ed',
			'x-rapidapi-host': 'gpts4u.p.rapidapi.com',
			'Content-Type': 'application/json'
		    },
		    data: [
			{
			    role: 'user',
			    content: `Imagina que eres un amigo mío respondiendo en español, de manera breve y amigable. Aquí está lo que quiero decir: ${userMessage}`			}
		    ]
		};

		try {
		    const response = await axios.request(options);
		    const gptResponse = response.data; // Obtiene la respuesta de la IA

		    if (gptResponse) {
			client.sendMessage(message.from, gptResponse);
		    } else {
			client.sendMessage(message.from, "Lo siento, no pude obtener una respuesta.");
		    }
		} catch (error) {
		    console.error("Error al comunicarse con GPT:", error);
		    client.sendMessage(message.from, "Lo siento, hubo un error al obtener la respuesta de GPT.");
		}
	    }
	    else if (message.body.startsWith(".reel ")) {
		    if (config.log) console.log(`[${'!'.red}] ${message.from.replace("@c.us", "").yellow} ${message.body}`);

		    try {
			const url = message.body.slice(6).trim(); // Extrae la URL del mensaje
			console.log("URL extraída:", url); // Registro de depuración

			const response = await downloadInstagramContent(url);
			const data = response.mediaURL.data[0]; // Accede al primer objeto en el array `data`

			console.log("Datos del contenido:", data); // Imprime los datos para depuración

			if (data && data.url) {
			    const videoUrl = data.url;
			    console.log("URL del video:", videoUrl); // Registro de depuración

			    // Ruta temporal para guardar el video
			    const videoPath = path.join(__dirname, 'temp_video.mp4');
			    console.log("Ruta del video:", videoPath); // Registro de depuración

			    // Descarga el video usando axios
			    const videoResponse = await axios({
				url: videoUrl,
				method: 'GET',
				responseType: 'arraybuffer' // Cambiado a 'arraybuffer' para usar con MessageMedia
			    });

			    console.log("Descargando el video..."); // Registro de depuración

			    // Convierte el video descargado en un objeto MessageMedia
			    const videoBase64 = Buffer.from(videoResponse.data).toString('base64');
			    const media = new MessageMedia('video/mp4', videoBase64, 'video.mp4');

			    // Envía el video al usuario
			    console.log("Enviando el video..."); // Registro de depuración
			    await client.sendMessage(message.from, media);
			    console.log("Video enviado con éxito."); // Registro de depuración
			} else {
			    console.log("No se encontró URL válida en los datos."); // Registro de depuración
			    await client.sendMessage(message.from, 'No se pudo encontrar un video en el enlace proporcionado.');
			}
		    } catch (error) {
			console.error("Error en el proceso:", error);
			await client.sendMessage(message.from, 'Hubo un error al descargar o enviar el video.');
		    }
	} else if (message) {
            if (config.log) console.log(`[${'!'.red}] ${message.from.replace("@c.us", "").yellow} ${message.body}`);
	    client.sendMessage(message.from, "");
        }
	    else {
            client.getChatById(message.id.remote).then(async (chat) => {
                await chat.sendSeen();
            });
        }
    }
});

client.initialize();
