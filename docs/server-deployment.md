# WrenchIQ.ai — Server Deployment (prod: 129.146.77.139)

## Overview

Static site deployment of the WrenchIQ.ai React/Vite app on the `prod` server,
served via nginx with HTTP Basic Auth password protection.

## Server Details

| Field       | Value                  |
|-------------|------------------------|
| Host alias  | `prod` (ssh_config)    |
| IP          | 129.146.77.139         |
| User        | tilak                  |
| OS          | Ubuntu 22.04           |
| Proxy       | azure-jump-box         |

## What Was Installed

### Packages

```
nginx              — web server to serve the static site
apache2-utils      — provides htpasswd utility for password protection
```

Install commands used:

```bash
sudo apt update
sudo apt install -y nginx apache2-utils
```

### Files Created on Server

| Path | Purpose |
|------|---------|
| `/var/www/wrenchiq/` | App static files (contents of `dist/`) |
| `/etc/nginx/sites-available/wrenchiq` | Nginx virtual host config |
| `/etc/nginx/sites-enabled/wrenchiq` | Symlink to enable the site |
| `/etc/nginx/.htpasswd` | Username/password file for Basic Auth |

### Nginx Config Location

```
/etc/nginx/sites-available/wrenchiq
```

Config overview:
- Serves files from `/var/www/wrenchiq`
- Listens on port 80
- Basic Auth required (realm: "WrenchIQ Demo")
- SPA fallback: all routes redirect to `index.html`

## How to Deploy / Redeploy

From your local machine (in `/opt/predii/next-gen`):

```bash
# 1. Build
npm run build

# 2. Upload to server
rsync -avz --delete -e "ssh -F /opt/predii/ssh_config" dist/ prod:/var/www/wrenchiq/
```

## How to Change the Password

```bash
ssh -F /opt/predii/ssh_config prod
sudo htpasswd /etc/nginx/.htpasswd <username>
# enter new password at prompt
sudo systemctl reload nginx
```

## How to Add a New User

```bash
ssh -F /opt/predii/ssh_config prod
sudo htpasswd /etc/nginx/.htpasswd <newusername>
sudo systemctl reload nginx
```

## How to Remove a User

```bash
ssh -F /opt/predii/ssh_config prod
sudo htpasswd -D /etc/nginx/.htpasswd <username>
sudo systemctl reload nginx
```

## How to Temporarily Disable Password Protection

On the server, edit `/etc/nginx/sites-available/wrenchiq` and comment out:

```nginx
# auth_basic "WrenchIQ Demo";
# auth_basic_user_file /etc/nginx/.htpasswd;
```

Then reload: `sudo systemctl reload nginx`

## How to Uninstall Everything

```bash
ssh -F /opt/predii/ssh_config prod

# Stop and disable nginx
sudo systemctl stop nginx
sudo systemctl disable nginx

# Remove packages
sudo apt remove -y nginx apache2-utils
sudo apt autoremove -y

# Remove site files and config
sudo rm -rf /var/www/wrenchiq
sudo rm -f /etc/nginx/sites-available/wrenchiq
sudo rm -f /etc/nginx/sites-enabled/wrenchiq
sudo rm -f /etc/nginx/.htpasswd
```

## Nginx Useful Commands

```bash
sudo systemctl start nginx      # start
sudo systemctl stop nginx       # stop
sudo systemctl restart nginx    # restart
sudo systemctl reload nginx     # reload config without downtime
sudo systemctl status nginx     # check status
sudo nginx -t                   # test config syntax
```

## Logs

```bash
sudo tail -f /var/log/nginx/access.log   # access log
sudo tail -f /var/log/nginx/error.log    # error log
```
