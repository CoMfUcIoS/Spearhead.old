# Spearhead

Spearhead is a collection of nodeJS applications bind together to produce multiple websites/ecommerces/mobile apps and such.

Features:
  - All apps are driven from a config file in the root folder
  - All apps are communicate to each other through Websocket
  - You can use whatever database system you like
  - Everything updates realtime user doesnt need to refresh anything.
  - You only need 1 port open on your server and multiple ( if you like ) sub domains to reach every app remotely.
  - There is a REST API that you can get data for an external client
  - You can monitor All your apps through a web page
  - You can monitor your Visiors through a web page.
  - You can host each apps on a different device / environment and bind them together if you like
  - SSL communication (security between all app calls)

### Version
0.1.1

### Installation
There are some things to consider before running spearhead
First of all requires [Node.js](https://nodejs.org/) v6.6 or greater to run.
```sh
$ sudo apt-get install nodejs
$ sudo npm install n -g
$ sudo n stable
```
It’s a general rule that you shouldn’t run node as root, but only root can bind to ports less than 1024. This is where authbind comes in. Authbind allows non-root users to bind to ports less than 1024.
```sh
$ sudo npm install pm2 -g
$ sudo apt-get install authbind
$ sudo touch /etc/authbind/byport/80
$ sudo chown [user] /etc/authbind/byport/80
$ sudo chmod 755 /etc/authbind/byport/80
$ sudo touch /etc/authbind/byport/443
$ sudo chown [user] /etc/authbind/byport/443
$ sudo chmod 755 /etc/authbind/byport/443
$ authbind --deep pm2 update
```
Now you can start applications with PM2 that can bind to port 80 without being root!
It’s recommended to put an alias in your .bashrc file:
```sh
alias pm2='authbind --deep pm2'
```
##### Note
> if you have problems installing authbind or its not available on your device then there is a workaround at the bottom of this README.md file


Then install all dependencies and run the app
```sh
$ cd spearhead
$ npm install
$ npm run start
```
Now use your favorite browser and surf to https://localhost/.

If you need to start spearhead on boot then you need to do the following
```sh
pm2 save
pm2 startup
```
(Follow the instruction given :) )

Enjoy!


### Authbind workaround

If for some reason authbind is not available then you can actual fake it ;)
Find from where your bash executable is
```sh
$ which bash
```
copy the location you are going to need it almost everywhere
then find where the /usr/bin folder is and add a file
```sh
$ nano /usr/bin/authbind
```
paste the following in that file
```sh
#!/bin/bash
ARGS=();
    for var in "$@"; do
        # Ignore known bad arguments
        [ "$var" != '--deep' ] && ARGS+=("$var");
    done
    ${ARGS[@]}
```
then make it executable.
```sh
$ chmod a+x /usr/bin/authbind
```

