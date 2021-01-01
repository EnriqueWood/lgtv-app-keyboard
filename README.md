#Welcome to lgtv-app-keyboard

##What is this?
Simple module written using nodejs to serve as a keyboard for LG WebOS smart TV apps that don't support a physical keyboard to search for content (e.g: netflix, amazon prime video, etc).

#Features
* The server will automatically detect the app being used (it might take from 0 to 10 secs to recognize it).
* You can write in the app searchbars using a physical keyboard connected to the machine running this app.
* You can use your keyboard to move within the app using the arrow keys and enter button.
* You can run the "turn off screen" sequence to turn off the tv screen while background music keeps sounding (useful for youtube or spotify).

##How to run the server:

* Identify your tv ip address in the LAN.
* Modify the `tv.js` file located in the config folder to type your tv lan host address and port there.

Go to the project's root directory and execute:
 `npm install` and then `node index.js` to start the project.
 
The first time it will ask you to authorize the device in your tv, this process is required only the first time you run this app.

## Activation shortcuts:

1. Turn off tv screen while music is still running: 

    `Control + Spacebar`
2. Move inside apps:

    `Arrow keys and enter`
    

##Special thanks
* To Sebastian Raff for his [lgtv2](https://github.com/hobbyquaker/lgtv2) project, which this app uses as dependency.
* To any other person helping reverse engineer the WebOS api

##How to help?

* You can conctact me if you have some useful features to add to the project (please consider that the scope of this project is to be a keyboard for WebOS tvs)
* Pull Requests
* Opening issues to report bugs