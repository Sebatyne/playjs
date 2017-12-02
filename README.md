# PlayJS

PlayJS is a simple-to-use fully web implemented web IDE, using only web standards and latest HTML5 features.

Using only web standards, PlayJS allow you to download your website sources locally in your browser, to edit it, test it still locally, and then push the changes live.

## Requirements

Thanks to web capabilities, PlayJS only needs in order to work :

   * A recent web browser
   * A web server with Redirect and DAV mods enabled

# Installation

1. clone this repository in __/var/html__
2. Generate a htpasswd with ```htpasswd -c /etc/apache2/htpasswd your_username```
3. Copy the apache configuration file below, replacing the variables ${} as needed.
4. Reload apache
5. Connect to your website with your browser and start hacking !

```
<VirtualHost *:443>
    ServerName ${DOMAIN_NAME}

    SSLEngine on
    SSLProtocol ALL -SSLv2 -SSLv3
    SSLCertificateFile ${PATH_TO_SSL_CERTIFICATE}
    SSLCertificateKeyFile ${PATH_TO_SSL_KEY}

    # Turn off automatic DirectoryIndexing 
    # And use RewriteEnigne to emulate it
    DirectoryIndex disabled

    RewriteEngine On

    # Rewrite rules for the root directory
    RewriteCond "%{REQUEST_METHOD}" "(GET)"
    RewriteRule "^/(.*)/$" "/$1/index.html" [PT,L]
    RewriteCond "%{REQUEST_METHOD}" "(GET)"
    RewriteRule "^/$" "/index.html" [PT,L]

    SetEnvIf Origin "^https://${DOMAIN_NAME}" ORIGIN_DOMAIN=$0
    Header always set Access-Control-Allow-Origin "%{ORIGIN_DOMAIN}e" env=ORIGIN_DOMAIN
    Header always set Access-Control-Allow-Credentials "true" env=ORIGIN_DOMAIN
    Header always set Access-Control-Allow-Methods "PROPFIND, PROPPATCH, COPY, MOVE, DELETE, MKCOL, LOCK, UNLOCK, PUT, GETLIB, VERSION-CONTROL, CHECKIN, CHECKOUT, UNCHECKOUT, REPORT, UPDATE, CANCELUPLOAD, HEAD, OPTIONS, GET, POST" env=ORIGIN_DOMAIN
    Header always set Access-Control-Allow-Headers "Overwrite, Destination, Content-Type, Depth, User-Agent, X-File-Size, X-Requested-With, If-Modified-Since, X-File-Name, Cache-Control, Authorization" env=ORIGIN_DOMAIN
    Header set Cache-Control "private, max-age=0, must-revalidate"
    Header set Vary "Origin,Cookie,Authorization"

    Header set Service-Worker-Allowed "/"

    DeflateCompressionLevel 9
    DavLockDB /var/www/play.dav.lock

    AddCharset utf-8 .txt

    DocumentRoot /var/www/play

	<Directory "/var/www/play">
        Dav On
        Options -Indexes

        AuthType Basic
        AuthName "Authentification Required"
        AuthUserFile "/etc/apache2/htpasswd"

        <LimitExcept GET OPTIONS>
            Require valid-user
        </LimitExcept>
	</Directory>

	<Directory "/var/www/play/priv">
        Dav On
        AuthType Basic
        AuthName "Authentification Required"
        AuthUserFile "/etc/apache2/htpasswd"
        Options -Indexes

        <LimitExcept OPTIONS>
            Require valid-user
        </LimitExcept>
	</Directory>

	<Directory /var/www/play/.git>
		Options -Indexes
		Order deny,allow
        Deny from all
	</Directory>

    CustomLog /var/log/apache2/play-access.log combined
	ErrorLog /var/log/apache2/play-error.log
</VirtualHost>
```
