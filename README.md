latest node version ( at least 6.6)

$ sudo npm install n -g
$ sudo n stable
$ restart shell


It’s a general rule that you shouldn’t run node as root, but only root can bind to ports less than 1024. This is where authbind comes in. Authbind allows non-root users to bind to ports less than 1024.

$ sudo npm install pm2 -g
$ sudo apt-get install authbind
$ sudo touch /etc/authbind/byport/80
$ sudo chown comfucios /etc/authbind/byport/80
$ sudo chmod 755 /etc/authbind/byport/80
$ authbind --deep pm2 update
Now you can start applications with PM2 that can bind to port 80 without being root!

It’s recommended to put an alias in your .bashrc file:

alias pm2='authbind --deep pm2'
