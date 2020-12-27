const tvConfig = require('./config/tv')
let app = require('./config/app/netflix')
let keyboard = new Map(app.layout)
let currentAppId = 'netflix'
const RESET_POINTER_POSITION_THRESHOLD_MILLIS = 2000;
const RESET_POINTER_RESOLUTION_MILLIS = 250;
const APP_CHECK_INTERVAL_MILLIS = 1000;

var lgtv = require('lgtv2')({
    url: tvConfig.host
});

lgtv.on('error', function (err) {
    console.log(err);
});

lgtv.on('connecting', function () {
    console.log('connecting');
});

lgtv.on('connect', function () {
    let buffer = ''
    let lastLetterPosition = null
    let prevTime = 0
    console.log('connected');

    function send(sock, command) {
        sock.send(command)
    };

    function resetPointer(sock) {
        for (let i = 0; i < 20; i++) {
            const command = "move\n" + "dx:-100\n" + "dy:-100\n" + "down:0\n";
            send(sock, command);
        }
        return new Promise(function (resolve, reject) {
            setTimeout(() => {
                resolve("done")
            }, RESET_POINTER_RESOLUTION_MILLIS);
        })
    }

    function moveX(sock, dx) {
        for (let i = 0; i < Math.abs(dx); i++) {
            const command = "move\n" + "dx:" + (dx < 0 ? '-' : '') + "1\n" + "dy:0\n" + "down:0\n";
            send(sock, command);
        }
    }

    function moveY(sock, dy) {
        for (let i = 0; i < Math.abs(dy); i++) {
            const command = "move\n" + "dx:0\n" + "dy:" + (dy < 0 ? '-' : '') + "1\n" + "down:0\n";
            send(sock, command);
        }
    }

    function move(sock, dx, dy) {
        const unitsToMove = Math.abs(dx) + Math.abs(dy)
        const travelTime = unitsToMove > 0 ? Math.ceil(unitsToMove * app.responsivenessMultiplier) : 50;
        moveX(sock, dx)
        moveY(sock, dy)
        return new Promise(function (resolve, reject) {
            setTimeout(() => {
                resolve("done")
            }, travelTime);
        })
    }

    async function click(sock) {
        return new Promise(function (resolve, reject) {
            setTimeout(() => {
                sock.send('click');
                setTimeout(() => {
                    resolve("done")
                }, lastLetterPosition === keyboard.get('\') ? 0 : 350);
            }, 50);

        })
    }

    function toFirstRow(sock) {
        moveY(sock, app.firstRowYPosition)
    }

    function toFirstColumn(sock) {
        moveX(sock, app.firstColumnXPosition)
    }

    async function typeIn(sock, letter) {
        const now = new Date().getTime();
        if (now - prevTime > RESET_POINTER_POSITION_THRESHOLD_MILLIS) {
            console.log('Reset position')
            lastLetterPosition = null
        }
        prevTime = now
        let letterPosition = keyboard.get(letter.toLowerCase());
        if (lastLetterPosition == null) {
            console.log("moving to first row")
            await resetPointer(sock)
            toFirstRow(sock)
            toFirstColumn(sock)
            lastLetterPosition = keyboard.get('default')
        }
        const dx = letterPosition.x - lastLetterPosition.x;
        const dy = letterPosition.y - lastLetterPosition.y;
        if (Math.abs(dx) + Math.abs(dy) > 0) {
            await move(sock, dx * app.LETTER_SIZE.width, dy * app.LETTER_SIZE.height)
        }
        await click(sock)
    }

    function addToBuffer(key) {
        buffer += '' + key;
        console.log('Buffer <' + buffer + '>')
    }

    async function dumpBuffer(sock) {
        if (buffer.length > 0) {
            showBuffer();
            const consumingLetter = bufferPop();
            console.log(`dumping <${consumingLetter}> off the buffer`)
            await typeIn(sock, consumingLetter)
            lastLetterPosition = keyboard.get(consumingLetter);
            console.log(`Buffer <${buffer}>`)
        }
        setTimeout(() => dumpBuffer(sock), 50)
    }

    function bufferPop() {
        const consumingLetter = buffer[0].toLowerCase();
        buffer = buffer.substr(1, buffer.length)
        return consumingLetter
    }

    function showBuffer() {
        const message = buffer.replace('\', "");
        if (message.length > 0) {
            lgtv.request('ssap://system.notifications/createToast', {message: message});
        }
    }

    lgtv.getSocket(
        'ssap://com.webos.service.networkinput/getPointerInputSocket',
        function (err, sock) {
            if (!err) {
                var stdin = process.stdin;

                // noinspection JSUnresolvedFunction
                stdin.setRawMode(true);
                stdin.resume();
                stdin.setEncoding('utf8');
                stdin.on('data', function (key) {
                    // ctrl-c ( end of text )
                    if (key === '\u0003') {
                        process.exit();
                    }
                    if (key === '\' && buffer.length > 0) {
                        console.log('Deleting from buffer')
                        buffer = buffer.substring(0, buffer.length - 1)
                        key = ''
                        showBuffer();
                    }
                    if (key === '\u001B\u005B\u0041') {
                        sock.send('button', {name: 'UP'});
                    }
                    if (key === '\u001B\u005B\u0043') {
                        sock.send('button', {name: 'RIGHT'});
                    }
                    if (key === '\u001B\u005B\u0042') {
                        sock.send('button', {name: 'DOWN'});
                    }
                    if (key === '\u001B\u005B\u0044') {
                        sock.send('button', {name: 'LEFT'});
                    }
                    if (key === '\r' || key === '\r\n') {
                        sock.send('button', {name: 'ENTER'});
                    }
                    if (keyboard.has(key)) {
                        addToBuffer(key)
                    }
                });
                dumpBuffer(sock)
                setInterval(() => {
                    lgtv.subscribe('ssap://com.webos.applicationManager/getForegroundAppInfo', function (err, res) {
                        if (!err && res.appId !== currentAppId) {
                            const appConfigFile = `./config/app/${res.appId}`;
                            try {
                                let req = require(appConfigFile)
                                lgtv.request('ssap://system.notifications/createToast', {message: `Detected ${res.appId}`});
                                app = req
                                keyboard = new Map(app.layout)
                                currentAppId = res.appId
                            }catch (error) {
                                console.log(`Detected ${res.appId} config file not found in <${appConfigFile}.js>`);
                            }
                        }
                    })
                }, APP_CHECK_INTERVAL_MILLIS);
            }
        }
    );
});


lgtv.on('prompt', function () {
    console.log('please authorize on TV');
});

lgtv.on('close', function () {
    console.log('close');
});

