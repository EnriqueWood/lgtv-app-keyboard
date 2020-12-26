Simple module to serve as a keyboard for LG WebOS smart TV apps that don't support one

Modify the tv.js file located in the config folder to type your tv lan host address and port there

How to run:

Go to the project's root directory and execute:
 ``npm install`` and then ``node index.js`` to start the project.
 
The first time it will ask you to authorize the device in your tv

This project uses as dependency the project lgtv2 ([Sebastian Raff](https://github.com/hobbyquaker/lgtv2))